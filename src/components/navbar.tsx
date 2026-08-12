import type { User } from '@supabase/supabase-js'
import NavbarClient from './navbar-client'

export default function Navbar({ user, nombre }: {
  user: User
  nombre: string | null
}) {
  return <NavbarClient user={user} nombre={nombre} />
}
