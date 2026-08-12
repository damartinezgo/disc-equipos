'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleBack() {
    if (typeof window !== 'undefined') {
      const justLogout = sessionStorage.getItem('just_logout')
      if (justLogout) {
        sessionStorage.removeItem('just_logout')
        router.push('/')
        return
      }
      if (window.history.length > 1) {
        router.back()
        return
      }
    }
    router.push('/')
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('login_email')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setEmail(saved)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && email) {
      sessionStorage.setItem('login_email', email)
    }
  }, [email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setCargando(false)

    if (signInError || !user) {
      const msg = signInError?.message || ''
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('Correo o contraseña incorrectos.')
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Debes confirmar tu correo antes de iniciar sesión.')
      } else if (msg) {
        setError(msg)
      } else {
        setError('Correo o contraseña incorrectos.')
      }
      return
    }

    const siguiente = searchParams.get('siguiente')
    const saved = sessionStorage.getItem('redirect_after_login')
    sessionStorage.removeItem('redirect_after_login')
    window.location.href = siguiente || saved || '/carga'
  }

  return (
    <>
      <main suppressHydrationWarning className="relative flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50 hover:text-gray-800"
        aria-label="Volver atrás"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <div className="mb-6 flex justify-center">
          <Link href="/">
            <img src="/logo-rizoma.svg" alt="Desarrollo de Líderes y Equipo" className="h-24 w-auto cursor-pointer transition-transform hover:scale-105" />
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-[#1F2937]">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-gray-500">Ingresa a tu cuenta para continuar.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              className="mt-1 w-full rounded-lg border border-gray-400 px-3 py-3 text-base md:text-sm text-black transition-colors focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <div className="relative mt-1">
              <input
                required
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full rounded-lg border border-gray-400 px-3 py-3 pr-10 text-base md:text-sm text-black transition-colors focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="mt-2 flex justify-end">
              <Link href="/login/recuperar" className="text-xs font-medium text-[#EA580C] hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
          {error && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500" />
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-[#1F4E79] px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#EA580C] disabled:opacity-50"
            >
              {cargando ? 'Ingresando…' : 'Ingresar'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
           ¿No tienes cuenta?{' '}
           <Link href="/registro" className="font-semibold text-[#EA580C] transition-colors hover:text-[#C2410C] hover:underline">
             Regístrate
           </Link>
        </div>
      </div>
      </main>
    </>
  )
}
