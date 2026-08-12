import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GraciasContent from './gracias-content'

export default async function GraciasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <GraciasContent />
}
