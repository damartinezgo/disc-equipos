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
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState('')
  const [lugarId, setLugarId] = useState('')
  const [equipo, setEquipo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acepto, setAcepto] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('terminos_aceptados') === 'true'
    }
    return false
  })
  const [mostrarTerminos, setMostrarTerminos] = useState(false)
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [cargandoEquipos, setCargandoEquipos] = useState(false)

  const lugarSelectId = useId()
  const equipoSelectId = useId()

  useEffect(() => {
    async function cargarLugares() {
      const res = await fetch('/api/lugares')
      const data = await res.json()
      setLugares(Array.isArray(data) ? data : [])
    }
    cargarLugares()
  }, [])

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

    setCargando(true)
    const { error: signUpError } = await supabase.auth.signUp({
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

    router.push('/carga')
  }

  function confirmarTerminos() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('terminos_aceptados', 'true')
    }
    setAcepto(true)
    setMostrarTerminos(false)
  }

  return (
    <main suppressHydrationWarning className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <div className="mb-6 flex justify-center">
          <img src="/logo-rizoma.svg" alt="Desarrollo de Líderes y Equipo" className="h-12 w-auto opacity-80" />
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
                  backgroundColor: isFocused ? '#1F4E79]/10' : undefined,
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
                  backgroundColor: isFocused ? '#1F4E79]/10' : undefined,
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
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={acepto}
                onChange={(e) => {
                  const checked = e.target.checked
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('terminos_aceptados', String(checked))
                  }
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
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
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
          yaAceptado={acepto}
        />
      )}
    </main>
  )
}
