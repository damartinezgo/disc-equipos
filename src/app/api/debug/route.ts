import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const admin = createServiceClient()

  const results: Record<string, any> = {}

  {
    const { data, error, count } = await admin.from('perfiles').select('*', { count: 'exact' })
    results.perfiles_count = count ?? 0
    results.perfiles_error = error?.message
    results.perfiles_data = data
  }

  {
    const { data, error, count } = await admin.from('respuestas').select('*', { count: 'exact' })
    results.respuestas_count = count ?? 0
    results.respuestas_error = error?.message
  }

  {
    const { data, error, count } = await admin.from('scoring').select('*', { count: 'exact' })
    results.scoring_count = count ?? 0
    results.scoring_error = error?.message
  }

  {
    const { data, error } = await admin.auth.admin.listUsers()
    results.auth_users_count = data?.users?.length ?? 0
    results.auth_users_error = error?.message
  }

  {
    const { data, error, count } = await admin.from('encuestadores').select('*', { count: 'exact' })
    results.encuestadores_count = count ?? 0
    results.encuestadores_error = error?.message
    results.encuestadores_data = data
  }

  return NextResponse.json(results, { headers: { 'Cache-Control': 'no-store' } })
}
