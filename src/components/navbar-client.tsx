'use client'

import { useState, useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import LogoutButton from './logout-button'

export default function NavbarClient({
  user,
  nombre,
}: {
  user: User
  nombre: string | null
}) {
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
      <nav suppressHydrationWarning className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo-rizoma.svg"
              alt="Desarrollo de Líderes y Equipo"
              className="h-10 w-auto"
            />
            <span className="text-sm font-semibold text-[#1F4E79] hidden sm:inline">
              Desarrollo de Líderes y Equipo
            </span>
          </div>

          <div className="relative" ref={dropdownRef}>
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
      </nav>
  )
}
