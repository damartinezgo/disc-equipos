import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Verify the caller is an admin
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

  const body = await req.json()
  const {
    correo,
    cedula,
    nombres,
    primer_apellido,
    segundo_apellido,
    departamento,
    municipio,
    dependencia_funciones,
    telefono,
    lugar,
    equipo,
  } = body

  if (!correo || !cedula || !nombres) {
    return NextResponse.json(
      { error: 'Correo, cédula y nombres son obligatorios' },
      { status: 400 }
    )
  }

  const admin = createServiceClient()

  // Create user with email_confirm = true so they don't need to verify
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email: correo,
    password: cedula,
    email_confirm: true,
    user_metadata: {
      nombre: nombres,
      cedula,
      primer_apellido: primer_apellido || '',
      segundo_apellido: segundo_apellido || '',
      departamento: departamento || '',
      municipio: municipio || '',
      dependencia_funciones: dependencia_funciones || '',
      telefono: telefono || '',
      lugar: lugar || '',
      equipo: equipo || '',
      terminos_aceptados: true,
    },
  })

  if (createError) {
    if (createError.message?.includes('already been registered') || createError.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este correo electrónico' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: createError.message || 'Error al crear usuario' },
      { status: 500 }
    )
  }

  // Also upsert into perfiles table immediately
  try {
    await admin.from('perfiles').upsert({
      id: newUser.user.id,
      nombre: nombres,
      cedula,
      primer_apellido: primer_apellido || null,
      segundo_apellido: segundo_apellido || null,
      departamento: departamento || null,
      dependencia_funciones: dependencia_funciones || null,
      telefono: telefono || null,
      terminos_aceptados: true,
    })
  } catch (err) {
    console.error('Error al insertar perfil:', err)
  }

  return NextResponse.json({ user: { id: newUser.user.id, email: newUser.user.email } })
}

export async function GET() {
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

  const admin = createServiceClient()

  // Get all profiles
  const { data: perfiles } = await admin
    .from('perfiles')
    .select('*')
    .order('created_at', { ascending: false })

  const perfilesMap = new Map((perfiles ?? []).map((p) => [p.id, p]))

  // Get all auth users
  const allAuthUsers: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> }[] = []
  {
    let page = 1
    const perPage = 1000
    while (true) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage })
      const users = data?.users ?? []
      allAuthUsers.push(...users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        user_metadata: u.user_metadata,
      })))
      if (users.length < perPage) break
      page++
    }
  }

  const usuarios = allAuthUsers
    .filter((u) => u.user_metadata?.is_admin !== true)
    .map((u) => {
      const p = perfilesMap.get(u.id)
      const meta = (u.user_metadata ?? {}) as Record<string, string>
      return {
        id: u.id,
        nombre: p?.nombre || meta.nombre || 'Sin nombre',
        correo: u.email ?? '',
        cedula: p?.cedula || meta.cedula || '',
        primer_apellido: p?.primer_apellido || meta.primer_apellido || '',
        segundo_apellido: p?.segundo_apellido || meta.segundo_apellido || '',
        departamento: p?.departamento || meta.departamento || '',
        dependencia_funciones: p?.dependencia_funciones || meta.dependencia_funciones || '',
        telefono: p?.telefono || meta.telefono || '',
        created_at: p?.created_at || u.created_at || '',
      }
    })

  return NextResponse.json({ usuarios })
}

export async function PUT(req: NextRequest) {
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

  const body = await req.json()
  const {
    id,
    correo,
    cedula,
    nombres,
    primer_apellido,
    segundo_apellido,
    departamento,
    municipio,
    dependencia_funciones,
    telefono,
  } = body

  if (!id || !correo || !cedula || !nombres) {
    return NextResponse.json(
      { error: 'ID, correo, cédula y nombres son obligatorios' },
      { status: 400 }
    )
  }

  const admin = createServiceClient()

  // Update Auth user
  const metadata = {
    nombre: nombres,
    cedula,
    primer_apellido: primer_apellido || '',
    segundo_apellido: segundo_apellido || '',
    departamento: departamento || '',
    municipio: municipio || '',
    dependencia_funciones: dependencia_funciones || '',
    telefono: telefono || '',
    terminos_aceptados: true,
  }

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    email: correo,
    user_metadata: metadata,
  })

  if (authError) {
    return NextResponse.json(
      { error: authError.message || 'Error al actualizar usuario en Auth' },
      { status: 500 }
    )
  }

  // Update perfiles table
  const { error: perfilError } = await admin
    .from('perfiles')
    .update({
      nombre: nombres,
      cedula,
      primer_apellido: primer_apellido || null,
      segundo_apellido: segundo_apellido || null,
      departamento: departamento || null,
      municipio: municipio || null,
      dependencia_funciones: dependencia_funciones || null,
      telefono: telefono || null,
    })
    .eq('id', id)

  if (perfilError) {
    console.error('Error al actualizar perfiles:', perfilError)
  }

  return NextResponse.json({ ok: true, message: 'Usuario actualizado correctamente' })
}

export async function DELETE(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}))
  const url = new URL(req.url)
  const id = body.id || url.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID de usuario es obligatorio' }, { status: 400 })
  }

  const admin = createServiceClient()

  // Clean up related tables first
  try {
    await Promise.allSettled([
      admin.from('respuestas').delete().eq('user_id', id),
      admin.from('scoring').delete().eq('user_id', id),
      admin.from('consentimientos').delete().eq('user_id', id),
      admin.from('perfiles').delete().eq('id', id),
      admin.from('perfiles').delete().eq('user_id', id),
      admin.from('encuestadores').delete().eq('user_id', id),
    ])
  } catch (err) {
    console.error('Error limpiando datos relacionados:', err)
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(id)

  if (deleteError && !deleteError.message?.includes('User not found')) {
    return NextResponse.json(
      { error: deleteError.message || 'Error al eliminar usuario' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, message: 'Usuario eliminado exitosamente' })
}
