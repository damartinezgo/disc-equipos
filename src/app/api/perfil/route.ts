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
    const { terminos_aceptados, telefono } = body

    const admin = createServiceClient()

    const updateData: Record<string, unknown> = {}
    if (terminos_aceptados !== undefined) updateData.terminos_aceptados = terminos_aceptados
    if (telefono !== undefined) updateData.telefono = String(telefono).trim()

    if (Object.keys(updateData).length > 0) {
      const { error } = await admin
        .from('perfiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) {
        console.error('Error al actualizar perfiles:', error)
      }
    }

    // Also update Auth metadata if telefono is provided
    if (telefono !== undefined) {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          telefono: String(telefono).trim(),
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
