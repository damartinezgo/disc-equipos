'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle } from '@/lib/icons'

export default function SessionManager() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [showModal, setShowModal] = useState(false)
  const [targetPath, setTargetPath] = useState<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
           if (event === 'SIGNED_OUT' && !session) {
          if (sessionStorage.getItem('just_logout')) {
            sessionStorage.removeItem('just_logout')
            return
          }
          const saved = sessionStorage.getItem('redirect_after_login')
          const siguiente = searchParams.get('siguiente')

          const destino = siguiente || saved || '/login'

          if (
            pathname.startsWith('/dashboard') ||
            pathname.startsWith('/carga') ||
            pathname.startsWith('/encuesta')
          ) {
            sessionStorage.setItem('redirect_after_login', pathname)
            setTargetPath(destino)
            setShowModal(true)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router, pathname, searchParams])

  function handleRedirectToLogin() {
    setShowModal(false)
    router.replace(targetPath || '/login')
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
              <AlertCircle className="h-6 w-6 text-[#EA580C]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1F2937]">Ups, se acabó tu sesión</h3>
            {pathname.startsWith('/encuesta') ? (
              <p className="mt-1 text-sm text-gray-600">
                Recuerda que si cierras sesión, el avance de tu encuesta se guarda correctamente. Podrás retomar desde donde lo dejaste la próxima vez.
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-600">
                Tu sesión ha expirado. Vuelve a iniciar sesión para continuar.
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleRedirectToLogin}
            className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C]"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
