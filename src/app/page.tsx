import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
      <img src="/logo-rizoma.svg" alt="Desarrollo de Líderes y Equipo" className="h-16 w-auto opacity-80" />
      <h1 className="text-3xl font-bold text-[#1F2937]">Desarrollo de Líderes y Equipo</h1>
      <p className="text-gray-600">Encuesta de estilo de trabajo en equipo</p>
      <div className="flex gap-4">
        <Link href="/registro" className="rounded-lg bg-[#1F4E79] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#173A5C]">
          Registrarse
        </Link>
        <Link href="/login" className="rounded-lg border border-[#1F4E79] px-6 py-3 text-sm font-medium text-[#1F4E79] transition hover:bg-[#1F4E79]/10">
          Ya tengo cuenta
        </Link>
      </div>
    </main>
  )
}