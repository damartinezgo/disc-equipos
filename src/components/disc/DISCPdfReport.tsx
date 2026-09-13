/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * generateDISCPdf
 * Genera el informe individual DISC en PDF usando jsPDF (100% client-side, compatible con Turbopack / Next.js 16).
 * Estructura fija de 5 páginas institucionales (Procuraduría General de la Nación):
 *   1. Portada institucional (banda azul oscuro + logo Rizoma + ficha evaluado 2 col + alcance confidencial)
 *   2. Descripción general y marco conceptual del modelo DISC (brújula limpia con ejes normalizados sin caracteres extraños)
 *   3. Resultados y visualización (tabla con escala balanceada -8 a +8 + barras divergentes + lectura completa + radar)
 *   4. Perfil operativo y recomendaciones (4 tarjetas ejecutivas según rúbrica, sintaxis limpia sin dobles puntos)
 *   5. Conclusiones y Plan de Prevención del Riesgo Psicosocial (formato viñetas ejecutivas, exactamente 5 páginas)
 */
import type { ReportTexts, RawScores, UserResponses, SubcategoryScores } from "@/lib/disc/discService";
import { SUBCATEGORY_LABELS, DISC_LABELS, DISC_COLORS, clasificarNivel, buildConclusionTexts, getSubcategoryDominantScore } from "@/lib/disc/discService";
import itemsData from "@/data/items-disc.json";

const COLORS = {
  headerBg: "#1A365D",
  headerAccent: "#38BDF8",
  white: "#FFFFFF",
  primary: "#0F172A",
  textDark: "#1E293B",
  textMed: "#475569",
  textLight: "#64748B",
  sectionBar: "#38BDF8",
  bgLight: "#F8FAFC",
  cardBorder: "#CBD5E1",
  boxBg: "#EFF6FF",
  boxBorder: "#3B82F6",
  warningBg: "#FEF3C7",
  warningBorder: "#F59E0B",
  dangerBg: "#FEE2E2",
  dangerBorder: "#EF4444",
  D: "#1E40AF",
  I: "#F59E0B",
  S: "#7C3AED",
  C: "#10B981",
};

