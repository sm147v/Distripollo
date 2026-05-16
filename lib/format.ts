/**
 * ═══════════════════════════════════════════════════════════════
 * 📦 lib/format.ts - Helpers globales (web pública + panel admin)
 * ═══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────
// MONEDA
// ─────────────────────────────────────────────
export const fmt = (n: number | string | null | undefined): string => {
  if (n === null || n === undefined) return "$0";
  const num = typeof n === "string" ? parseFloat(n) : Number(n);
  if (isNaN(num)) return "$0";
  return "$" + Math.round(num).toLocaleString("es-CO");
};

// Alias para el panel admin
export const fmtMoney = fmt;

// Sin el símbolo $ (para usar en columnas numéricas)
export const fmtNumber = (n: number | string | null | undefined): string => {
  if (n === null || n === undefined) return "0";
  const num = typeof n === "string" ? parseFloat(n) : Number(n);
  if (isNaN(num)) return "0";
  return Math.round(num).toLocaleString("es-CO");
};

// ─────────────────────────────────────────────
// FECHAS
// ─────────────────────────────────────────────

// Formato relativo: "hace 5 min", "hace 2 d", etc.
export function fmtRelativo(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const f = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (isNaN(f.getTime())) return "—";

  const diff = Date.now() - f.getTime();
  const seg = Math.floor(diff / 1000);
  const min = Math.floor(seg / 60);
  const hr = Math.floor(min / 60);
  const dia = Math.floor(hr / 24);

  if (seg < 60) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  if (hr < 24) return `hace ${hr} h`;
  if (dia < 7) return `hace ${dia} d`;
  return f.toLocaleDateString("es-CO");
}

// Formato de fecha: "14 may 2026, 10:32 AM"
export function fmtFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const f = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (isNaN(f.getTime())) return "—";
  return f.toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Solo fecha corta: "14/05/2026"
export function fmtFechaCorta(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const f = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (isNaN(f.getTime())) return "—";
  return f.toLocaleDateString("es-CO");
}

// Solo hora: "10:32 AM"
export function fmtHora(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  const f = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (isNaN(f.getTime())) return "—";
  return f.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─────────────────────────────────────────────
// ESTADOS DE PEDIDO
// ─────────────────────────────────────────────

export const ESTADOS_PEDIDO = [
  "NUEVO",
  "PENDIENTE",
  "CONFIRMADO",
  "EN_RUTA",
  "ENTREGADO",
  "CANCELADO",
] as const;

export type EstadoPedido = typeof ESTADOS_PEDIDO[number];

// Mapa de estados con color, fondo y label
export interface BadgeEstado {
  color: string;
  bg: string;
  label: string;
}

const MAPA_ESTADOS: Record<string, BadgeEstado> = {
  NUEVO: { color: "#1D3FA8", bg: "#E3E8F5", label: "Nuevo" },
  PENDIENTE: { color: "#1D3FA8", bg: "#E3E8F5", label: "Pendiente" },
  CONFIRMADO: { color: "#0F1E3F", bg: "#FFC72C", label: "Confirmado" },
  EN_RUTA: { color: "#0F1E3F", bg: "#FFD75F", label: "En ruta" },
  ENTREGADO: { color: "#0F4F2A", bg: "#D4F1DD", label: "Entregado" },
  CANCELADO: { color: "#7A1B22", bg: "#FBE5E7", label: "Cancelado" },
};

export function badgeEstado(estado: string | null | undefined): BadgeEstado {
  if (!estado) return { color: "#6B6B6B", bg: "#F5F5F5", label: "—" };
  return MAPA_ESTADOS[estado] || { color: "#6B6B6B", bg: "#F5F5F5", label: estado };
}

// Solo el label del estado
export function labelEstado(estado: string | null | undefined): string {
  return badgeEstado(estado).label;
}

// ─────────────────────────────────────────────
// MÉTODOS DE PAGO
// ─────────────────────────────────────────────

export const METODOS_PAGO = [
  "EFECTIVO",
  "NEQUI",
  "DAVIPLATA",
  "TRANSFERENCIA",
  "CREDITO",
] as const;

export function labelMetodoPago(metodo: string | null | undefined): string {
  if (!metodo) return "—";
  const map: Record<string, string> = {
    EFECTIVO: "Efectivo",
    NEQUI: "Nequi",
    DAVIPLATA: "Daviplata",
    TRANSFERENCIA: "Transferencia",
    CREDITO: "Crédito",
  };
  return map[metodo] || metodo;
}

// ─────────────────────────────────────────────
// TEXTO / SLUGS
// ─────────────────────────────────────────────

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

// Capitalizar primera letra
export function capitalize(s: string | null | undefined): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Truncar texto con elipsis
export function truncate(s: string | null | undefined, max: number = 50): string {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max).trim() + "…";
}

// Formato de número de teléfono colombiano
export function fmtTelefono(tel: string | null | undefined): string {
  if (!tel) return "—";
  const clean = tel.replace(/\D/g, "");
  if (clean.length === 10) {
    return `${clean.slice(0,3)} ${clean.slice(3,6)} ${clean.slice(6)}`;
  }
  if (clean.length === 12 && clean.startsWith("57")) {
    return `+57 ${clean.slice(2,5)} ${clean.slice(5,8)} ${clean.slice(8)}`;
  }
  return tel;
}

// Formato de porcentaje
export function fmtPorcentaje(n: number | null | undefined, decimales = 0): string {
  if (n === null || n === undefined || isNaN(n)) return "0%";
  return n.toFixed(decimales) + "%";
}

// Alias para compatibilidad con admin
export const fmtNum = fmtNumber;
