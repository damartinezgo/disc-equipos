export default function InstruccionesPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FA] px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <h1 className="text-2xl font-semibold text-[#1F2937]">
          Bienvenido(a) a la experiencia DISC
        </h1>
        <div className="mt-4 space-y-4 text-sm text-gray-700">
          <p>
            Este instrumento está orientado al desarrollo de líderes y equipos. No evalúa su
            desempeño ni sus capacidades; busca identificar tendencias en la manera en que asume
            sus retos laborales y las posibles oportunidades de desarrollo en este contexto.
          </p>
          <p>
            Encontrará una serie de preguntas con varias opciones de respuesta. No existen
            respuestas buenas o malas. En cada pregunta:
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Seleccione la opción que más refleja su forma habitual de actuar en el trabajo.</li>
            <li>Seleccione una opción diferente que menos refleje su forma habitual de actuar.</li>
            <li>Responda todas las preguntas, sin dejar ninguna sin contestar.</li>
          </ul>
          <p>
            Responda con sinceridad y de manera espontánea. Agradecemos su interés y disposición
            para participar en esta experiencia. Al finalizar, nuestro equipo de coaches se pondrá
            en contacto con usted para brindarle retroalimentación sobre sus resultados.
          </p>
        </div>
      </div>
    </main>
  )
}
