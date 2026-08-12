import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createServiceClient } from "@/lib/supabase/server";

const EMAIL_FROM = process.env.SMTP_FROM_EMAIL || "no-reply@disc-equipos.com";
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export async function POST(req: NextRequest) {
  try {
    const { email, purpose = "signup" } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Se requiere el correo electrónico" },
        { status: 400 },
      );
    }

    const admin = createServiceClient();

    // Verify email is not already registered
    const {
      data: { users },
      error: listError,
    } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (listError) {
      return NextResponse.json(
        { error: "Error al verificar usuarios" },
        { status: 500 },
      );
    }

    const emailLower = email.toLowerCase();
    const exists = users.some((u) => u.email?.toLowerCase() === emailLower);

    if (purpose === "recovery") {
      if (!exists) {
        return NextResponse.json(
          { error: "No existe una cuenta con ese correo. Registrate primero." },
          { status: 409 },
        );
      }
    } else {
      if (exists) {
        return NextResponse.json(
          { error: "Este correo ya está registrado. Intenta iniciar sesión." },
          { status: 409 },
        );
      }
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code in database (clean up old codes for this email first)
    const { error: cleanupError } = await admin
      .from("otp_codes")
      .delete()
      .eq("email", emailLower);

    if (cleanupError) {
      console.error("OTP cleanup error:", cleanupError.message);
    }

    const { error: insertError } = await admin.from("otp_codes").insert({
      email: emailLower,
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Error al generar el código" },
        { status: 500 },
      );
    }

    // Send email
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      const subject =
        purpose === "recovery"
          ? "Recupera tu contraseña - Desarrollo de Líderes y Equipo"
          : "Tu código de verificación - Desarrollo de Líderes y Equipo";

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://tvzjxqihzsxpgrqfhlcl.supabase.co/storage/v1/object/public/public/logo-rizoma.png" alt="Logo" style="max-height: 60px;" />
          </div>
          <h1 style="color: #1F4E79; font-size: 24px; margin-bottom: 16px;">Tu código de verificación</h1>
          <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
            ${
              purpose === "recovery"
                ? "Ingresa el siguiente código de 6 dígitos para restablecer tu contraseña:"
                : "Ingresa el siguiente código de 6 dígitos para completar tu registro:"
            }
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1F4E79; background: #F3F4F6; padding: 16px 32px; border-radius: 8px;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #6B7280; margin-bottom: 20px;">
            Este código expira en 10 minutos.
          </p>
          <p style="font-size: 12px; color: #9CA3AF;">
            Estás recibiendo este email porque ${
              purpose === "recovery"
                ? "solicitaste restablecer tu contraseña en Desarrollo de Líderes y Equipo."
                : "te registraste en Desarrollo de Líderes y Equipo."
            }
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject,
        html: htmlContent,
      });
    }

    return NextResponse.json({ ok: true, message: "Código enviado" });
  } catch (err) {
    console.error("OTP send error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
