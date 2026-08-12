import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, code, purpose = 'signup' } = await req.json()

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

    if (purpose === 'recovery') {
      let page = 1
      const perPage = 100
      let userId: string | null = null

      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage })

        if (error) {
          console.error('OTP recovery user lookup error:', error)
          return NextResponse.json(
            { error: 'Error al verificar el correo electrónico' },
            { status: 500 }
          )
        }

        const users = data?.users ?? []
        const match = users.find(
          (u) => (u.email ?? '').toLowerCase() === email.toLowerCase()
        )

        if (match) {
          userId = match.id
          break
        }

        if (users.length < perPage) {
          break
        }

        page += 1
      }

      if (!userId) {
        return NextResponse.json(
          { error: 'No se encontró el usuario' },
          { status: 404 }
        )
      }

      return NextResponse.json({ ok: true, user_id: userId })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
