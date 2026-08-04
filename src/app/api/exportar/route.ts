import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import path from 'path'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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

  // Usa el service role para leer todo sin restricción de RLS por fila
  const admin = createServiceClient()

  const { data: respuestas } = await admin
    .from('respuestas')
    .select('user_id, fecha_aplicacion, respuestas_mas, respuestas_menos, errores_misma_opcion, perfiles:perfiles!inner(nombre, equipo)')
    .in('user_id', userIds)

  const { data: scoring } = await admin
    .from('scoring')
    .select('*')
    .in('user_id', userIds)

  if (!respuestas || !scoring) {
    return NextResponse.json({ error: 'No se pudieron leer los datos' }, { status: 500 })
  }

  // ---- Abre la plantilla original y escribe solo en las celdas de datos ----
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(path.join(process.cwd(), 'plantilla', 'formulario.xlsx'))

  const hojaRespuestas = workbook.getWorksheet('02_Entrada_Respuestas')!
  const hojaScoring = workbook.getWorksheet('03_Scoring')!

  respuestas.forEach((r, idx) => {
    const filaIdx = idx + 2 // fila 1 = encabezados
    const fila = hojaRespuestas.getRow(filaIdx)
    fila.getCell(1).value = r.user_id
    fila.getCell(2).value = (r.perfiles as unknown as { nombre: string }[])[0]?.nombre
    fila.getCell(3).value = (r.perfiles as unknown as { equipo: string }[])[0]?.equipo
    fila.getCell(4).value = r.fecha_aplicacion ? new Date(r.fecha_aplicacion) : null

    for (let item = 1; item <= 32; item++) {
      fila.getCell(4 + item).value = (r.respuestas_mas as Record<string, string>)?.[item] ?? null
      fila.getCell(36 + item).value = (r.respuestas_menos as Record<string, string>)?.[item] ?? null
    }
    fila.getCell(69).value = r.errores_misma_opcion ?? 0
    fila.commit()
  })

  scoring.forEach((s, idx) => {
    const filaIdx = idx + 2
    const fila = hojaScoring.getRow(filaIdx)
    const persona = respuestas.find((r) => r.user_id === s.user_id)
    fila.getCell(1).value = s.user_id
    fila.getCell(2).value = (persona?.perfiles as unknown as { nombre: string }[])?.[0]?.nombre ?? ''
    fila.getCell(3).value = (persona?.perfiles as unknown as { equipo: string }[])?.[0]?.equipo ?? ''
    fila.getCell(4).value = s.d_global
    fila.getCell(5).value = s.i_global
    fila.getCell(6).value = s.s_global
    fila.getCell(7).value = s.c_global
    fila.getCell(8).value = s.estilo_principal
    fila.getCell(9).value = s.puntaje_principal
    fila.getCell(10).value = s.estilo_secundario
    fila.getCell(11).value = s.puntaje_secundario
    fila.getCell(12).value = s.perfil_combinado
    fila.commit()
  })

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="disc_resultados.xlsx"`,
    },
  })
}
