'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TIEMPO_MINIMO = 3000

export default function CargaPage() {
  const [visible, setVisible] = useState(true)
  const [redirigiendo, setRedirigiendo] = useState(false)

  const router = useRouter()

  async function handleRedirect() {
    setVisible(false)
    setRedirigiendo(true)

    const redirect = typeof window !== 'undefined'
      ? sessionStorage.getItem('redirect_after_login')
      : null

    if (redirect) {
      sessionStorage.removeItem('redirect_after_login')
      router.push(redirect)
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
      router.push('/login')
      return
    }

    const isAdmin = user.user_metadata?.is_admin === true

    if (isAdmin) {
      router.push('/dashboard')
      return
    }

    try {
      const { data: esEncuestador } = await supabase
        .from('encuestadores')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (esEncuestador) {
        router.push('/dashboard')
        return
      }
    } catch {
      // fallback to encuesta
    }

    router.push('/encuesta')
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


  return (
    <>
      {visible && (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-[#F7F8FA] to-white">
          <div className="flex flex-col items-center" suppressHydrationWarning>
            <img
              src="/logo-rizoma.svg"
              alt="Rizoma Logo"
              className="mb-8 h-24 w-auto"
              suppressHydrationWarning
            />
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1F4E79] border-t-transparent" suppressHydrationWarning />
            <p className="mt-4 text-sm text-gray-500">Preparando tu experiencia…</p>
          </div>
        </main>
      )}
    </>
  )
}
