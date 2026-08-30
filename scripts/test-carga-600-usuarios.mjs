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

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
})

const itemsData = JSON.parse(fs.readFileSync('src/data/items-disc.json', 'utf8'))

console.log('='.repeat(75))
console.log('🚀 PRUEBA DE ESTRES Y CARGA MASIVA DE EXTREMA CONCURRENCIA (600 USUARIOS)')
console.log('='.repeat(75))
console.log(`📍 Supabase Target: ${SUPABASE_URL}`)
console.log(`📋 Total Ítems por Encuesta: ${itemsData.length}`)
console.log('='.repeat(75))

function generarRespuestasAleatorias() {
  const mas = {}
  const menos = {}
  itemsData.forEach(item => {
    const letras = item.opciones.map(o => o.letra)
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

async function simularTransaccionUsuario(userNum) {
  const emailTest = `stress_600_${Date.now()}_${userNum}_${Math.floor(Math.random() * 100000)}@evaluacion-disc.temp`
  const passwordTest = `Pass600Test${userNum}`
  const cedulaTest = `CC600_${Date.now()}_${userNum}`
  const startUser = Date.now()

  try {
    // 1. Crear usuario en Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: emailTest,
      password: passwordTest,
      email_confirm: true,
      user_metadata: {
        nombre: `EVALUADO 600 - ${userNum}`,
        cedula: cedulaTest,
        departamento: 'BOGOTA',
        dependencia_funciones: 'PRUEBA DE ESTRES 600',
      }
    })

    if (authError || !authUser?.user) {
      throw new Error(`Error en Auth createUser: ${authError?.message}`)
    }

    const userId = authUser.user.id

    // 2. Crear perfil
    await supabase.from('perfiles').upsert({
      id: userId,
      nombre: `EVALUADO 600 - ${userNum}`,
      cedula: cedulaTest,
      departamento: 'BOGOTA',
      dependencia_funciones: 'PRUEBA DE ESTRES 600',
      terminos_aceptados: true,
    })

    // 3. Simular respuestas de encuesta
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

    // 4. Simular scoring psicométrico
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

    // 5. Simular teléfono al finalizar
    const telTest = `310${Math.floor(1000000 + Math.random() * 9000000)}`
    await supabase.from('perfiles').update({ telefono: telTest }).eq('id', userId)

    const totalDuration = Date.now() - startUser

    // Limpieza inmediata de datos de prueba
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

async function ejecutarBatchConcurrente(numUsuariosSimultaneos) {
  console.log(`\n⏳ Lanzando ráfaga simultánea con ${numUsuariosSimultaneos} usuarios concurrentes...`)
  const startBatch = Date.now()

  const promesas = []
  for (let i = 1; i <= numUsuariosSimultaneos; i++) {
    promesas.push(simularTransaccionUsuario(i))
  }

  const resultados = await Promise.all(promesas)
  const durationBatch = Date.now() - startBatch

  const exitosos = resultados.filter(r => r.success)
  const fallidos = resultados.filter(r => !r.success)

  const tiempos = exitosos.map(r => r.totalDuration)
  const minTime = tiempos.length ? Math.min(...tiempos) : 0
  const maxTime = tiempos.length ? Math.max(...tiempos) : 0
  const avgTime = tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : 0
  
  tiempos.sort((a, b) => a - b)
  const p95 = tiempos.length ? tiempos[Math.floor(tiempos.length * 0.95)] : 0
  const rps = ((numUsuariosSimultaneos / (durationBatch / 1000))).toFixed(2)

  console.log(`📊 RESULTADOS RÁFAGA DE ${numUsuariosSimultaneos} USUARIOS:`)
  console.log(`   - Éxito: ${exitosos.length} / ${numUsuariosSimultaneos} (${((exitosos.length / numUsuariosSimultaneos) * 100).toFixed(1)}%)`)
  console.log(`   - Fallos / Errores: ${fallidos.length}`)
  console.log(`   - Tiempo total de ráfaga: ${(durationBatch / 1000).toFixed(2)} segundos`)
  console.log(`   - Tasa de rendimiento (Throughput): ${rps} encuestas completadas/segundo`)
  console.log(`   - Tiempo promedio por usuario: ${avgTime} ms`)
  console.log(`   - Tiempo Mínimo: ${minTime} ms | Máximo: ${maxTime} ms`)
  console.log(`   - Latencia P95: ${p95} ms`)

  if (fallidos.length > 0) {
    console.log(`   ⚠️ Muestra de errores en la ráfaga:`)
    fallidos.slice(0, 5).forEach(f => console.log(`      • Usuario ${f.userNum}: ${f.error}`))
  }

  return { exitosos: exitosos.length, fallidos: fallidos.length, avgTime, p95, rps }
}

async function main() {
  console.log('\n--- ESCENARIO 1: Concurrencia Base (50 usuarios) ---')
  await ejecutarBatchConcurrente(50)

  console.log('\n--- ESCENARIO 2: Concurrencia Media (100 usuarios) ---')
  await ejecutarBatchConcurrente(100)

  console.log('\n--- ESCENARIO 3: Concurrencia Alta (200 usuarios) ---')
  await ejecutarBatchConcurrente(200)

  console.log('\n' + '='.repeat(75))
  console.log('✅ PRUEBAS DE CARGA MASIVA Y ESTRES COMPLETADAS')
  console.log('='.repeat(75))
}

main().catch(console.error)
