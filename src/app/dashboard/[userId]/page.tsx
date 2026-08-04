import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GraficoDisc from './grafico-disc'

const CATEGORIAS = [
  { key: 'perfil_trabajo', label: 'Perfil de trabajo' },
  { key: 'motivacion', label: 'Motivación y compromiso' },
  { key: 'gestion_jefe', label: 'Gestión directa del jefe' },
  { key: 'dinamica_equipo', label: 'Dinámica de equipo' },
] as const

export default async function DetallePersonaPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: esEncuestador } = await supabase
    .from('encuestadores')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!esEncuestador) redirect('/encuesta')

  const { data: scoring } = await supabase
    .from('scoring')
    .select('*, perfiles:perfiles!inner(nombre, equipo)')
    .eq('user_id', userId)
    .single()

  if (!scoring) notFound()

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
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h1 className="text-2xl font-semibold text-[#1F2937]">{scoring.perfiles.nombre}</h1>
          <p className="text-sm text-gray-500">{scoring.perfiles.equipo}</p>

          {textoPerfil && (
            <div className="mt-4 rounded-xl bg-[#F7F8FA] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#1F4E79]">
                {textoPerfil.perfil} — {textoPerfil.nombre_sugerido}
              </p>
              <p className="mt-1 text-sm text-gray-700">{textoPerfil.lectura_ejecutiva}</p>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Cómo gestionarlo: </span>
                {textoPerfil.gestion_recomendada}
              </p>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Puntaje global (rango -32 a +32)
          </h2>
          <GraficoDisc
            d={scoring.d_global}
            i={scoring.i_global}
            s={scoring.s_global}
            c={scoring.c_global}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORIAS.map((cat) => (
            <div key={cat.key} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{cat.label}</h3>
              <p className="text-xs text-gray-500">
                Dominante:{' '}
                <span className="font-semibold">
                  {scoring[`${cat.key}_dominante` as keyof typeof scoring] as string}
                </span>{' '}
                · Nivel: {scoring[`${cat.key}_nivel` as keyof typeof scoring] as string}
              </p>
            </div>
          ))}
        </div>

        {rubrica && rubrica.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Cómo gestionar a esta persona
            </h2>
            <div className="space-y-4">
              {rubrica.map((r) => (
                <div key={r.id} className="border-l-4 pl-4" style={{ borderColor: r.color_hex }}>
                  <p className="text-sm font-medium" style={{ color: r.color_hex }}>
                    {r.estilo} — {r.nombre_estilo} · {r.categoria}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">{r.como_gestionarlo}</p>
                  <p className="mt-1 text-xs text-gray-500">Evitar: {r.que_evitar}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
