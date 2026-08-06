'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LogoutButton from './logout-button'
import BienvenidaModal from './bienvenida-modal'
import TerminosModal from './terminos-modal'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [perfil, setPerfil] = useState<{ nombre: string } | null>(null)
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false)
  const [mostrarTerminos, setMostrarTerminos] = useState(false)
  const [aceptoTerminos, setAceptoTerminos] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCargando(false)
        return
      }
      setUser(user)

      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('nombre')
        .eq('id', user.id)
        .maybeSingle()
      setPerfil(perfilData)

      const acepto = typeof window !== 'undefined'
        ? localStorage.getItem('terminos_aceptados') === 'true'
        : false
      setAceptoTerminos(acepto)
      setCargando(false)
    }
    cargar()
  }, [supabase])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function confirmarTerminos() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('terminos_aceptados', 'true')
    }
    setAceptoTerminos(true)
    setMostrarTerminos(false)
  }

  function getInitials(nombre?: string) {
    if (!nombre) return 'U'
    const partes = nombre.trim().split(' ')
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase()
    }
    return nombre.substring(0, 2).toUpperCase()
  }

  if (cargando) {
    return (
      <nav suppressHydrationWarning className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </nav>
    )
  }

  if (!user) return null

  return (
    <>
      <nav suppressHydrationWarning className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
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
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMostrarInstrucciones(true)}
              className="text-sm font-medium text-gray-600 transition hover:text-[#1F4E79]"
            >
              Instrucciones
            </button>
            <button
              type="button"
              onClick={() => setMostrarTerminos(true)}
              className="text-sm font-medium text-[#1F4E79] underline underline-offset-2 hover:text-[#173A5C]"
            >
              Términos y condiciones
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownAbierto(!dropdownAbierto)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1F4E79] text-sm font-medium text-white transition hover:bg-[#173A5C]"
              >
                {getInitials(perfil?.nombre)}
              </button>

              {dropdownAbierto && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-[#1F2937]">
                      {perfil?.nombre ?? 'Usuario'}
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
        </div>
      </nav>

      {mostrarInstrucciones && (
        <BienvenidaModal onClose={() => setMostrarInstrucciones(false)} />
      )}
      {mostrarTerminos && (
        <TerminosModal onAccept={confirmarTerminos} yaAceptado={aceptoTerminos} />
      )}
    </>
  )
}
