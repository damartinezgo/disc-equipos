'use client'

import { useState } from 'react'

export default function TerminosModal({
  onAccept,
  yaAceptado = false,
}: {
  onAccept: () => void
  yaAceptado?: boolean
}) {
  const [acepta, setAcepta] = useState(false)

  if (yaAceptado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-[#1F2937]">
            Términos y condiciones
          </h2>
          <div className="mt-4 space-y-4 text-sm text-gray-700">
            <p>
              Este instrumento está orientado al desarrollo de líderes y equipos. No evalúa su
              desempeño ni sus capacidades; busca identificar tendencias en la manera en que asume
              sus retos laborales y las posibles oportunidades de desarrollo en este contexto.
            </p>
            <p>
              Al participar, usted acepta que sus respuestas serán utilizadas con fines de
              desarrollo organizacional, manteniendo la confidencialidad de sus resultados.
            </p>
            <p>
              No existen respuestas buenas ni malas. Responda con sinceridad y de manera
              espontánea. Al finalizar, nuestro equipo de coaches se pondrá en contacto con usted
              para brindarle retroalimentación sobre sus resultados.
            </p>
            <p className="font-medium text-[#1F4E79]">
              Usted ya aceptó estos términos y condiciones.
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onAccept}
              className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C]"
            >
              Volver
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
          Términos y condiciones
        </h2>
        <div className="mt-4 space-y-4 text-sm text-gray-700">
          <p>
            Este instrumento está orientado al desarrollo de líderes y equipos. No evalúa su
            desempeño ni sus capacidades; busca identificar tendencias en la manera en que asume
            sus retos laborales y las posibles oportunidades de desarrollo en este contexto.
          </p>
          <p>
            Al participar, usted acepta que sus respuestas serán utilizadas con fines de
            desarrollo organizacional, manteniendo la confidencialidad de sus resultados.
          </p>
          <p>
            No existen respuestas buenas ni malas. Responda con sinceridad y de manera
            espontánea. Al finalizar, nuestro equipo de coaches se pondrá en contacto con usted
            para brindarle retroalimentación sobre sus resultados.
          </p>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#1F4E79] focus:ring-[#1F4E79]"
            />
            Acepto los términos y condiciones
          </label>
          <button
            onClick={onAccept}
            disabled={!acepta}
            className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
