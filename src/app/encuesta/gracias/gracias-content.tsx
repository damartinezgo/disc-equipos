'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Phone, CheckCircle, AlertCircle } from '@/lib/icons'

export default function GraciasContent() {
  const router = useRouter()
  const [telefono, setTelefono] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)

  // Cargar teléfono actual si ya existe
  useEffect(() => {
    async function cargarTelefono() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('telefono')
          .eq('id', user.id)
          .maybeSingle()
        if (perfil?.telefono) {
          setTelefono(perfil.telefono)
        } else if (user.user_metadata?.telefono) {
          setTelefono(user.user_metadata.telefono)
        }
      }
    }
    cargarTelefono()
  }, [])

  async function handleFinalizar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const telLimpio = telefono.trim()
    if (!telLimpio) {
      setError('Por favor ingresa tu número de teléfono para enviarte tus resultados.')
      return
    }

    if (telLimpio.length < 7) {
      setError('Por favor ingresa un número de teléfono válido.')
      return
    }

    setGuardando(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: telLimpio }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al guardar el número de teléfono.')
        setGuardando(false)
        return
      }

      setGuardadoExitoso(true)
      setTimeout(async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        router.push('/')
      }, 1500)
    } catch {
      setError('Error de conexión al registrar el teléfono.')
      setGuardando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F7F8FA] via-white to-[#F7F8FA] px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white px-8 py-10 text-center shadow-lg sm:px-10">
        {/* Logo dentro de la tarjeta */}
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-rizoma.svg"
            alt="Desarrollo de Líderes y Equipo"
            className="mx-auto mb-6 h-16 w-auto cursor-pointer"
          />
        </Link>

        {/* Título principal */}
        <h1 className="text-2xl font-bold leading-tight text-[#0F172A]">
          ¡Evaluación completada con éxito!
        </h1>

        {/* Subtítulo */}
        <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
          Agradecemos tu tiempo y dedicación al responder cada una de las situaciones.
        </p>

        {/* Sección para pedir el número de teléfono */}
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-left">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#1F4E79] p-2 text-white shadow-xs">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1F4E79]">
                Recibe tus resultados detallados
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                Para que nuestro equipo pueda compartirte tu informe psicométrico DISC y retroalimentación, por favor confirma tu número de teléfono / WhatsApp:
              </p>
            </div>
          </div>

          <form onSubmit={handleFinalizar} className="mt-4 space-y-3">
            <div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  required
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 300 123 4567"
                  disabled={guardando || guardadoExitoso}
                  className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm text-black shadow-xs focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79] disabled:bg-gray-100"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {guardadoExitoso && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2.5 text-xs text-green-800 font-semibold">
                <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                <span>Teléfono registrado correctamente. Cerrando sesión…</span>
              </div>
            )}

            <button
              type="submit"
              disabled={guardando || guardadoExitoso}
              className="mt-2 w-full rounded-lg bg-[#1F4E79] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#173A5C] disabled:opacity-60"
            >
              {guardando ? 'Guardando información…' : 'Registrar teléfono y finalizar'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Tus datos se manejan bajo estrictas políticas de confidencialidad y protección de datos.
        </p>
      </div>
    </main>
  )
}
