'use client'

import { useEffect, useRef } from 'react'
import { X } from '@/lib/icons'

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
        className="relative w-full max-w-4xl rounded-2xl bg-white shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative flex items-center justify-center border-b border-gray-200 bg-[#1F4E79]/10 px-6 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-rizoma.svg" alt="Logo" className="absolute left-6 h-8 w-auto" />
          <h2 className="text-lg font-bold text-[#1F4E79]">Instrucciones DISC</h2>
        </div>

        <div className="flex flex-col md:flex-row max-h-[600px] overflow-y-auto">
          <div className="w-full md:w-1/2 space-y-4 px-6 py-4 text-sm text-gray-700">
            <p>
              Este instrumento está orientado al desarrollo de líderes y equipos. No evalúa su
              desempeño ni sus capacidades; busca identificar tendencias en la manera en que asume
              sus retos laborales y las posibles oportunidades de desarrollo en este contexto.
            </p>
            <p>Encontrará una serie de preguntas con varias opciones de respuesta. No existen respuestas buenas o malas. En cada pregunta:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Paso 1: Haz clic en <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">MÁS (+)</span> para la conducta más afín.</li>
              <li>Paso 2: Haz clic en <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">MENOS (-)</span> para la conducta menos afín.</li>
              <li>Responda todas las preguntas, sin dejar ninguna sin contestar.</li>
            </ul>
            <p>
              Responda con sinceridad y de manera espontánea. Agradecemos su interés y disposición
              para participar en esta experiencia. Al finalizar, nuestro equipo de coaches se pondrá
              en contacto con usted para brindarle retroalimentación sobre sus resultados.
            </p>
          </div>
          <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-gray-50 border-l border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pantalla-carga.png" alt="Modelo DISC" className="max-w-full h-auto rounded-xl shadow-sm object-contain" />
          </div>
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
