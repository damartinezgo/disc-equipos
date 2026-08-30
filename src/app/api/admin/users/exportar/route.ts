import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const isAdmin = user.user_metadata?.is_admin === true
  if (!isAdmin) {
    const { data: esEncuestador } = await supabase
      .from('encuestadores')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!esEncuestador) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  const body = await req.json().catch(() => ({}))
  const userIds: string[] = body.userIds || []

  if (!userIds?.length) {
    return NextResponse.json({ error: 'Sin personas para exportar' }, { status: 400 })
  }

  const admin = createServiceClient()

  // Chunk array to avoid Supabase IN limits (max 1000)
  const CHUNK = 1000
  const chunks: string[][] = []
  for (let i = 0; i < userIds.length; i += CHUNK) chunks.push(userIds.slice(i, i + CHUNK))

  const perfilesRes = await Promise.all(
    chunks.map((c) => admin.from('perfiles').select('*').in('id', c))
  )
  const perfiles = perfilesRes.flatMap((r) => r.data ?? [])

  // Get auth users for email mapping and admin exclusion (pagination needed to get all users)
  const allAuthUsers: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> }[] = []
  {
    let page = 1
    const perPage = 1000
    while (true) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage })
      const users = data?.users ?? []
      allAuthUsers.push(...users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        user_metadata: u.user_metadata,
      })))
      if (users.length < perPage) break
      page++
    }
  }

  const adminIds = new Set(
    allAuthUsers.filter((u) => u.user_metadata?.is_admin === true).map((u) => u.id)
  )
  const emailMap = new Map(
    allAuthUsers.map((u) => [u.id, u.email ?? ''])
  )
  const createdMap = new Map(
    allAuthUsers.map((u) => [u.id, u.created_at ?? ''])
  )
  const metaMap = new Map(
    allAuthUsers.map((u) => [u.id, (u.user_metadata ?? {}) as Record<string, string>])
  )
  const perfilesMap = new Map((perfiles ?? []).map((p) => [p.id, p]))

  // Map each requested userId safely
  const usuarios = userIds
    .filter((uid) => !adminIds.has(uid))
    .map((uid) => {
      const p = perfilesMap.get(uid)
      const meta = metaMap.get(uid) ?? {}
      return {
        id: uid,
        nombre: p?.nombre || meta.nombre || '',
        primer_apellido: p?.primer_apellido || meta.primer_apellido || '',
        segundo_apellido: p?.segundo_apellido || meta.segundo_apellido || '',
        cedula: p?.cedula || meta.cedula || '',
        correo: emailMap.get(uid) ?? '',
        telefono: p?.telefono || meta.telefono || '',
        departamento: p?.departamento || meta.departamento || '',
        dependencia_funciones: p?.dependencia_funciones || meta.dependencia_funciones || '',
        created_at: p?.created_at || createdMap.get(uid) || '',
      }
    })

  // Build Excel
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Desarrollo de Líderes y Equipo'
  workbook.created = new Date()

  const hoja = workbook.addWorksheet('Usuarios Registrados')

  const encabezados = [
    { header: 'Nombres', key: 'nombre', width: 24 },
    { header: 'Primer Apellido', key: 'primer_apellido', width: 20 },
    { header: 'Segundo Apellido', key: 'segundo_apellido', width: 20 },
    { header: 'Cédula', key: 'cedula', width: 16 },
    { header: 'Correo', key: 'correo', width: 30 },
    { header: 'Teléfono', key: 'telefono', width: 16 },
    { header: 'Departamento', key: 'departamento', width: 20 },
    { header: 'Dependencia / Funciones', key: 'dependencia_funciones', width: 35 },
    { header: 'Fecha Registro', key: 'created_at', width: 20 },
  ]

  hoja.columns = encabezados

  // Header style
  const headerRow = hoja.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    }
  })
  headerRow.height = 22

  usuarios.forEach((u, idx) => {
    const row = hoja.addRow({
      nombre: u.nombre || '',
      primer_apellido: u.primer_apellido || '',
      segundo_apellido: u.segundo_apellido || '',
      cedula: u.cedula || '',
      correo: u.correo || '',
      telefono: u.telefono || '',
      departamento: u.departamento || '',
      dependencia_funciones: u.dependencia_funciones || '',
      created_at: u.created_at ? new Date(u.created_at).toLocaleDateString('es-CO') : '',
    })
    row.height = 18
    if (idx % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F8FA' } }
      })
    }
  })

  hoja.views = [{ state: 'frozen', ySplit: 1 }]

  function colToLetter(col: number): string {
    let letter = ''
    let temp = col
    while (temp > 0) {
      temp--
      letter = String.fromCharCode(65 + (temp % 26)) + letter
      temp = Math.floor(temp / 26)
    }
    return letter
  }

  const lastCol = colToLetter(encabezados.length)
  hoja.autoFilter = { from: 'A1', to: `${lastCol}1` }

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="usuarios_registrados_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
