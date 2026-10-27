// Facturile primite alocate unui șantier (aduse din Centralizator Facturi) și legătura lor cu avizele.
// Fără cod de server, ca să poată fi folosite și de componentele de client.

export interface FacturaPrimita {
  id: string;
  furnizor: string;
  numar: string | null;
  data: string;
  moneda: string;
  cotaTva: number;
  totalFactura: number;
  /** cât din factură e alocat acestui șantier (cu TVA) */
  sumaAlocata: number;
  /** aceeași sumă, fără TVA */
  sumaFaraTva: number;
  platit: boolean;
  pozaUrl: string | null;
}

export interface NealocatPeMoneda {
  moneda: string;
  nr: number;
  cuTva: number;
  faraTva: number;
}

export interface RaspunsFacturiPrimite {
  facturi: FacturaPrimita[];
  nealocat: NealocatPeMoneda[];
  /** facturaId -> id-urile avizelor pe care le acoperă (pentru toate facturile) */
  acopera: Record<string, string[]>;
}

/** TVA-ul avizelor nu e păstrat separat; pentru „fără TVA” se estimează cu cota standard actuală. */
export const COTA_TVA_ESTIMATA_AVIZE = 21;
