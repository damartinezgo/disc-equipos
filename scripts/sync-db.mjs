import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

// Lee variables de entorno directamente de .env.local
const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    env[match[1]] = value.trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan claves de Supabase en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 1. Limpieza de usuarios de prueba
const correosBorrar = [
  'dianacguiot@gmail.com',
  'damartinezgo@unal.edu.co',
  'marthapgonzalez1966@gmail.com',
  'damartinezgo1@gmail.com',
  'dm373965@gmail.com'
]

async function limpiarUsuarios() {
  console.log('--- 1. Eliminando usuarios de prueba ---')
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  for (const email of correosBorrar) {
    const u = users.find(x => x.email?.toLowerCase() === email.toLowerCase())
    if (u) {
      console.log(`Eliminando: ${email} (ID: ${u.id})`)
      await supabase.from('respuestas').delete().eq('user_id', u.id)
      await supabase.from('scoring').delete().eq('user_id', u.id)
      await supabase.from('perfiles').delete().eq('id', u.id)
      await supabase.auth.admin.deleteUser(u.id)
      console.log(`✓ Eliminado: ${email}`)
    } else {
      console.log(`No encontrado en Auth: ${email}`)
    }
  }
}

// Parseador simple de CSV
function parseCSV(content) {
  const lines = content.split('\r\n').join('\n').split('\n').filter(l => l.trim().length > 0)
  if (lines.length === 0) return []
  
  // Header
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Dividir considerando comas
    const parts = line.split(',')
    if (parts.length < 5) continue

    const row = {}
    headers.forEach((h, idx) => {
      row[h] = parts[idx] ? parts[idx].trim() : ''
    })
    rows.push(row)
  }
  return rows
}

async function cargarUsuariosCSV() {
  console.log('--- 2. Cargando usuarios del CSV ---')
  const csvData = fs.readFileSync('usuarios.csv', 'utf8')
  const rows = parseCSV(csvData)
  console.log(`Total registros en CSV: ${rows.length}`)

  let creados = 0
  let actualizados = 0
  let errores = 0

  // Obtenemos usuarios auth existentes para no duplicar
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const userMap = new Map((authData?.users || []).map(u => [u.email?.toLowerCase(), u]))

  for (const r of rows) {
    const cedula = r['Cédula']
    const nombres = r['Nombres']
    const primerApellido = r['Primer Apellido']
    const segundoApellido = r['Segundo Apellido']
    const departamento = r['Departamento']
    const dependencia = r['Dependencia Funciones']
    const correo = r['Correo']?.toLowerCase()

    if (!correo || !cedula) {
      continue
    }

    const metadata = {
      nombre: nombres,
      cedula: cedula,
      primer_apellido: primerApellido || '',
      segundo_apellido: segundoApellido || '',
      departamento: departamento || '',
      dependencia_funciones: dependencia || '',
      terminos_aceptados: true
    }

    try {
      const existing = userMap.get(correo)
      let userId = null

      if (existing) {
        // Actualizar perfil
        userId = existing.id
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: metadata,
          password: cedula
        })
        actualizados++
      } else {
        // Crear nuevo usuario
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: correo,
          password: cedula,
          email_confirm: true,
          user_metadata: metadata
        })

        if (createErr) {
          console.error(`Error creando ${correo}:`, createErr.message)
          errores++
          continue
        }
        userId = newUser.user.id
        creados++
      }

      // Upsert directo en tabla perfiles para asegurar integridad inmediata
      await supabase.from('perfiles').upsert({
        id: userId,
        nombre: nombres || 'Sin nombre',
        cedula: cedula,
        primer_apellido: primerApellido || null,
        segundo_apellido: segundoApellido || null,
        departamento: departamento || null,
        dependencia_funciones: dependencia || null,
        terminos_aceptados: true
      })

    } catch (err) {
      console.error(`Excepción en ${correo}:`, err.message)
      errores++
    }
  }

  console.log(`\nResumen de sincronización:`)
  console.log(`- Nuevos creados: ${creados}`)
  console.log(`- Actualizados: ${actualizados}`)
  console.log(`- Errores: ${errores}`)
}

async function main() {
  await limpiarUsuarios()
  await cargarUsuariosCSV()
  console.log('Proceso completado exitosamente.')
}

main()
