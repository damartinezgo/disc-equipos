import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import DashboardCliente from './dashboard-cliente'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirect_after_login', '/dashboard')
    }
    redirect('/login')
  }

  // Verifica que sea encuestador o admin
  const isAdmin = user.user_metadata?.is_admin === true

  if (!isAdmin) {
    const { data: esEncuestador } = await supabase
      .from('encuestadores')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!esEncuestador) redirect('/encuesta')
  }

  // Service role para leer datos de todos los usuarios sin restricción de RLS
  const admin = createServiceClient()

  // Queries paralelas para reducir LCP
  const [perfilesRes, respuestasRes, scoringRes, authRes] = await Promise.all([
    admin.from('perfiles').select('id, nombre, equipo, created_at'),
    admin.from('respuestas').select('user_id, completado'),
    admin.from('scoring').select(`
      user_id,
      d_global, i_global, s_global, c_global,
      estilo_principal, estilo_secundario, perfil_combinado,
      perfil_trabajo_d, perfil_trabajo_i, perfil_trabajo_s, perfil_trabajo_c,
      motivacion_d, motivacion_i, motivacion_s, motivacion_c,
      gestion_jefe_d, gestion_jefe_i, gestion_jefe_s, gestion_jefe_c,
      dinamica_equipo_d, dinamica_equipo_i, dinamica_equipo_s, dinamica_equipo_c,
      calculado_en
    `),
    admin.auth.admin.listUsers(),
  ])

  const perfilesData = perfilesRes.data
  const respuestasData = respuestasRes.data
  const scoringData = scoringRes.data
  const authUsers = authRes.data?.users ?? []

  // IDs de usuarios admin (no participan en la encuesta)
  const adminIds = new Set(
    authUsers
      .filter((u) => u.user_metadata?.is_admin === true)
      .map((u) => u.id)
  )

  // Mapa de emails para mostrar fallback cuando nombre es "Sin nombre"
  const emailMap = new Map(
    authUsers.map((u) => [u.id, u.email ?? ''])
  )

  // Mapa de lugares desde user_metadata (columna lugar puede no existir en perfiles)
  const lugarMap = new Map(
    authUsers.map((u) => [u.id, u.user_metadata?.lugar ?? u.user_metadata?.lugar_id ?? ''])
  )

  // Mapas de búsqueda rápida
  const respuestasMap = new Map(
    (respuestasData ?? []).map((r) => [r.user_id, r.completado])
  )
  const scoringMap = new Map(
    (scoringData ?? []).map((s) => [s.user_id, s])
  )

  // Combinar: parte de perfiles, añade estado + scoring.
  // Se excluyen usuarios admin (is_admin=true) — no participan en la encuesta.
  const personas = (perfilesData ?? [])
    .filter((p) => !adminIds.has(p.id))
    .map((p) => {
      const scoring = scoringMap.get(p.id)
      const completado = respuestasMap.get(p.id) ?? false
      const nombre = p.nombre || 'Sin nombre'
      return {
        user_id: p.id,
        perfiles: [{ nombre, lugar: lugarMap.get(p.id) ?? '', equipo: p.equipo ?? '', created_at: p.created_at, correo: emailMap.get(p.id) ?? '' }],
      completado,
      // Scoring (null si no completó)
      d_global: scoring?.d_global ?? null,
      i_global: scoring?.i_global ?? null,
      s_global: scoring?.s_global ?? null,
      c_global: scoring?.c_global ?? null,
      estilo_principal: scoring?.estilo_principal ?? null,
      estilo_secundario: scoring?.estilo_secundario ?? null,
      perfil_combinado: scoring?.perfil_combinado ?? null,
      perfil_trabajo_d: scoring?.perfil_trabajo_d ?? null,
      perfil_trabajo_i: scoring?.perfil_trabajo_i ?? null,
      perfil_trabajo_s: scoring?.perfil_trabajo_s ?? null,
      perfil_trabajo_c: scoring?.perfil_trabajo_c ?? null,
      motivacion_d: scoring?.motivacion_d ?? null,
      motivacion_i: scoring?.motivacion_i ?? null,
      motivacion_s: scoring?.motivacion_s ?? null,
      motivacion_c: scoring?.motivacion_c ?? null,
      gestion_jefe_d: scoring?.gestion_jefe_d ?? null,
      gestion_jefe_i: scoring?.gestion_jefe_i ?? null,
      gestion_jefe_s: scoring?.gestion_jefe_s ?? null,
      gestion_jefe_c: scoring?.gestion_jefe_c ?? null,
      dinamica_equipo_d: scoring?.dinamica_equipo_d ?? null,
      dinamica_equipo_i: scoring?.dinamica_equipo_i ?? null,
      dinamica_equipo_s: scoring?.dinamica_equipo_s ?? null,
      dinamica_equipo_c: scoring?.dinamica_equipo_c ?? null,
    }
  })

  const equiposUnicos = Array.from(
    new Set((perfilesData ?? []).filter((p) => !adminIds.has(p.id)).map((p) => p.equipo).filter(Boolean))
  ) as string[]

  return (
    <DashboardCliente personas={personas} equipos={equiposUnicos} />
  )
}
