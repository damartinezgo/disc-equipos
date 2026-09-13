/* eslint-disable @typescript-eslint/no-explicit-any */

// Importamos la rúbrica como 'any' para evitar problemas de tipos con las claves acentuadas
import rubricaJson from './rubrica.json';
const rubricaData: any = rubricaJson;

export type DISC = "D" | "I" | "S" | "C";
export type RawScores = Record<DISC, number>;

export const DISC_LABELS: Record<DISC, string> = {
  D: 'Dominancia',
  I: 'Influencia',
  S: 'Estabilidad',
  C: 'Cumplimiento',
};

export const DISC_COLORS: Record<DISC, string> = {
  D: '#1E40AF',
  I: '#F59E0B',
  S: '#7C3AED',
  C: '#10B981',
};

export const SUBCATEGORY_LABELS = [
  "Orientación general de trabajo",
  "Toma de decisiones",
  "Comunicación",
  "Motivadores",
  "Delegación",
  "Acompañamiento, seguimiento y retroalimentación",
  "Manejo de conflicto",
  "Rol natural en el equipo",
] as const;

export type SubcategoryKey = (typeof SUBCATEGORY_LABELS)[number];

export type SubcategoryScores = Record<SubcategoryKey, RawScores>;

export interface UserResponses {
  [itemIndex: number]: {
    mas: "A" | "B" | "C" | "D";
    menos: "A" | "B" | "C" | "D";
  }
}

export interface CategoryFeedback {
  lecturaEjecutiva: string;
  comoGestionarlo: string;
  queEvitar: string;
  fortalezas: string;
  debilidades: string;
  riesgoACuidar: string;
  rolPalanca: string;
  efectoPotencial: string;
  prevencionVerificacion: string;
}

export interface ReportTexts {
  perfilTrabajo: CategoryFeedback & { nombreEstilo: string };
  motivacionCompromiso: CategoryFeedback;
  gestionDirecta: CategoryFeedback;
  dinamicaEquipo: CategoryFeedback;
  prevencionRiesgos: {
    riesgoPsicosocial: string;
    planAccion: string;
  };
}

/**
 * Calcula el puntaje global neto por cada dimensión DISC.
 * MÁS = +1, MENOS = -1, no seleccionada = 0.
 */
export function calculateRawScores(responses: UserResponses): RawScores {
  const scores: RawScores = { D: 0, I: 0, S: 0, C: 0 };

  const items: any[] = rubricaData.items_clave;
  items.forEach((item: any) => {
    const userRes = responses[item.Item];
    if (!userRes) return;

    // Las claves en el JSON son "DISC A", "DISC B", "DISC C", "DISC D"
    const masDiscKey = `DISC ${userRes.mas}`;
    const menosDiscKey = `DISC ${userRes.menos}`;

    const masDisc = item[masDiscKey] as DISC | undefined;
    const menosDisc = item[menosDiscKey] as DISC | undefined;

    if (masDisc && scores[masDisc] !== undefined) scores[masDisc] += 1;
    if (menosDisc && scores[menosDisc] !== undefined) scores[menosDisc] -= 1;
  });

  return scores;
}

/**
 * Calcula puntajes desglosados por cada uno de los 8 módulos/subcategorías.
 */
export function calculateSubcategoryScores(responses: UserResponses): SubcategoryScores {
  const subScores = {} as SubcategoryScores;
  for (const label of SUBCATEGORY_LABELS) {
    subScores[label] = { D: 0, I: 0, S: 0, C: 0 };
  }

  const items: any[] = rubricaData.items_clave;
  items.forEach((item: any) => {
    const userRes = responses[item.Item];
    if (!userRes) return;

    // El campo "Módulo" del JSON tiene el nombre del módulo (ej. "Orientación general de trabajo")
    const modulo = item["Módulo"] as SubcategoryKey | undefined;
    if (!modulo || !subScores[modulo]) return;

    const masDiscKey = `DISC ${userRes.mas}`;
    const menosDiscKey = `DISC ${userRes.menos}`;

    const masDisc = item[masDiscKey] as DISC | undefined;
    const menosDisc = item[menosDiscKey] as DISC | undefined;

    if (masDisc && subScores[modulo][masDisc] !== undefined) subScores[modulo][masDisc] += 1;
    if (menosDisc && subScores[modulo][menosDisc] !== undefined) subScores[modulo][menosDisc] -= 1;
  });

  return subScores;
}

