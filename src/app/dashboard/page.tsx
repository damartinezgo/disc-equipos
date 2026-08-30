import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import DashboardCliente from './dashboard-cliente'

export const dynamic = 'force-dynamic'

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
    admin.from('perfiles').select('*'),
    admin.from('respuestas').select('user_id, completado, respuestas_mas, respuestas_menos'),
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
    admin.auth.admin.listUsers({ perPage: 1000 }),
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

  // Mapa de user_metadata para leer campos del CSV (cedula, apellidos, depto, etc.)
  const metaMap = new Map(
    authUsers.map((u) => [u.id, u.user_metadata ?? {}])
  )

  // Mapas de búsqueda rápida
  const respuestasMap = new Map(
    (respuestasData ?? []).map((r) => {
      const masCount = Object.keys(r.respuestas_mas || {}).length
      const menosCount = Object.keys(r.respuestas_menos || {}).length
      // Cada ítem tiene una respuesta MÁS y una MENOS; el total de ítems es 32
      const itemsRespondidos = Math.max(masCount, menosCount)
      const porcentaje = Math.min(Math.round((itemsRespondidos / 32) * 100), 100)
      return [r.user_id, { completado: r.completado, porcentaje }]
    })
  )
  const scoringMap = new Map(
    (scoringData ?? []).map((s) => [s.user_id, s])
  )

  const authUserIds = new Set(authUsers.map((u) => u.id))

  // Combinar: parte de perfiles, añade estado + scoring.
  // Se excluyen usuarios eliminados de Auth y usuarios admin (is_admin=true).
  const personas = (perfilesData ?? [])
    .filter((p) => authUserIds.has(p.id) && !adminIds.has(p.id))
    .map((p) => {
      const scoring = scoringMap.get(p.id)
      const respData = respuestasMap.get(p.id)
      const completado = respData?.completado ?? false
      const porcentaje = respData?.porcentaje ?? 0
      const meta = metaMap.get(p.id) ?? {}
      const nombre = p.nombre || meta.nombre || 'Sin nombre'
      return {
        user_id: p.id,
        perfiles: [{
          nombre,
          primer_apellido: p.primer_apellido || meta.primer_apellido || '',
          segundo_apellido: p.segundo_apellido || meta.segundo_apellido || '',
          cedula: p.cedula || meta.cedula || '',
          departamento: p.departamento || meta.departamento || '',
          dependencia_funciones: p.dependencia_funciones || meta.dependencia_funciones || '',
          telefono: p.telefono || meta.telefono || '',
          created_at: p.created_at,
          correo: emailMap.get(p.id) ?? ''
        }],
        completado,
        porcentaje,
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

  return (
    <DashboardCliente personas={personas} />
  )
}
