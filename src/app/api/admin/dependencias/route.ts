import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function verificarAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401, error: 'No autenticado' }

  const isAdmin = user.user_metadata?.is_admin === true
  if (!isAdmin) {
    const { data: esEncuestador } = await supabase
      .from('encuestadores')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!esEncuestador) return { ok: false as const, status: 403, error: 'No autorizado' }
  }
  return { ok: true as const }
}

export async function GET() {
  const auth = await verificarAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('equipos')
    .select('id, nombre, departamento')
    .order('nombre')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ dependencias: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await verificarAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json()
  const nombre = (body.nombre || '').trim().toUpperCase()
  const departamento = (body.departamento || '').trim().toUpperCase()

  if (!nombre) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  }

  const admin = createServiceClient()

  const { data: existente } = await admin.from('equipos').select('id').eq('nombre', nombre).maybeSingle()
  if (existente) {
    return NextResponse.json({ error: 'Ya existe una dependencia con ese nombre' }, { status: 409 })
  }

  const { data, error } = await admin
    .from('equipos')
    .insert({ nombre, departamento: departamento || null })
    .select('id, nombre, departamento')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ dependencia: data })
}

export async function PUT(req: NextRequest) {
  const auth = await verificarAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json()
  const id = Number(body.id)
  const nombre = (body.nombre || '').trim().toUpperCase()
  const departamento = (body.departamento || '').trim().toUpperCase()

  if (!id || !nombre) {
    return NextResponse.json({ error: 'ID y nombre son obligatorios' }, { status: 400 })
  }

  const admin = createServiceClient()

  const { data: existente } = await admin.from('equipos').select('id').eq('nombre', nombre).neq('id', id).maybeSingle()
  if (existente) {
    return NextResponse.json({ error: 'Ya existe una dependencia con ese nombre' }, { status: 409 })
  }

  const { data, error } = await admin
    .from('equipos')
    .update({ nombre, departamento: departamento || null })
    .eq('id', id)
    .select('id, nombre, departamento')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ dependencia: data })
}

export async function DELETE(req: NextRequest) {
  const auth = await verificarAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const url = new URL(req.url)
  const id = Number(url.searchParams.get('id'))

  if (!id) {
    return NextResponse.json({ error: 'ID de dependencia es obligatorio' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { error } = await admin.from('equipos').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