/**
 * Determina la combinación de estilos predominantes (ej. "D/I", "S/C").
 * Retorna el par de las dos dimensiones con mayor puntaje.
 */
export function determineStyleCombination(scores: RawScores): string {
  const sorted = (Object.entries(scores) as [DISC, number][]).sort((a, b) => b[1] - a[1]);
  return `${sorted[0][0]}/${sorted[1][0]}`;
}

/**
 * Busca una entrada en retroalimentacion_combinaciones por estilo y categoría.
 * Usa normalización para manejar variantes de tildes/encoding.
 */
function findFeedbackEntry(combinacion: string, categoriaTarget: string): any | null {
  const fb: any[] = rubricaData.retroalimentacion_combinaciones;
  if (!fb) return null;

  // Normalizar para comparar
  const normalize = (s: string) => s.normalize('NFC').toLowerCase().trim();
  const targetNorm = normalize(categoriaTarget);
  const combiNorm = normalize(combinacion);

  return fb.find((item: any) => {
    const cat = item["Categoría"] || item["Categoria"] || "";
    const estilo = item["Estilo"] || "";
    return normalize(estilo) === combiNorm && normalize(cat) === targetNorm;
  }) || null;
}

/**
 * Extrae los textos de retroalimentación para la combinación de estilos dada.
 * Cruza con la tabla retroalimentacion_combinaciones del JSON.
 */
export function getReportFeedback(combinacion: string): ReportTexts {
  const perfil = findFeedbackEntry(combinacion, "Perfil de trabajo");
  const motivacion = findFeedbackEntry(combinacion, "Motivación y compromiso");
  const gestion = findFeedbackEntry(combinacion, "Gestión directa del jefe");
  const dinamica = findFeedbackEntry(combinacion, "Dinámica de equipo");

  const getCatFb = (cat: any): CategoryFeedback => ({
    lecturaEjecutiva: cat?.Lectura_para_el_jefe || "",
    comoGestionarlo: cat?.["Cómo_gestionarlo"] || cat?.["Como_gestionarlo"] || "",
    queEvitar: cat?.["Qué_evitar"] || cat?.["Que_evitar"] || "",
    fortalezas: cat?.Fortalezas_potenciales || "",
    debilidades: cat?.Debilidades_o_excesos || "",
    riesgoACuidar: cat?.Riesgo_a_cuidar || "",
    rolPalanca: cat?.Rol_o_palanca_sugerida || "",
    efectoPotencial: cat?.Efecto_potencial_en_el_equipo || "",
    prevencionVerificacion: cat?.["Prevención_y_verificación"] || cat?.["Prevencion_y_verificacion"] || "",
  });

  return {
    perfilTrabajo: {
      ...getCatFb(perfil),
      nombreEstilo: perfil?.Nombre_estilo || "Estilo no identificado",
    },
    motivacionCompromiso: getCatFb(motivacion),
    gestionDirecta: getCatFb(gestion),
    dinamicaEquipo: getCatFb(dinamica),
    prevencionRiesgos: {
      riesgoPsicosocial: dinamica?.Riesgo_psicosocial_condiciones_a_verificar || "",
      planAccion: dinamica?.["Prevención_y_verificación"] || dinamica?.["Prevencion_y_verificacion"] || "",
    },
  };
}

/**
 * Calcula el puntaje dominante neto de una subcategoría para usarse en el gráfico radar.
 * Retorna el puntaje máximo absoluto de la dimensión más fuerte en esa subcategoría.
 */
export function getSubcategoryDominantScore(subScores: SubcategoryScores): Record<SubcategoryKey, number> {
  const result = {} as Record<SubcategoryKey, number>;
  for (const label of SUBCATEGORY_LABELS) {
    const s = subScores[label];
    // El puntaje dominante de la subcategoría es el mayor valor de D/I/S/C
    result[label] = Math.max(s.D, s.I, s.S, s.C);
  }
  return result;
}

/** Clasifica la magnitud de un puntaje neto D/I/S/C para la lectura de la página de resultados. */
export function clasificarNivel(valor: number): 'alto' | 'moderado' | 'bajo' {
  const abs = Math.abs(valor);
  if (abs >= 5) return 'alto';
  if (abs >= 2) return 'moderado';
  return 'bajo';
}

