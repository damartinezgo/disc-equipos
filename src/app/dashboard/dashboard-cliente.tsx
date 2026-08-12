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
  const [activeTab, setActiveTab] = useState<'graficos' | 'tabla'>('graficos')
  const [exportando, setExportando] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const REGISTROS_POR_PAGINA = 10

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

  const totalPaginas = Math.ceil(filtradas.length / REGISTROS_POR_PAGINA)
  const paginadas = useMemo(() => {
    const start = (paginaActual - 1) * REGISTROS_POR_PAGINA
    return filtradas.slice(start, start + REGISTROS_POR_PAGINA)
  }, [filtradas, paginaActual])

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
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-8 flex flex-col">
      <div className="mx-auto max-w-6xl w-full flex-1">

        {/* Encabezado */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1F2937]">Resultados — Desarrollo de Líderes y Equipo</h1>
            <p className="mt-1 text-sm font-medium text-[#1F4E79]">
              Bienvenido al panel. Aquí puedes visualizar los resultados de tu equipo.
            </p>
            <p className="mt-2 text-sm text-gray-500">
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
            className="rounded-lg bg-[#1F4E79] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C] disabled:opacity-50 whitespace-nowrap"
          >
            {exportando ? 'Generando…' : '↓ Descargar Excel'}
          </button>
        </div>

        {/* Filtros Grid */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-[2fr_repeat(4,1fr)_auto] gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <input
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1) }}
            placeholder="Buscar por nombre…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
          />
          <select
            value={filtroLugar}
            onChange={(e) => { setFiltroLugar(e.target.value); setPaginaActual(1) }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
          >
            <option value="todos">Lugar</option>
            {lugaresUnicos.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select
            value={filtroEquipo}
            onChange={(e) => { setFiltroEquipo(e.target.value); setPaginaActual(1) }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
          >
            <option value="todos">Equipo</option>
            {equiposDisponibles.map((eq) => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
          <select
            value={filtroEstilo}
            onChange={(e) => { setFiltroEstilo(e.target.value); setPaginaActual(1) }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
          >
            <option value="todos">Estilo</option>
            {Object.entries(NOMBRE_ESTILO).map(([k, v]) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPaginaActual(1) }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black"
          >
            <option value="todos">Estado</option>
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
              setPaginaActual(1)
            }}
            className="w-full whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Limpiar
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('graficos')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${activeTab === 'graficos'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              Visión General
            </button>
            <button
              onClick={() => setActiveTab('tabla')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${activeTab === 'tabla'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              Detalle por Persona
            </button>
          </nav>
        </div>

        {/* Contenido */}
        {activeTab === 'graficos' ? (
          <div className="space-y-6">
            {conScoring.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
                <div className="mb-4 flex justify-center">
                  <svg className="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3m-3 4h3m2 5.29V5.29a2 2 0 00-2.16-1.95l-5.5-1A2 2 0 003 3v7m18 0v7a2 2 0 01-2 2h-5.25M9 7v1M9 11v1m3-1v1m-3 5v1m3-1v1" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-700">Aún no hay resultados disponibles</h3>
                <p className="text-sm text-gray-500">
                  Cuando alguien complete la encuesta DISC, aquí aparecerán los gráficos de distribución
                  de estilos y el mapa de calor por categoría.
                </p>
                {personas.length > 0 && (
                  <p className="mt-2 text-xs text-gray-400">
                    {personas.filter(p => !p.completado).length} persona(s) aún no han completado la encuesta.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <GraficosDashboard personas={conScoring as any[]} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <MapaCalor personas={conScoring as any[]} />
              </>
            )}
          </div>
        ) : (
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
                {paginadas.map((p) => (
                  <tr key={p.user_id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {p.perfiles?.[0]?.nombre || 'Sin nombre'}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {p.perfiles?.[0]?.lugar || '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {p.perfiles?.[0]?.equipo || '—'}
                    </td>
                    <td className="px-5 py-3">
                      {p.completado ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                          ✓ Completado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
                          ⏳ Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {p.completado && p.estilo_principal ? (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-1 text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: COLOR_ESTILO[p.estilo_principal] }}
                        >
                          {p.perfil_combinado}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
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
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1F4E79]"
                          title="Ver detalle"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      ) : (
                        <span className="inline-flex h-8 w-8 items-center justify-center text-gray-200" title="Sin resultado">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {paginadas.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-gray-400">
                    {personas.length === 0
                      ? 'Aún no hay usuarios registrados.'
                      : 'Nadie coincide con este filtro todavía.'}
                  </td>
                </tr>
                )}
              </tbody>
            </table>
            
            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{(paginaActual - 1) * REGISTROS_POR_PAGINA + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(paginaActual * REGISTROS_POR_PAGINA, filtradas.length)}
                      </span>{' '}
                      de <span className="font-medium">{filtradas.length}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                        disabled={paginaActual === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Anterior</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                        {paginaActual} de {totalPaginas}
                      </span>
                      <button
                        onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                        disabled={paginaActual === totalPaginas}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Siguiente</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Institucional */}
      <footer className="mt-16 w-full border-t border-gray-200 pt-8 pb-4 text-center">
        <p className="text-xs text-gray-400">
          © 2026 Rizoma Consultoría y Desarrollo • Sistema de Evaluación de Líderes y Equipos
        </p>
      </footer>
    </div>
  )
}
