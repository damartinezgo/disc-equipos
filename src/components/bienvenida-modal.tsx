'use client'

import { useEffect, useRef } from 'react'

export default function BienvenidaModal({
  onAccept,
  onClose,
}: {
  onAccept: () => void
  onClose: () => void
}) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    function handleOverlayClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleOverlayClick)
    return () => document.removeEventListener('mousedown', handleOverlayClick)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen min-w-screen items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 border-b border-gray-200 bg-[#1F4E79]/10 px-6 py-3">
          <img src="/logo-rizoma.svg" alt="Logo" className="h-6 w-auto" />
          <h2 className="text-lg font-bold text-[#1F4E79]">Instrucciones DISC</h2>
        </div>

        <div className="max-h-[400px] space-y-4 px-6 py-4 text-sm text-gray-700 overflow-y-auto">
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

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onAccept}
            className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
