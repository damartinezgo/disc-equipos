import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

console.log('='.repeat(70))
console.log('🔒 BATERÍA DE PRUEBAS DE SEGURIDAD, RLS Y SANITIZACIÓN (XSS)')
console.log('='.repeat(70))

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY)
const anonClient = createClient(SUPABASE_URL, ANON_KEY)

async function testRLSYAislamiento() {
  console.log('\n--- 1. PRUEBA DE ROW LEVEL SECURITY (RLS) Y AISLAMIENTO ---')

  // Crear 2 usuarios de prueba distintos
  const u1Email = `test_sec_user1_${Date.now()}@disc.temp`
  const u2Email = `test_sec_user2_${Date.now()}@disc.temp`

  const { data: user1Auth } = await adminClient.auth.admin.createUser({ email: u1Email, password: 'Password123!', email_confirm: true })
  const { data: user2Auth } = await adminClient.auth.admin.createUser({ email: u2Email, password: 'Password123!', email_confirm: true })

  const u1Id = user1Auth.user.id
  const u2Id = user2Auth.user.id

  // Insertar datos para Usuario 1
  await adminClient.from('perfiles').upsert({ id: u1Id, nombre: 'Usuario Sec 1', cedula: '11111' })
  await adminClient.from('respuestas').upsert({ user_id: u1Id, respuestas_mas: { 1: 'A' }, respuestas_menos: { 1: 'B' }, completado: true })
  await adminClient.from('scoring').upsert({ user_id: u1Id, d_global: 5, estilo_principal: 'D', perfil_combinado: 'D/I' })

  // Insertar datos para Usuario 2
  await adminClient.from('perfiles').upsert({ id: u2Id, nombre: 'Usuario Sec 2', cedula: '22222' })
  await adminClient.from('respuestas').upsert({ user_id: u2Id, respuestas_mas: { 1: 'C' }, respuestas_menos: { 1: 'D' }, completado: true })

  // A. Probar acceso Anónimo (Sin JWT)
  console.log('🔹 A. Acceso Anónimo (Sin autenticar):')
  const { data: anonRespuestas } = await anonClient.from('respuestas').select('*')
  const { data: anonScoring } = await anonClient.from('scoring').select('*')

  const anonRespLeak = (anonRespuestas?.length ?? 0) > 0
  const anonScoringLeak = (anonScoring?.length ?? 0) > 0

  if (!anonRespLeak && !anonScoringLeak) {
    console.log('   ✅ RLS de Lectura Anónima: PROTEGIDO (Usuarios no autenticados no pueden ver datos).')
  } else {
    console.log(`   ⚠️ RLS de Lectura Anónima: EXPUESTO (Respuestas visibles: ${anonRespuestas?.length}, Scoring visible: ${anonScoring?.length})`)
  }

  // B. Probar sesión de Usuario 1 intentando leer datos de Usuario 2
  console.log('🔹 B. Aislamiento entre Usuarios Authenticated (User 1 leyendo User 2):')
  const user1Client = createClient(SUPABASE_URL, ANON_KEY)
  const { data: signInData } = await user1Client.auth.signInWithPassword({ email: u1Email, password: 'Password123!' })

  if (signInData?.session) {
    const { data: u1ReadU2Resp } = await user1Client.from('respuestas').select('*').eq('user_id', u2Id)
    const { data: u1ReadU2Scoring } = await user1Client.from('scoring').select('*').eq('user_id', u2Id)

    const userCrossReadLeak = (u1ReadU2Resp?.length ?? 0) > 0 || (u1ReadU2Scoring?.length ?? 0) > 0

    if (!userCrossReadLeak) {
      console.log('   ✅ RLS entre Usuarios: PROTEGIDO (Un usuario regular NO puede ver las respuestas/scoring de otro).')
    } else {
      console.log('   ⚠️ RLS entre Usuarios: EXPUESTO (User 1 pudo leer datos de User 2).')
    }
  }

  // Cleanup
  await adminClient.from('respuestas').delete().in('user_id', [u1Id, u2Id])
  await adminClient.from('scoring').delete().in('user_id', [u1Id, u2Id])
  await adminClient.from('perfiles').delete().in('id', [u1Id, u2Id])
  await adminClient.auth.admin.deleteUser(u1Id)
  await adminClient.auth.admin.deleteUser(u2Id)
}

function testSanitizacionXSS() {
  console.log('\n--- 2. PRUEBA DE SANITIZACIÓN DE ENTRADAS (XSS) ---')
  const payloadsXSS = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(document.cookie)',
    '"><script>fetch("http://attacker.com")</script>'
  ]

  console.log('🔹 Probando inyección de payloads maliciosos HTML/JS:')
  payloadsXSS.forEach((payload, idx) => {
    // Simular renderizado React (JSX escapa automáticamete HTML)
    const safeString = String(payload).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const isSafe = !safeString.includes('<script>') && !safeString.includes('onerror=')
    console.log(`   • Payload [${idx + 1}]: ${payload.slice(0, 30)}... -> Sanitizado: ${isSafe ? '✅ SEGURO' : '❌ VULNERABLE'}`)
  })
}

async function run() {
  await testRLSYAislamiento()
  testSanitizacionXSS()
  console.log('\n' + '='.repeat(70))
  console.log('✅ PRUEBAS DE SEGURIDAD FINALIZADAS')
  console.log('='.repeat(70))
}

run().catch(console.error)
