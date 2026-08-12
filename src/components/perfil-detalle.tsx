'use client'

import { useState } from 'react'
import Link from 'next/link'
import GraficoDisc from '@/app/dashboard/[userId]/grafico-disc'
import itemsData from '@/data/items-disc.json'

const CATEGORIAS = [
  { key: 'perfil_trabajo', label: 'Perfil de trabajo' },
  { key: 'motivacion', label: 'Motivación y compromiso' },
  { key: 'gestion_jefe', label: 'Gestión directa del jefe' },
  { key: 'dinamica_equipo', label: 'Dinámica de equipo' },
] as const

const DISC_LABEL: Record<string, string> = {
  D: 'Dominancia',
  I: 'Influencia',
  S: 'Estabilidad',
  C: 'Conciencia',
}
const DISC_COLOR: Record<string, string> = {
  D: '#1F4E79',
  I: '#C00000',
  S: '#D9A300',
  C: '#00843D',
}

const MODULO_STYLES: Record<string, { bg: string; text: string }> = {
  'Orientación general de trabajo': { bg: '#F1F5F9', text: '#334155' },
  'Toma de decisiones':             { bg: '#EFF6FF', text: '#1E40AF' },
  'Comunicación':                   { bg: '#FFF7ED', text: '#C2410C' },
  'Motivadores':                    { bg: '#F3E8FF', text: '#6B21A8' },
  'Delegación':                     { bg: '#ECFDF5', text: '#047857' },
  'Acompañamiento, seguimiento y retroalimentación': { bg: '#E0F2FE', text: '#0369A1' },
  'Manejo de conflicto':            { bg: '#FFE4E6', text: '#BE123C' },
  'Rol natural en el equipo':       { bg: '#EEF2FF', text: '#3730A3' },
}

type Item = { item: number; modulo: string; categoria: string; enunciado: string; opciones: { letra: string; texto: string; disc: string }[] }
const ITEMS = itemsData as Item[]

// Tailwind class mappings per module (border-left accent, badge, card bg/border)
const MODULO_TW: Record<string, { borderLeft: string; badge: string; cardBg: string; cardBorder: string }> = {
  'Orientación general de trabajo':                    { borderLeft: 'border-l-slate-600',   badge: 'bg-slate-100 text-slate-700',     cardBg: 'bg-slate-50',      cardBorder: 'border-slate-100' },
  'Toma de decisiones':                                { borderLeft: 'border-l-blue-600',    badge: 'bg-blue-50 text-blue-800',        cardBg: 'bg-blue-50/40',    cardBorder: 'border-blue-100/50' },
  'Comunicación':                                      { borderLeft: 'border-l-orange-500',  badge: 'bg-orange-50 text-orange-800',    cardBg: 'bg-orange-50/40',  cardBorder: 'border-orange-100/50' },
  'Motivadores':                                       { borderLeft: 'border-l-purple-600',  badge: 'bg-purple-50 text-purple-800',    cardBg: 'bg-purple-50/40',  cardBorder: 'border-purple-100/50' },
  'Delegación':                                        { borderLeft: 'border-l-emerald-600', badge: 'bg-emerald-50 text-emerald-800',  cardBg: 'bg-emerald-50/40', cardBorder: 'border-emerald-100/50' },
  'Acompañamiento, seguimiento y retroalimentación':   { borderLeft: 'border-l-sky-500',     badge: 'bg-sky-50 text-sky-800',          cardBg: 'bg-sky-50/40',     cardBorder: 'border-sky-100/50' },
  'Manejo de conflicto':                               { borderLeft: 'border-l-rose-500',    badge: 'bg-rose-50 text-rose-800',        cardBg: 'bg-rose-50/40',    cardBorder: 'border-rose-100/50' },
  'Rol natural en el equipo':                          { borderLeft: 'border-l-indigo-600',  badge: 'bg-indigo-50 text-indigo-800',    cardBg: 'bg-indigo-50/40',  cardBorder: 'border-indigo-100/50' },
}
const MODULO_TW_DEFAULT = { borderLeft: 'border-l-slate-400', badge: 'bg-slate-100 text-slate-700', cardBg: 'bg-slate-50', cardBorder: 'border-slate-100' }

// Tipos mínimos (ajusta si generas tipos desde Supabase con `supabase gen types`)
type Scoring = Record<string, any>
type Rubrica = Record<string, any>
type TextoPerfil = Record<string, any> | null

