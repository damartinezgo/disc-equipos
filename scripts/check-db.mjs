import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
})

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function check() {
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const authUsers = authData?.users ?? []
  const authIds = new Set(authUsers.map(u => u.id))

  const { data: perfiles } = await admin.from('perfiles').select('*')
  const { data: respuestas } = await admin.from('respuestas').select('*')
  const { data: scoring } = await admin.from('scoring').select('*')

  console.log('Total Auth Users:', authUsers.length)
  console.log('Total Perfiles:', perfiles?.length)
  console.log('Total Respuestas:', respuestas?.length)
  console.log('Total Scoring:', scoring?.length)

  const orphanPerfiles = perfiles?.filter(p => !authIds.has(p.id)) || []
  const orphanRespuestas = respuestas?.filter(r => !authIds.has(r.user_id)) || []
  const orphanScoring = scoring?.filter(s => !authIds.has(s.user_id)) || []

  console.log('\n--- BÚSQUEDA DE REGISTROS HUÉRFANOS ---')
  console.log('Huérfanos en Perfiles (sin usuario en Auth):', orphanPerfiles.length)
  console.log('Huérfanos en Respuestas (sin usuario en Auth):', orphanRespuestas.length)
  console.log('Huérfanos en Scoring (sin usuario en Auth):', orphanScoring.length)

  if (orphanPerfiles.length > 0) {
    console.log('\nEjemplos de Perfiles Huérfanos:')
    orphanPerfiles.forEach(p => console.log(` - ID: ${p.id} | Nombre: ${p.nombre}`))
  }
  if (orphanRespuestas.length > 0) {
    console.log('\nEjemplos de Respuestas Huérfanas:')
    orphanRespuestas.forEach(r => console.log(` - User ID: ${r.user_id}`))
  }
  if (orphanScoring.length > 0) {
    console.log('\nEjemplos de Scoring Huérfanos:')
    orphanScoring.forEach(s => console.log(` - User ID: ${s.user_id} | Perfil: ${s.perfil_combinado}`))
  }
}

check().catch(console.error)
