'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import LogoutButton from './logout-button'
import BienvenidaModal from './bienvenida-modal'

export default function NavbarClient({
  user,
  nombre,
}: {
  user: User
  nombre: string | null
}) {
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false)
  const [mostrarLogoutConfirm, setMostrarLogoutConfirm] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const ocultarInstrucciones = pathname.includes('/gracias') || pathname.includes('/dashboard')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMostrarLogoutConfirm(false)
    }
    if (mostrarLogoutConfirm) {
      document.addEventListener('keydown', onKeyDown)
    }
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mostrarLogoutConfirm])

  useEffect(() => {
    function handleOverlayClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setMostrarLogoutConfirm(false)
      }
    }
    if (mostrarLogoutConfirm) {
      document.addEventListener('mousedown', handleOverlayClick)
    }
    return () => document.removeEventListener('mousedown', handleOverlayClick)
  }, [mostrarLogoutConfirm])

  async function handleLogoutConfirmado() {
    setMostrarLogoutConfirm(false)
    setSaliendo(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.clear()
    sessionStorage.clear()
    sessionStorage.setItem('just_logout', 'true')
    window.location.href = '/login'
  }

  function getInitials(nombre?: string) {
    if (!nombre) return 'U'
    const partes = nombre.trim().split(' ')
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase()
    }
    return nombre.substring(0, 2).toUpperCase()
  }

  return (
    <>
      <nav suppressHydrationWarning className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMostrarLogoutConfirm(true)}
              className="cursor-pointer focus:outline-none"
              aria-label="Cerrar sesión"
            >
              <img
                src="/logo-rizoma.svg"
                alt="Desarrollo de Líderes y Equipo"
                className="h-20 w-auto cursor-pointer transition-transform hover:scale-105"
              />
            </button>
            <span className="text-sm font-semibold text-[#1F4E79] hidden sm:inline">
              Desarrollo de Líderes y Equipo
            </span>
          </div>

          <div className="relative flex items-center gap-4" ref={dropdownRef}>
            {!ocultarInstrucciones && (
              <button
                type="button"
                onClick={() => setMostrarInstrucciones(true)}
                className="flex items-center gap-2 rounded-lg border border-[#EA580C] bg-white px-3 py-1.5 text-sm font-medium text-[#EA580C] transition hover:bg-[#FFF3EB]"
              >
                <span>Instrucciones</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDropdownAbierto(!dropdownAbierto)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#1F4E79] text-sm font-medium text-white transition hover:bg-[#173A5C]"
            >
              {getInitials(nombre ?? undefined)}
            </button>

            {dropdownAbierto && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-[#1F2937]">
                    {nombre ?? 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.email}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>{mostrarInstrucciones && (
        <BienvenidaModal
          onAccept={() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('instrucciones_vista', 'true')
            }
            setMostrarInstrucciones(false)
          }}
          onClose={() => setMostrarInstrucciones(false)}
        />
      )}

      {mostrarLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex min-h-screen min-w-screen items-center justify-center bg-black/50 p-4">
          <div
            ref={modalRef}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setMostrarLogoutConfirm(false)}
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
              Recuerda que si cierras sesión, el avance se guarda correctamente. Podrás retomar desde donde lo dejaste la próxima vez.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarLogoutConfirm(false)}
                disabled={saliendo}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirmado}
                disabled={saliendo}
                className="rounded-lg bg-[#C00000] px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {saliendo ? 'Cerrando…' : 'Cerrar sesión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
