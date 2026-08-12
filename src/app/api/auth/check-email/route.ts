import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere el correo electrónico' },
        { status: 400 }
      )
    }

    const admin = createServiceClient()

    const { data: { users }, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const exists = users.some((u) => u.email?.toLowerCase() === email.toLowerCase())

    return NextResponse.json({ exists })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
