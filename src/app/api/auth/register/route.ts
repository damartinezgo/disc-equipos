import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { user_id, password, nombre, lugar, equipo, email } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Se requiere email y password' },
        { status: 400 }
      )
    }

    const admin = createServiceClient()

    let resolvedUserId = user_id

    if (!resolvedUserId) {
      const { data: createUserRes, error: createUserError } = await admin.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          nombre: nombre || 'Sin nombre',
          lugar: lugar || null,
          equipo: equipo || null,
          terminos_aceptados: true,
        },
      })

      if (createUserError) {
        const msg = createUserError.message.toLowerCase()
        if (msg.includes('already') || msg.includes('exists')) {
          return NextResponse.json(
            { error: 'Este correo ya está registrado. Intenta iniciar sesión.' },
            { status: 409 }
          )
        }
        return NextResponse.json({ error: createUserError.message }, { status: 400 })
      }

      resolvedUserId = createUserRes?.user?.id
      if (!resolvedUserId) {
        return NextResponse.json(
          { error: 'No se pudo crear el usuario' },
          { status: 500 }
        )
      }
    } else {
      const { error: updateError } = await admin.auth.admin.updateUserById(resolvedUserId, {
        password,
        user_metadata: {
          nombre: nombre || 'Sin nombre',
          lugar: lugar || null,
          equipo: equipo || null,
          terminos_aceptados: true,
        },
      })

      if (updateError) {
        const msg = updateError.message.toLowerCase()
        if (msg.includes('invalid') || msg.includes('password')) {
          return NextResponse.json(
            { error: 'La contraseña no cumple con los requisitos de seguridad.' },
            { status: 400 }
          )
        }
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
    }

    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Sign-in error:', signInError.message)
    }

    const { error: upsertError } = await admin
      .from('perfiles')
      .upsert({
        id: resolvedUserId,
        nombre: nombre || 'Sin nombre',
        lugar: lugar || null,
        equipo: equipo || null,
        terminos_aceptados: true,
      })

    if (upsertError) {
      console.error('Perfil upsert error:', upsertError.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
