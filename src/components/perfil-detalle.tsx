import GraficoDisc from '@/app/dashboard/[userId]/grafico-disc'

const CATEGORIAS = [
  { key: 'perfil_trabajo', label: 'Perfil de trabajo' },
  { key: 'motivacion', label: 'Motivación y compromiso' },
  { key: 'gestion_jefe', label: 'Gestión directa del jefe' },
  { key: 'dinamica_equipo', label: 'Dinámica de equipo' },
] as const

// Tipos mínimos (ajusta si generas tipos desde Supabase con `supabase gen types`)
type Scoring = Record<string, any>
type Rubrica = Record<string, any>
type TextoPerfil = Record<string, any> | null

export default function PerfilDetalle({
  nombre,
  equipo,
  scoring,
  rubrica,
  textoPerfil,
}: {
  nombre: string
  equipo: string
  scoring: Scoring
  rubrica: Rubrica[]
  textoPerfil: TextoPerfil
}) {
  return (
    <>
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-2xl font-semibold text-[#1F2937]">{nombre}</h1>
        <p className="text-sm text-gray-500">{equipo}</p>

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
        <GraficoDisc d={scoring.d_global} i={scoring.i_global} s={scoring.s_global} c={scoring.c_global} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIAS.map((cat) => (
          <div key={cat.key} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">{cat.label}</h3>
            <p className="text-xs text-gray-500">
              Dominante: <span className="font-semibold">{scoring[`${cat.key}_dominante`]}</span>{' '}
              · Nivel: {scoring[`${cat.key}_nivel`]}
            </p>
          </div>
        ))}
      </div>

      {rubrica && rubrica.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Cómo te gestiona mejor tu jefe (lectura de tu perfil)
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
    </>
  )
}
