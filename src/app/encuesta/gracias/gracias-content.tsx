'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function GraciasContent() {
  const router = useRouter()
  async function handleSalir() {
    const supabase = createClient()
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
    router.push('/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F7F8FA] via-white to-[#F7F8FA] px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white px-10 py-12 text-center shadow-lg">
        {/* Logo dentro de la tarjeta */}
        <Link href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-rizoma.svg"
          alt="Desarrollo de Líderes y Equipo"
          className="mx-auto mb-8 h-18 w-auto cursor-pointer"
        />
        </Link>

        {/* Título principal */}
        <h1 className="text-2xl font-bold leading-tight text-[#0F172A]">
          ¡Evaluación completada con éxito!
        </h1>

        {/* Subtítulo */}
        <p className="mt-3 text-base leading-relaxed text-[#64748B]">
          Agradecemos tu tiempo y disposición al responder esta prueba.
        </p>

        {/* Caja informativa */}
        <div className="mt-8 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-6 py-5 text-left">
          <h2 className="text-sm font-bold text-[#1F4E79]">
            ¿Qué sigue ahora?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">
            Tus respuestas han sido registradas de manera confidencial. Nuestro equipo de
            coaches analizará tu perfil y se pondrá en contacto contigo para brindar
            retroalimentación.
          </p>
        </div>

        {/* Botón de salida */}
        <button
          type="button"
          onClick={handleSalir}
          className="mt-10 w-full rounded-lg bg-[#1F4E79] px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-[#EA580C] hover:shadow-md"
        >
          Finalizar y salir
        </button>
      </div>
    </main>
  )
}
