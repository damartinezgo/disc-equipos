'use client'

import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer,
} from 'recharts'

const COLOR: Record<string, string> = {
  D: '#1F4E79',
  I: '#C00000',
  S: '#D9A300',
  C: '#00843D',
}
const NOMBRE: Record<string, string> = {
  D: 'Dominancia',
  I: 'Influencia',
  S: 'Estabilidad',
  C: 'Conciencia',
}

type Persona = {
  estilo_principal: string
  d_global: number
  i_global: number
  s_global: number
  c_global: number
}

export default function GraficosDashboard({ personas }: { personas: Persona[] }) {
  if (personas.length === 0) return null

  // --- distribución de estilo dominante ---
  const conteo: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 }
  personas.forEach((p) => {
    if (p.estilo_principal in conteo) conteo[p.estilo_principal]++
  })
  const datosDistribucion = Object.entries(conteo)
    .filter(([, valor]) => valor > 0)
    .map(([estilo, valor]) => ({
      estilo,
      nombre: NOMBRE[estilo],
      valor,
      porcentaje: Math.round((valor / personas.length) * 100),
    }))

  // --- promedio global D/I/S/C ---
  const promedio = (campo: keyof Persona) =>
    Math.round((personas.reduce((acc, p) => acc + (p[campo] as number), 0) / personas.length) * 10) / 10

  const datosPromedio = [
    { estilo: 'D', valor: promedio('d_global') },
    { estilo: 'I', valor: promedio('i_global') },
    { estilo: 'S', valor: promedio('s_global') },
    { estilo: 'C', valor: promedio('c_global') },
  ]

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2">
      {/* Distribución de estilos dominantes */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-1 text-sm font-semibold text-gray-700">Distribución de estilos</h2>
        <p className="mb-3 text-xs text-gray-400">Estilo dominante, {personas.length} personas</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={datosDistribucion}
              dataKey="valor"
              nameKey="nombre"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {datosDistribucion.map((d) => (
                <Cell key={d.estilo} fill={COLOR[d.estilo]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(valor: unknown, _n, entry) => [
                `${valor} personas (${(entry.payload as { porcentaje: number }).porcentaje}%)`,
                (entry.payload as { nombre: string }).nombre,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={24}
              formatter={(_valor, entry) => {
                const p = entry.payload as unknown as { nombre: string; porcentaje: number }
                return `${p.nombre} — ${p.porcentaje}%`
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Promedio D/I/S/C del grupo filtrado */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-1 text-sm font-semibold text-gray-700">Promedio del equipo</h2>
        <p className="mb-3 text-xs text-gray-400">Puntaje neto promedio (rango -32 a +32)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={datosPromedio} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[-32, 32]} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="estilo" tick={{ fontSize: 13, fontWeight: 600 }} width={30} />
            <ReferenceLine x={0} stroke="#9CA3AF" />
            <Tooltip formatter={(valor: unknown) => String(valor)} />
            <Bar dataKey="valor" radius={4}>
              {datosPromedio.map((d) => (
                <Cell key={d.estilo} fill={COLOR[d.estilo]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
