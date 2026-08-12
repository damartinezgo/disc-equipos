'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from 'recharts'

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
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="horizontal" margin={{ left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis type="category" dataKey="estilo" tick={{ fontSize: 13, fontWeight: 600 }} />
        <YAxis type="number" domain={[-32, 32]} tick={{ fontSize: 12 }} />
        <ReferenceLine y={0} stroke="#9CA3AF" />
        <Tooltip />
        <Bar dataKey="valor" radius={4}>
          {data.map((entry) => (
            <Cell key={entry.estilo} fill={COLOR[entry.estilo]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
