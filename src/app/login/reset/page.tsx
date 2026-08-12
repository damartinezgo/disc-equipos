'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowLeft, AlertCircle } from '@/lib/icons'

export default function ResetPage() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [mostrarConfirm, setMostrarConfirm] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [intercambiando, setIntercambiando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  // El enlace de reset lleva un `code` en los query params (PKCE)
  const code = searchParams?.get('code')

  useEffect(() => {
    if (!code) {
      router.replace('/login')
      return
    }

    async function intercambiar() {
      setIntercambiando(true)
      setError(null)

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code!)

      if (exchangeError) {
        setError(exchangeError.message || 'El enlace de recuperación es inválido o expiró.')
      }
      setIntercambiando(false)
    }
    intercambiar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      const msg = updateError.message.toLowerCase()
      if (msg.includes('invalid') || msg.includes('password')) {
        setError('La contraseña no cumple con los requisitos de seguridad.')
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setError('Error de conexión. Verifica tu internet e intenta de nuevo.')
      } else {
        setError(updateError.message || 'No se pudo cambiar la contraseña. Intenta de nuevo.')
      }
      setCargando(false)
      return
    }

    setCargando(false)
    setListo(true)
  }

  if (intercambiando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
        <p className="text-sm text-gray-600">Procesando tu enlace de recuperación…</p>
      </main>
    )
  }

  return (
    <>
      <main suppressHydrationWarning className="relative flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
        <Link
          href="/login"
          className="absolute top-6 left-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <div className="mb-6 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-rizoma.svg" alt="Desarrollo de Líderes y Equipo" className="h-14 w-auto" />
          </div>

          {listo ? (
            <>
              <h1 className="text-2xl font-semibold text-[#1F2937]">Contraseña actualizada</h1>
              <p className="mt-4 text-sm text-gray-600">
                Tu contraseña ha sido cambiada exitosamente. Ya podés iniciar sesión con la nueva contraseña.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-[#1F2937]">Nueva contraseña</h1>
              <p className="mt-1 text-sm text-gray-500">
                Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      required
                      type={mostrarPassword ? 'text' : 'password'}
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-400 px-3 py-3 pr-10 text-base md:text-sm text-black transition-colors focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                      placeholder="Mínimo 8 caracteres"
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
                      className="mt-1 w-full rounded-lg border border-gray-400 px-3 py-3 pr-10 text-base md:text-sm text-black transition-colors focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                      placeholder="Repite la contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirm(!mostrarConfirm)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={mostrarConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {mostrarConfirm ? (
<EyeOff className="h-5 w-5" />
                      ) : (
<Eye className="h-5 w-5" />
                      )}
                    </button>
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

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full rounded-lg bg-[#1F4E79] px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cargando ? 'Cambiando…' : 'Cambiar contraseña'}
                </button>
              </form>
            </>
          )}

          {listo && (
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="font-medium text-[#1F4E79] hover:underline"
              >
                Ir a iniciar sesión
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
