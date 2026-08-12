import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F8FAFC] to-white flex flex-col">
      {/* Header robusto y de ancho completo */}
      <header className="w-full border-b border-[#F1F5F9] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/">
            <img
              src="/logo-rizoma.svg"
              alt="Rizoma"
              className="h-12 w-auto cursor-pointer"
            />
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-[#1F4E79] px-5 py-2 text-sm font-medium text-[#1F4E79] transition-colors hover:bg-[#1F4E79] hover:text-white"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Hero Split */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center gap-12 px-6 pt-8 pb-16 md:flex-row md:items-center md:gap-16 md:pt-12 md:pb-24">
        {/* Columna Izquierda */}
        <div className="flex-1 space-y-6">
          <span className="inline-block rounded-full bg-[#FFF3EB] px-4 py-1.5 text-xs font-semibold tracking-wide text-[#C2410C]">
            Evaluación Ejecutiva
          </span>

          <h1 className="text-4xl font-bold leading-tight text-[#0F172A] md:text-5xl">
            Desarrollo de Líderes y Equipo
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-[#64748B]">
            Descubre tu estilo de comportamiento y optimiza la dinámica de trabajo de tu equipo con la metodología DISC.
          </p>

          <ul className="space-y-3 text-sm text-[#475569]">
            <li className="flex items-center gap-3">
              <span className="text-[#EA580C] font-bold text-lg leading-none">•</span>
              32 preguntas situacionales
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#EA580C] font-bold text-lg leading-none">•</span>
              Resultados confidenciales
            </li>
          </ul>

          <div className="flex items-center gap-4 pt-2">
            <Link
              href="/registro"
              className="rounded-lg bg-[#1F4E79] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#EA580C] hover:shadow-md"
            >
              Registrarse y comenzar →
            </Link>
          </div>
        </div>

        {/* Columna Derecha - Imagen limpia sobre el fondo */}
        <div className="flex flex-1 items-center justify-center">
          <img
            src="/pantalla-carga.png"
            alt="Modelo DISC"
            className="h-auto max-h-[460px] w-full max-w-md object-contain"
          />
        </div>
      </main>

      {/* Footer sutil */}
      <footer className="w-full border-t border-[#F1F5F9] py-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Rizoma · Desarrollo de Líderes y Equipo
      </footer>
    </div>
  )
}