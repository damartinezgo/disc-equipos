import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Desarrollo de Líderes y Equipo</h1>
      <p className="text-gray-600">Encuesta de estilo de trabajo en equipo</p>
      <div className="flex gap-4">
        <Link href="/registro" className="rounded-full bg-black px-6 py-3 text-white">
          Comenzar encuesta
        </Link>
        <Link href="/login" className="rounded-full border px-6 py-3">
          Ya tengo cuenta
        </Link>
      </div>
    </main>
  )
}