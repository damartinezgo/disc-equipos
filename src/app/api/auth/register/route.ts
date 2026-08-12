import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { user_id, password, nombre, lugar, equipo, email } = await req.json()

    if (!user_id || !password || !email) {
      return NextResponse.json(
        { error: 'Se requiere user_id, password y email' },
        { status: 400 }
      )
    }

    const admin = createServiceClient()

    const { error: updateError } = await admin.auth.admin.updateUserById(user_id, {
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
        id: user_id,
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
