'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
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
  const dropdownRef = useRef<HTMLDivElement>(null)
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
            <Link href="/">
              <img
                src="/logo-rizoma.svg"
                alt="Desarrollo de Líderes y Equipo"
                className="h-12 w-auto cursor-pointer"
              />
            </Link>
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
    </>
  )
}
