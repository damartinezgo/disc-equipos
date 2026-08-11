import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const admin = createServiceClient()

  const { data: users, error: usersError } = await admin.auth.admin.listUsers()

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const { data: existingPerfiles, error: perfilesError } = await admin
    .from('perfiles')
    .select('id')

  if (perfilesError) {
    return NextResponse.json({ error: perfilesError.message }, { status: 500 })
  }

  const existingIds = new Set((existingPerfiles ?? []).map((p) => p.id))

  const newPerfiles = users.users
    .filter((u) => !existingIds.has(u.id))
    .map((u) => ({
      id: u.id,
      nombre: u.user_metadata?.nombre ?? u.user_metadata?.name ?? u.email?.split('@')[0] ?? 'Sin nombre',
      lugar: u.user_metadata?.lugar ?? null,
      equipo: u.user_metadata?.equipo ?? null,
      created_at: u.created_at,
    }))

  let inserted = 0
  if (newPerfiles.length > 0) {
    const { error: insertError } = await admin.from('perfiles').upsert(newPerfiles, {
      onConflict: 'id',
    })
    if (insertError) {
      return NextResponse.json({ error: insertError.message, inserted: 0 }, { status: 500 })
    }
    inserted = newPerfiles.length
  }

  return NextResponse.json({
    total_users: users.users.length,
    existing_perfiles: existingIds.size,
    inserted,
    ok: true,
  })
}
