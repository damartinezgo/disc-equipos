'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import GraficosDashboard from './graficos-dashboard'
import MapaCalor from './mapa-calor'

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
  completado: boolean
  perfiles: { nombre: string; lugar: string; equipo: string; created_at: string }[]
  // Scoring — null si aún no completó
  d_global: number | null
  i_global: number | null
  s_global: number | null
  c_global: number | null
  estilo_principal: string | null
  estilo_secundario: string | null
  perfil_combinado: string | null
  perfil_trabajo_d: number | null; perfil_trabajo_i: number | null
  perfil_trabajo_s: number | null; perfil_trabajo_c: number | null
  motivacion_d: number | null; motivacion_i: number | null
  motivacion_s: number | null; motivacion_c: number | null
  gestion_jefe_d: number | null; gestion_jefe_i: number | null
  gestion_jefe_s: number | null; gestion_jefe_c: number | null
  dinamica_equipo_d: number | null; dinamica_equipo_i: number | null
  dinamica_equipo_s: number | null; dinamica_equipo_c: number | null
}

export default function DashboardCliente({
  personas,
  equipos,
}: {
  personas: Persona[]
  equipos: string[]
}) {
  const [filtroLugar, setFiltroLugar] = useState<string>('todos')
  const [filtroEquipo, setFiltroEquipo] = useState<string>('todos')
  const [filtroEstilo, setFiltroEstilo] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [exportando, setExportando] = useState(false)

  const lugaresUnicos = useMemo(
    () => Array.from(new Set(personas.map((p) => p.perfiles?.[0]?.lugar).filter(Boolean))) as string[],
    [personas]
  )

  const equiposDisponibles = useMemo(() => {
    const base = filtroLugar === 'todos' ? personas : personas.filter((p) => p.perfiles?.[0]?.lugar === filtroLugar)
    return Array.from(new Set(base.map((p) => p.perfiles?.[0]?.equipo).filter(Boolean)))
  }, [personas, filtroLugar])

  const filtradas = useMemo(() => {
    return personas.filter((p) => {
      const lugar = p.perfiles?.[0]?.lugar ?? ''
      if (filtroLugar !== 'todos' && lugar !== filtroLugar) return false
      if (filtroEquipo !== 'todos' && p.perfiles?.[0]?.equipo !== filtroEquipo) return false
      if (filtroEstilo !== 'todos' && p.estilo_principal !== filtroEstilo) return false
      if (filtroEstado === 'completado' && !p.completado) return false
      if (filtroEstado === 'pendiente' && p.completado) return false
      if (busqueda && !p.perfiles?.[0]?.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
        return false
      return true
    })
  }, [personas, filtroLugar, filtroEquipo, filtroEstilo, filtroEstado, busqueda])

  // Solo los que completaron se pasan a gráficos y exportación
  const conScoring = filtradas.filter((p) => p.completado)
  const totalCompletados = personas.filter((p) => p.completado).length
  const pctCompletado = personas.length
    ? Math.round((totalCompletados / personas.length) * 100)
    : 0

  async function exportar() {
    setExportando(true)
    try {
      const res = await fetch('/api/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: conScoring.map((p) => p.user_id),
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

        {/* Encabezado */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1F2937]">Resultados — Desarrollo de Líderes y Equipo</h1>
            <p className="text-sm text-gray-500">
              {filtradas.length} de {personas.length} personas
              {' · '}
              <span className="font-medium text-[#00843D]">
                {totalCompletados} completaron ({pctCompletado}%)
              </span>
            </p>
          </div>
          <button
            onClick={exportar}
            disabled={exportando || conScoring.length === 0}
            className="rounded-lg bg-[#1F4E79] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C] disabled:opacity-50"
          >
            {exportando ? 'Generando…' : '↓ Descargar Excel (filtro actual)'}
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
           <input
             value={busqueda}
             onChange={(e) => setBusqueda(e.target.value)}
             placeholder="Buscar por nombre…"
             className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
           />
           <select
             value={filtroLugar}
             onChange={(e) => setFiltroLugar(e.target.value)}
             className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
           >
             <option value="todos">Todos los lugares</option>
             {lugaresUnicos.map((l) => (
               <option key={l} value={l}>{l}</option>
             ))}
           </select>
           <select
             value={filtroEquipo}
             onChange={(e) => setFiltroEquipo(e.target.value)}
             className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
           >
             <option value="todos">Todos los equipos</option>
             {equiposDisponibles.map((eq) => (
               <option key={eq} value={eq}>{eq}</option>
             ))}
           </select>
            <select
              value={filtroEstilo}
             onChange={(e) => setFiltroEstilo(e.target.value)}
             className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
           >
             <option value="todos">Todos los estilos</option>
             {Object.entries(NOMBRE_ESTILO).map(([k, v]) => (
               <option key={k} value={k}>{k} — {v}</option>
             ))}
           </select>
           <select
             value={filtroEstado}
             onChange={(e) => setFiltroEstado(e.target.value)}
             className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
           >
            <option value="todos">Todos los estados</option>
            <option value="completado">✓ Completado</option>
            <option value="pendiente">⏳ Pendiente</option>
            </select>
            <button
              onClick={() => {
                setFiltroLugar('todos')
                setFiltroEquipo('todos')
                setFiltroEstilo('todos')
                setFiltroEstado('todos')
                setBusqueda('')
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-black hover:bg-gray-50"
            >
              Limpiar
            </button>
          </div>

        {/* Gráficos — solo quienes completaron del filtro activo */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <GraficosDashboard personas={conScoring as any[]} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MapaCalor personas={conScoring as any[]} />

        {/* Tabla */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Lugar</th>
                <th className="px-5 py-3">Equipo</th>
                <th className="px-5 py-3">Estado</th>
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
                  <td className="px-5 py-3 font-medium text-gray-800">
                    {p.perfiles?.[0]?.nombre}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {p.perfiles?.[0]?.lugar || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {p.perfiles?.[0]?.equipo}
                  </td>
                  <td className="px-5 py-3">
                    {p.completado ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Completado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {p.perfil_combinado ? (
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: COLOR_ESTILO[p.estilo_principal!] }}
                      >
                        {p.perfil_combinado}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 tabular-nums" style={{ color: COLOR_ESTILO.D }}>
                    {p.d_global ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 tabular-nums" style={{ color: COLOR_ESTILO.I }}>
                    {p.i_global ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 tabular-nums" style={{ color: COLOR_ESTILO.S }}>
                    {p.s_global ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 tabular-nums" style={{ color: COLOR_ESTILO.C }}>
                    {p.c_global ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {p.completado ? (
                      <Link
                        href={`/dashboard/${p.user_id}`}
                        className="text-xs font-medium text-[#1F4E79] hover:underline"
                      >
                        Ver detalle →
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-300">Sin resultado</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-gray-400">
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
