import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient, createServiceClient } from '@/lib/supabase/server'

function normalizarClave(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, '')       // keep only alphanumeric
}

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

  let rows: Record<string, string>[] = []

  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se ha proporcionado ningún archivo' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = file.name.toLowerCase()

    if (filename.endsWith('.csv')) {
      const text = buffer.toString('utf8')
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
      if (lines.length > 0) {
        const headerParts = lines[0].split(',').map((h) => normalizarClave(h.trim()))
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',')
          const rowObj: Record<string, string> = {}
          headerParts.forEach((key, idx) => {
            rowObj[key] = (parts[idx] ?? '').trim().replace(/^["']|["']$/g, '')
          })
          rows.push(rowObj)
        }
      }
    } else {
      // Excel (.xlsx, .xls)
      const workbook = new ExcelJS.Workbook()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any)
      const worksheet = workbook.worksheets[0]

      if (!worksheet) {
        return NextResponse.json({ error: 'El archivo Excel no contiene hojas de cálculo' }, { status: 400 })
      }

      const headers: { colIndex: number; key: string }[] = []
      const headerRow = worksheet.getRow(1)

      headerRow.eachCell((cell, colIndex) => {
        const val = String(cell.value ?? '').trim()
        if (val) {
          headers.push({ colIndex, key: normalizarClave(val) })
        }
      })

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // Skip header
        const rowObj: Record<string, string> = {}
        let hasAnyValue = false

        headers.forEach(({ colIndex, key }) => {
          const cell = row.getCell(colIndex)
          let val = ''
          if (cell.value !== null && cell.value !== undefined) {
            if (typeof cell.value === 'object' && 'text' in cell.value) {
              val = String((cell.value as { text?: string }).text ?? '')
            } else {
              val = String(cell.value).trim()
            }
          }
          if (val) hasAnyValue = true
          rowObj[key] = val
        })

        if (hasAnyValue) {
          rows.push(rowObj)
        }
      })
    }
  } else {
    // JSON payload
    const body = await req.json().catch(() => ({}))
    rows = body.users || []
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No se encontraron registros para importar' }, { status: 400 })
  }

  const admin = createServiceClient()

  // Get existing users to determine update vs create
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const userMap = new Map((authData?.users || []).map((u) => [u.email?.toLowerCase(), u]))

  let creados = 0
  let actualizados = 0
  const errores: string[] = []

  for (let index = 0; index < rows.length; index++) {
    const r = rows[index]
    const filaNum = index + 2 // Considering row 1 is header

    // Map fields flexibly
    const nombres = r['nombres'] || r['nombre'] || r['firstname'] || r['name'] || ''
    const primerApellido = r['primerapellido'] || r['apellido1'] || r['primerapellido'] || r['apellidos'] || ''
    const segundoApellido = r['segundoapellido'] || r['apellido2'] || r['segundoapellido'] || ''
    const cedula = String(r['cedula'] || r['documento'] || r['identificacion'] || r['cc'] || '').trim()
    const correo = String(r['correo'] || r['email'] || r['correoelectronico'] || '').trim().toLowerCase()
    const telefono = String(r['telefono'] || r['celular'] || r['phone'] || '').trim()
    const departamento = String(r['departamento'] || r['depto'] || '').trim()
    const municipio = String(r['municipio'] || r['ciudad'] || '').trim()
    const dependencia = String(r['dependenciafunciones'] || r['dependencia'] || r['cargo'] || r['funciones'] || '').trim()

    if (!correo || !cedula || !nombres) {
      errores.push(`Fila ${filaNum}: Faltan campos obligatorios (Nombres: "${nombres}", Cédula: "${cedula}", Correo: "${correo}")`)
      continue
    }

    const metadata = {
      nombre: nombres,
      cedula,
      primer_apellido: primerApellido,
      segundo_apellido: segundoApellido,
      departamento,
      municipio,
      dependencia_funciones: dependencia,
      telefono,
      terminos_aceptados: true,
    }

    try {
      const existing = userMap.get(correo)
      let userId: string

      if (existing) {
        userId = existing.id
        const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
          user_metadata: metadata,
          password: cedula,
        })
        if (updateErr) {
          errores.push(`Fila ${filaNum} (${correo}): ${updateErr.message}`)
          continue
        }
        actualizados++
      } else {
        const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
          email: correo,
          password: cedula,
          email_confirm: true,
          user_metadata: metadata,
        })

        if (createErr) {
          errores.push(`Fila ${filaNum} (${correo}): ${createErr.message}`)
          continue
        }
        userId = newUser.user.id
        creados++
      }

      // Upsert into perfiles table
      await admin.from('perfiles').upsert({
        id: userId,
        nombre: nombres,
        cedula,
        primer_apellido: primerApellido || null,
        segundo_apellido: segundoApellido || null,
        departamento: departamento || null,
        municipio: municipio || null,
        dependencia_funciones: dependencia || null,
        telefono: telefono || null,
        terminos_aceptados: true,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      errores.push(`Fila ${filaNum} (${correo}): ${msg}`)
    }
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    creados,
    actualizados,
    fallidos: errores.length,
    errores,
  })
}
