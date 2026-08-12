import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Se requiere correo y código' },
        { status: 400 }
      )
    }

    const admin = createServiceClient()

    const now = new Date().toISOString()

    const { data: codes, error: fetchError } = await admin
      .from('otp_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      return NextResponse.json(
        { error: 'Error al verificar el código' },
        { status: 500 }
      )
    }

    if (!codes || codes.length === 0) {
      return NextResponse.json(
        { error: 'Código inválido o expirado. Verificá el código e intentá de nuevo.' },
        { status: 400 }
      )
    }

    const { error: updateError } = await admin
      .from('otp_codes')
      .update({ used: true })
      .eq('id', codes[0].id)

    if (updateError) {
      console.error('OTP mark used error:', updateError.message)
    }

    let userId: string | null = null

    try {
      const { data, error: createUserError } = await admin.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: true,
        user_metadata: {
          nombre: 'Sin nombre',
          terminos_aceptados: true,
        },
      })

      if (createUserError && !createUserError.message?.includes('already')) {
        return NextResponse.json(
          { error: createUserError.message },
          { status: 400 }
        )
      }

      if (data?.user?.id) {
        userId = data.user.id
      } else {
        const { data: listData } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 100,
        })
        if (listData?.users) {
          const existingUser = listData.users.find(
            (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase()
          )
          if (existingUser) {
            userId = existingUser.id
          }
        }
      }
    } catch {
      return NextResponse.json(
        { error: 'Error al crear el usuario' },
        { status: 500 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, user_id: userId })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
