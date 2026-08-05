import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PerfilDetalle from '@/components/perfil-detalle'

export default async function MisResultadosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?siguiente=/mis-resultados')

  // Si aún no completó la encuesta, no hay scoring que mostrar
  const { data: respuesta } = await supabase
    .from('respuestas')
    .select('completado')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!respuesta?.completado) {
    redirect('/encuesta')
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, equipo')
    .eq('id', user.id)
    .single()

  const { data: scoring } = await supabase
    .from('scoring')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Puede pasar si la encuesta se marcó completada pero /api/scoring aún no terminó
  if (!scoring) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-gray-600">
            Estamos terminando de calcular tu resultado. Refresca esta página en unos
            segundos.
          </p>
        </div>
      </main>
    )
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

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <PerfilDetalle
          nombre={perfil?.nombre ?? user.email ?? ''}
          equipo={perfil?.equipo ?? ''}
          scoring={scoring}
          rubrica={rubrica ?? []}
          textoPerfil={textoPerfil ?? null}
        />
      </div>
    </main>
  )
}
