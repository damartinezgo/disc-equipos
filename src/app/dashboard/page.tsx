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

  // Verifica que sea encuestador
  const { data: esEncuestador } = await supabase
    .from('encuestadores')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!esEncuestador) redirect('/encuesta')

  // Service role para leer datos de todos los usuarios sin restricción de RLS
  const admin = createServiceClient()

  // 1. Todos los perfiles registrados (base de la tabla)
  const { data: perfilesData } = await admin
    .from('perfiles')
    .select('id, nombre, lugar, equipo, created_at')

  // 2. Estado de completado por usuario
  const { data: respuestasData } = await admin
    .from('respuestas')
    .select('user_id, completado')

  // 3. Scoring (solo existe para quien completó)
  const { data: scoringData } = await admin
    .from('scoring')
    .select(`
      user_id,
      d_global, i_global, s_global, c_global,
      estilo_principal, estilo_secundario, perfil_combinado,
      perfil_trabajo_d, perfil_trabajo_i, perfil_trabajo_s, perfil_trabajo_c,
      motivacion_d, motivacion_i, motivacion_s, motivacion_c,
      gestion_jefe_d, gestion_jefe_i, gestion_jefe_s, gestion_jefe_c,
      dinamica_equipo_d, dinamica_equipo_i, dinamica_equipo_s, dinamica_equipo_c,
      calculado_en
    `)

  // Mapas de búsqueda rápida
  const respuestasMap = new Map(
    (respuestasData ?? []).map((r) => [r.user_id, r.completado])
  )
  const scoringMap = new Map(
    (scoringData ?? []).map((s) => [s.user_id, s])
  )

  // Combinar: parte de perfiles, añade estado + scoring
  const personas = (perfilesData ?? []).map((p) => {
    const scoring = scoringMap.get(p.id)
    const completado = respuestasMap.get(p.id) ?? false
    return {
      user_id: p.id,
      perfiles: [{ nombre: p.nombre, lugar: p.lugar ?? '', equipo: p.equipo, created_at: p.created_at }],
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
    new Set((perfilesData ?? []).map((p) => p.equipo).filter(Boolean))
  ) as string[]

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-xl bg-[#1F4E79]/10 px-4 py-3 text-sm text-[#1F4E79]">
          Bienvenido al panel de Desarrollo de Líderes y Equipo. Aquí podés visualizar los resultados de tu equipo.
        </div>
      <DashboardCliente personas={personas} equipos={equiposUnicos} />
    </div>
  </main>
  )
}
