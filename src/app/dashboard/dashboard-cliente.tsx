'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

const COLOR_ESTILO: Record<string, string> = {
  D: '#1F4E79',
  I: '#C00000',
  S: '#D9A300',
  C: '#00843D',
}
const NOMBRE_ESTILO: Record<string, string> = {
  D: 'Dominancia',
  I: 'Influencia',
  S: 'Estabilidad',
  C: 'Conciencia',
}

type Persona = {
  user_id: string
  d_global: number
  i_global: number
  s_global: number
  c_global: number
  estilo_principal: string
  estilo_secundario: string
  perfil_combinado: string
  perfiles: { nombre: string; equipo: string; created_at: string }
}

export default function DashboardCliente({
  personas,
  equipos,
}: {
  personas: Persona[]
  equipos: string[]
}) {
  const [filtroEquipo, setFiltroEquipo] = useState<string>('todos')
  const [filtroEstilo, setFiltroEstilo] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [exportando, setExportando] = useState(false)

  const filtradas = useMemo(() => {
    return personas.filter((p) => {
      if (filtroEquipo !== 'todos' && p.perfiles?.equipo !== filtroEquipo) return false
      if (filtroEstilo !== 'todos' && p.estilo_principal !== filtroEstilo) return false
      if (busqueda && !p.perfiles?.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
        return false
      return true
    })
  }, [personas, filtroEquipo, filtroEstilo, busqueda])

  async function exportar() {
    setExportando(true)
    try {
      const res = await fetch('/api/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: filtradas.map((p) => p.user_id),
        }),
      })
      if (!res.ok) throw new Error('Error al exportar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `disc_resultados_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1F2937]">Resultados DISC</h1>
            <p className="text-sm text-gray-500">
              {filtradas.length} de {personas.length} personas
            </p>
          </div>
          <button
            onClick={exportar}
            disabled={exportando || filtradas.length === 0}
            className="rounded-lg bg-[#1F4E79] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C] disabled:opacity-50"
          >
            {exportando ? 'Generando…' : '↓ Descargar Excel (filtro actual)'}
          </button>
        </div>

        {/* filtros */}
        <div className="mb-6 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre…"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
          />
          <select
            value={filtroEquipo}
            onChange={(e) => setFiltroEquipo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="todos">Todos los equipos</option>
            {equipos.map((eq) => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
          <select
            value={filtroEstilo}
            onChange={(e) => setFiltroEstilo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="todos">Todos los estilos</option>
            {Object.entries(NOMBRE_ESTILO).map(([k, v]) => (
              <option key={k} value={k}>{k} — {v}</option>
            ))}
          </select>
        </div>

        {/* tabla */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Equipo</th>
                <th className="px-5 py-3">Perfil</th>
                <th className="px-5 py-3">D</th>
                <th className="px-5 py-3">I</th>
                <th className="px-5 py-3">S</th>
                <th className="px-5 py-3">C</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.map((p) => (
                <tr key={p.user_id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{p.perfiles?.nombre}</td>
                  <td className="px-5 py-3 text-gray-500">{p.perfiles?.equipo}</td>
                  <td className="px-5 py-3">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: COLOR_ESTILO[p.estilo_principal] }}
                    >
                      {p.perfil_combinado}
                    </span>
                  </td>
                  <td className="px-5 py-3 tabular-nums" style={{ color: COLOR_ESTILO.D }}>{p.d_global}</td>
                  <td className="px-5 py-3 tabular-nums" style={{ color: COLOR_ESTILO.I }}>{p.i_global}</td>
                  <td className="px-5 py-3 tabular-nums" style={{ color: COLOR_ESTILO.S }}>{p.s_global}</td>
                  <td className="px-5 py-3 tabular-nums" style={{ color: COLOR_ESTILO.C }}>{p.c_global}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/dashboard/${p.user_id}`}
                      className="text-xs font-medium text-[#1F4E79] hover:underline"
                    >
                      Ver detalle →
                    </Link>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                    Nadie coincide con este filtro todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
