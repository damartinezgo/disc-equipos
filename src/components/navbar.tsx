import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './logout-button'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre')
    .eq('id', user.id)
    .maybeSingle()

  const { data: esEncuestador } = await supabase
    .from('encuestadores')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
            <img
              src="/logo-rizoma.svg"
              alt="Desarrollo de Líderes y Equipo"
              className="h-10 w-auto"
            />
            <span className="text-sm font-semibold text-[#1F4E79] hidden sm:inline">
              Desarrollo de Líderes y Equipo
            </span>
          </Link>

          {esEncuestador ? (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Link href="/dashboard" className="transition hover:text-[#1F4E79]">
                Panel general
              </Link>
              <Link href={`/dashboard/${user.id}`} className="transition hover:text-[#1F4E79]">
                Mis resultados
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Link href="/encuesta" className="transition hover:text-[#1F4E79]">
                Mi encuesta
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-gray-500 sm:inline">
            {perfil?.nombre ?? user.email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </nav>
  )
}
