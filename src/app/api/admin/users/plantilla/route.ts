import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sistema DISC Procuraduría'
  workbook.created = new Date()

  const hoja = workbook.addWorksheet('Plantilla Usuarios')

  const encabezados = [
    { header: 'Nombres', key: 'nombres', width: 24 },
    { header: 'Primer Apellido', key: 'primer_apellido', width: 20 },
    { header: 'Segundo Apellido', key: 'segundo_apellido', width: 20 },
    { header: 'Cédula', key: 'cedula', width: 18 },
    { header: 'Correo', key: 'correo', width: 32 },
    { header: 'Teléfono', key: 'telefono', width: 18 },
    { header: 'Departamento', key: 'departamento', width: 22 },
    { header: 'Dependencia Funciones', key: 'dependencia_funciones', width: 38 },
  ]

  hoja.columns = encabezados

  // Estilo del encabezado
  const headerRow = hoja.getRow(1)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    }
  })
  headerRow.height = 26

  // Filas de ejemplo instructivas
  const ejemplos = [
    {
      nombres: 'Juan Carlos',
      primer_apellido: 'Pérez',
      segundo_apellido: 'Gómez',
      cedula: '1020304050',
      correo: 'juan.perez@procuraduria.gov.co',
      telefono: '3001234567',
      departamento: 'BOGOTA',
      dependencia_funciones: 'DESPACHO PROCURADOR GENERAL',
    },
    {
      nombres: 'María Elena',
      primer_apellido: 'Rodríguez',
      segundo_apellido: 'Castro',
      cedula: '52987654',
      correo: 'maria.rodriguez@procuraduria.gov.co',
      telefono: '3159876543',
      departamento: 'ANTIOQUIA',
      dependencia_funciones: 'PROCURADURIA REGIONAL DE INSTRUCCION DE ANTIOQUIA',
    },
  ]

  ejemplos.forEach((ej) => {
    const row = hoja.addRow(ej)
    row.height = 20
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      }
    })
  })

  hoja.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla_carga_usuarios.xlsx"',
    },
  })
}
