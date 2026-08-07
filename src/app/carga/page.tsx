'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CargaPage() {
  const router = useRouter()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const inicio = Date.now()
    async function esperar() {
      const transcurrido = Date.now() - inicio
      if (transcurrido < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - transcurrido))
      }
      setVisible(false)
      router.push('/encuesta')
    }
    esperar()
  }, [router])

  if (!visible) return null

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <img
        src="/pantalla-carga.png"
        alt="Cargando…"
        className="h-auto max-h-screen w-auto"
      />
    </main>
  )
}
