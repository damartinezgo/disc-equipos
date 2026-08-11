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

  // Solo un encuestador autenticado puede exportar
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const { data: esEncuestador } = await supabase
    .from('encuestadores')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!esEncuestador) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { userIds }: { userIds: string[] } = await req.json()
  if (!userIds?.length) {
    return NextResponse.json({ error: 'Sin personas para exportar' }, { status: 400 })
  }

  const admin = createServiceClient()

  // Leer datos (queries independientes, sin FK)
  const { data: perfilesData } = await admin
    .from('perfiles')
    .select('id, nombre, equipo')
    .in('id', userIds)

  const { data: respuestasData } = await admin
    .from('respuestas')
    .select('user_id, completado')
    .in('user_id', userIds)

  const { data: scoringData } = await admin
    .from('scoring')
    .select('*')
    .in('user_id', userIds)

  // Leer lugares desde auth.users.user_metadata (columna lugar no existe en perfiles)
  const { data: authRes } = await admin.auth.admin.listUsers()
  const lugarMap = new Map(
    (authRes?.users ?? []).map((u) => [u.id, u.user_metadata?.lugar ?? ''])
  )

  if (!perfilesData) {
    return NextResponse.json({ error: 'No se pudieron leer los datos' }, { status: 500 })
  }

  // Mapas de búsqueda
  const perfilesMap = new Map((perfilesData ?? []).map((p) => [p.id, p]))
  const scoringMap = new Map((scoringData ?? []).map((s) => [s.user_id, s]))
  const respuestasMap = new Map((respuestasData ?? []).map((r) => [r.user_id, r]))

  // Combinar datos por persona
  const filas = userIds.map((uid) => ({
    user_id: uid,
    nombre: perfilesMap.get(uid)?.nombre ?? '',
    lugar: lugarMap.get(uid) ?? '',
    equipo: perfilesMap.get(uid)?.equipo ?? '',
    completado: respuestasMap.get(uid)?.completado ? 'Sí' : 'No',
    ...scoringMap.get(uid),
  }))

  // ── Construir el workbook desde cero ──────────────────────────────────────
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Desarrollo de Líderes y Equipo'
  workbook.created = new Date()

  // ── Hoja 1: Resultados ────────────────────────────────────────────────────
  const hoja = workbook.addWorksheet('Resultados - Desarrollo de Líderes y Equipo')

  const encabezados = [
    { header: 'Nombre', key: 'nombre', width: 24 },
    { header: 'Lugar', key: 'lugar', width: 18 },
    { header: 'Equipo', key: 'equipo', width: 20 },
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
    { header: 'Equipo D', key: 'dinamica_equipo_d', width: 10 },
    { header: 'Equipo I', key: 'dinamica_equipo_i', width: 10 },
    { header: 'Equipo S', key: 'dinamica_equipo_s', width: 10 },
    { header: 'Equipo C', key: 'dinamica_equipo_c', width: 10 },
  ]

  hoja.columns = encabezados

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

  // Auto-filtro
  hoja.autoFilter = { from: 'A1', to: `${String.fromCharCode(65 + encabezados.length - 1)}1` }

  // ── Data bars de color para columnas D / I / S / C global ─────────────────
  const totalFilas = filas.length
  if (totalFilas > 0) {
    const colLetras: Record<string, { col: string; hex: string }> = {
      d_global: { col: 'H', hex: '1F4E79' },
      i_global: { col: 'I', hex: 'C00000' },
      s_global: { col: 'J', hex: 'D9A300' },
      c_global: { col: 'K', hex: '00843D' },
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
            // @ts-ignore ExcelJS types incompletos para color en dataBar
            color: { argb: `FF${hex}` },
            showValue: true,
            gradient: true,
          },
        ],
      })
    })
  }

  // ── Hoja 2: Resumen por equipo ────────────────────────────────────────────
  const hojaResumen = workbook.addWorksheet('Resumen por Equipo')
  hojaResumen.columns = [
    { header: 'Equipo', key: 'equipo', width: 22 },
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

  // Agrupar por equipo
  const porEquipo: Record<string, typeof filas> = {}
  filas.forEach((f) => {
    const eq = f.equipo || 'Sin equipo'
    if (!porEquipo[eq]) porEquipo[eq] = []
    porEquipo[eq].push(f)
  })

  Object.entries(porEquipo).sort(([a], [b]) => a.localeCompare(b)).forEach(([equipo, miembros], idx) => {
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
      equipo,
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

  // ── Generar buffer y devolver ─────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="disc_resultados_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
