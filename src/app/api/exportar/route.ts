import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const COLOR_DISC: Record<string, string> = {
  D: 'FF1F4E79',
  I: 'FFC00000',
  S: 'FFD9A300',
  C: 'FF00843D',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Solo un encuestador o administrador autenticado puede exportar
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

  const { userIds }: { userIds: string[] } = await req.json()
  if (!userIds?.length) {
    return NextResponse.json({ error: 'Sin personas para exportar' }, { status: 400 })
  }

  const admin = createServiceClient()

  // Leer datos (queries independientes, sin FK)
  // Supabase .in() tiene límite de 1000 items → chunk para datasets grandes
  const CHUNK = 1000
  const chunks: string[][] = []
  for (let i = 0; i < userIds.length; i += CHUNK) chunks.push(userIds.slice(i, i + CHUNK))

  const perfilesRes = await Promise.all(
    chunks.map((c) => admin.from('perfiles').select('*').in('id', c))
  )
  const perfilesData = perfilesRes.flatMap((r) => r.data ?? [])

  const respuestasRes = await Promise.all(
    chunks.map((c) => admin.from('respuestas').select('user_id, completado').in('user_id', c))
  )
  const respuestasData = respuestasRes.flatMap((r) => r.data ?? [])

  const scoringRes = await Promise.all(
    chunks.map((c) => admin.from('scoring').select('*').in('user_id', c))
  )
  const scoringData = scoringRes.flatMap((r) => r.data ?? [])

  // Leer correos/metadata desde auth.users (listUsers pagina: 100/page por defecto)
  const allAuthUsers: { id: string; email?: string; user_metadata?: Record<string, unknown> }[] = []
  {
    let page = 1
    const perPage = 100
    while (true) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage })
      const users = data?.users ?? []
      allAuthUsers.push(...users.map((u) => ({
        id: u.id,
        email: u.email,
        user_metadata: u.user_metadata,
      })))
      if (users.length < perPage) break
      page++
    }
  }
  const metaMap = new Map(
    allAuthUsers.map((u) => [u.id, (u.user_metadata ?? {}) as Record<string, string>])
  )
  const emailMap = new Map(
    allAuthUsers.map((u) => [u.id, u.email ?? ''])
  )

  if (!perfilesData) {
    return NextResponse.json({ error: 'No se pudieron leer los datos' }, { status: 500 })
  }

  // Mapas de búsqueda
  const perfilesMap = new Map((perfilesData ?? []).map((p) => [p.id, p]))
  const scoringMap = new Map((scoringData ?? []).map((s) => [s.user_id, s]))
  const respuestasMap = new Map((respuestasData ?? []).map((r) => [r.user_id, r]))

  // Combinar datos por persona
  const filas = userIds.map((uid) => {
    const perfil = perfilesMap.get(uid)
    const meta = metaMap.get(uid) ?? {}
    const nombreCompleto = [
      perfil?.nombre || meta.nombre,
      perfil?.primer_apellido || meta.primer_apellido,
      perfil?.segundo_apellido || meta.segundo_apellido,
    ].filter(Boolean).join(' ') || 'Sin nombre'

    return {
      user_id: uid,
      nombre: nombreCompleto,
      cedula: perfil?.cedula || meta.cedula || '',
      correo: emailMap.get(uid) ?? '',
      departamento: perfil?.departamento || meta.departamento || '',
      dependencia_funciones: perfil?.dependencia_funciones || meta.dependencia_funciones || '',
      completado: respuestasMap.get(uid)?.completado ? 'Sí' : 'No',
      ...scoringMap.get(uid),
    }
  })

  // ── Construir el workbook desde cero ──────────────────────────────────────
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Desarrollo de Líderes y Equipo'
  workbook.created = new Date()

  // ── Hoja 1: Resultados ────────────────────────────────────────────────────
  const hoja = workbook.addWorksheet('Resultados DISC')

  const encabezados = [
    { header: 'Nombre Completo', key: 'nombre', width: 28 },
    { header: 'Cédula', key: 'cedula', width: 16 },
    { header: 'Correo', key: 'correo', width: 30 },
    { header: 'Departamento', key: 'departamento', width: 20 },
    { header: 'Dependencia / Funciones', key: 'dependencia_funciones', width: 35 },
    { header: 'Completó', key: 'completado', width: 10 },
    { header: 'Perfil', key: 'perfil_combinado', width: 8 },
    { header: 'Estilo principal', key: 'estilo_principal', width: 16 },
    { header: 'Estilo secundario', key: 'estilo_secundario', width: 17 },
    { header: 'D global', key: 'd_global', width: 10 },
    { header: 'I global', key: 'i_global', width: 10 },
    { header: 'S global', key: 's_global', width: 10 },
    { header: 'C global', key: 'c_global', width: 10 },
    { header: 'Perfil trabajo D', key: 'perfil_trabajo_d', width: 16 },
    { header: 'Perfil trabajo I', key: 'perfil_trabajo_i', width: 16 },
    { header: 'Perfil trabajo S', key: 'perfil_trabajo_s', width: 16 },
    { header: 'Perfil trabajo C', key: 'perfil_trabajo_c', width: 16 },
    { header: 'Motivación D', key: 'motivacion_d', width: 13 },
    { header: 'Motivación I', key: 'motivacion_i', width: 13 },
    { header: 'Motivación S', key: 'motivacion_s', width: 13 },
    { header: 'Motivación C', key: 'motivacion_c', width: 13 },
    { header: 'Gestión jefe D', key: 'gestion_jefe_d', width: 14 },
    { header: 'Gestión jefe I', key: 'gestion_jefe_i', width: 14 },
    { header: 'Gestión jefe S', key: 'gestion_jefe_s', width: 14 },
    { header: 'Gestión jefe C', key: 'gestion_jefe_c', width: 14 },
    { header: 'Dinámica equipo D', key: 'dinamica_equipo_d', width: 16 },
    { header: 'Dinámica equipo I', key: 'dinamica_equipo_i', width: 16 },
    { header: 'Dinámica equipo S', key: 'dinamica_equipo_s', width: 16 },
    { header: 'Dinámica equipo C', key: 'dinamica_equipo_c', width: 16 },
  ]

  hoja.columns = encabezados

  // Helper: column number → Excel letter (soporta AA, AB, etc.)
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

  // Estilo del encabezado
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

  // Filas de datos
  filas.forEach((f, idx) => {
    const row = hoja.addRow(f)
    row.height = 18

    // Alternar color de fila
    if (idx % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F8FA' } }
      })
    }

    // Colorear celda de perfil con el color del estilo dominante
    const estilo = f.estilo_principal as string | undefined
    if (estilo && COLOR_DISC[estilo]) {
      const perfilCell = row.getCell('perfil_combinado')
      perfilCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_DISC[estilo] } }
      perfilCell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      perfilCell.alignment = { horizontal: 'center' }
    }

    // Centrar columnas numéricas
    ;['d_global','i_global','s_global','c_global'].forEach((col) => {
      row.getCell(col).alignment = { horizontal: 'center' }
    })
  })

  // Congelar fila de encabezados
  hoja.views = [{ state: 'frozen', ySplit: 1 }]

  // Auto-filtro en toda la tabla de resultados
  const lastCol = colToLetter(encabezados.length)
  hoja.autoFilter = { from: 'A1', to: `${lastCol}1` }

  // ── Data bars de color para columnas D / I / S / C global ─────────────────
  const totalFilas = filas.length
  if (totalFilas > 0) {
    const colLetras: Record<string, { col: string; hex: string }> = {
      d_global: { col: 'I', hex: '1F4E79' },
      i_global: { col: 'J', hex: 'C00000' },
      s_global: { col: 'K', hex: 'D9A300' },
      c_global: { col: 'L', hex: '00843D' },
    }
    Object.values(colLetras).forEach(({ col, hex }) => {
      const rango = `${col}2:${col}${totalFilas + 1}`
      hoja.addConditionalFormatting({
        ref: rango,
        rules: [
          {
            type: 'dataBar',
            minLength: 10,
            maxLength: 90,
            cfvo: [{ type: 'num', value: -32 }, { type: 'num', value: 32 }],
            // @ts-expect-error — ExcelJS types incompletos para color en dataBar
color: { argb: `FF${hex}` },
            showValue: true,
            gradient: true,
          },
        ],
      })
    })
  }

  // ── Hoja 2: Resumen por Dependencia ───────────────────────────────────────
  const hojaResumen = workbook.addWorksheet('Resumen por Dependencia')
  hojaResumen.columns = [
    { header: 'Departamento', key: 'departamento', width: 22 },
    { header: 'Dependencia / Funciones', key: 'dependencia', width: 35 },
    { header: 'Total registrados', key: 'total', width: 18 },
    { header: 'Completaron', key: 'completaron', width: 13 },
    { header: '% Completado', key: 'pct', width: 14 },
    { header: 'Prom. D', key: 'd', width: 10 },
    { header: 'Prom. I', key: 'i', width: 10 },
    { header: 'Prom. S', key: 's', width: 10 },
    { header: 'Prom. C', key: 'c', width: 10 },
    { header: 'Estilo + frecuente', key: 'estilo', width: 18 },
  ]

  const headerResumen = hojaResumen.getRow(1)
  headerResumen.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } }
    cell.alignment = { horizontal: 'center' }
  })
  headerResumen.height = 22

  // Agrupar por dependencia
  const porDep: Record<string, typeof filas> = {}
  filas.forEach((f) => {
    const dep = f.dependencia_funciones || 'Sin dependencia'
    if (!porDep[dep]) porDep[dep] = []
    porDep[dep].push(f)
  })

  Object.entries(porDep).sort(([a], [b]) => a.localeCompare(b)).forEach(([dep, miembros], idx) => {
    const completaron = miembros.filter((m) => m.completado === 'Sí')
    const n = completaron.length || 1
    const avg = (campo: string) =>
      Math.round((completaron.reduce((acc, m) => acc + ((m as Record<string, number>)[campo] ?? 0), 0) / n) * 10) / 10

    const conteo: Record<string, number> = {}
    completaron.forEach((m) => {
      const e = (m as Record<string, string>).estilo_principal
      if (e) conteo[e] = (conteo[e] ?? 0) + 1
    })
    const estiloFrecuente = Object.entries(conteo).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '-'

    const row = hojaResumen.addRow({
      departamento: miembros[0]?.departamento || '—',
      dependencia: dep,
      total: miembros.length,
      completaron: completaron.length,
      pct: miembros.length ? `${Math.round((completaron.length / miembros.length) * 100)}%` : '0%',
      d: completaron.length ? avg('d_global') : '-',
      i: completaron.length ? avg('i_global') : '-',
      s: completaron.length ? avg('s_global') : '-',
      c: completaron.length ? avg('c_global') : '-',
      estilo: estiloFrecuente,
    })
    row.height = 18

    if (idx % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F8FA' } }
      })
    }

    if (estiloFrecuente !== '-' && COLOR_DISC[estiloFrecuente]) {
      const estiloCell = row.getCell('estilo')
      estiloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_DISC[estiloFrecuente] } }
      estiloCell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      estiloCell.alignment = { horizontal: 'center' }
    }
  })

  hojaResumen.views = [{ state: 'frozen', ySplit: 1 }]
  hojaResumen.autoFilter = { from: 'A1', to: `${colToLetter(10)}1` }

  // ── Generar buffer y devolver ─────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="disc_resultados_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
