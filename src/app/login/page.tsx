'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    // Si hay un destino explícito en la URL, respetarlo
    const siguiente = searchParams.get('siguiente')
    if (siguiente) {
      router.push(siguiente)
      router.refresh()
      return
    }

    // Sin destino explícito: detectar rol y redirigir inteligentemente
    const { data: esEncuestador } = await supabase
      .from('encuestadores')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (esEncuestador) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    // Participante normal: ver si ya completó la encuesta
    const { data: respuesta } = await supabase
      .from('respuestas')
      .select('completado')
      .eq('user_id', user.id)
      .maybeSingle()

    router.push(respuesta?.completado ? '/mis-resultados' : '/encuesta')
    router.refresh()
  }

  return (
    <main suppressHydrationWarning className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-[#1F4E79] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C] disabled:opacity-50"
          >
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-medium text-[#1F4E79] hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  )
}
