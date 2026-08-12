'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al inicio
        </Link>
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <div className="mb-6 flex justify-center">
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
                  disabled={cargando}
                  className="w-full rounded-lg bg-[#1F4E79] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C] disabled:cursor-not-allowed disabled:opacity-50"
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
