import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import fallbackData from '@/data/lugares-equipos.json'

export async function POST() {
  const admin = createServiceClient()

  const equiposConId = fallbackData.equipos.map((e, idx) => ({
    id: idx + 1,
    nombre: e.nombre,
    lugar_id: e.lugar_id,
  }))

  const { error: lugaresError } = await admin
    .from('lugares')
    .upsert(fallbackData.lugares, { onConflict: 'id' })

  if (lugaresError) {
    return NextResponse.json(
      { error: lugaresError.message, hint: 'Run the SQL migration first: supabase/migrations/20260806175000_create_lugares_equipos.sql' },
      { status: 400 }
    )
  }

  const { error: equiposError } = await admin
    .from('equipos')
    .upsert(equiposConId, { onConflict: 'nombre,lugar_id' })

  if (equiposError) {
    return NextResponse.json(
      { error: equiposError.message, hint: 'Run the SQL migration first: supabase/migrations/20260806175000_create_lugares_equipos.sql' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    lugares: fallbackData.lugares.length,
    equipos: equiposConId.length,
  })
}
