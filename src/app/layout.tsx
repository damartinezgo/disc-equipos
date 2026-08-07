import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Desarrollo de Líderes y Equipo",
  description: "Evaluación de Desarrollo de Líderes y Equipo",
  icons: {
    icon: "/logo-rizoma.svg",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let nombre: string | null = null
  if (user) {
    const { data: perfilData } = await supabase
      .from('perfiles')
      .select('nombre')
      .eq('id', user.id)
      .maybeSingle()
    nombre = perfilData?.nombre ?? null
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {user && <Navbar user={user} nombre={nombre} />}
        {children}
      </body>
    </html>
  )
}
