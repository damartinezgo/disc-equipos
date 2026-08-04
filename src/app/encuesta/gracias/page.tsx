export default function GraciasPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
      <div className="max-w-md rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#00843D]/10">
          <svg className="h-7 w-7 text-[#00843D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[#1F2937]">¡Encuesta completada!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Gracias por responder. Tu jefe o el equipo de gestión revisará los resultados
          para adaptar mejor la forma de trabajar contigo.
        </p>
      </div>
    </main>
  )
}
