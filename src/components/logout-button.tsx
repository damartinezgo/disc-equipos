'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
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
    const supabase = createClient()
    await supabase.auth.signOut().catch(() => {})
    localStorage.clear()
    sessionStorage.clear()
    sessionStorage.setItem('just_logout', 'true')
    window.location.href = '/login'
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
        <div className="fixed inset-0 z-[9999] flex min-h-screen min-w-screen items-center justify-center bg-black/50 p-4">
          <div
            ref={modalRef}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setMostrarConfirmacion(false)}
              className="absolute top-3 right-3 z-10 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="h-7 w-7 text-[#C00000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0018 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#1F2937]">¿Estás seguro?</h2>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              {encuestaTerminada
                ? 'Tu encuesta está completada. No perderás nada al cerrar sesión.'
                : 'Recuerda que si cierras sesión, el avance se guarda correctamente. Podrás retomar desde donde lo dejaste la próxima vez.'}
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
