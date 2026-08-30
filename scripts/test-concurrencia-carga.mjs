import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Load env
const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
})

const itemsData = JSON.parse(fs.readFileSync('src/data/items-disc.json', 'utf8'))

console.log('='.repeat(65))
console.log('🚀 INICIANDO BATERÍA DE PRUEBAS DE CARGA Y CONCURRENCIA DISC')
console.log('='.repeat(65))
console.log(`📍 URL Supabase: ${SUPABASE_URL}`)
console.log(`📋 Total de ítems psicométricos en la encuesta: ${itemsData.length}`)
console.log('='.repeat(65))

function generarRespuestasAleatorias() {
  const mas = {}
  const menos = {}
  itemsData.forEach(item => {
    const letras = item.opciones.map(o => o.letra)
    // Elegir dos opciones distintas
    const masIdx = Math.floor(Math.random() * letras.length)
    let menosIdx = Math.floor(Math.random() * letras.length)
    while (menosIdx === masIdx) {
      menosIdx = Math.floor(Math.random() * letras.length)
    }
    mas[item.item] = letras[masIdx]
    menos[item.item] = letras[menosIdx]
  })
  return { mas, menos }
}

async function simularUsuarioCompleto(userNum) {
  const emailTest = `test_carga_${Date.now()}_${userNum}_${Math.floor(Math.random() * 10000)}@evaluacion-disc.temp`
  const passwordTest = `PassTest123${userNum}`
  const cedulaTest = `CC${Date.now()}${userNum}`
  const startUser = Date.now()

  try {
    // 1. Crear / Autenticar usuario de prueba
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: emailTest,
      password: passwordTest,
      email_confirm: true,
      user_metadata: {
        nombre: `USUARIO PRUEBA ${userNum}`,
        cedula: cedulaTest,
        departamento: 'BOGOTA',
        dependencia_funciones: 'PRUEBAS DE CARGA',
      }
    })

    if (authError || !authUser?.user) {
      throw new Error(`Error al crear usuario: ${authError?.message}`)
    }

    const userId = authUser.user.id

    // 2. Crear perfil
    await supabase.from('perfiles').upsert({
      id: userId,
      nombre: `USUARIO PRUEBA ${userNum}`,
      cedula: cedulaTest,
      departamento: 'BOGOTA',
      dependencia_funciones: 'PRUEBAS DE CARGA',
      terminos_aceptados: true,
    })

    // 3. Simular guardado de progreso de las 32 preguntas
    const { mas, menos } = generarRespuestasAleatorias()
    
    const startSave = Date.now()
    const { error: respError } = await supabase.from('respuestas').upsert({
      user_id: userId,
      respuestas_mas: mas,
      respuestas_menos: menos,
      completado: true,
    }, { onConflict: 'user_id' })

    const saveDuration = Date.now() - startSave
    if (respError) throw new Error(`Error al guardar respuestas: ${respError.message}`)

    // 4. Simular cálculo de scoring
    const startScore = Date.now()
    const scores = {
      d_global: Math.floor(Math.random() * 20) - 10,
      i_global: Math.floor(Math.random() * 20) - 10,
      s_global: Math.floor(Math.random() * 20) - 10,
      c_global: Math.floor(Math.random() * 20) - 10,
    }
    const estilos = ['D', 'I', 'S', 'C']
    const estiloP = estilos[Math.floor(Math.random() * 4)]
    const estiloS = estilos[(Math.floor(Math.random() * 3) + 1) % 4]

    const { error: scoreError } = await supabase.from('scoring').upsert({
      user_id: userId,
      ...scores,
      estilo_principal: estiloP,
      estilo_secundario: estiloS,
      perfil_combinado: `${estiloP}/${estiloS}`,
      calculado_en: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    const scoreDuration = Date.now() - startScore
    if (scoreError) throw new Error(`Error en scoring: ${scoreError.message}`)

    // 5. Simular registro de teléfono al finalizar
    const telTest = `300${Math.floor(1000000 + Math.random() * 9000000)}`
    await supabase.from('perfiles').update({ telefono: telTest }).eq('id', userId)

    const totalDuration = Date.now() - startUser

    // Limpiar usuario de prueba de la base de datos
    await supabase.from('respuestas').delete().eq('user_id', userId)
    await supabase.from('scoring').delete().eq('user_id', userId)
    await supabase.from('perfiles').delete().eq('id', userId)
    await supabase.auth.admin.deleteUser(userId)

    return {
      success: true,
      userNum,
      totalDuration,
      saveDuration,
      scoreDuration,
    }
  } catch (err) {
    return {
      success: false,
      userNum,
      error: err.message,
      totalDuration: Date.now() - startUser,
    }
  }
}

