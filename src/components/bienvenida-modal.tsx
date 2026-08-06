'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BienvenidaModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false)

  if (mostrarInstrucciones) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-[#1F2937]">
            Bienvenido(a) a la experiencia DISC
          </h2>
          <div className="mt-4 space-y-4 text-sm text-gray-700">
            <p>
              Este instrumento está orientado al desarrollo de líderes y equipos. No evalúa su
              desempeño ni sus capacidades; busca identificar tendencias en la manera en que asume
              sus retos laborales y las posibles oportunidades de desarrollo en este contexto.
            </p>
            <p>Encontrará una serie de preguntas con varias opciones de respuesta. No existen respuestas buenas o malas. En cada pregunta:</p>
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
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setMostrarInstrucciones(false)}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Volver
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C]"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-semibold text-[#1F2937]">
          Bienvenido(a) a la experiencia DISC
        </h2>
        <div className="mt-4 space-y-4 text-sm text-gray-700">
          <p>
            Este instrumento está orientado al desarrollo de líderes y equipos. No evalúa su
            desempeño ni sus capacidades; busca identificar tendencias en la manera en que asume
            sus retos laborales y las posibles oportunidades de desarrollo en este contexto.
          </p>
          <p>Encontrará una serie de preguntas con varias opciones de respuesta. No existen respuestas buenas o malas. En cada pregunta:</p>
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
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setMostrarInstrucciones(true)}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Ver instrucciones
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

