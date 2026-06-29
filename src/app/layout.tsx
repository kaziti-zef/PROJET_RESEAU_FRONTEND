// ============================================================
//  KamerStay — app/layout.tsx  (layout racine)
//  Le Footer est masqué sur l'accueil (/) qui possède sa propre
//  section #about. Sur toutes les autres pages, FooterConditional
//  l'affiche normalement.
// ============================================================

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import Navbar from "@/components/Navbar";
import FooterConditional from "@/components/FooterConditional";
import ToastContainer from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: {
    default: "KamerStay — Découvrez le monde, une chambre à la fois",
    template: "%s | KamerStay",
  },
  description:
    "Plateforme de réservation hôtelière internationale. Trouvez, réservez et payez en devise locale en toute sécurité.",
  keywords: ["location", "chambre", "hôtel", "réservation", "hébergement", "voyage"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ToastProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <FooterConditional />
            </div>
            <ToastContainer />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
