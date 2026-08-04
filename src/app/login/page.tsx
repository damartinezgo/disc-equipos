'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const DISC_ITEMS = [
  { label: 'D', color: '#1F4E79', name: 'Dominancia' },
  { label: 'I', color: '#C00000', name: 'Influencia' },
  { label: 'S', color: '#D9A340', name: 'Estabilidad' },
  { label: 'C', color: '#00843D', name: 'Conciencia' },
]

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setCargando(false)

    if (signInError) {
      setError('Correo o contraseña incorrectos. Inténtalo de nuevo.')
      return
    }

    const destino = searchParams.get('siguiente') || '/encuesta'
    router.push(destino)
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F7F8FA] via-white to-[#F7F8FA] px-4 py-8">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 gap-0 rounded-3xl bg-white shadow-xl ring-1 ring-black/5 md:grid-cols-2 md:gap-8 lg:gap-12">

          {/* Panel de branding */}
          <div className="relative flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-[#1F4E79] via-[#173A5C] to-[#0F2A44] px-8 py-12 text-center text-white">
            <div className="absolute top-0 right-0 -mt-4 h-40 w-40 rounded-bl-[3rem] rounded-tr-[3rem] bg-[#C00000] opacity-10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-4 h-36 w-36 rounded-tr-[3rem] rounded-br-[3rem] bg-[#00843D] opacity-10 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-center gap-2">
                <span className="text-4xl font-extrabold">DISC</span>
                <span className="text-4xl font-extrabold text-[#D9A340]">Equipos</span>
              </div>
              <h2 className="mb-4 text-2xl font-semibold">Gestión basada en estilo de trabajo</h2>
              <p className="mx-auto max-w-xs text-sm text-blue-100">
                Descubre el perfil DISC de tu equipo y potencia la colaboración.
              </p>
            </div>

            <div className="relative z-10 mt-4 flex justify-center gap-3">
              {DISC_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.label}
                  </span>
                  <span className="hidden text-xs text-blue-200 sm:inline">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel de formulario */}
          <div className="flex flex-col justify-center px-8 py-10 sm:px-12">
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-2xl font-semibold text-[#1F2937]">Iniciar sesión</h1>
              <p className="mt-1 text-sm text-gray-500">
                Ingresa tus credenciales para continuar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Correo electrónico</label>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-transparent focus:border-[#1F4E79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/20"
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div>
                <div className="mb-1.5 flex justify-between">
                  <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                  <span className="text-xs text-gray-400" />
                </div>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-800 placeholder-transparent focus:border-[#1F4E79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/20"
                    placeholder="Tu contraseña"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:text-gray-600"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-xl bg-[#1F4E79] px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#173A5C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cargando ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link
                href="/registro"
                className="font-medium text-[#1F4E79] transition hover:text-[#173A5C] hover:underline"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.457 12B12 19.99 21.543 12 21.543 12"
      />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.042c.52.147.75.18.875.19"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.878 9.878A3 3 0 1114.12 14.12M9.878 9.878L6.5 6.5M17.5 17.5L14.12 14.12"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.457 12B12 19.99 21.543 12"
      />
    </svg>
  )
}