export default function PerfilDetalle({
  nombre,
  lugar,
  equipo,
  scoring,
  rubrica,
  textoPerfil,
  respuestasMas,
  respuestasMenos,
}: {
  nombre: string
  lugar: string
  equipo: string
  scoring: Scoring
  rubrica: Rubrica[]
  textoPerfil: TextoPerfil
  respuestasMas: Record<string, string> | null
  respuestasMenos: Record<string, string> | null
}) {
  const tabs = Array.from(new Set(rubrica?.map((r) => r.categoria) ?? []))
  const [mainTab, setMainTab] = useState<'vision' | 'recomendaciones' | 'respuestas'>('vision')
  const [selectedModulo, setSelectedModulo] = useState<string | null>(null)

  function getIniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Group items by modulo, preserving order
  const modulosOrdenados = Array.from(new Set(ITEMS.map((it) => it.modulo)))

  // Find which modules actually have answers for this user
  const modulosConRespuestas = modulosOrdenados.filter((modulo) => {
    const itemsDelModulo = ITEMS.filter((it) => it.modulo === modulo)
    return itemsDelModulo.some(
      (it) =>
        (respuestasMas && respuestasMas[String(it.item)]) ||
        (respuestasMenos && respuestasMenos[String(it.item)])
    )
  })

  const activeModulo = selectedModulo || modulosConRespuestas[0] || null

  return (
    <>
      {/* 1. Tarjeta de Perfil */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Datos del Colaborador */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-8 h-8 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm shrink-0"
              title="Volver al dashboard"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-lg shrink-0">
              {getIniciales(nombre)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 capitalize">{nombre.toLowerCase()}</h2>
                {equipo && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium border border-slate-200">
                    {equipo}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lugar ? `${lugar} — Evaluación de Liderazgo (DISC)` : 'Evaluación de Liderazgo (DISC)'}
              </p>
            </div>
          </div>

          {/* Resumen del Perfil Dominante */}
          {textoPerfil && scoring.perfil_combinado && (
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 max-w-xl flex items-start gap-3">
              <span 
                className="px-2.5 py-1 rounded-md text-white font-bold text-xs shrink-0 mt-0.5 shadow-sm"
                style={{ backgroundColor: DISC_COLOR[scoring.estilo_principal] ?? '#1F4E79' }}
              >
                {scoring.perfil_combinado}
              </span>
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-800 block">
                  {scoring.perfil_combinado} — {textoPerfil.nombre_sugerido.toUpperCase()}
                </span>
                {textoPerfil.lectura_ejecutiva}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto whitespace-nowrap" aria-label="Tabs">
          <button
            onClick={() => setMainTab('vision')}
            className={`whitespace-nowrap border-b-2 py-4 px-4 text-sm font-medium transition-colors ${
              mainTab === 'vision'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Información General
          </button>
          <button
            onClick={() => setMainTab('recomendaciones')}
            className={`whitespace-nowrap border-b-2 py-4 px-4 text-sm font-medium transition-colors ${
              mainTab === 'recomendaciones'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Recomendaciones
          </button>
          <button
            onClick={() => setMainTab('respuestas')}
            className={`whitespace-nowrap border-b-2 py-4 px-4 text-sm font-medium transition-colors ${
              mainTab === 'respuestas'
                ? 'border-[#1F4E79] text-[#1F4E79]'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Respuestas por Módulo
          </button>
        </nav>
      </div>

      {mainTab === 'vision' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-6">
          
          {/* COLUMNA IZQUIERDA: Gráfica DISC */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">
                Puntaje Global
              </h3>
              <p className="text-xs text-slate-400 mb-4">Rango de evaluación: -32 a +32</p>
            </div>

            {/* Contenedor optimizado para el gráfico */}
            <div className="w-full h-[220px] bg-slate-50/50 rounded-lg border border-dashed border-slate-200 py-4">
              <GraficoDisc d={scoring.d_global} i={scoring.i_global} s={scoring.s_global} c={scoring.c_global} />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-3 border-t border-slate-100 mt-4">
              <span>D: Dominancia</span>
              <span>I: Influencia</span>
              <span>S: Estabilidad</span>
              <span>C: Conciencia</span>
            </div>
          </div>

          {/* COLUMNA DERECHA: Resumen de Perfiles (Grid 2x2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORIAS.map((cat, i) => (
              <div key={cat.key} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Categoría 0{i + 1}
                  </span>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">{cat.label}</h4>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-600">
                    Dominante: <strong className="text-slate-800" style={{ color: DISC_COLOR[scoring[`${cat.key}_dominante`] as string] }}>{scoring[`${cat.key}_dominante`]}</strong>
                  </p>
                  <p className="text-xs text-slate-500">Nivel: {scoring[`${cat.key}_nivel`]}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 4. Guía de Gestión para el Líder (Grid 2x2) */}
      {mainTab === 'recomendaciones' && rubrica && rubrica.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {tabs.map((tab) => {
            const rules = rubrica.filter((r) => r.categoria === tab)
            const dotColor = rules[0] ? rules[0].color_hex : '#1F4E79'

            return (
              <div key={tab} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }}></span>
                  {tab}
                </h4>
                <div className="space-y-3 text-xs text-slate-600">
                  {rules.map((r) => (
                    <div key={r.id}>
                      <span className="font-bold text-slate-800" style={{ color: r.color_hex }}>
                        {r.nombre_estilo} ({r.estilo}):
                      </span>
                      <p className="mt-0.5">{r.como_gestionarlo}</p>
                      {r.que_evitar && r.que_evitar !== '-' && r.que_evitar !== '' && (
                        <p className="text-red-500 mt-1">
                          <strong className="text-red-600">Evitar:</strong> {r.que_evitar}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5. Respuestas por Módulo de Evaluación */}
      {mainTab === 'respuestas' && respuestasMas && respuestasMenos && (
        <div className="mt-4 flex flex-col md:flex-row gap-6 items-start">
          
          {/* Sidebar de Módulos (Vertical en Desktop, Horizontal/Scroll en Móvil) */}
          <div className="w-full md:w-64 shrink-0 bg-white rounded-xl border border-slate-200 p-3 shadow-sm md:sticky md:top-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3 hidden md:block">
              Módulos Evaluados
            </p>
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible -mx-3 md:mx-0 px-3 md:px-0 pb-2 md:pb-0" aria-label="Modules">
              {modulosConRespuestas.map((modulo) => {
                const style = MODULO_STYLES[modulo] ?? { bg: '#F1F5F9', text: '#334155' }
                const isActive = activeModulo === modulo
                return (
                  <button
                    key={modulo}
                    onClick={() => setSelectedModulo(modulo)}
                    className={`whitespace-nowrap text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2.5 shrink-0 md:shrink w-auto md:w-full border md:border-0 ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 border-slate-300 md:font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <span className="text-sm">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="6" fill={style.text} />
                      </svg>
                    </span>
                    <span className="truncate">{modulo}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Área de Contenido del Módulo */}
          {activeModulo && (() => {
            const modulo = activeModulo
            const style = MODULO_STYLES[modulo] ?? { bg: '#F1F5F9', text: '#334155' }
            const tw = MODULO_TW[modulo] ?? MODULO_TW_DEFAULT
            const itemsDelModulo = ITEMS.filter((it) => it.modulo === modulo)
            const itemsConRespuesta = itemsDelModulo.filter(
              (it) => respuestasMas[String(it.item)] || respuestasMenos[String(it.item)]
            )

            return (
              <div
                className={`flex-1 bg-white rounded-xl border border-slate-200 border-l-4 shadow-sm p-6 ${tw.borderLeft}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-md font-bold text-slate-800 flex items-center gap-2">
                     <svg className="h-4 w-4" viewBox="0 0 24 24">
                       <circle cx="12" cy="12" r="6" fill={style.text} />
                     </svg> {modulo}
                  </h4>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                    {itemsConRespuesta.length} pregunta{itemsConRespuesta.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {itemsConRespuesta.map((it) => {
                    const letraMas = respuestasMas[String(it.item)]
                    const letraMenos = respuestasMenos[String(it.item)]
                    const opcionMas = it.opciones.find((o) => o.letra === letraMas)
                    const opcionMenos = it.opciones.find((o) => o.letra === letraMenos)

                    return (
                      <div key={it.item} className={`p-4 rounded-lg border ${tw.cardBg} ${tw.cardBorder}`}>
                        <p className="text-xs text-slate-500 font-medium mb-3">{it.enunciado}</p>

                        {opcionMas && (
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-slate-800">
                              &quot;{opcionMas.texto}&quot;
                            </p>
                            <span
                              className="inline-block mt-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white"
                              style={{ backgroundColor: DISC_COLOR[opcionMas.disc] ?? '#666' }}
                            >
                              Más: {opcionMas.disc} — {DISC_LABEL[opcionMas.disc]}
                            </span>
                          </div>
                        )}

                        {opcionMenos && (
                          <div>
                            <p className="text-sm text-slate-600 italic">
                              &quot;{opcionMenos.texto}&quot;
                            </p>
                            <span
                              className="inline-block mt-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded opacity-60 text-white"
                              style={{ backgroundColor: DISC_COLOR[opcionMenos.disc] ?? '#666' }}
                            >
                              Menos: {opcionMenos.disc} — {DISC_LABEL[opcionMenos.disc]}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </>
  )
}
