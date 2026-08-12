'use client'

const COLOR: Record<string, string> = {
  D: '31, 78, 121',   // #1F4E79 en rgb, para variar opacidad
  I: '192, 0, 0',     // #C00000
  S: '217, 163, 0',   // #D9A300
  C: '0, 132, 61',    // #00843D
}

const CATEGORIAS = [
  { key: 'perfil_trabajo', label: 'Perfil de trabajo', maximo: 8 },
  { key: 'motivacion', label: 'Motivación y compromiso', maximo: 4 },
  { key: 'gestion_jefe', label: 'Gestión directa del jefe', maximo: 12 },
  { key: 'dinamica_equipo', label: 'Dinámica de equipo', maximo: 8 },
] as const

const ESTILOS = ['D', 'I', 'S', 'C'] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MapaCalor({ personas }: { personas: any[] }) {
  if (personas.length === 0) return null

  function promedio(categoria: string, estilo: string) {
    const campo = `${categoria}_${estilo.toLowerCase()}`
    const suma = personas.reduce((acc, p) => acc + (p[campo] ?? 0), 0)
    return suma / personas.length
  }

  return (
    <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-1 text-sm font-semibold text-gray-700">Mapa de calor por categoría</h2>
      <p className="mb-4 text-xs text-gray-400">
        Promedio del grupo filtrado ({personas.length} personas) — más intenso = más presente
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr>
              <th className="w-48 px-2 py-2 text-left text-xs font-medium text-gray-400">
                Categoría
              </th>
              {ESTILOS.map((estilo) => (
                <th key={estilo} className="px-2 py-2 text-center text-xs font-medium text-gray-400">
                  {estilo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIAS.map((cat) => (
              <tr key={cat.key}>
                <td className="px-2 py-1.5 text-sm text-gray-700">{cat.label}</td>
                {ESTILOS.map((estilo) => {
                  const valor = promedio(cat.key, estilo)
                  const normalizado = Math.min(Math.abs(valor) / cat.maximo, 1) // 0 a 1
                  const opacidad = 0.12 + normalizado * 0.75 // nunca invisible, nunca 100% opaco
                  return (
                    <td key={estilo} className="px-2 py-1.5">
                      <div
                        className="flex h-12 items-center justify-center rounded-lg text-sm font-semibold"
                        style={{
                          backgroundColor: `rgba(${COLOR[estilo]}, ${opacidad})`,
                          color: normalizado > 0.55 ? 'white' : '#374151',
                        }}
                        title={`${cat.label} · ${estilo}: promedio ${valor.toFixed(1)} de ±${cat.maximo}`}
                      >
                        {valor > 0 ? '+' : ''}
                        {valor.toFixed(1)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
