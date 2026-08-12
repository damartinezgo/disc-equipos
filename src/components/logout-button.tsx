'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { X, AlertCircle } from '@/lib/icons'

export default function LogoutButton({ user }: { user: User }) {
  const router = useRouter()
  const [saliendo, setSaliendo] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [encuestaTerminada] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('encuesta_terminada') === 'true'
    }
    return false
  })
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMostrarConfirmacion(false)
    }
    if (mostrarConfirmacion) {
      document.addEventListener('keydown', onKeyDown)
    }
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mostrarConfirmacion])

  useEffect(() => {
    function handleOverlayClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setMostrarConfirmacion(false)
      }
    }
    if (mostrarConfirmacion) {
      document.addEventListener('mousedown', handleOverlayClick)
    }
    return () => document.removeEventListener('mousedown', handleOverlayClick)
  }, [mostrarConfirmacion])

  function confirmarSalida() {
    setMostrarConfirmacion(false)
    void handleLogout()
  }

  async function handleLogout() {
    setSaliendo(true)
    sessionStorage.setItem('just_logout', 'true')
    const supabase = createClient()
    await supabase.auth.signOut().catch(() => {})
    localStorage.clear()
    router.push('/login')
  }

  return (
    <>
      <button
        onClick={() => setMostrarConfirmacion(true)}
        disabled={saliendo}
        className="rounded-lg bg-[#C00000] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {saliendo ? 'Saliendo…' : 'Cerrar sesión'}
      </button>

      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-9999 flex min-h-screen min-w-screen items-center justify-center bg-black/50 p-4">
          <div
            ref={modalRef}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setMostrarConfirmacion(false)}
              className="absolute top-3 right-3 z-10 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="shrink-0">
              <AlertCircle className="h-7 w-7 text-[#C00000]" />
              </div>
              <h2 className="text-lg font-bold text-[#1F2937]">¿Estás seguro?</h2>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              {user.user_metadata?.is_admin
                ? 'Perderás el acceso a esta sesión. Deberás iniciar sesión nuevamente para continuar.'
                : encuestaTerminada
                ? 'Tu encuesta está completada. No perderás nada al cerrar sesión.'
                : 'Recuerda que si cierras sesión, el avance de tu encuesta se guarda correctamente. Podrás retomar desde donde lo dejaste la próxima vez.'}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarSalida}
                className="rounded-lg bg-[#C00000] px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
