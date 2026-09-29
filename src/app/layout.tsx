import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cheltuieli Șantier",
  description: "Centralizează avizele și cheltuielile pe fiecare șantier",
};

// TEMPORAR — fundal de test, de sters (si de sters poza din storage: fundal-test-TEMPORAR.jpg)
const FUNDAL_TEST_URL = "https://omucgphxqarwlletvrjt.supabase.co/storage/v1/object/public/cheltuieli-poze/fundal-test-TEMPORAR.jpg";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body
        className="min-h-screen bg-fixed bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(248,250,252,0.88), rgba(248,250,252,0.88)), url(${FUNDAL_TEST_URL})` }}
      >
        {children}
      </body>
    </html>
  );
}
