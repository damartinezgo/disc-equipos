import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import PerfilDetalle from '@/components/perfil-detalle'

export default async function DetallePersonaPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  // Queries separadas (no hay FK entre scoring y perfiles)
  const adminSupabase = createServiceClient()

  const { data: scoring } = await adminSupabase
    .from('scoring')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!scoring) notFound()

  const { data: perfil } = await adminSupabase
    .from('perfiles')
    .select('nombre, equipo')
    .eq('id', userId)
    .maybeSingle()

  const { data: authRes } = await adminSupabase.auth.admin.getUserById(userId)
  const lugar = authRes?.user?.user_metadata?.lugar ?? ''

  // Adjuntar perfiles para mantener la interfaz compatible
  const scoringConPerfil = {
    ...scoring,
    perfiles: [{ nombre: perfil?.nombre ?? 'Sin nombre', lugar, equipo: perfil?.equipo ?? '' }],
  }

  const { data: rubrica } = await supabase
    .from('rubrica')
    .select('*')
    .in('estilo', [scoring.estilo_principal, scoring.estilo_secundario])

  const { data: textoPerfil } = await supabase
    .from('textos_perfiles')
    .select('*')
    .eq('perfil', scoring.perfil_combinado)
    .maybeSingle()

  const { data: respuestasData } = await adminSupabase
    .from('respuestas')
    .select('respuestas_mas, respuestas_menos')
    .eq('user_id', userId)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-4 py-8 flex flex-col">
      <div className="mx-auto max-w-6xl w-full flex-1">
        <PerfilDetalle
           nombre={scoringConPerfil.perfiles[0].nombre}
           lugar={scoringConPerfil.perfiles[0].lugar}
           equipo={scoringConPerfil.perfiles[0].equipo}
          scoring={scoring}
          rubrica={rubrica ?? []}
          textoPerfil={textoPerfil ?? null}
          respuestasMas={respuestasData?.respuestas_mas ?? null}
          respuestasMenos={respuestasData?.respuestas_menos ?? null}
        />
      </div>
    </main>
  )
}