export interface ConclusionTexts {
  conclusionIntegral: string;
  recomendacionesRiesgo: string;
  recomendacionesRiesgoBullets: { titulo: string; texto: string }[];
  compromisosDesarrollo: string;
}

/**
 * Construye los textos de la página de Conclusiones y Plan de Prevención, combinando
 * (sin duplicar) los textos ya diferenciados por categoría de retroalimentacion_combinaciones.
 */
export function buildConclusionTexts(
  combinacion: string,
  scores: RawScores,
  textos: ReportTexts
): ConclusionTexts {
  const [dom, sec] = combinacion.split('/') as [DISC, DISC];
  const nombreEstilo = textos.perfilTrabajo.nombreEstilo || combinacion;

  const cleanDot = (s: string) => s.replace(/\.{2,}/g, '.').replace(/\s*\.\s*$/, '').trim();

  const conclusionIntegral =
    `El perfil resultante ${combinacion} — ${nombreEstilo} — combina un estilo dominante en ${DISC_LABELS[dom]} ` +
    `(${scores[dom] > 0 ? '+' : ''}${scores[dom]}) con un componente secundario en ${DISC_LABELS[sec]} ` +
    `(${scores[sec] > 0 ? '+' : ''}${scores[sec]}). ${cleanDot(textos.perfilTrabajo.lecturaEjecutiva)}. ` +
    `En la práctica diaria, este balance entre ambas tendencias define tanto su forma preferida de aportar valor ` +
    `como los puntos que conviene observar para sostener un desempeño equilibrado en el tiempo.`;

  const recomendacionesRiesgoBullets = [
    {
      titulo: '1. Perfil de Trabajo',
      texto: `Efecto potencial: ${cleanDot(textos.perfilTrabajo.efectoPotencial)}.\nPrevención y verificación: ${cleanDot(textos.perfilTrabajo.prevencionVerificacion)}.`,
    },
    {
      titulo: '2. Motivación y Compromiso',
      texto: `Efecto potencial: ${cleanDot(textos.motivacionCompromiso.efectoPotencial)}.\nPrevención y verificación: ${cleanDot(textos.motivacionCompromiso.prevencionVerificacion)}.`,
    },
    {
      titulo: '3. Gestión Directa del Jefe',
      texto: `Efecto potencial: ${cleanDot(textos.gestionDirecta.efectoPotencial)}.\nPrevención y verificación: ${cleanDot(textos.gestionDirecta.prevencionVerificacion)}.`,
    },
    {
      titulo: '4. Dinámica de Equipo',
      texto: `Efecto potencial: ${cleanDot(textos.dinamicaEquipo.efectoPotencial)}.\nPrevención y verificación: ${cleanDot(textos.dinamicaEquipo.prevencionVerificacion)}.`,
    }
  ];

  const recomendacionesRiesgo =
    `Perfil de trabajo: ${cleanDot(textos.perfilTrabajo.efectoPotencial)}. ${cleanDot(textos.perfilTrabajo.prevencionVerificacion)}.\n` +
    `Motivación: ${cleanDot(textos.motivacionCompromiso.efectoPotencial)}. ${cleanDot(textos.motivacionCompromiso.prevencionVerificacion)}.\n` +
    `Gestión: ${cleanDot(textos.gestionDirecta.efectoPotencial)}. ${cleanDot(textos.gestionDirecta.prevencionVerificacion)}.\n` +
    `Equipo: ${cleanDot(textos.dinamicaEquipo.efectoPotencial)}. ${cleanDot(textos.dinamicaEquipo.prevencionVerificacion)}.`;

  const compromisosDesarrollo =
    `Se sugiere que la jefatura directa y la persona evaluada acuerden un espacio periódico de seguimiento para ` +
    `revisar avances, ajustar la forma de delegación y retroalimentación descrita en este informe, y verificar de ` +
    `manera conjunta las condiciones de riesgo psicosocial señaladas, en el marco del Programa de Prevención y ` +
    `Atención del Riesgo Psicosocial de la Procuraduría General de la Nación.`;

  return { conclusionIntegral, recomendacionesRiesgo, recomendacionesRiesgoBullets, compromisosDesarrollo };
}