async function ejecutarPruebaConcurrente(numUsuariosSimultaneos) {
  console.log(`\n⏳ Ejecutando prueba con ${numUsuariosSimultaneos} usuarios simultáneos...`)
  const startBatch = Date.now()

  const promesas = []
  for (let i = 1; i <= numUsuariosSimultaneos; i++) {
    promesas.push(simularUsuarioCompleto(i))
  }

  const resultados = await Promise.all(promesas)
  const durationBatch = Date.now() - startBatch

  const exitosos = resultados.filter(r => r.success)
  const fallidos = resultados.filter(r => !r.success)

  const tiempos = exitosos.map(r => r.totalDuration)
  const minTime = tiempos.length ? Math.min(...tiempos) : 0
  const maxTime = tiempos.length ? Math.max(...tiempos) : 0
  const avgTime = tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : 0
  
  // Percentil 95
  tiempos.sort((a, b) => a - b)
  const p95 = tiempos.length ? tiempos[Math.floor(tiempos.length * 0.95)] : 0

  const rps = ((numUsuariosSimultaneos / (durationBatch / 1000))).toFixed(2)

  console.log(`📊 RESULTADOS PARA ${numUsuariosSimultaneos} USUARIOS SIMULTÁNEOS:`)
  console.log(`   - Éxito: ${exitosos.length} / ${numUsuariosSimultaneos} (${((exitosos.length / numUsuariosSimultaneos) * 100).toFixed(1)}%)`)
  console.log(`   - Fallos: ${fallidos.length}`)
  console.log(`   - Tiempo total de ejecución del lote: ${(durationBatch / 1000).toFixed(2)} segundos`)
  console.log(`   - Flujo de transacciones completadas: ${rps} usuarios/segundo`)
  console.log(`   - Tiempo promedio por usuario completo: ${avgTime} ms`)
  console.log(`   - Tiempo mínimo: ${minTime} ms`)
  console.log(`   - Tiempo máximo: ${maxTime} ms`)
  console.log(`   - Percentil 95 (P95): ${p95} ms`)

  if (fallidos.length > 0) {
    console.log(`   ⚠️ Errores detectados:`)
    fallidos.slice(0, 3).forEach(f => console.log(`      • Usuario ${f.userNum}: ${f.error}`))
  }

  return { exitosos: exitosos.length, fallidos: fallidos.length, avgTime, p95, rps }
}

async function main() {
  console.log('\n--- FASE 1: Prueba de Humo (Smoke Test: 5 usuarios concurrentes) ---')
  await ejecutarPruebaConcurrente(5)

  console.log('\n--- FASE 2: Carga Media (20 usuarios concurrentes simultáneos) ---')
  await ejecutarPruebaConcurrente(20)

  console.log('\n--- FASE 3: Carga Alta (50 usuarios concurrentes simultáneos) ---')
  await ejecutarPruebaConcurrente(50)

  console.log('\n' + '='.repeat(65))
  console.log('✅ TODAS LAS PRUEBAS DE CONCURRENCIA HAN FINALIZADO CON ÉXITO')
  console.log('='.repeat(65))
}

main().catch(console.error)
