'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BienvenidaModal from '@/components/bienvenida-modal'

const TIEMPO_MINIMO = 3000

export default function CargaPage() {
  const [visible, setVisible] = useState(true)
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false)
  const [redirigiendo, setRedirigiendo] = useState(false)

  async function handleRedirect() {
    setVisible(false)
    setRedirigiendo(true)

    const redirect = typeof window !== 'undefined'
      ? sessionStorage.getItem('redirect_after_login')
      : null

    if (redirect) {
      sessionStorage.removeItem('redirect_after_login')
      window.location.href = redirect
      return
    }

    const supabase = createClient()
    let user = null
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      user = supabaseUser
    } catch {
      user = null
    }

    if (!user) {
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/login'
      return
    }

    try {
      const { data: esEncuestador } = await supabase
        .from('encuestadores')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (esEncuestador) {
        window.location.href = '/dashboard'
        return
      }
    } catch {
      // fallback to encuesta
    }

    window.location.href = '/encuesta'
  }

  useEffect(() => {
    const startTime = Date.now()
    const visto = typeof window !== 'undefined'
      ? localStorage.getItem('instrucciones_vista') === 'true'
      : false

    let ejecutado = false

    function proceed() {
      if (ejecutado) return
      ejecutado = true

      if (!visto) {
        setVisible(false)
        setMostrarInstrucciones(true)
        return
      }

      void handleRedirect()
    }

    const timeoutId = setTimeout(proceed, TIEMPO_MINIMO)

    const intervalId = setInterval(() => {
      if (Date.now() - startTime >= TIEMPO_MINIMO) {
        proceed()
      }
    }, 500)

    function onVisibility() {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (Date.now() - startTime >= TIEMPO_MINIMO) {
          proceed()
        }
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
    }

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }
  }, [])

  function handleSaltar() {
    void handleRedirect()
  }

  function acceptarInstrucciones() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('instrucciones_vista', 'true')
    }
    setMostrarInstrucciones(false)
    void handleRedirect()
  }

  return (
    <>
      {visible && (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-[#F7F8FA] to-white">
          <div className="relative flex flex-col items-center" suppressHydrationWarning>
            <img
              src="/pantalla-carga.png"
              alt="Cargando…"
              className="h-auto max-h-[70vh] w-auto"
              suppressHydrationWarning
            />
            <div className="absolute bottom-[-60px] flex flex-col items-center" suppressHydrationWarning>
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1F4E79] border-t-transparent" suppressHydrationWarning />
              <p className="mt-4 text-sm text-gray-500">Preparando tu experiencia…</p>
              <button
                onClick={handleSaltar}
                className="mt-4 text-xs font-medium text-gray-400 underline underline-offset-1 hover:text-gray-600"
              >
                Saltar
              </button>
            </div>
          </div>
        </main>
      )}

      {redirigiendo && !visible && !mostrarInstrucciones && (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-[#F7F8FA] to-white">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1F4E79] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500">Redirigiendo…</p>
          </div>
        </div>
      )}

      {mostrarInstrucciones && (
        <BienvenidaModal
          onAccept={acceptarInstrucciones}
          onClose={() => setMostrarInstrucciones(false)}
        />
      )}
    </>
  )
}
