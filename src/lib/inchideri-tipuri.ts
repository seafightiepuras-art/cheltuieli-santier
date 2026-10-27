// Lunile închise: cifrele șantierului pe luna respectivă, înghețate la momentul închiderii.
// Fără cod de server, ca să poată fi folosit și de componentele de client.

import type { FisaMoneda } from "./fisa";
import type { NealocatPeMoneda } from "./facturi-tipuri";

export interface Inchidere {
  /** momentul închiderii (ISO) */
  inchisLa: string;
  fise: FisaMoneda[];
  /** cheltuielile generale din luna respectivă, nealocate pe niciun șantier (doar informativ) */
  nealocat: NealocatPeMoneda[];
}

/** luna (YYYY-MM) -> cifrele înghețate ale lunii */
export type InchideriSantier = Record<string, Inchidere>;
