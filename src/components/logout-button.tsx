'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const [saliendo, setSaliendo] = useState(false)

  async function handleLogout() {
    setSaliendo(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={saliendo}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-[#C00000] hover:text-[#C00000] disabled:opacity-50"
    >
      {saliendo ? 'Saliendo…' : 'Cerrar sesión'}
    </button>
  )
}
