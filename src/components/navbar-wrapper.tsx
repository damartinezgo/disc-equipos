'use client'

import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Navbar from './navbar'

export default function NavbarWrapper({
  user,
  nombre,
}: {
  user: User
  nombre: string | null
}) {
  const pathname = usePathname()

  if (pathname === '/' || pathname.startsWith('/carga') || pathname.startsWith('/login') || pathname.startsWith('/registro') || pathname.includes('/gracias')) {
    return null
  }

  return <Navbar user={user} nombre={nombre} />
}
