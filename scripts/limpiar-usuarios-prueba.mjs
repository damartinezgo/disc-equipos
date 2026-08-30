import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
})

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function limpiar() {
  console.log('🧹 Buscando usuarios de prueba para eliminar...\n')

  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const allUsers = authData?.users ?? []

  // Encontrar usuarios de prueba (stress, e2e, test_carga, evaluacion-disc.temp)
  const testUsers = allUsers.filter(u => {
    const email = (u.email || '').toLowerCase()
    return email.includes('evaluacion-disc.temp') ||
           email.includes('test_carga') ||
           email.includes('test_sec_') ||
           email.includes('e2e_user_') ||
           email.includes('stress_600')
  })

  console.log(`📋 Encontrados ${testUsers.length} usuarios de prueba para eliminar.\n`)

  if (testUsers.length === 0) {
    console.log('✅ No hay usuarios de prueba. La BD está limpia.')
    return
  }

  let eliminados = 0
  let errores = 0

  for (const u of testUsers) {
    try {
      await admin.from('respuestas').delete().eq('user_id', u.id)
      await admin.from('scoring').delete().eq('user_id', u.id)
      await admin.from('consentimientos').delete().eq('user_id', u.id)
      await admin.from('perfiles').delete().eq('id', u.id)
      await admin.auth.admin.deleteUser(u.id)
      eliminados++
      console.log(`   ✅ Eliminado: ${u.email}`)
    } catch (err) {
      errores++
      console.log(`   ❌ Error al eliminar ${u.email}: ${err.message}`)
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`🧹 LIMPIEZA COMPLETADA`)
  console.log(`   - Eliminados: ${eliminados}`)
  console.log(`   - Errores: ${errores}`)

  // Verificar que no queden residuos
  const { data: checkAuth } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const remaining = (checkAuth?.users ?? []).filter(u =>
    (u.email || '').toLowerCase().includes('evaluacion-disc.temp')
  )
  console.log(`   - Residuos restantes: ${remaining.length}`)
  console.log(`${'='.repeat(60)}`)
}

limpiar().catch(console.error)
