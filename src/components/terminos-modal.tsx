'use client'

import { useEffect, useRef } from 'react'

export default function TerminosModal({
  onAccept,
  onClose,
  onVolver,
}: {
  onAccept: () => void
  onClose: () => void
  onVolver?: () => void
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
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-2 border-b border-[#1F4E79]/20 bg-[#1F4E79]/10 px-6 py-3">
          <img src="/logo-rizoma.svg" alt="Logo" className="h-6 w-auto" />
          <h2 className="text-lg font-bold text-[#1F4E79]">
            Aviso de Confidencialidad y Términos
          </h2>
        </div>

        <div className="max-h-[400px] space-y-4 px-6 py-4 text-sm text-gray-700 overflow-y-auto">
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
          <p className="mt-4 text-center italic text-gray-500">
            Al hacer clic en {'"Aceptar"'}, confirmas que has leído y entendido estos términos.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onVolver ?? onClose}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-lg bg-[#1F4E79] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#173A5C]"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
