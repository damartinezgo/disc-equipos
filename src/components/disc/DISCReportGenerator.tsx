"use client";

import { useState, useCallback } from 'react';
import {
  calculateRawScores,
  calculateSubcategoryScores,
  determineStyleCombination,
  getReportFeedback,
} from '@/lib/disc/discService';
import type { UserResponses, ReportTexts, RawScores, SubcategoryScores } from '@/lib/disc/discService';
import { DISCChartsOffscreen } from './DISCCharts';
import { generateDISCPdf } from './DISCPdfReport';

interface DISCReportGeneratorProps {
  evaluado: { nombre: string; cargo: string; fecha: string; cedula?: string; correo?: string; dependencia?: string; departamento?: string; telefono?: string };
  responses: UserResponses;
  variant?: 'full' | 'button';
}

export function DISCReportGenerator({ evaluado, responses, variant = 'full' }: DISCReportGeneratorProps) {
  const [chartsReady, setChartsReady] = useState(false);
  const [radarBase64, setRadarBase64] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Derived data
  const rawScores: RawScores = calculateRawScores(responses);
  const subScores: SubcategoryScores = calculateSubcategoryScores(responses);
  const combinacion = determineStyleCombination(rawScores);
  const textos: ReportTexts = getReportFeedback(combinacion);

  const handleChartsReady = useCallback((radBase64: string) => {
    setRadarBase64(radBase64);
    setChartsReady(true);
  }, []);

  const handleDownload = async () => {
    if (!chartsReady || isGenerating) return;
    setIsGenerating(true);
    try {
      await generateDISCPdf(
        evaluado,
        textos,
        combinacion,
        rawScores,
        subScores,
        radarBase64,
        responses
      );
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Ocurrió un error al generar el informe. Por favor intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasResponses = Object.keys(responses).length > 0;

  // ── Compact icon-button variant (for embedding in headers) ──
  if (variant === 'button') {
    if (!hasResponses) return null;

    return (
      <span className="relative inline-flex items-center">
        {/* Hidden off-screen chart renderer — needed for PDF generation */}
        <DISCChartsOffscreen
          scores={rawScores}
          subScores={subScores}
          combinacion={combinacion}
          onChartsReady={handleChartsReady}
        />
        <button
          onClick={handleDownload}
          disabled={!chartsReady || isGenerating}
          title={chartsReady ? 'Descargar Informe PDF' : 'Preparando informe…'}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200
            ${chartsReady && !isGenerating
              ? 'bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] text-white border-blue-300 hover:shadow-md hover:from-[#1E3A8A] hover:to-[#2563EB] cursor-pointer'
              : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
            }`}
        >
          {isGenerating ? (
            <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </button>
      </span>
    );
  }

  // ── Full panel variant (default) ──
  if (!hasResponses) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <p className="text-amber-800 font-semibold">No hay respuestas registradas</p>
        <p className="text-amber-600 text-sm mt-1">Este usuario aún no ha completado la evaluación DISC.</p>
      </div>
    );
  }

  const dimColors: Record<string, string> = { D: '#1E40AF', I: '#F59E0B', S: '#7C3AED', C: '#10B981' };
  const dimLabels: Record<string, string> = { D: 'Dominancia', I: 'Influencia', S: 'Estabilidad', C: 'Cumplimiento' };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E40AF] p-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generador de Informe Individual DISC
        </h3>
        <p className="text-blue-200 text-sm mt-1">
          Perfil:{' '}
          <span className="font-bold text-white">{combinacion}</span>
          {textos.perfilTrabajo.nombreEstilo ? ` — ${textos.perfilTrabajo.nombreEstilo}` : ''}
        </p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-4 gap-px bg-slate-100">
        {(['D', 'I', 'S', 'C'] as const).map(dim => (
          <div key={dim} className="bg-white p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: dimColors[dim] }}>
              {rawScores[dim] > 0 ? `+${rawScores[dim]}` : rawScores[dim]}
            </div>
            <div className="text-xs text-slate-500 mt-1">{dimLabels[dim]}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="p-6 flex flex-col items-center gap-4">
        {!chartsReady && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <svg className="animate-spin h-4 w-4 text-blue-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Procesando gráficos, por favor espera...
          </div>
        )}

        {/* Off-screen chart renderer */}
        <DISCChartsOffscreen
          scores={rawScores}
          subScores={subScores}
          combinacion={combinacion}
          onChartsReady={handleChartsReady}
        />

        <button
          onClick={handleDownload}
          disabled={!chartsReady || isGenerating}
          className={`inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold text-sm shadow-md transition-all duration-200
            ${chartsReady && !isGenerating
              ? 'bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white hover:shadow-lg hover:from-[#1E3A8A] hover:to-[#2563EB] cursor-pointer'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generando PDF...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {chartsReady ? 'Descargar Informe en PDF' : 'Preparando informe...'}
            </>
          )}
        </button>

        <p className="text-xs text-slate-400 text-center max-w-md">
          El informe incluye 5 páginas: portada institucional, marco metodológico del modelo DISC, resultados y visualización (tabla, barras y radar), perfil operativo con 4 recomendaciones ejecutivas, y conclusiones con plan de prevención de riesgo psicosocial.
        </p>
      </div>
    </div>
  );
}
