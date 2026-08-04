import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // 1. Ejecuta la función SQL que hace la suma +1/-1 por ítem (definida en 01_schema.sql)
  const { error: rpcError } = await supabase.rpc('calcular_scoring', { p_user_id: user.id })
  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  // 2. Lee el resultado recién calculado
  const { data: scoring, error: readError } = await supabase
    .from('scoring')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (readError || !scoring) {
    return NextResponse.json({ error: 'No se pudo leer el scoring' }, { status: 500 })
  }

  // 3. Deriva estilo secundario / perfil combinado / niveles por categoría (regla de negocio en la app)
  const global = dominanteYSecundario(scoring.d_global, scoring.i_global, scoring.s_global, scoring.c_global)
  const perfilTrabajo = dominanteYSecundario(
    scoring.perfil_trabajo_d, scoring.perfil_trabajo_i, scoring.perfil_trabajo_s, scoring.perfil_trabajo_c
  )
  const motivacion = dominanteYSecundario(
    scoring.motivacion_d, scoring.motivacion_i, scoring.motivacion_s, scoring.motivacion_c
  )
  const gestionJefe = dominanteYSecundario(
    scoring.gestion_jefe_d, scoring.gestion_jefe_i, scoring.gestion_jefe_s, scoring.gestion_jefe_c
  )
  const dinamicaEquipo = dominanteYSecundario(
    scoring.dinamica_equipo_d, scoring.dinamica_equipo_i, scoring.dinamica_equipo_s, scoring.dinamica_equipo_c
  )

  const perfilCombinado = `${global.dominante}/${global.secundario}`

  const { error: updateError } = await supabase
    .from('scoring')
    .update({
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
    })
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, perfilCombinado })
}
