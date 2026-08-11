'use client'

import { useState, useEffect, useId } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Select from 'react-select'
import { createClient } from '@/lib/supabase/client'
import TerminosModal from '@/components/terminos-modal'

type Lugar = { id: number; nombre: string }
type Equipo = { id: number; nombre: string }

export default function RegistroPage() {
  const supabase = createClient()
  const router = useRouter()

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const [nombre, setNombre] = useState('')
  const [lugarId, setLugarId] = useState('')
  const [equipo, setEquipo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirm, setMostrarConfirm] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acepto, setAcepto] = useState(false)
     const [mostrarTerminos, setMostrarTerminos] = useState(false)
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [cargandoEquipos, setCargandoEquipos] = useState(false)

  const lugarSelectId = useId()
  const equipoSelectId = useId()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = sessionStorage.getItem('login_email')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedEmail) setEmail(savedEmail)
    }
  }, [])

  useEffect(() => {
    async function cargarLugares() {
      try {
        const res = await fetch('/api/lugares')
        const data = await res.json()
        setLugares(Array.isArray(data) ? data : [])
      } catch {
        // error silencioso
      }
    }
    cargarLugares()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && email) {
      sessionStorage.setItem('login_email', email)
    }
  }, [email])

  useEffect(() => {
    async function cargarEquipos() {
      if (!lugarId) {
        setEquipos([])
        return
      }
      setCargandoEquipos(true)
      try {
        const res = await fetch(`/api/equipos?lugar_id=${lugarId}`)
        const data = await res.json()
        setEquipos(Array.isArray(data) ? data : [])
      } catch {
        // error silencioso
      } finally {
        setCargandoEquipos(false)
      }
      setEquipo('')
    }
    cargarEquipos()
  }, [lugarId])

  const lugarNombre = lugares.find((l) => String(l.id) === lugarId)?.nombre ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!lugarId || !equipo) {
      setError('Selecciona un lugar y una dependencia.')
      return
    }

    if (!acepto) {
      setError('Debes aceptar los términos y condiciones.')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, lugar: lugarNombre, equipo: equipo },
      },
    })
    setCargando(false)

    if (signUpError) {
      const msg = signUpError.message || ''
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already exists')) {
        setError('Ese correo ya está registrado. Intenta iniciar sesión.')
      } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password')) {
        setError('La contraseña no cumple con los requisitos de seguridad.')
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        setError('Error de conexión. Verifica tu internet e intenta de nuevo.')
      } else {
        setError(msg || 'No se pudo crear la cuenta. Intenta de nuevo.')
      }
      return
    }

    if (newUser) {
      await fetch('/api/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: newUser.id,
          nombre,
          lugar: lugarNombre,
          equipo,
          terminos_aceptados: true,
        }),
      }).catch(() => {})
    }

    window.location.href = '/carga'
  }

  function confirmarTerminos() {
    setAcepto(true)
    setMostrarTerminos(false)
  }

  return (
    <main suppressHydrationWarning className="relative flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        ← Volver atrás
      </button>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
         <div className="mb-6 flex justify-center">
           <img src="/logo-rizoma.svg" alt="Desarrollo de Líderes y Equipo" className="h-14 w-auto" />
        </div>
        <h1 className="text-2xl font-semibold text-[#1F2937]">Crear cuenta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Regístrate para responder la encuesta de Desarrollo de Líderes y Equipo.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lugar</label>
            <Select
              required
              instanceId={lugarSelectId}
              value={lugarId ? { value: lugarId, label: lugares.find((l) => String(l.id) === lugarId)?.nombre ?? '' } : null}
              onChange={(opt) => {
                setLugarId(opt ? opt.value : '')
                setEquipo('')
              }}
              options={lugares.map((l) => ({ value: String(l.id), label: l.nombre }))}
              placeholder="Selecciona un lugar"
              classNames={{
                control: () => 'border-gray-300 text-black',
                menu: () => 'z-50',
                option: ({ isFocused }) => isFocused ? 'bg-[#1F4E79]/10 cursor-pointer' : 'cursor-pointer',
              }}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '42px',
                  borderColor: '#d1d5db',
                  borderRadius: '0.5rem',
                  backgroundColor: 'white',
                  '&:hover': { borderColor: '#9ca3af' },
                }),
                menu: (base) => ({ ...base, zIndex: 50 }),
                option: (base, { isFocused }) => ({
                  ...base,
                  color: '#111827',
                   backgroundColor: isFocused ? 'rgba(31, 78, 121, 0.1)' : undefined,
                  cursor: 'pointer',
                }),
                singleValue: (base) => ({ ...base, color: '#111827' }),
                placeholder: (base) => ({ ...base, color: '#6b7280' }),
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Dependencia</label>
            <Select
              required
              instanceId={equipoSelectId}
              isDisabled={!lugarId || cargandoEquipos}
              value={equipo ? { value: equipo, label: equipo } : null}
              onChange={(opt) => setEquipo(opt ? opt.value : '')}
              options={equipos.map((e) => ({ value: e.nombre, label: e.nombre }))}
              placeholder={cargandoEquipos ? 'Cargando...' : !lugarId ? 'Selecciona un lugar' : 'Selecciona o escribe una dependencia'}
              classNames={{
                control: () => 'border-gray-300 text-black',
                menu: () => 'z-50',
                option: ({ isFocused }) => isFocused ? 'bg-[#1F4E79]/10 cursor-pointer' : 'cursor-pointer',
              }}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '42px',
                  borderColor: '#d1d5db',
                  borderRadius: '0.5rem',
                  backgroundColor: 'white',
                  '&:hover': { borderColor: '#9ca3af' },
                }),
                menu: (base) => ({ ...base, zIndex: 50 }),
                option: (base, { isFocused }) => ({
                  ...base,
                  color: '#111827',
                   backgroundColor: isFocused ? 'rgba(31, 78, 121, 0.1)' : undefined,
                  cursor: 'pointer',
                }),
                singleValue: (base) => ({ ...base, color: '#111827' }),
                placeholder: (base) => ({ ...base, color: '#6b7280' }),
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Correo</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <div className="relative">
              <input
                required
                type={mostrarPassword ? 'text' : 'password'}
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.125A7.5 7.5 0 016 12c0-1.276.312-2.46.844-3.485M9.88 9.88l4.235 4.235M9.88 9.88L6.515 6.515M15.5 12a3.5 3.5 0 11-4.95 0 3.5 3.5 0 014.95 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.06 12C3.13 8.66 6.31 6 12 6c1.51 0 2.91.32 4.12.91M12 18c-1.11 0-2.1-.18-3.02-.47M9.88 5.06L6.52 8.42m9.06 9.06 3.4 3.4M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
            <div className="relative">
              <input
                required
                type={mostrarConfirm ? 'text' : 'password'}
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
                placeholder="Repite la contraseña"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirm(!mostrarConfirm)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                aria-label={mostrarConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarConfirm ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.125A7.5 7.5 0 016 12c0-1.276.312-2.46.844-3.485M9.88 9.88l4.235 4.235M9.88 9.88L6.515 6.515M15.5 12a3.5 3.5 0 11-4.95 0 3.5 3.5 0 014.95 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.06 12C3.13 8.66 6.31 6 12 6c1.51 0 2.91.32 4.12.91M12 18c-1.11 0-2.1-.18-3.02-.47M9.88 5.06L6.52 8.42m9.06 9.06 3.4 3.4M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={acepto}
                onChange={(e) => {
                  const checked = e.target.checked
                  setAcepto(checked)
                }}
                className="h-4 w-4 rounded border-gray-300 text-[#1F4E79] focus:ring-[#1F4E79]"
              />
              Acepto los
            </label>
            <button
              type="button"
              onClick={() => setMostrarTerminos(true)}
              className="text-sm font-medium text-[#1F4E79] underline underline-offset-2 hover:text-[#173A5C]"
            >
              Términos y condiciones
            </button>
          </div>

          {error && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0018 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700">{error}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setError(null)}
                    className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C]"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando || !lugarId || !equipo || !acepto}
            className="w-full rounded-lg bg-[#1F4E79] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? 'Creando cuenta…' : 'Crear cuenta y comenzar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-[#1F4E79] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>

      {mostrarTerminos && (
        <TerminosModal
          onAccept={confirmarTerminos}
          onClose={() => setMostrarTerminos(false)}
        />
      )}

    </main>
  )
}
