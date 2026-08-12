'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BienvenidaModal from '@/components/bienvenida-modal'
import itemsData from '@/data/items-disc.json'

const getBadgeStyles = (modulo: string) => {
  const styles: Record<string, string> = {
    'Orientación general de trabajo': 'bg-[#F1F5F9] text-[#334155]',
    'Toma de decisiones': 'bg-[#EFF6FF] text-[#1E40AF]',
    'Comunicación': 'bg-[#FFF7ED] text-[#C2410C]',
    'Motivadores': 'bg-[#F3E8FF] text-[#6B21A8]',
    'Delegación': 'bg-[#ECFDF5] text-[#047857]',
    'Acompañamiento, seguimiento y retroalimentación': 'bg-[#E0F2FE] text-[#0369A1]',
    'Manejo de conflicto': 'bg-[#FFE4E6] text-[#BE123C]',
    'Rol natural en el equipo': 'bg-[#EEF2FF] text-[#3730A3]',
  }
  return styles[modulo] || 'bg-[#FFF3EB] text-[#C2410C]'
}

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
  const [mostrarModalProgreso, setMostrarModalProgreso] = useState(false)
  const [mostrarConfirmacionCierre, setMostrarConfirmacionCierre] = useState(false)
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false)

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
        if (typeof window !== 'undefined') {
          localStorage.setItem('encuesta_terminada', 'true')
        }
        router.push('/encuesta/gracias')
        return
      }
      if (data) {
        setRespuestasMas(data.respuestas_mas || {})
        setRespuestasMenos(data.respuestas_menos || {})
        const respondidas = Object.keys(data.respuestas_mas || {}).length + Object.keys(data.respuestas_menos || {}).length
        if (respondidas > 0) {
          // Usuario que regresa con progreso: solo mostrar modal de progreso
          setMostrarModalProgreso(true)
        }
        const primeraSinResponder = ITEMS.findIndex(
          (it) => !(data.respuestas_mas?.[it.item] && data.respuestas_menos?.[it.item])
        )
        setIndice(primeraSinResponder === -1 ? 0 : primeraSinResponder)
      } else {
        // Usuario nuevo sin respuestas: mostrar instrucciones si no las ha visto
        const visto = typeof window !== 'undefined'
          ? localStorage.getItem('instrucciones_vista') === 'true'
          : false

        if (!visto) {
          setMostrarInstrucciones(true)
        }
      }

      setCargandoInicial(false)
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      setMostrarConfirmacionCierre(true)
      window.history.pushState(null, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    window.history.pushState(null, '', window.location.href)

    return () => window.removeEventListener('popstate', handlePopState)
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

        if (typeof window !== 'undefined') {
          localStorage.setItem('encuesta_terminada', 'true')
        }

        await fetch('/api/scoring', { method: 'POST' })

      router.push('/encuesta/gracias')
      return
    }

    setIndice((i) => i + 1)
  }

  function anterior() {
    if (indice > 0) setIndice((i) => i - 1)
  }

  function confirmarCierre() {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
    window.location.href = '/login'
  }

  if (cargandoInicial) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-[#F7F8FA] to-white">
        <div className="flex flex-col items-center">
          <img src="/logo-rizoma.svg" alt="Rizoma Logo" className="mb-8 h-24 w-auto" />
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1F4E79] border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">Preparando tu experiencia…</p>
        </div>
      </main>
    )
  }

  const progreso = Math.round(((indice + 1) / TOTAL) * 100)

  return (
    <>
      <main className="min-h-screen bg-[#F7F8FA] px-4 py-10">
        <div className="mx-auto max-w-2xl">
          {/* barra de progreso */}

        {/* barra de progreso */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs font-medium text-gray-500">
            <span>Pregunta {indice + 1} de {TOTAL}</span>
            <span className="font-bold text-[#EA580C]">{progreso}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#EA580C] transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border-t-[3px] border-t-[#EA580C] bg-white p-8 shadow-sm ring-1 ring-black/5">
          <div className="mb-4">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getBadgeStyles(itemActual.modulo)}`}>
              {itemActual.modulo}
            </span>
          </div>
          <h2 className="mb-6 text-xl font-semibold text-[#1F2937]">{itemActual.enunciado}</h2>

          <div className="space-y-3">
             <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 pb-2 text-xs font-bold text-gray-500 pr-2">
               <span />
               <span className="text-center text-[#00843D] w-6">MÁS</span>
               <span className="text-center text-[#C00000] w-6">MENOS</span>
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
                   className={`relative flex h-6 w-6 justify-self-center items-center justify-center rounded-full border-2 text-base font-bold transition ${
                     masSeleccionado === op.letra
                       ? 'border-[#00843D] bg-[#00843D] text-white ring-2 ring-[#00843D]/30'
                       : 'border-[#00843D]/40 bg-transparent text-[#00843D]/60 hover:border-[#00843D] hover:text-[#00843D]'
                   }`}
                 >
                   +
                 </button>
                 <button
                   type="button"
                   onClick={() => seleccionar('menos', op.letra)}
                   aria-label={`Marcar "${op.texto}" como MENOS me describe`}
                   className={`relative flex h-6 w-6 justify-self-center items-center justify-center rounded-full border-2 text-base font-bold transition ${
                     menosSeleccionado === op.letra
                       ? 'border-[#C00000] bg-[#C00000] text-white ring-2 ring-[#C00000]/30'
                       : 'border-[#C00000]/40 bg-transparent text-[#C00000]/60 hover:border-[#C00000] hover:text-[#C00000]'
                   }`}
                 >
                   -
                 </button>
               </div>
             ))}
          </div>

          {masSeleccionado && menosSeleccionado && masSeleccionado === menosSeleccionado && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              MÁS y MENOS deben ser opciones distintas.
            </p>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={anterior}
              disabled={indice === 0}
              className="text-sm font-medium text-gray-500 disabled:opacity-0"
            >
              ← Anterior
            </button>
            <div className="flex items-center gap-3">
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
      </div>
    </main>

    {mostrarConfirmacionCierre && (
      <div
        className="fixed inset-0 z-[9999] flex min-h-screen min-w-screen items-center justify-center bg-black/50 p-4"
        onClick={(e) => e.target === e.currentTarget && setMostrarConfirmacionCierre(false)}
      >
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
          <div className="bg-[#1F4E79] px-6 py-4">
            <h2 className="text-xl font-semibold text-white">¿Estás seguro de cerrar sesión?</h2>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-6">
            <p className="text-sm text-gray-600">
              Tu progreso se guarda automáticamente. Si sales ahora, podrás retomar desde donde lo dejaste la próxima vez.
            </p>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={() => setMostrarConfirmacionCierre(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarCierre}
              className="rounded-lg bg-[#1F4E79] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#173A5C]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
      )}

      {mostrarModalProgreso && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-[#1F4E79]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1V10h-4v1l3 1.5V18l3-1.5V13z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-700">Continuás desde donde lo dejaste. Tu progreso se guarda automáticamente.</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setMostrarModalProgreso(false)}
                className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarInstrucciones && (
        <BienvenidaModal
          onAccept={async () => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('instrucciones_vista', 'true')
            }
            if (userId) {
              await supabase.from('respuestas').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
            }
            setMostrarInstrucciones(false)
          }}
          onClose={() => setMostrarInstrucciones(false)}
        />
      )}
    </>
  )
}
