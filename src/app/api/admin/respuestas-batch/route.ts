import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const isAdmin = user.user_metadata?.is_admin === true
  if (!isAdmin) {
    const { data: esEncuestador } = await supabase
      .from('encuestadores')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!esEncuestador) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  try {
    const body = await req.json()
    const { userIds } = body as { userIds: string[] }
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({})
    }

    const admin = createServiceClient()
    const { data, error } = await admin
      .from('respuestas')
      .select('user_id, respuestas_mas, respuestas_menos')
      .in('user_id', userIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const resultMap: Record<string, { respuestas_mas: any; respuestas_menos: any }> = {}
    for (const item of data ?? []) {
      resultMap[item.user_id] = {
        respuestas_mas: item.respuestas_mas,
        respuestas_menos: item.respuestas_menos,
      }
    }

    return NextResponse.json(resultMap)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
