import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import fallbackData from '@/data/lugares-equipos.json'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const lugarId = searchParams.get('lugar_id')

  let query = supabase
    .from('equipos')
    .select('id, nombre')
    .order('nombre')

  if (lugarId) {
    query = query.eq('lugar_id', parseInt(lugarId, 10))
  }

  const { data, error } = await query

  if (error || !data) {
    const filtered = lugarId
      ? fallbackData.equipos.filter((e) => e.lugar_id === parseInt(lugarId, 10))
      : fallbackData.equipos
    return NextResponse.json(filtered)
  }

  return NextResponse.json(data)
}
