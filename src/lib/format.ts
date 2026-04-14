import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDateBR(iso: string) {
  try {
    const d = parseISO(iso);
    if (!isValid(d)) {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso;
      return iso;
    }
    return format(d, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

/** Rótulo curto para série diária (API pode enviar ISO ou dd/MM). */
export function formatDiaChart(dia: string) {
  try {
    const d = parseISO(dia);
    if (isValid(d)) return format(d, "dd/MM", { locale: ptBR });
  } catch {
    /* fallthrough */
  }
  return dia.length > 5 ? dia.slice(0, 5) : dia;
}

export function formatNumberBR(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

/** Taxa pode vir 0–1 ou 0–100. */
export function formatTaxaPct(n: number) {
  if (n <= 1 && n >= 0) return `${(n * 100).toFixed(1)}%`;
  return `${n.toFixed(1)}%`;
}
