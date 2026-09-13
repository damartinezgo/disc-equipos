"use client";

import { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { RawScores, SubcategoryScores } from '@/lib/disc/discService';
import { DISC_COLORS, SUBCATEGORY_LABELS } from '@/lib/disc/discService';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

interface DISCChartsProps {
  scores: RawScores;
  subScores: SubcategoryScores;
  combinacion?: string;
  onChartsReady: (radarBase64: string) => void;
}

// Etiquetas cortas para el gráfico radar (sin truncar la información)
const RADAR_SHORT_LABELS = [
  "Orientación",
  "Decisiones",
  "Comunicación",
  "Motivadores",
  "Delegación",
  "Feedback",
  "Conflicto",
  "Rol natural",
];

/**
 * Renderiza el gráfico radar fuera de pantalla (invisible al usuario) únicamente para
 * capturarlo como imagen PNG y poder incrustarlo en el PDF del informe.
 * El gráfico de barras D/I/S/C se dibuja nativamente en el PDF
 * (ver DISCPdfReport.tsx) para garantizar que coincide exactamente con la tabla de puntajes.
 */
export function DISCChartsOffscreen({ scores, subScores, combinacion, onChartsReady }: DISCChartsProps) {
  const radarChartRef = useRef<ChartJS<'radar'> | null>(null);
  const hasEmitted = useRef(false);

  useEffect(() => {
    if (hasEmitted.current) return;

    const timer = setTimeout(() => {
      if (radarChartRef.current && !hasEmitted.current) {
        hasEmitted.current = true;
        const radarBase64 = radarChartRef.current.toBase64Image('image/png', 1);
        onChartsReady(radarBase64);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [scores, subScores, onChartsReady]);

  /* ─── Gráfico Radar por Subcategorías ─── */
  const dominantDims = combinacion ? combinacion.split('/') : [];

  const createRadarDataset = (label: string, dim: 'D' | 'I' | 'S' | 'C', color: string) => {
    const data = SUBCATEGORY_LABELS.map(key => subScores[key]?.[dim] ?? 0);
    const isDominant = dominantDims.includes(dim);

    // Regla visual: si supera 50% del max (4), marcar con punto grande
    const MAX_PER_SUB = 4;
    const threshold = MAX_PER_SUB * 0.5; // 2

    // Polígonos dominantes resaltados con trazo grueso y opacidad destacada;
    // no dominantes con fill-opacity: 0.15 y trazo fino sutil.
    const pointRadii = data.map(val => {
      if (isDominant) return val > threshold ? 7 : 4;
      return val > threshold ? 3.5 : 2;
    });

    const pointStyles = data.map(val => (val > threshold ? 'triangle' : 'circle'));

    return {
      label: isDominant ? `${label} (Dominante)` : label,
      data,
      backgroundColor: isDominant ? `${color}4D` : `${color}20`, // ~0.30 vs ~0.13 (fill-opacity 0.15)
      borderColor: isDominant ? color : `${color}88`,
      borderWidth: isDominant ? 3.5 : 1.2,
      pointBackgroundColor: isDominant ? color : `${color}66`,
      pointBorderColor: '#fff',
      pointRadius: pointRadii,
      pointStyle: pointStyles,
      fill: true,
      order: isDominant ? 1 : 2, // Dominantes dibujados encima
    };
  };

  const radarData = {
    labels: RADAR_SHORT_LABELS,
    datasets: [
      createRadarDataset('Dominancia', 'D', DISC_COLORS.D),
      createRadarDataset('Influencia', 'I', DISC_COLORS.I),
      createRadarDataset('Estabilidad', 'S', DISC_COLORS.S),
      createRadarDataset('Cumplimiento', 'C', DISC_COLORS.C),
    ],
  };

  const radarOptions = {
    responsive: false,
    animation: false as const,
    scales: {
      r: {
        beginAtZero: false,
        min: -4,
        max: 4,
        ticks: {
          stepSize: 2,
          color: '#64748B',
          backdropColor: 'transparent',
          font: { size: 9 },
        },
        grid: { color: '#CBD5E1' },
        pointLabels: {
          color: '#334155',
          font: { size: 10, weight: 'bold' as const },
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#334155',
          font: { size: 10 },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
        },
      },
      title: {
        display: true,
        text: 'Desglose por Subcategorías',
        color: '#0F172A',
        font: { size: 14, weight: 'bold' as const },
      },
    },
  };

  return (
    <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
      <Radar ref={radarChartRef} data={radarData} options={radarOptions} width={560} height={520} />
    </div>
  );
}

/**
 * Renderiza un gráfico radar fuera de pantalla sincrónicamente mediante un canvas virtual
 * y retorna su imagen PNG en formato Base64.
 * Ideal para generación de reportes por lote / ZIP sin necesidad de montar componentes React.
 */
export function renderRadarChartBase64(
  scores: RawScores,
  subScores: SubcategoryScores,
  combinacion?: string
): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 560;

    const dominantDims = combinacion ? combinacion.split('/') : [];
    const createRadarDataset = (label: string, dim: 'D' | 'I' | 'S' | 'C', color: string) => {
      const data = SUBCATEGORY_LABELS.map(key => subScores[key]?.[dim] ?? 0);
      const isDominant = dominantDims.includes(dim);
      const MAX_PER_SUB = 4;
      const threshold = MAX_PER_SUB * 0.5;

      const pointRadii = data.map(val => (isDominant ? (val > threshold ? 7 : 4) : (val > threshold ? 2 : 1)));
      const pointStyles = data.map(val => (val > threshold ? 'triangle' : 'circle'));

      return {
        label: isDominant ? `${label} (Dominante)` : label,
        data,
        backgroundColor: isDominant ? `${color}4D` : `${color}10`,
        borderColor: isDominant ? color : `${color}40`,
        borderWidth: isDominant ? 3.5 : 0.5,
        pointBackgroundColor: isDominant ? color : `${color}30`,
        pointBorderColor: isDominant ? '#fff' : 'transparent',
        pointRadius: pointRadii,
        pointStyle: pointStyles,
        fill: true,
        order: isDominant ? 1 : 2,
      };
    };

    const radarData = {
      labels: RADAR_SHORT_LABELS,
      datasets: [
        createRadarDataset('Dominancia', 'D', DISC_COLORS.D),
        createRadarDataset('Influencia', 'I', DISC_COLORS.I),
        createRadarDataset('Estabilidad', 'S', DISC_COLORS.S),
        createRadarDataset('Cumplimiento', 'C', DISC_COLORS.C),
      ],
    };

    const chart = new ChartJS(canvas, {
      type: 'radar',
      data: radarData,
      options: {
        responsive: false,
        animation: false,
        scales: {
          r: {
            beginAtZero: false,
            min: -4,
            max: 4,
            ticks: {
              stepSize: 2,
              color: '#64748B',
              backdropColor: 'transparent',
              font: { size: 9 },
            },
            grid: { color: '#CBD5E1' },
            pointLabels: {
              color: '#334155',
              font: { size: 10, weight: 'bold' as const },
            },
          },
        },
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              color: '#334155',
              font: { size: 10 },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 12,
            },
          },
          title: {
            display: true,
            text: 'Desglose por Subcategorías',
            color: '#0F172A',
            font: { size: 14, weight: 'bold' as const },
          },
        },
      },
    });

    const base64 = chart.toBase64Image('image/png', 1);
    chart.destroy();
    return base64;
  } catch (err) {
    console.error('Error renderizando radar off-screen:', err);
    return '';
  }
}
