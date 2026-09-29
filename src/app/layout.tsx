import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cheltuieli Șantier",
  description: "Centralizează avizele și cheltuielile pe fiecare șantier",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body
        className="min-h-screen bg-fixed bg-cover bg-center"
        style={{ backgroundImage: `url(/fundal-marmura-roz.jpg)` }}
      >
        {children}
      </body>
    </html>
  );
}
