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
  const { data: resp } = await admin.from('respuestas').select('*')
  console.log('Respuestas en DB:', JSON.stringify(resp, null, 2))

  if (resp && resp.length > 0) {
    const userId = resp[0].user_id
    const { data: perfil } = await admin.from('perfiles').select('*').eq('id', userId).maybeSingle()
    const { data: userAuth } = await admin.auth.admin.getUserById(userId)
    console.log('Perfil asociado:', perfil)
    console.log('Auth user asociado:', userAuth)
  }
}

check().catch(console.error)
