import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { user_id, password } = await req.json()

    if (!user_id || !password) {
      return NextResponse.json(
        { error: 'Se requiere user_id y password' },
        { status: 400 }
      )
    }

    const admin = createServiceClient()

    const { error: updateError } = await admin.auth.admin.updateUserById(user_id, {
      password,
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

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
