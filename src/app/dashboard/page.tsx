import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardCliente from './dashboard-cliente'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?siguiente=/dashboard')

  // Verifica que sea encuestador (política RLS también lo protege a nivel de datos)
  const { data: esEncuestador } = await supabase
    .from('encuestadores')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!esEncuestador) {
    redirect('/encuesta')
  }

  const { data: personas } = await supabase
    .from('scoring')
    .select(`
      user_id, d_global, i_global, s_global, c_global,
      estilo_principal, estilo_secundario, perfil_combinado,
      perfiles:perfiles!inner ( nombre, equipo, created_at )
    `)
    .order('calculado_en', { ascending: false })

  const { data: equipos } = await supabase
    .from('perfiles')
    .select('equipo')
    .not('equipo', 'is', null)

  const equiposUnicos = Array.from(new Set((equipos ?? []).map((e) => e.equipo))).filter(
    Boolean
  ) as string[]

  return <DashboardCliente personas={personas ?? []} equipos={equiposUnicos} />
}
