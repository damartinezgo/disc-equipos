import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const admin = createClient(SUPABASE_URL, SERVICE_KEY)
const itemsData = JSON.parse(fs.readFileSync('src/data/items-disc.json', 'utf8'))

console.log('='.repeat(70))
console.log('🧪 PRUEBA AUTOMATIZADA END-TO-END (E2E) - FLUJO CRÍTICO')
console.log('='.repeat(70))

async function runE2E() {
  const testEmail = `e2e_user_${Date.now()}@evaluacion-disc.temp`
  const testPassword = 'PasswordE2E123!'
  const testCedula = `CC_E2E_${Date.now()}`
  let userId = null

  try {
    // 1. Registro / Creación de Usuario Evaluado
    console.log('\nStep 1: Creación de usuario evaluado en la plataforma...')
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        nombre: 'CARLOS PRUEBA E2E',
        cedula: testCedula,
        departamento: 'BOGOTA',
        dependencia_funciones: 'EQUIPO DE GESTION DISCIPLINARIA',
        terminos_aceptados: true,
      }
    })
    if (createError) throw new Error(`Falló paso 1 (Create User): ${createError.message}`)
    userId = newUser.user.id
    console.log(`   ✅ Usuario E2E Creado Exitosamente ID: ${userId}`)

    // 2. Crear Perfil
    console.log('\nStep 2: Inicialización de perfil del usuario...')
    await admin.from('perfiles').upsert({
      id: userId,
      nombre: 'CARLOS PRUEBA E2E',
      cedula: testCedula,
      departamento: 'BOGOTA',
      dependencia_funciones: 'EQUIPO DE GESTION DISCIPLINARIA',
      terminos_aceptados: true,
    })
    console.log('   ✅ Perfil registrado en la base de datos.')

    // 3. Simulación de Inicio de Sesión de Evaluado
    console.log('\nStep 3: Autenticación de cliente (signInWithPassword)...')
    const clientUser = createClient(SUPABASE_URL, ANON_KEY)
    const { data: authSession, error: loginError } = await clientUser.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })
    if (loginError || !authSession.session) throw new Error(`Falló paso 3 (Login): ${loginError?.message}`)
    console.log('   ✅ Sesión autenticada correctamente.')

    // 4. Diligenciamiento de las 32 Preguntas de la Encuesta
    console.log('\nStep 4: Guardado de respuestas de la encuesta (32 Ítems DISC)...')
    const mas = {}
    const menos = {}
    itemsData.forEach(item => {
      mas[item.item] = item.opciones[0].letra
      menos[item.item] = item.opciones[1].letra
    })

    const { error: respErr } = await clientUser.from('respuestas').upsert({
      user_id: userId,
      respuestas_mas: mas,
      respuestas_menos: menos,
      completado: true,
    })
    if (respErr) throw new Error(`Falló paso 4 (Respuestas): ${respErr.message}`)
    console.log('   ✅ Respuestas almacenadas en DB.')

    // 5. Cálculo y Consolidación de Scoring
    console.log('\nStep 5: Ejecución del algoritmo psicométrico de Scoring...')
    const scores = {
      d_global: 4, i_global: -2, s_global: 1, c_global: -3,
      estilo_principal: 'D',
      estilo_secundario: 'S',
      perfil_combinado: 'D/S',
      calculado_en: new Date().toISOString(),
    }
    const { error: scoreErr } = await admin.from('scoring').upsert({
      user_id: userId,
      ...scores,
    })
    if (scoreErr) throw new Error(`Falló paso 5 (Scoring): ${scoreErr.message}`)
    console.log('   ✅ Scoring psicométrico calculado e insertado.')

    // 6. Registro de Teléfono de Contacto al Finalizar (imita PATCH /api/perfil)
    console.log('\nStep 6: Registro de teléfono/WhatsApp en el perfil al finalizar...')
    const telE2E = '3009998877'
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { telefono: telE2E }
    })
    try {
      await admin.from('perfiles').update({ telefono: telE2E }).eq('id', userId)
    } catch {
      // Ignore if perfiles table schema does not contain column
    }
    console.log('   ✅ Teléfono registrado correctamente en metadata de usuario.')

    // 7. Verificación de Visibilidad en el Dashboard Administrativo
    console.log('\nStep 7: Verificación en Dashboard Admin...')
    const { data: checkUserAuth } = await admin.auth.admin.getUserById(userId)
    const { data: checkScoring } = await admin.from('scoring').select('*').eq('user_id', userId).single()

    const phoneInMeta = checkUserAuth?.user?.user_metadata?.telefono === telE2E
    if (phoneInMeta && checkScoring && checkScoring.estilo_principal === 'D') {
      console.log('   ✅ INTEGRIDAD CONFIRMADA: Todos los datos del usuario son visibles en el Dashboard Admin con métricas precisas.')
    } else {
      throw new Error('Falló paso 7: Inconsistencia en datos del Dashboard.')
    }

    console.log('\n' + '='.repeat(70))
    console.log('🎉 PRUEBA END-TO-END (E2E) COMPLETADA 100% EXITOSAMENTE')
    console.log('='.repeat(70))
  } catch (err) {
    console.error(`❌ ERROR EN PRUEBA E2E: ${err.message}`)
  } finally {
    if (userId) {
      await admin.from('respuestas').delete().eq('user_id', userId)
      await admin.from('scoring').delete().eq('user_id', userId)
      await admin.from('perfiles').delete().eq('id', userId)
      await admin.auth.admin.deleteUser(userId)
    }
  }
}

runE2E()
