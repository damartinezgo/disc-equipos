import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import fallbackData from '@/data/lugares-equipos.json'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lugares')
    .select('id, nombre')
    .order('nombre')

  if (error || !data) {
    return NextResponse.json(fallbackData.lugares)
  }

  return NextResponse.json(data)
}
