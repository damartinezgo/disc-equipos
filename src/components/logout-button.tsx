'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const [saliendo, setSaliendo] = useState(false)

  async function handleLogout() {
    setSaliendo(true)
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={saliendo}
      className="rounded-lg bg-[#C00000] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
    >
      {saliendo ? 'Saliendo…' : 'Cerrar sesión'}
    </button>
  )
}
