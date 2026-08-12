import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const admin = createServiceClient()

  const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }

  const adminIds = new Set(
    users.filter((u) => u.user_metadata?.is_admin === true).map((u) => u.id)
  )
  const nonAdminIds = users
    .filter((u) => u.user_metadata?.is_admin !== true)
    .map((u) => u.id)

  const deleted: Record<string, number> = {}

  const { count: respuestasCount, error: respuestasErr } = await admin
    .from('respuestas')
    .delete()
    .in('user_id', nonAdminIds)
  deleted.respuestas = respuestasCount ?? 0
  if (respuestasErr) {
    return NextResponse.json({ error: respuestasErr.message, table: 'respuestas' }, { status: 400 })
  }

  const { count: scoringCount, error: scoringErr } = await admin
    .from('scoring')
    .delete()
    .in('user_id', nonAdminIds)
  deleted.scoring = scoringCount ?? 0
  if (scoringErr) {
    return NextResponse.json({ error: scoringErr.message, table: 'scoring' }, { status: 400 })
  }

  const { count: perfilesCount, error: perfilesErr } = await admin
    .from('perfiles')
    .delete()
    .in('id', nonAdminIds)
  deleted.perfiles = perfilesCount ?? 0
  if (perfilesErr) {
    return NextResponse.json({ error: perfilesErr.message, table: 'perfiles' }, { status: 400 })
  }

  const { count: encuestadoresCount, error: encuestadoresErr } = await admin
    .from('encuestadores')
    .delete()
    .in('user_id', nonAdminIds)
  deleted.encuestadores = encuestadoresCount ?? 0
  if (encuestadoresErr) {
    return NextResponse.json({ error: encuestadoresErr.message, table: 'encuestadores' }, { status: 400 })
  }

  const { count: otpCount, error: otpErr } = await admin
    .from('otp_codes')
    .delete()
    .neq('id', 0)
  deleted.otp_codes = otpCount ?? 0
  if (otpErr) {
    return NextResponse.json({ error: otpErr.message, table: 'otp_codes' }, { status: 400 })
  }

  for (const id of nonAdminIds) {
    const { error: delErr } = await admin.auth.admin.deleteUser(id)
    if (delErr) {
      return NextResponse.json({ error: delErr.message, userId: id }, { status: 400 })
    }
  }

  return NextResponse.json({
    admin_ids_kept: adminIds.size,
    non_admin_deleted: nonAdminIds.length,
    tables: deleted,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
