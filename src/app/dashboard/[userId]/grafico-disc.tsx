'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts'

const COLOR: Record<string, string> = {
  D: '#1F4E79',
  I: '#C00000',
  S: '#D9A300',
  C: '#00843D',
}

export default function GraficoDisc({ d, i, s, c }: { d: number; i: number; s: number; c: number }) {
  const data = [
    { estilo: 'D', valor: d },
    { estilo: 'I', valor: i },
    { estilo: 'S', valor: s },
    { estilo: 'C', valor: c },
  ]

  return (
    <BarChart width={600} height={220} data={data} layout="vertical" margin={{ left: 10 }}>
      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
      <XAxis type="number" domain={[-32, 32]} tick={{ fontSize: 12 }} />
      <YAxis type="category" dataKey="estilo" tick={{ fontSize: 13, fontWeight: 600 }} width={30} />
      <ReferenceLine x={0} stroke="#9CA3AF" />
      <Tooltip />
      <Bar dataKey="valor" radius={4}>
        {data.map((entry) => (
          <Cell key={entry.estilo} fill={COLOR[entry.estilo]} />
        ))}
      </Bar>
    </BarChart>
  )
}
