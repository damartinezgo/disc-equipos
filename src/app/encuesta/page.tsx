'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import itemsData from '@/data/items-disc.json'

type Opcion = { letra: string; texto: string; disc: string }
type Item = { item: number; modulo: string; categoria: string; enunciado: string; opciones: Opcion[] }

const ITEMS = itemsData as Item[]
const TOTAL = ITEMS.length

export default function EncuestaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [indice, setIndice] = useState(0)
  const [respuestasMas, setRespuestasMas] = useState<Record<number, string>>({})
  const [respuestasMenos, setRespuestasMenos] = useState<Record<number, string>>({})
  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [tieneProgresoGuardado, setTieneProgresoGuardado] = useState(false)

  // Cargar progreso existente (por si cerró el navegador a mitad de la encuesta)
  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirect_after_login', '/encuesta')
        }
        router.push('/login')
        return
      }
      setUserId(user.id)

      const { data } = await supabase
        .from('respuestas')
        .select('respuestas_mas, respuestas_menos, completado')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data?.completado) {
        router.push('/encuesta/gracias')
        return
      }
      if (data) {
        setRespuestasMas(data.respuestas_mas || {})
        setRespuestasMenos(data.respuestas_menos || {})
        const respondidas = Object.keys(data.respuestas_mas || {}).length + Object.keys(data.respuestas_menos || {}).length
        if (respondidas > 0) {
          setTieneProgresoGuardado(true)
        }
        const primeraSinResponder = ITEMS.findIndex(
          (it) => !(data.respuestas_mas?.[it.item] && data.respuestas_menos?.[it.item])
        )
        setIndice(primeraSinResponder === -1 ? 0 : primeraSinResponder)
      }
      setCargandoInicial(false)
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const guardarProgreso = useCallback(
    async (mas: Record<number, string>, menos: Record<number, string>) => {
      if (!userId) return
      setGuardando(true)
      await supabase.from('respuestas').upsert(
        {
          user_id: userId,
          respuestas_mas: mas,
          respuestas_menos: menos,
        },
        { onConflict: 'user_id' }
      )
      setGuardando(false)
    },
    [userId, supabase]
  )

  const itemActual = ITEMS[indice]
  const masSeleccionado = respuestasMas[itemActual?.item]
  const menosSeleccionado = respuestasMenos[itemActual?.item]
  const puedeAvanzar =
    !!masSeleccionado && !!menosSeleccionado && masSeleccionado !== menosSeleccionado

  function seleccionar(tipo: 'mas' | 'menos', letra: string) {
    if (tipo === 'mas') {
      const nuevo = { ...respuestasMas, [itemActual.item]: letra }
      setRespuestasMas(nuevo)
      guardarProgreso(nuevo, respuestasMenos)
    } else {
      const nuevo = { ...respuestasMenos, [itemActual.item]: letra }
      setRespuestasMenos(nuevo)
      guardarProgreso(respuestasMas, nuevo)
    }
  }

  async function siguiente() {
    if (!puedeAvanzar) return

    if (indice === TOTAL - 1) {
      // última pregunta: marcar completado y disparar el cálculo de scoring
      await supabase
        .from('respuestas')
        .update({ completado: true })
        .eq('user_id', userId)

      await fetch('/api/scoring', { method: 'POST' })

      router.push('/encuesta/gracias')
      return
    }

    setIndice((i) => i + 1)
  }

  function anterior() {
    if (indice > 0) setIndice((i) => i - 1)
  }

  if (cargandoInicial) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <img src="/pantalla-carga.png" alt="Cargando…" className="h-auto max-h-screen w-auto" />
      </div>
    )
  }

  const progreso = Math.round(((indice + 1) / TOTAL) * 100)

  return (
    <main className="min-h-screen bg-[#F7F8FA] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {tieneProgresoGuardado && (
          <div className="mb-6 rounded-xl bg-[#1F4E79]/10 px-4 py-3 text-sm text-[#1F4E79]">
            Continuás desde donde lo dejaste. Tu progreso se guarda automáticamente.
          </div>
        )}

        {/* barra de progreso */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs font-medium text-gray-500">
            <span>Pregunta {indice + 1} de {TOTAL}</span>
            <span>{progreso}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#1F4E79] transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#1F4E79]">
            {itemActual.modulo}
          </p>
          <h2 className="mb-6 text-xl font-semibold text-[#1F2937]">{itemActual.enunciado}</h2>

          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 pb-2 text-xs font-medium text-gray-400">
              <span />
              <span className="text-center">MÁS me describe</span>
              <span className="text-center">MENOS me describe</span>
            </div>

            {itemActual.opciones.map((op) => (
              <div
                key={op.letra}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-gray-200 px-4 py-3"
              >
                <span className="text-sm text-gray-700">{op.texto}</span>
                <button
                  type="button"
                  onClick={() => seleccionar('mas', op.letra)}
                  aria-label={`Marcar "${op.texto}" como MÁS me describe`}
                  className={`h-6 w-6 justify-self-center rounded-full border-2 transition ${
                    masSeleccionado === op.letra
                      ? 'border-[#00843D] bg-[#00843D]'
                      : 'border-gray-300 hover:border-[#00843D]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => seleccionar('menos', op.letra)}
                  aria-label={`Marcar "${op.texto}" como MENOS me describe`}
                  className={`h-6 w-6 justify-self-center rounded-full border-2 transition ${
                    menosSeleccionado === op.letra
                      ? 'border-[#C00000] bg-[#C00000]'
                      : 'border-gray-300 hover:border-[#C00000]'
                  }`}
                />
              </div>
            ))}
          </div>

          {masSeleccionado && menosSeleccionado && masSeleccionado === menosSeleccionado && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              MÁS y MENOS deben ser opciones distintas.
            </p>
          )}

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={anterior}
              disabled={indice === 0}
              className="text-sm font-medium text-gray-500 disabled:opacity-0"
            >
              ← Anterior
            </button>
            {guardando && <span className="text-xs text-[#1F4E79]">Guardando…</span>}
            <button
              type="button"
              onClick={siguiente}
              disabled={!puedeAvanzar}
              className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {indice === TOTAL - 1 ? 'Finalizar' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
