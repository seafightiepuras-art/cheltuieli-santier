export function formateazaData(data: string | null): string {
  if (!data) return "—";
  const d = new Date(data + "T00:00:00");
  return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formateazaSuma(suma: number, moneda: "RON" | "EUR" = "RON"): string {
  try {
    return new Intl.NumberFormat("ro-RO", { style: "currency", currency: moneda }).format(suma);
  } catch {
    return `${suma.toFixed(2)} ${moneda}`;
  }
}
