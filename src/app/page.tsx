import Link from 'next/link'
import Image from 'next/image'
import { BarChart3 } from '@/lib/icons'

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-r from-white via-[#F8FAFC] to-white flex flex-col">
      {/* Header robusto y de ancho completo */}
      <header className="w-full border-b border-[#F1F5F9] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-rizoma.svg"
            alt="Rizoma"
            className="h-14 w-auto cursor-pointer"
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

        {/* Contenedor del Lado Derecho */}
        <div className="relative flex flex-1 items-center justify-center lg:justify-end">
          
          {/* 1. Fondo difuminado (Glow ambiental) */}
          <div className="absolute -inset-4 bg-linear-to-r from-orange-200/60 via-blue-200/50 to-purple-200/60 rounded-3xl blur-3xl opacity-70 -z-10"></div>

          {/* 2. Tarjeta contenedora de la Imagen */}
          <div className="relative bg-white p-3 md:p-4 rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full">
            
            {/* Badge Flotante Superior */}
            <div className="absolute -top-3 -left-3 bg-white border border-slate-200/80 shadow-md px-3 py-1.5 rounded-full flex items-center gap-2 z-10">
              <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse"></span>
              <span className="text-xs font-bold text-slate-700">Metodología DISC 7.0</span>
            </div>

            {/* Imagen integrada */}
            <div className="overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
            <Image 
              src="/pantalla-carga.png" 
              alt="Evaluación DISC Rizoma" 
              className="w-full h-auto object-cover"
              width={500}
              height={300}
            />
            </div>

            {/* Badge Flotante Inferior */}
            <div className="absolute -bottom-4 -right-3 bg-slate-900 text-white shadow-xl px-4 py-2 rounded-2xl flex items-center gap-2 z-10">
              <BarChart3 className="h-5 w-5" />
              <div className="text-left">
                <p className="text-[10px] text-slate-400 leading-none">Resultados</p>
                <p className="text-xs font-bold leading-tight">Instantáneos y Precisos</p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer sutil */}
      <footer className="w-full border-t border-[#F1F5F9] py-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Rizoma · Desarrollo de Líderes y Equipo
      </footer>
    </div>
  )
}