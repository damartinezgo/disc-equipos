import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import itemsData from '@/data/items-disc.json'

// Rangos máximos por categoría (ver 06_Reglas_Puntaje del Excel)
const MAXIMOS: Record<string, number> = {
  global: 32,
  perfil_trabajo: 8,
  motivacion: 4,
  gestion_jefe: 12,
  dinamica_equipo: 8,
}

function calcularNivel(puntajeDominante: number, maximo: number): string {
  const porcentaje = puntajeDominante / maximo
  if (porcentaje >= 0.5) return 'Alto'
  if (porcentaje >= 0.15) return 'Medio'
  return 'Mixto/Neutro'
}

function dominanteYSecundario(d: number, i: number, s: number, c: number) {
  const puntajes = [
    { estilo: 'D', valor: d },
    { estilo: 'I', valor: i },
    { estilo: 'S', valor: s },
    { estilo: 'C', valor: c },
  ].sort((a, b) => b.valor - a.valor)
  return {
    dominante: puntajes[0].estilo,
    puntajeDominante: puntajes[0].valor,
    secundario: puntajes[1].estilo,
    puntajeSecundario: puntajes[1].valor,
  }
}

export async function POST() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('AUTH ERROR:', authError)
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const adminSupabase = createServiceClient()

  // 1. Obtener las respuestas del usuario usando adminSupabase
  const { data: respuestasData, error: respError } = await adminSupabase
    .from('respuestas')
    .select('respuestas_mas, respuestas_menos')
    .eq('user_id', user.id)
    .single()

  if (respError || !respuestasData) {
    console.error('RESP ERROR:', respError)
    return NextResponse.json({ error: 'No se encontraron respuestas para el usuario' }, { status: 500 })
  }

  const mas = respuestasData.respuestas_mas as Record<string, string> || {}
  const menos = respuestasData.respuestas_menos as Record<string, string> || {}

  // 2. Calcular puntajes base (+1 por mas, -1 por menos)
  const scores = {
    d_global: 0, i_global: 0, s_global: 0, c_global: 0,
    perfil_trabajo_d: 0, perfil_trabajo_i: 0, perfil_trabajo_s: 0, perfil_trabajo_c: 0,
    motivacion_d: 0, motivacion_i: 0, motivacion_s: 0, motivacion_c: 0,
    gestion_jefe_d: 0, gestion_jefe_i: 0, gestion_jefe_s: 0, gestion_jefe_c: 0,
    dinamica_equipo_d: 0, dinamica_equipo_i: 0, dinamica_equipo_s: 0, dinamica_equipo_c: 0,
  }

  const categoryMap: Record<string, string> = {
    'Perfil de trabajo': 'perfil_trabajo',
    'Motivación y compromiso': 'motivacion',
    'Gestión directa del jefe': 'gestion_jefe',
    'Dinámica de equipo': 'dinamica_equipo'
  }

  itemsData.forEach((item: {
    item: { toString: () => string }
    categoria: string
    opciones: { letra: string; disc: string }[]
  }) => {
    const itemId = item.item.toString()
    const catPrefix = categoryMap[item.categoria]
    
    const letraMas = mas[itemId]
    if (letraMas) {
      const opcion = item.opciones.find((o: { letra: string }) => o.letra === letraMas)
      if (opcion) {
        const disc = opcion.disc.toLowerCase() // "d", "i", "s", "c"
        scores[`${disc}_global` as keyof typeof scores] += 1
        if (catPrefix) {
          scores[`${catPrefix}_${disc}` as keyof typeof scores] += 1
        }
      }
    }

    const letraMenos = menos[itemId]
    if (letraMenos) {
      const opcion = item.opciones.find((o: { letra: string }) => o.letra === letraMenos)
      if (opcion) {
        const disc = opcion.disc.toLowerCase()
        scores[`${disc}_global` as keyof typeof scores] -= 1
        if (catPrefix) {
          scores[`${catPrefix}_${disc}` as keyof typeof scores] -= 1
        }
      }
    }
  })

  // 3. Derivar estilos y perfiles
  const global = dominanteYSecundario(scores.d_global, scores.i_global, scores.s_global, scores.c_global)
  const perfilTrabajo = dominanteYSecundario(scores.perfil_trabajo_d, scores.perfil_trabajo_i, scores.perfil_trabajo_s, scores.perfil_trabajo_c)
  const motivacion = dominanteYSecundario(scores.motivacion_d, scores.motivacion_i, scores.motivacion_s, scores.motivacion_c)
  const gestionJefe = dominanteYSecundario(scores.gestion_jefe_d, scores.gestion_jefe_i, scores.gestion_jefe_s, scores.gestion_jefe_c)
  const dinamicaEquipo = dominanteYSecundario(scores.dinamica_equipo_d, scores.dinamica_equipo_i, scores.dinamica_equipo_s, scores.dinamica_equipo_c)

  const perfilCombinado = `${global.dominante}/${global.secundario}`

  // 4. Guardar todo de una sola vez en Supabase usando adminSupabase
  const finalScoringData = {
    user_id: user.id,
    ...scores,
    estilo_principal: global.dominante,
    estilo_secundario: global.secundario,
    puntaje_secundario: global.puntajeSecundario,
    perfil_combinado: perfilCombinado,

    perfil_trabajo_dominante: perfilTrabajo.dominante,
    perfil_trabajo_puntaje: perfilTrabajo.puntajeDominante,
    perfil_trabajo_nivel: calcularNivel(perfilTrabajo.puntajeDominante, MAXIMOS.perfil_trabajo),

    motivacion_dominante: motivacion.dominante,
    motivacion_puntaje: motivacion.puntajeDominante,
    motivacion_nivel: calcularNivel(motivacion.puntajeDominante, MAXIMOS.motivacion),

    gestion_jefe_dominante: gestionJefe.dominante,
    gestion_jefe_puntaje: gestionJefe.puntajeDominante,
    gestion_jefe_nivel: calcularNivel(gestionJefe.puntajeDominante, MAXIMOS.gestion_jefe),

    dinamica_equipo_dominante: dinamicaEquipo.dominante,
    dinamica_equipo_puntaje: dinamicaEquipo.puntajeDominante,
    dinamica_equipo_nivel: calcularNivel(dinamicaEquipo.puntajeDominante, MAXIMOS.dinamica_equipo),
    
    calculado_en: new Date().toISOString()
  }

  const { error: upsertError } = await adminSupabase
    .from('scoring')
    .upsert(finalScoringData, { onConflict: 'user_id' })

  if (upsertError) {
    console.error('UPSERT ERROR:', upsertError)
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, perfilCombinado })
}
