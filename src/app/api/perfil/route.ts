import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, nombre, lugar, equipo, terminos_aceptados } = body

    if (!user_id || !nombre) {
      return NextResponse.json(
        { error: 'Faltan datos: user_id y nombre son requeridos' },
        { status: 400 }
      )
    }

    const admin = createServiceClient()

    const { error } = await admin.from('perfiles').upsert({
      id: user_id,
      nombre,
      lugar: lugar ?? null,
      equipo: equipo ?? null,
      terminos_aceptados: terminos_aceptados ?? true,
    }, { onConflict: 'id' })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('does not exist') && msg.includes('column')) {
        // Fallback: insert sin columnas que aún no fueron migradas a la BD
        const { error: retryError } = await admin.from('perfiles').upsert({
          id: user_id,
          nombre,
          equipo: equipo ?? null,
        }, { onConflict: 'id' })

        if (retryError) {
          return NextResponse.json(
            { error: retryError.message },
            { status: 500 }
          )
        }
        return NextResponse.json({ ok: true, warning: 'Se aplicarán migraciones de BD pendientes' })
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { terminos_aceptados } = body

    const admin = createServiceClient()

    const { error } = await admin
      .from('perfiles')
      .update({ terminos_aceptados })
      .eq('id', user.id)

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('does not exist') && msg.includes('column')) {
        // La columna terminos_aceptados aún no existe en la BD. La funcionalidad seguirá
        // funcionando una vez aplicada la migración correspondiente.
        return NextResponse.json({ ok: true, warning: 'La columna terminos_aceptados no existe todavía en la BD' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