const TOTAL_PAGES = 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Limpia cualquier doble punto o puntuación redundante en los textos. */
function sanitizeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\.{2,}/g, ".")
    .replace(/\s+\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function hexToRgb(hex: string): [number, number, number] {
  if (!hex || !hex.startsWith("#")) return [0, 0, 0];
  const clean = hex.replace("#", "");
  if (clean.length < 6) return [0, 0, 0];
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return [0, 0, 0];
  return [r, g, b];
}

function setFill(doc: any, hex: string) {
  doc.setFillColor(...hexToRgb(hex));
}
function setTextColor(doc: any, hex: string) {
  doc.setTextColor(...hexToRgb(hex));
}
function setDrawColor(doc: any, hex: string) {
  doc.setDrawColor(...hexToRgb(hex));
}

const PW = 210; // A4 width in mm
const PH = 297; // A4 height in mm
const ML = 20; // margin left
const MR = 20; // margin right
const CONTENT_W = PW - ML - MR; // 170mm
const BOTTOM_LIMIT = PH - 16; // 281mm

/** Convierte la imagen pública /logo-rizoma.png a un data URL base64 para incrustarla en el PDF. */
async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/logo-rizoma.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Dibuja texto con auto-wrap. Corta si se pasa del límite inferior de la página. */
function drawWrappedText(
  doc: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  if (!text) return y;
  const clean = sanitizeText(text);
  const lines: string[] = doc.splitTextToSize(clean, maxWidth);
  for (const line of lines) {
    if (y > BOTTOM_LIMIT) break;
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

function drawPageTitle(doc: any, title: string, y: number): number {
  setTextColor(doc, COLORS.primary);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, ML, y);
  setDrawColor(doc, COLORS.sectionBar);
  doc.setLineWidth(1.5);
  doc.line(ML, y + 3, PW - MR, y + 3);
  return y + 12;
}

function drawSectionHeader(doc: any, title: string, y: number, fontSize = 10): number {
  setFill(doc, "#F1F5F9");
  doc.rect(ML - 2, y - 4.5, CONTENT_W + 4, 7, "F");
  setFill(doc, COLORS.sectionBar);
  doc.rect(ML - 2, y - 4.5, 2.5, 7, "F");

  setTextColor(doc, COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  doc.text(title, ML + 3, y);
  doc.setFont("helvetica", "normal");
  return y + 6;
}

function drawInfoBox(
  doc: any,
  text: string,
  y: number,
  bgHex: string,
  borderHex: string,
  fontSize = 8
): number {
  if (!text) return y;
  const clean = sanitizeText(text);
  const lines: string[] = doc.splitTextToSize(clean, CONTENT_W - 8);
  const lineHeight = fontSize * 0.42;
  const boxH = lines.length * lineHeight + 5;
  setFill(doc, bgHex);
  doc.rect(ML, y, CONTENT_W, boxH, "F");
  setDrawColor(doc, borderHex);
  doc.setLineWidth(0.5);
  doc.rect(ML, y, 2.5, boxH, "F");
  setTextColor(doc, COLORS.textDark);
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
  lines.forEach((line: string, i: number) => {
    doc.text(line, ML + 5, y + 4 + i * lineHeight);
  });
  return y + boxH + 3;
}

/** Dibuja un cuadro con viñetas estructuradas ejecutivas (bullet points). */
function drawBulletBox(
  doc: any,
  bullets: { titulo: string; texto: string }[],
  y: number,
  bgHex: string,
  borderHex: string,
  accentHex: string
): number {
  const innerW = CONTENT_W - 14;
  const lineH = 3.6;

  // Medir altura total requerida
  const parsedBullets = bullets.map((b) => {
    const cleanT = sanitizeText(b.texto);
    const lines: string[] = doc.splitTextToSize(cleanT, innerW);
    return { titulo: b.titulo, lines };
  });

  let totalContentH = 6;
  parsedBullets.forEach((pb) => {
    totalContentH += 4 + pb.lines.length * lineH + 2.5;
  });

  // Contenedor
  setFill(doc, bgHex);
  doc.roundedRect(ML, y, CONTENT_W, totalContentH, 2.5, 2.5, "F");
  setDrawColor(doc, borderHex);
  doc.setLineWidth(0.4);
  doc.roundedRect(ML, y, CONTENT_W, totalContentH, 2.5, 2.5, "S");
  setFill(doc, accentHex);
  doc.rect(ML, y, 2.5, totalContentH, "F");

  let curY = y + 5;
  parsedBullets.forEach((pb) => {
    // Bullet dot
    setFill(doc, accentHex);
    doc.circle(ML + 5.5, curY - 1, 1.1, "F");

    // Título de la viñeta
    setTextColor(doc, "#0F172A");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(pb.titulo, ML + 9, curY);
    curY += 3.8;

    // Cuerpo de la viñeta
    setTextColor(doc, COLORS.textMed);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    pb.lines.forEach((ln: string) => {
      doc.text(ln, ML + 9, curY);
      curY += lineH;
    });
    curY += 2;
  });

  return y + totalContentH + 4;
}

function drawFooter(doc: any, nombre: string, pageNum: number, totalPages: number = TOTAL_PAGES) {
  setDrawColor(doc, "#E2E8F0");
  doc.setLineWidth(0.3);
  doc.line(ML, PH - 12, PW - MR, PH - 12);
  setTextColor(doc, COLORS.textLight);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Informe Individual DISC — ${nombre} — Confidencial`, ML, PH - 7);
  doc.text(`Página ${pageNum} de ${totalPages}`, PW - MR, PH - 7, { align: "right" });
}

const DISC_KEYS: (keyof RawScores)[] = ["D", "I", "S", "C"];

/**
 * Dibuja la tabla cuantitativa D/I/S/C con barras horizontales divergentes nativas
 * sobre una escala balanceada de -8 a +8.
 * Las barras negativas se proyectan claramente hacia la izquierda del eje neutro 0,
 * y las positivas hacia la derecha.
 */
function drawScoreTable(doc: any, scores: RawScores, y: number): number {
  const maxAbs = Math.max(8, ...DISC_KEYS.map((k) => Math.abs(scores[k])));
  const labelW = 44;
  const valueW = 14;
  const barAreaX = ML + labelW;
  const barAreaW = CONTENT_W - labelW - valueW;
  const barAreaMid = barAreaX + barAreaW / 2;
  const rowH = 10.5;

  // ── Encabezado de escala balanceada (-8 a +8) ──
  setTextColor(doc, "#94A3B8");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);

  doc.text("-8", barAreaX, y - 1.5, { align: "center" });
  doc.text("-4", barAreaX + barAreaW * 0.25, y - 1.5, { align: "center" });
  setTextColor(doc, "#475569");
  doc.text("0 (neutro)", barAreaMid, y - 1.5, { align: "center" });
  setTextColor(doc, "#94A3B8");
  doc.text("+4", barAreaX + barAreaW * 0.75, y - 1.5, { align: "center" });
  doc.text("+8", barAreaX + barAreaW, y - 1.5, { align: "center" });

  y += 2;

  DISC_KEYS.forEach((key) => {
    const color = DISC_COLORS[key];
    const value = scores[key];

    // Etiqueta de la dimensión
    setTextColor(doc, COLORS.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${DISC_LABELS[key]} (${key})`, ML, y + 4.8);

    // Fondo gris suave del track completo
    setFill(doc, "#F1F5F9");
    doc.rect(barAreaX, y + 1.2, barAreaW, 5.8, "F");
    setDrawColor(doc, "#E2E8F0");
    doc.setLineWidth(0.3);
    doc.rect(barAreaX, y + 1.2, barAreaW, 5.8, "S");

    // Eje central 0 (neutro)
    setDrawColor(doc, "#64748B");
    doc.setLineWidth(0.6);
    doc.line(barAreaMid, y + 0.5, barAreaMid, y + 7.7);

    // Ticks tenues de -4 y +4
    setDrawColor(doc, "#CBD5E1");
    doc.setLineWidth(0.3);
    doc.line(barAreaX + barAreaW * 0.25, y + 1.2, barAreaX + barAreaW * 0.25, y + 7.0);
    doc.line(barAreaX + barAreaW * 0.75, y + 1.2, barAreaX + barAreaW * 0.75, y + 7.0);

    const halfW = barAreaW / 2;
    const barLen = Math.min(halfW, (Math.abs(value) / maxAbs) * halfW);

    if (value > 0) {
      // Barra POSITIVA hacia la DERECHA
      setFill(doc, color);
      doc.rect(barAreaMid, y + 1.2, barLen, 5.8, "F");
    } else if (value < 0) {
      // Barra NEGATIVA hacia la IZQUIERDA (con color diferenciado y trazo nítido)
      setFill(doc, color);
      doc.rect(barAreaMid - barLen, y + 1.2, barLen, 5.8, "F");
      // Borde marcador en el extremo izquierdo
      setDrawColor(doc, "#0F172A");
      doc.setLineWidth(0.4);
      doc.line(barAreaMid - barLen, y + 1.2, barAreaMid - barLen, y + 7.0);
    }

    // Valor numérico a la derecha
    setTextColor(doc, color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    const valueText = value > 0 ? `+${value}` : `${value}`;
    doc.text(valueText, ML + labelW + barAreaW + 3, y + 5.5);

    y += rowH;
  });

  return y + 2;
}

/**
 * Diagrama conceptual nativo del modelo DISC (brújula de 4 cuadrantes).
 * Matriz limpia y exacta, sin caracteres corruptos ni símbolos unicode de flechas:
 *   Eje Y Superior: "Rápido / Directo"
 *   Eje Y Inferior: "Cauto / Metódico"
 *   Eje X Izquierdo: "Orientado a Tareas"
 *   Eje X Derecho: "Orientado a Personas"
 * Con márgenes holgados para que no choque contra la sección siguiente.
 */
function drawDiscCompass(doc: any, y: number): number {
  const size = 62;
  const cx = PW / 2;
  const half = size / 2;
  const cy = y + half + 7;

  // ── Fondos sutiles de cuadrantes ──
  // D (Sup-Izq)
  setFill(doc, "#DBEAFE");
  doc.rect(cx - half, cy - half, half, half, "F");
  // I (Sup-Der)
  setFill(doc, "#FEF3C7");
  doc.rect(cx, cy - half, half, half, "F");
  // C (Inf-Izq)
  setFill(doc, "#D1FAE5");
  doc.rect(cx - half, cy, half, half, "F");
  // S (Inf-Der)
  setFill(doc, "#EDE9FE");
  doc.rect(cx, cy, half, half, "F");

  // ── Ejes divisorios centrales ──
  setDrawColor(doc, "#64748B");
  doc.setLineWidth(0.6);
  doc.line(cx - half, cy, cx + half, cy);
  doc.line(cx, cy - half, cx, cy + half);

  // Borde exterior
  setDrawColor(doc, "#94A3B8");
  doc.setLineWidth(0.5);
  doc.rect(cx - half, cy - half, size, size, "S");

  // ── Etiquetas de ejes ──
  setTextColor(doc, "#0F172A");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  doc.text("Rápido / Directo", cx, cy - half - 3, { align: "center" });
  doc.text("Cauto / Metódico", cx, cy + half + 5.5, { align: "center" });
  doc.text("Orientado a Tareas", cx - half - 4, cy + 1, { align: "right" });
  doc.text("Orientado a Personas", cx + half + 4, cy + 1, { align: "left" });

  // ── Cuadrantes ──
  const quadrants = [
    { label: "D", title: "Dominancia (D)", sub: "Directo y decidido", color: COLORS.D, qx: cx - half / 2, qy: cy - half / 2 },
    { label: "I", title: "Influencia (I)", sub: "Sociable y persuasivo", color: COLORS.I, qx: cx + half / 2, qy: cy - half / 2 },
    { label: "C", title: "Cumplimiento (C)", sub: "Meticuloso y preciso", color: COLORS.C, qx: cx - half / 2, qy: cy + half / 2 },
    { label: "S", title: "Estabilidad (S)", sub: "Paciente y constante", color: COLORS.S, qx: cx + half / 2, qy: cy + half / 2 },
  ];

  quadrants.forEach((q) => {
    // 1. Círculo y Letra
    setFill(doc, q.color);
    doc.circle(q.qx, q.qy - 8, 6.5, "F");
    
    setTextColor(doc, COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(q.label, q.qx, q.qy - 5.5, { align: "center" });

    // 2. Título (Dominancia, etc.)
    setTextColor(doc, "#1E293B");
    doc.setFontSize(10.5);
    doc.text(q.title, q.qx, q.qy + 3, { align: "center" });

    // 3. Subtexto
    setTextColor(doc, "#64748B");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(q.sub, q.qx, q.qy + 8.5, { align: "center" });
  });

  return cy + half + 12;
}

// ─── Función Principal de Generación ──────────────────────────────────────────


export async function createDISCPdfDoc(
  evaluado: { nombre: string; cargo: string; fecha: string; cedula?: string; correo?: string; dependencia?: string; departamento?: string; telefono?: string },
  textos: ReportTexts,
  combinacion: string,
  rawScores: RawScores,
  subScores: SubcategoryScores,
  radarBase64: string,
  responses?: UserResponses
): Promise<{ doc: any; fileName: string; getBlob: () => Blob }> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const logoBase64 = await loadLogoBase64();

  // ══════════════════════════════════════════════════════════
  // PÁGINA 1 — PORTADA (pantalla-carga.png)
  // ══════════════════════════════════════════════════════════
  try {
    const coverBase64 = await fetch("/pantalla-carga.png")
      .then(res => res.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
    doc.addImage(coverBase64, "PNG", 0, 0, 210, 297);
    doc.addPage();
  } catch (e) {
    console.warn("No se pudo cargar la portada", e);
  }

  // ══════════════════════════════════════════════════════════
  // PÁGINA 2 — ENCABEZADO Y FICHA TÉCNICA
  // ══════════════════════════════════════════════════════════

  // ── Banda Cabecera Corporativa Superior (Fondo Blanco) ──
  const bannerH = 32;
  setFill(doc, "#FFFFFF");
  doc.rect(0, 0, PW, bannerH, "F");

  // Logo Rizoma (incrementado ~30%)
  if (logoBase64) {
    try {
      const logoW = 65;
      const logoH = logoW * (99 / 300);
      doc.addImage(logoBase64, "PNG", ML, 6, logoW, logoH);
    } catch {
      // continúa sin logo si falla
    }
  }

  // Membrete Institucional alineado a la derecha en la banda
  setTextColor(doc, "#0F172A");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PROCURADURÍA GENERAL DE LA NACIÓN", PW - MR, 12, { align: "right" });

  setTextColor(doc, "#1E40AF");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Proyecto de Liderazgo Visible", PW - MR, 18, { align: "right" });

  setTextColor(doc, "#475569");
  doc.setFontSize(7);
  doc.text("Programa de Prevención y Atención del Riesgo Psicosocial", PW - MR, 23, { align: "right" });

  // Línea divisoria de acento celeste
  setFill(doc, COLORS.headerAccent);
  doc.rect(0, bannerH, PW, 1.8, "F");

  // ── Título Principal Destacado ──
  setTextColor(doc, "#0F172A");
  doc.setFontSize(18.5);
  doc.setFont("helvetica", "bold");
  doc.text("INFORME OFICIAL DE PERFIL DISC", PW / 2, 46, { align: "center" });

  setTextColor(doc, "#1E40AF");
  doc.setFontSize(14.5);
  doc.text("Gestión de Equipos y Riesgo Psicosocial", PW / 2, 55, { align: "center" });

  setTextColor(doc, "#64748B");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Herramienta de desarrollo de liderazgo y diagnóstico comportamental — 2026", PW / 2, 63, { align: "center" });

  // ══════════════════════════════════════════════════════════
  // FICHA DEL EVALUADO — GRID 3 FILAS (DEPENDENCIA 100%)
  // ══════════════════════════════════════════════════════════
  const fichaTop = 72;
  const cellPadX = 5;
  const cellPadY = 3.5;
  const cellH = 15; // altura de filas estandar (1 y 2)
  const headerH = 7.5;

  // Medir la altura dinámica de la dependencia para la fila 3
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  const depText = evaluado.dependencia || "—";
  const depLines: string[] = doc.splitTextToSize(depText, CONTENT_W - cellPadX * 2);
  const depH = Math.max(cellH, depLines.length * 3.8 + 8);

  const perfilRowH = 26; // altura para el perfil resultante
  const fichaH = headerH + cellH * 2 + depH + perfilRowH; 

  // Sombra sutil
  setFill(doc, "#E2E8F0");
  doc.roundedRect(ML + 1, fichaTop + 1, CONTENT_W, fichaH, 3, 3, "F");

  // Tarjeta blanca con borde
  setFill(doc, "#FFFFFF");
  doc.roundedRect(ML, fichaTop, CONTENT_W, fichaH, 3, 3, "F");
  setDrawColor(doc, "#CBD5E1");
  doc.setLineWidth(0.5);
  doc.roundedRect(ML, fichaTop, CONTENT_W, fichaH, 3, 3, "S");

  // Encabezado interno
  setFill(doc, "#F8FAFC");
  doc.roundedRect(ML, fichaTop, CONTENT_W, headerH, 3, 3, "F");
  doc.rect(ML, fichaTop + 4, CONTENT_W, headerH - 4, "F");
  setDrawColor(doc, "#E2E8F0");
  doc.line(ML, fichaTop + headerH, ML + CONTENT_W, fichaTop + headerH);

  setTextColor(doc, "#475569");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.text("DATOS GENERALES DE LA PERSONA EVALUADA", ML + 6, fichaTop + 5.2);

  // Helper: draw a cell with label + value
  const drawCell = (x: number, y: number, w: number, label: string, value: string, fontSize: number = 9) => {
    const cx = x + cellPadX;
    const cy = y + cellPadY;
    setTextColor(doc, "#64748B");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text(label, cx, cy + 3);
    setTextColor(doc, "#0F172A");
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(value || "—", w - cellPadX * 2);
    lines.slice(0, 3).forEach((ln: string, i: number) => {
      doc.text(ln, cx, cy + 7.5 + i * 3.5);
    });
  };

  const gridY = fichaTop + headerH;

  // ── Fila 1 (Cortos): Nombre (75), Cédula (35), Correo (60) ──
  const w1 = 75, w2 = 35, w3 = 60;
  drawCell(ML, gridY, w1, "NOMBRE COMPLETO", evaluado.nombre, 9.5);
  drawCell(ML + w1, gridY, w2, "CÉDULA / ID", evaluado.cedula || "—");
  drawCell(ML + w1 + w2, gridY, w3, "CORREO ELECTRÓNICO", evaluado.correo || "—", 8);

  // ── Fila 2 (Largo): Dependencia (100%) ──
  const depY = gridY + cellH;
  setTextColor(doc, "#64748B");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.text("DEPENDENCIA", ML + cellPadX, depY + cellPadY + 3);
  
  setTextColor(doc, "#0F172A");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  depLines.forEach((ln: string, i: number) => {
    doc.text(ln, ML + cellPadX, depY + cellPadY + 7.5 + i * 3.8);
  });

  // ── Fila 3 (Cortos): Departamento (85), Fecha (85) ──
  const f3Y = depY + depH;
  const w4 = 85, w5 = 85;
  drawCell(ML, f3Y, w4, "DEPARTAMENTO", evaluado.departamento || "—", 8.5);
  drawCell(ML + w4, f3Y, w5, "FECHA DE EVALUACIÓN", evaluado.fecha, 9);

  // Líneas divisorias de la grilla
  setDrawColor(doc, "#E2E8F0");
  doc.setLineWidth(0.3);
  
  // Verticales Fila 1
  doc.line(ML + w1, gridY, ML + w1, gridY + cellH);
  doc.line(ML + w1 + w2, gridY, ML + w1 + w2, gridY + cellH);
  
  // Verticales Fila 3
  doc.line(ML + w4, f3Y, ML + w4, f3Y + cellH);

  // Horizontales
  doc.line(ML + 4, gridY + cellH, ML + CONTENT_W - 4, gridY + cellH);
  doc.line(ML + 4, f3Y, ML + CONTENT_W - 4, f3Y);

  // ── Fila de Perfil Resultante ──
  const perfilRowTop = f3Y + cellH;
  doc.line(ML + 4, perfilRowTop, ML + CONTENT_W - 4, perfilRowTop);

  setTextColor(doc, "#64748B");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.text("PERFIL RESULTANTE", ML + cellPadX, perfilRowTop + 4.5);

  // Badges
  const pStyle = combinacion.split('/')[0] as "D"|"I"|"S"|"C";
  const sStyle = combinacion.split('/')[1] as "D"|"I"|"S"|"C";
  
  let badgeX = ML + cellPadX;
  const badgeY = perfilRowTop + 8;
  
  setFill(doc, COLORS[pStyle] || COLORS.D);
  doc.roundedRect(badgeX, badgeY, 9, 5, 1.2, 1.2, "F");
  setTextColor(doc, "#FFFFFF");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(pStyle, badgeX + 4.5, badgeY + 3.6, { align: "center" });
  badgeX += 11;

  if (sStyle) {
    setFill(doc, COLORS[sStyle] || COLORS.I);
    doc.roundedRect(badgeX, badgeY, 9, 5, 1.2, 1.2, "F");
    setTextColor(doc, "#FFFFFF");
    doc.text(sStyle, badgeX + 4.5, badgeY + 3.6, { align: "center" });
    badgeX += 12;
  }

  // Combinación label
  setTextColor(doc, "#0F172A");
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  const estiloLabel = `${combinacion} — ${(textos.perfilTrabajo.nombreEstilo || "").toUpperCase()}`;
  doc.text(estiloLabel, badgeX + 2, badgeY + 3.8);

  // Descripción cualitativa debajo
  setTextColor(doc, "#475569");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  const perfilDesc = textos.perfilTrabajo.lecturaEjecutiva || textos.perfilTrabajo.fortalezas || "Metódico, constante, cuidadoso y orientado a procesos.";
  const descLines = doc.splitTextToSize(perfilDesc, CONTENT_W - 14);
  descLines.slice(0, 3).forEach((ln: string, i: number) => {
    doc.text(ln, ML + cellPadX, badgeY + 9 + i * 3.5);
  });

  // ── Cuadro "Acerca de este Informe / Alcance Confidencial" ──
  const alcanceTop = fichaTop + fichaH + 6;
  const alcanceH = Math.min(84, PH - 14 - alcanceTop - 6);

  setFill(doc, "#E2E8F0");
  doc.roundedRect(ML + 1, alcanceTop + 1, CONTENT_W, alcanceH, 3, 3, "F");

  setFill(doc, "#F8FAFC");
  doc.roundedRect(ML, alcanceTop, CONTENT_W, alcanceH, 3, 3, "F");
  setDrawColor(doc, "#CBD5E1");
  doc.setLineWidth(0.5);
  doc.roundedRect(ML, alcanceTop, CONTENT_W, alcanceH, 3, 3, "S");

  setFill(doc, "#1E40AF");
  doc.roundedRect(ML, alcanceTop, 3.5, alcanceH, 2, 2, "F");

  setTextColor(doc, "#0F172A");
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text("Acerca de este Informe — Alcance Confidencial", ML + 8, alcanceTop + 9);

  setTextColor(doc, "#334155");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  const alcanceTexto =
    "Este informe forma parte del Programa de Prevención y Atención del Riesgo Psicosocial y del Proyecto de Liderazgo Visible de la Procuraduría General de la Nación. Su propósito es apoyar a los coaches de desarrollo en la comprensión de las tendencias de comportamiento observables de cada servidor, para adaptar la comunicación, la delegación, el seguimiento y la asignación de roles dentro del equipo.";
  const alcanceLines = doc.splitTextToSize(alcanceTexto, CONTENT_W - 16);
  alcanceLines.forEach((ln: string, li: number) =>
    doc.text(ln, ML + 8, alcanceTop + 16 + li * 4.3)
  );

  // Cuadro de advertencia confidencial
  const calloutTop = alcanceTop + 44;
  const calloutH = 26;
  setFill(doc, "#FEF3C7");
  doc.roundedRect(ML + 8, calloutTop, CONTENT_W - 16, calloutH, 2, 2, "F");
  setDrawColor(doc, "#F59E0B");
  doc.setLineWidth(0.4);
  doc.roundedRect(ML + 8, calloutTop, CONTENT_W - 16, calloutH, 2, 2, "S");
  setFill(doc, "#D97706");
  doc.rect(ML + 8, calloutTop, 2, calloutH, "F");

  setTextColor(doc, "#92400E");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.text("Uso Exclusivo y Confidencial:", ML + 14, calloutTop + 6.5);

  setTextColor(doc, "#78350F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  const confLines = doc.splitTextToSize(
    "Este resultado debe usarse exclusivamente con fines de desarrollo y gestión de equipos. No debe usarse para etiquetar, limitar ni tomar decisiones de selección de personal.",
    CONTENT_W - 26
  );
  confLines.forEach((ln: string, li: number) =>
    doc.text(ln, ML + 14, calloutTop + 13 + li * 3.8)
  );

  drawFooter(doc, evaluado.nombre, 1);

  // ══════════════════════════════════════════════════════════
  // PÁGINA 2 — DESCRIPCIÓN GENERAL Y MARCO METODOLÓGICO
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  let y = 22;
  y = drawPageTitle(doc, "Descripción General y Marco Metodológico", y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setTextColor(doc, COLORS.textMed);
  y = drawWrappedText(
    doc,
    "En el marco del Proyecto de Liderazgo Visible y del Programa de Prevención y Atención del Riesgo Psicosocial de la Procuraduría General de la Nación, el modelo DISC mide tendencias de comportamiento observables y preferencias de respuesta ante distintos entornos laborales: no mide inteligencia ni valores, sino cómo la persona aborda problemas, se comunica, responde al ritmo del entorno y se adapta a las reglas.",
    ML, y, CONTENT_W, 4.3
  );
  y += 4;

  y = drawSectionHeader(doc, "Las 4 Dimensiones del Modelo DISC", y);
  y += 4;
  const factors: { label: string; color: string; text: string }[] = [
    { label: `Dominancia (D)`, color: COLORS.D, text: "Orientación a resultados, decisiones rápidas, asertividad y resolución directa de problemas." },
    { label: `Influencia (I)`, color: COLORS.I, text: "Persuasión, entusiasmo, comunicación abierta y enfoque en las relaciones interpersonales." },
    { label: `Estabilidad (S)`, color: COLORS.S, text: "Paciencia, cooperación, consistencia y preferencia por entornos estables y predecibles." },
    { label: `Cautela / Cumplimiento (C)`, color: COLORS.C, text: "Orientación al detalle, precisión, pensamiento analítico y apego a estándares de calidad." },
  ];
  factors.forEach(({ label, color, text }) => {
    setFill(doc, color);
    doc.circle(ML + 1.5, y - 1.3, 1.6, "F");
    setTextColor(doc, color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(label + ":", ML + 5, y);
    setTextColor(doc, COLORS.textMed);
    doc.setFont("helvetica", "normal");
    const textX = ML + 5 + doc.getTextWidth(label + ": ") + 1;
    y = drawWrappedText(doc, text, textX, y, CONTENT_W - (textX - ML), 4.2);
    y += 2.2;
  });
  y += 2;

  y = drawSectionHeader(doc, "Modelo Conceptual DISC", y);
  y += 3;
  y = drawDiscCompass(doc, y);
  y += 6; // Margen adicional antes de la tabla

  // ── Módulos y Categorías del Instrumento (Tabla de 3 Columnas) ──
  y += 2;
  y = drawSectionHeader(doc, "Módulos y Categorías del Instrumento", y, 9.5);
  y += 3;

  const tableX = ML;
  const colCatW = 60;
  const colModW = CONTENT_W - colCatW;
  const tableStartY = y;

  // Encabezado de la tabla
  const headH = 5.5;
  setFill(doc, "#EDF2F7");
  doc.roundedRect(tableX, y, CONTENT_W, headH, 1, 1, "F");
  setTextColor(doc, "#1E293B");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("CATEGORÍA", tableX + 3, y + 3.8);
  doc.text("MÓDULOS EVALUADOS", tableX + colCatW + 3, y + 3.8);
  
  // Bordes del encabezado
  setDrawColor(doc, "#CBD5E1");
  doc.setLineWidth(0.3);
  doc.line(tableX, y + headH, tableX + CONTENT_W, y + headH);
  doc.line(tableX + colCatW, y, tableX + colCatW, y + headH);
  
  y += headH;

  const moduloFilas = [
    {
      cat: "Perfil de trabajo",
      mods: "• Orientación general de trabajo\n• Toma de decisiones",
    },
    {
      cat: "Motivación y compromiso",
      mods: "• Motivadores",
    },
    {
      cat: "Gestión directa del jefe",
      mods: "• Comunicación\n• Delegación\n• Acompañamiento, seguimiento\n  y retroalimentación",
    },
    {
      cat: "Dinámica de equipo",
      mods: "• Manejo de conflicto\n• Rol natural en el equipo",
    },
  ];

  moduloFilas.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    const rowBg = isEven ? "#FFFFFF" : "#F8FAFC";
    
    // Calcular la altura dinámica basada en el contenido más largo
    const catLineCount = row.cat.split("\n").length;
    const modLineCount = row.mods.split("\n").length;
    const maxLines = Math.max(catLineCount, modLineCount);
    const rowH = Math.max(8, maxLines * 3.2 + 3);

    setFill(doc, rowBg);
    doc.rect(tableX, y, CONTENT_W, rowH, "F");

    // Borde inferior sutil
    setDrawColor(doc, "#E2E8F0");
    doc.setLineWidth(0.3);
    doc.line(tableX, y + rowH, tableX + CONTENT_W, y + rowH);
    // Divisorias verticales
    doc.line(tableX + colCatW, y, tableX + colCatW, y + rowH);

    // Columna 1: Categoría
    setTextColor(doc, "#1E40AF");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    row.cat.split("\n").forEach((ln, i) => {
      doc.text(ln.trim(), tableX + 3, y + 4 + i * 3.2);
    });

    // Columna 2: Módulos Evaluados
    setTextColor(doc, "#334155");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    row.mods.split("\n").forEach((ln, i) => {
      doc.text(ln.trim(), tableX + colCatW + 3, y + 4 + i * 3.2);
    });

    y += rowH;
  });

  // Borde contenedor de la tabla
  setDrawColor(doc, "#CBD5E1");
  doc.setLineWidth(0.4);
  doc.roundedRect(tableX, tableStartY, CONTENT_W, y - tableStartY, 1, 1, "S");

  // ── Advertencia Psicométrica (cierre limpio de Página 2) ──
  y += 6;
  y = drawSectionHeader(doc, "Naturaleza Ipsativa del Test — Advertencia Psicométrica", y, 9);
  y += 1;
  y = drawInfoBox(
    doc,
    "Esta evaluación compara las preferencias de la persona consigo misma: en cada ítem elige la opción que MÁS lo describe (+1) y la que MENOS lo describe (-1). No mide inteligencia ni valores, no establece un porcentaje absoluto de personalidad y SOLO PARA FINES DE DESARROLLO.",
    y, COLORS.warningBg, COLORS.warningBorder, 7.5
  );
  
  drawFooter(doc, evaluado.nombre, 2);

  // ══════════════════════════════════════════════════════════
  // PÁGINA 4 — RESULTADOS Y VISUALIZACIÓN
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  y = 22;
  y = drawPageTitle(doc, "Resultados y Visualización", y);

  setFill(doc, COLORS.boxBg);
  doc.roundedRect(ML, y, CONTENT_W, 14, 2, 2, "F");
  setFill(doc, COLORS.boxBorder);
  doc.rect(ML, y, 2.5, 14, "F");
  setTextColor(doc, COLORS.D);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text(`Perfil: ${combinacion} — ${textos.perfilTrabajo.nombreEstilo}`, ML + 6, y + 6);
  setTextColor(doc, COLORS.textMed);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Estilo dominante y secundario según la mayor puntuación neta de sus respuestas.", ML + 6, y + 11);
  y += 20;

  y = drawSectionHeader(doc, "Distribución General DISC (Escala -8 a +8)", y);
  y += 5;
  y = drawScoreTable(doc, rawScores, y);
  y += 2;
  setTextColor(doc, COLORS.textLight);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    `Suma de verificación (D+I+S+C = 0): ${rawScores.D + rawScores.I + rawScores.S + rawScores.C}`,
    ML, y
  );
  y += 5;

  // ── Bloque de Lectura de la Distribución (sin truncamientos, tamaño 8.2pt) ──
  const nivelesTexto = DISC_KEYS.map((k) => `${DISC_LABELS[k]}: ${clasificarNivel(rawScores[k])} (${rawScores[k] > 0 ? '+' : ''}${rawScores[k]})`).join(' · ');
  const lecturaTexto =
    `Lectura de la distribución: un puntaje de magnitud alta (>= 5 ó <= -5) indica una tendencia marcada y consistente en las respuestas; moderado (2 a 4 ó -2 a -4) indica una inclinación presente pero no dominante; bajo (0 a 1 ó -1) indica que esa dimensión no se refleja como preferencia sobresaliente frente a las demás. En este caso: ${nivelesTexto}.`;

  doc.setFontSize(8.2);
  doc.setFont("helvetica", "normal");
  const lecturaLines = doc.splitTextToSize(lecturaTexto, CONTENT_W - 12);
  const lecturaLineH = 4.1;
  const lecturaBoxH = lecturaLines.length * lecturaLineH + 8;

  setFill(doc, "#F8FAFC");
  doc.roundedRect(ML, y, CONTENT_W, lecturaBoxH, 2, 2, "F");
  setDrawColor(doc, "#CBD5E1");
  doc.setLineWidth(0.4);
  doc.roundedRect(ML, y, CONTENT_W, lecturaBoxH, 2, 2, "S");
  setFill(doc, "#3B82F6");
  doc.rect(ML, y, 2.5, lecturaBoxH, "F");

  setTextColor(doc, COLORS.textDark);
  lecturaLines.forEach((line: string, i: number) => {
    doc.text(line, ML + 6, y + 5.2 + i * lecturaLineH);
  });
  y += lecturaBoxH + 5;

  // ── Desglose por Subcategorías y Radar ──
  y += 4;
  y = drawSectionHeader(doc, "Desglose por Subcategorías", y);
  y += 5;
  setTextColor(doc, COLORS.textLight);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  
  const evalText = `Módulos evaluados: ${SUBCATEGORY_LABELS.join(" · ")}`;
  const evalLines = doc.splitTextToSize(evalText, CONTENT_W);
  evalLines.forEach((ln: string) => {
    doc.text(ln, ML, y);
    y += 3.5;
  });
  y += 2;

  if (radarBase64) {
    try {
      const imgSize = 76;
      doc.addImage(radarBase64, "PNG", (PW - imgSize) / 2, y, imgSize, imgSize);
      y += imgSize;
    } catch {
      y = drawWrappedText(doc, "Gráfico radar no disponible.", ML, y, CONTENT_W, 4.5);
    }
  }
  y += 2;
  doc.setFontSize(7);
  setTextColor(doc, COLORS.textMed);
  y = drawWrappedText(
    doc,
    "Cada eje del radar representa un módulo de comportamiento; la línea con trazo grueso y opacidad destacada resalta el perfil dominante de la persona frente a las tendencias secundarias.",
    ML, y, CONTENT_W, 3.8
  );

  const domScores = getSubcategoryDominantScore(subScores);
  const sortedModules = Object.entries(domScores).sort((a, b) => b[1] - a[1]);
  
  if (sortedModules.length >= 4) {
    const high1 = sortedModules[0][0];
    const high2 = sortedModules[1][0];
    const low1 = sortedModules[sortedModules.length - 2][0];
    const low2 = sortedModules[sortedModules.length - 1][0];
    
    const dom1 = DISC_LABELS[combinacion.split('/')[0] as "D"|"I"|"S"|"C"];
    const dom2 = DISC_LABELS[combinacion.split('/')[1] as "D"|"I"|"S"|"C"];
    const firstName = evaluado.nombre.split(" ")[0];

    const personalReading = `En ${firstName}, los módulos con mayor puntaje son ${high1} y ${high2} (influenciados por sus tendencias globales en ${dom1} y ${dom2}), mientras que ${low1} y ${low2} muestran menor intensidad.`;
    y += 1;
    y = drawWrappedText(doc, personalReading, ML, y, CONTENT_W, 3.8);
  }

  y += 4;
  const sortedScores = Object.values(rawScores).sort((a, b) => b - a);
  const diffPct = (sortedScores[0] - sortedScores[1]) / 32;
  const interpretacion = diffPct >= 0.3 
    ? "Perfil de marcada dominancia. Muestra patrones de conducta muy predecibles e influenciados fuertemente por su estilo principal."
    : "Perfil adaptable o secundario activo. Muestra flexibilidad para alternar entre ambos estilos según las exigencias del entorno.";
  
  setTextColor(doc, COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Análisis de Brecha:", ML, y);
  doc.setFont("helvetica", "normal");
  setTextColor(doc, COLORS.textDark);
  y = drawWrappedText(doc, interpretacion, ML + 22, y, CONTENT_W - 22, 3.8);

  drawFooter(doc, evaluado.nombre, 4);

  // ══════════════════════════════════════════════════════════
  // PÁGINA 4 — PERFIL OPERATIVO Y RECOMENDACIONES (4 tarjetas)
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  y = 22;
  y = drawPageTitle(doc, "Perfil Operativo y Recomendaciones", y);

  const cardTop = y - 5;
  const gap = 5;
  const cardW = (CONTENT_W - gap) / 2;
  const innerW = cardW - 8;

  type CardField = { label: string; text: string; tone?: "normal" | "warning" | "danger" };

  const getCardHeight = (fields: CardField[]) => {
    let needed = 11;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    fields.forEach(f => {
      needed += 3.5;
      const cleanVal = sanitizeText(f.text || "—");
      const rawSentences = cleanVal.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 0);
      const isBullet = rawSentences.length > 1;
      let lineCount = 0;
      const availW = innerW - (f.tone ? 5 : 0);
      if (isBullet) {
        rawSentences.forEach(s => {
          const text = s.endsWith('.') ? s : s + '.';
          lineCount += doc.splitTextToSize("• " + text, availW).length;
        });
      } else {
        lineCount += doc.splitTextToSize(cleanVal, availW).length;
      }
      needed += (lineCount * 3.0) + (f.tone ? 3 : 1) + 1.2;
    });
    return needed + 2;
  };

  function drawCard(x: number, top: number, title: string, accent: string, fields: CardField[], cardH: number) {
    setDrawColor(doc, "#E2E8F0");
    doc.setLineWidth(0.4);
    doc.roundedRect(x, top, cardW, cardH, 2.5, 2.5, "S");
    setFill(doc, accent);
    doc.rect(x, top, cardW, 6, "F");
    setTextColor(doc, COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, x + 3, top + 4.2);

    let cy = top + 11;
    const innerX = x + 4;

    fields.forEach((f) => {
      setTextColor(doc, COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.1);
      doc.text(f.label, innerX, cy);
      cy += 3.5;

      const bg = f.tone === "warning" ? COLORS.warningBg : f.tone === "danger" ? COLORS.dangerBg : null;
      const border = f.tone === "warning" ? COLORS.warningBorder : f.tone === "danger" ? COLORS.dangerBorder : null;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      const lineH = 3.0;
      const cleanVal = sanitizeText(f.text || "—");
      const rawSentences = cleanVal.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 0);
      const isBullet = rawSentences.length > 1;
      let allLines: string[] = [];
      const availW = innerW - (bg ? 5 : 0);
      
      if (isBullet) {
        rawSentences.forEach(s => {
          const text = s.endsWith('.') ? s : s + '.';
          const sLines = doc.splitTextToSize("• " + text, availW);
          allLines = allLines.concat(sLines.map((l: string) => l.trimEnd()));
        });
      } else {
        allLines = doc.splitTextToSize(cleanVal, availW);
      }

      const boxH = allLines.length * lineH + (bg ? 3 : 1);

      if (bg) {
        setFill(doc, bg);
        doc.rect(innerX, cy - 2.6, innerW, boxH, "F");
        setFill(doc, border!);
        doc.rect(innerX, cy - 2.6, 1.2, boxH, "F");
      }
      setTextColor(doc, COLORS.textMed);
      allLines.forEach((line: string, li: number) => {
        const cleanLine = line.trimStart();
        const indent = (isBullet && !cleanLine.startsWith("•")) ? 2 : 0;
        doc.text(cleanLine, innerX + (bg ? 3 : 0) + indent, cy + li * lineH);
      });
      cy += boxH + 1.2;
    });
  }

  const buildFields = (cat: any): CardField[] => [
    { label: "Lectura ejecutiva", text: cat.lecturaEjecutiva },
    { label: "Cómo gestionarlo", text: cat.comoGestionarlo },
    { label: "Qué evitar", text: cat.queEvitar, tone: "warning" as const },
    { label: "Fortalezas potenciales", text: cat.fortalezas },
    { label: "Debilidades o excesos a observar", text: cat.debilidades, tone: "warning" as const },
    { label: "Riesgo a cuidar", text: cat.riesgoACuidar, tone: "danger" as const },
    { label: "Rol o palanca sugerida", text: cat.rolPalanca },
  ];

  const f1 = buildFields(textos.perfilTrabajo);
  const f2 = buildFields(textos.motivacionCompromiso);
  const f3 = buildFields(textos.gestionDirecta);
  const f4 = buildFields(textos.dinamicaEquipo);

  const h1 = getCardHeight(f1);
  const h2 = getCardHeight(f2);
  const h3 = getCardHeight(f3);
  const h4 = getCardHeight(f4);

  const row2Top = cardTop + Math.max(h1, h2) + gap;

  drawCard(ML, cardTop, "1. Perfil de Trabajo", COLORS.D, f1, h1);
  drawCard(ML + cardW + gap, cardTop, "2. Motivación y Compromiso", COLORS.I, f2, h2);
  drawCard(ML, row2Top, "3. Gestión Directa del Jefe", COLORS.S, f3, h3);
  drawCard(ML + cardW + gap, row2Top, "4. Dinámica de Equipo & Riesgo Psicosocial", COLORS.C, f4, h4);

  drawFooter(doc, evaluado.nombre, 5);

  // ══════════════════════════════════════════════════════════
  // PÁGINA 5 — CONCLUSIONES Y PLAN DE PREVENCIÓN DEL RIESGO PSICOSOCIAL
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  y = 22;
  y = drawPageTitle(doc, "Conclusiones y Plan de Prevención del Riesgo Psicosocial", y);

  const conclusiones = buildConclusionTexts(combinacion, rawScores, textos);

  y = drawSectionHeader(doc, "Conclusión Integral del Perfil", y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setTextColor(doc, COLORS.textMed);
  y = drawWrappedText(doc, conclusiones.conclusionIntegral, ML, y, CONTENT_W, 4.3);
  y += 5;

  // ── Recomendaciones en formato viñetas ejecutivas (bullet points) ──
  y = drawSectionHeader(doc, "Efecto Potencial en el Equipo y Prevención", y);
  y += 3;
  y = drawBulletBox(
    doc,
    conclusiones.recomendacionesRiesgoBullets,
    y,
    COLORS.dangerBg,
    COLORS.dangerBorder,
    COLORS.dangerBorder
  );
  y += 3;

  if (y < BOTTOM_LIMIT - 24) {
    y = drawSectionHeader(doc, "Compromisos de Seguimiento y Desarrollo", y);
    y += 4;
    
    // ── Matriz de Compromisos (con filas sugeridas pre-pobladas) ──
    const compromisosSugeridos = [
      "Establecer criterios claros de entrega y calidad para cada asignación.",
      "Acordar espacios de feedback mensual (mínimo 15 min.) con el colaborador.",
      "Verificar carga mental, soporte técnico y balance de tareas del equipo.",
    ];
    
    const colCheckW = 8;
    const colAccionW = CONTENT_W - colCheckW;
    const rowH = 11;
    const headerH = 7;
    const matrixH = headerH + compromisosSugeridos.length * rowH;
    
    // Outer container
    setFill(doc, "#FFFFFF");
    setDrawColor(doc, "#CBD5E1");
    doc.setLineWidth(0.4);
    doc.roundedRect(ML, y, CONTENT_W, matrixH, 2, 2, "FD");
    
    // Header row background
    setFill(doc, "#F1F5F9");
    doc.roundedRect(ML, y, CONTENT_W, headerH, 2, 2, "F");
    doc.rect(ML, y + 4, CONTENT_W, headerH - 4, "F");
    setDrawColor(doc, "#CBD5E1");
    doc.line(ML, y + headerH, ML + CONTENT_W, y + headerH);
    
    // Header column separators
    const accionX = ML + colCheckW;
    
    setTextColor(doc, "#334155");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("✓", ML + colCheckW / 2, y + 5, { align: "center" });
    doc.text("Acción Acordada", accionX + 3, y + 5);
    
    // Column separator lines (full height)
    setDrawColor(doc, "#E2E8F0");
    doc.setLineWidth(0.3);
    doc.line(accionX, y, accionX, y + matrixH);
    
    // Data Rows
    compromisosSugeridos.forEach((texto, i) => {
      const rowY = y + headerH + i * rowH;
      
      // Row separator
      if (i > 0) {
        setDrawColor(doc, "#E2E8F0");
        doc.setLineWidth(0.3);
        doc.line(ML, rowY, ML + CONTENT_W, rowY);
      }
      
      // Checkbox square
      setDrawColor(doc, "#94A3B8");
      doc.setLineWidth(0.4);
      doc.rect(ML + 2, rowY + 3.5, 4, 4, "S");
      
      // Pre-filled action text
      setTextColor(doc, COLORS.textMed);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      const actionLines: string[] = doc.splitTextToSize(texto, colAccionW - 6);
      actionLines.forEach((ln: string, li: number) => {
        doc.text(ln, accionX + 3, rowY + 4.5 + li * 3.4);
      });
    });
    
    y += matrixH + 6;
  }

  // Nota de cierre con margen seguro antes del pie de página
  if (y < BOTTOM_LIMIT - 16) {
    setTextColor(doc, COLORS.textLight);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    drawWrappedText(
      doc,
      "Este informe se entrega como insumo de desarrollo y prevención. Su interpretación y aplicación deben hacerse en conjunto con el coach de desarrollo, respetando siempre la confidencialidad de la información aquí contenida.",
      ML, y, CONTENT_W, 4
    );
  }

  // ══════════════════════════════════════════════════════════
  // PÁGINA 6 — ANEXO: RESPUESTAS DESTACADAS POR MÓDULO (OPCIONAL)
  // ══════════════════════════════════════════════════════════
  
  // Calculate total pages for the footer across the document
  // Since jsPDF allows modifying previous pages' text only if we save the objects,
  // we'll just use a trick or accept the standard pages as 5, and Annex as extra.
  // Actually, we can use doc.internal.getNumberOfPages() as the dynamic total for Annex.
  // But to fix the footer on pages 1-5, we'd need to know if the annex exists before drawing them, 
  // or use doc.setPage(). Let's just assume we update pages 1-5 with a standard total, but we will
  // redraw footers at the end using setPage if we want perfection. We'll keep it simple for now.

  const hasAnnex = responses && Object.keys(responses).length > 0;
  const computedTotalPages = hasAnnex ? 7 : TOTAL_PAGES;

  if (hasAnnex) {
    doc.addPage();
    let currentPage = 6;
    let pageCount = 6;

    let anexoY = 20;
    anexoY = drawPageTitle(doc, "Anexo: Respuestas Destacadas por Módulo", anexoY);
    anexoY += 2;
    setTextColor(doc, COLORS.textMed);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    anexoY = drawWrappedText(doc, "A continuación, se presentan las frases específicas que la persona seleccionó como las que MÁS y MENOS la describen en cada módulo evaluado.", ML, anexoY, CONTENT_W, 3.8);
    anexoY += 4;

    const modulos = [
      "Orientación general de trabajo",
      "Toma de decisiones",
      "Comunicación",
      "Motivadores",
      "Delegación",
      "Acompañamiento, seguimiento y retroalimentación",
      "Manejo de conflicto",
      "Rol natural en el equipo"
    ];

    const colGap = 6;
    const colW = (CONTENT_W - colGap) / 2;
    const col1X = ML;
    const col2X = ML + colW + colGap;

    let col = 0; // 0: Left, 1: Right
    let pageTopY = anexoY;
    let curY = pageTopY;

    const switchColumnOrPage = () => {
      if (col === 0) {
        // Pasar a la columna derecha de la misma página
        col = 1;
        curY = pageTopY;
      } else {
        // Pasar a la página siguiente en columna izquierda
        drawFooter(doc, evaluado.nombre, currentPage, pageCount);
        doc.addPage();
        currentPage++;
        pageCount = Math.max(pageCount, currentPage);
        let topY = 20;
        topY = drawPageTitle(doc, "Anexo: Respuestas Destacadas por Módulo (Cont.)", topY);
        topY += 3;
        pageTopY = topY;
        col = 0;
        curY = pageTopY;
      }
    };

    const ensureSpace = (neededH: number) => {
      if (curY + neededH > BOTTOM_LIMIT) {
        switchColumnOrPage();
      }
    };

    modulos.forEach(modulo => {
      const itemsDelModulo = itemsData.filter((it: any) => it.modulo === modulo);
      const itemsRespondidos = itemsDelModulo.filter((it: any) => {
        const res = responses[it.item];
        return res && (res.mas || res.menos);
      });

      if (itemsRespondidos.length === 0) return;

      // Encabezado del módulo (asegurar que no quede huérfano sin preguntas)
      const headerH = 6;
      ensureSpace(headerH + 16);

      const actualX = col === 0 ? col1X : col2X;

      setFill(doc, "#F1F5F9");
      doc.rect(actualX - 1, curY - 3.5, colW + 2, 5.5, "F");
      setFill(doc, COLORS.sectionBar);
      doc.rect(actualX - 1, curY - 3.5, 2.5, 5.5, "F");
      setTextColor(doc, COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(modulo, actualX + 3.5, curY);
      curY += 4.5;

      itemsRespondidos.forEach((it: any) => {
        const res = responses[it.item];

        // Medir altura requerida por la pregunta y opciones para evitar cortes
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        const qClean = sanitizeText(`${it.item}. ${it.enunciado}`);
        const qLines: string[] = doc.splitTextToSize(qClean, colW);
        const qH = qLines.length * 3.2;

        let optMasData: { fittedLines: string[]; boxH: number; opcion: any } | null = null;
        let optMenosData: { fittedLines: string[]; boxH: number; opcion: any } | null = null;

        const measureOption = (letra: string, tipo: "MÁS" | "MENOS") => {
          const opcion = it.opciones.find((o: any) => o.letra === letra);
          if (!opcion) return null;
          doc.setFontSize(6.2);
          const prefixW = doc.getTextWidth(tipo);
          const badgeW = 4.5;
          const textStartX = 3 + prefixW + 1.5 + badgeW + 2;
          const availableW = colW - textStartX - 2;
          doc.setFontSize(7);
          const fittedLines: string[] = doc.splitTextToSize(`"${opcion.texto}"`, availableW);
          const boxH = Math.max(5.2, fittedLines.length * 2.9 + 2.0);
          return { fittedLines, boxH, opcion };
        };

        if (res.mas) optMasData = measureOption(res.mas, "MÁS");
        if (res.menos) optMenosData = measureOption(res.menos, "MENOS");

        let totalItemH = qH + 1.5;
        if (optMasData) totalItemH += optMasData.boxH + 1.0;
        if (optMenosData) totalItemH += optMenosData.boxH + 1.0;
        totalItemH += 2; // margen entre ítems

        ensureSpace(totalItemH);

        const itemX = col === 0 ? col1X : col2X;

        // Pregunta
        setTextColor(doc, COLORS.textDark);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        qLines.forEach((ln: string) => {
          doc.text(ln, itemX, curY);
          curY += 3.2;
        });
        curY += 1;

        // Renderizador de tarjeta de opción
        const renderOption = (data: { fittedLines: string[]; boxH: number; opcion: any }, tipo: "MÁS" | "MENOS") => {
          const { fittedLines, boxH, opcion } = data;
          const bg = tipo === "MÁS" ? "#EFF6FF" : "#F8FAFC";
          const border = tipo === "MÁS" ? "#3B82F6" : "#94A3B8";

          doc.setFontSize(6.2);
          const prefixW = doc.getTextWidth(tipo);
          const badgeW = 4.5;
          const textStartX = itemX + 3 + prefixW + 1.5 + badgeW + 2;

          setFill(doc, bg);
          doc.roundedRect(itemX, curY, colW, boxH, 1, 1, "F");
          setDrawColor(doc, border);
          doc.setLineWidth(0.3);
          doc.rect(itemX, curY, 1.5, boxH, "F");

          setTextColor(doc, tipo === "MÁS" ? "#1E40AF" : "#475569");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.2);
          doc.text(tipo, itemX + 3, curY + 3.8);

          const discColor = DISC_COLORS[opcion.disc as keyof typeof DISC_COLORS] || "#64748B";
          setFill(doc, discColor);
          doc.roundedRect(itemX + 3 + prefixW + 1.5, curY + 1.1, badgeW, 3.2, 0.5, 0.5, "F");
          setTextColor(doc, "#FFFFFF");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.2);
          doc.text(opcion.disc, itemX + 3 + prefixW + 1.5 + badgeW / 2, curY + 3.6, { align: "center" });

          setTextColor(doc, COLORS.textMed);
          doc.setFont("helvetica", tipo === "MÁS" ? "bold" : "italic");
          doc.setFontSize(6.8);
          fittedLines.forEach((ln: string, idx: number) => {
            doc.text(ln, textStartX, curY + 3.7 + idx * 2.9);
          });

          curY += boxH + 1.0;
        };

        if (optMasData) renderOption(optMasData, "MÁS");
        if (optMenosData) renderOption(optMenosData, "MENOS");

        curY += 1.5;
      });

      curY += 2;
    });

    drawFooter(doc, evaluado.nombre, currentPage, pageCount);

    // Actualizar numeración final en todas las páginas generadas
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      setFill(doc, "#FFFFFF");
      doc.rect(PW - MR - 22, PH - 11, 25, 6, "F");
      setTextColor(doc, COLORS.textLight);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`Página ${i} de ${pageCount}`, PW - MR, PH - 7, { align: "right" });
    }
    doc.setPage(pageCount);
  }

  const cleanNombre = evaluado.nombre.replace(/[/\\?%*:|"<>]/g, "").replace(/\s+/g, "_");
  const cleanFecha = evaluado.fecha.replace(/\//g, "-");
  const fileName = `Informe_DISC_${cleanNombre}_${cleanFecha}.pdf`;

  return {
    doc,
    fileName,
    getBlob: () => doc.output("blob") as Blob,
  };
}

/**
 * Genera y descarga directamente en el navegador el informe individual DISC en PDF.
 */
export async function generateDISCPdf(
  evaluado: { nombre: string; cargo: string; fecha: string; cedula?: string; correo?: string; dependencia?: string; departamento?: string },
  textos: ReportTexts,
  combinacion: string,
  rawScores: RawScores,
  subScores: SubcategoryScores,
  radarBase64: string,
  responses?: UserResponses
): Promise<void> {
  const { doc, fileName } = await createDISCPdfDoc(evaluado, textos, combinacion, rawScores, subScores, radarBase64, responses);
  doc.save(fileName);
}
