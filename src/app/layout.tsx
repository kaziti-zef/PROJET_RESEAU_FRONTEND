// ============================================================
//   NidiRoom — app/layout.tsx
//   Layout racine : enveloppe TOUTES les pages de l'application
//   Contient : métadonnées, polices, Navbar, Toast, Provider
// ============================================================

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import Navbar from "@/components/Navbar";
import ToastContainer from "@/components/ToastContainer";

// ── Polices Google Fonts (chargées via Next.js — optimisé) ─
import { Cormorant_Garamond, DM_Sans, Playfair_Display } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-accent",
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// ── Métadonnées SEO (Next.js App Router) ───────────────────

export const metadata: Metadata = {
  title: {
    default: "NidiRoom — Trouvez votre chambre idéale",
    template: "%s | NidiRoom",   // ex: "Connexion | NidiRoom"
  },
  description:
    "Plateforme de location de chambres de standing près de vos écoles. Trouvez, réservez et payez en toute sécurité.",
  keywords: ["location", "chambre", "hébergement", "réservation", "étudiant", "Yaoundé", "Melen"],
  authors: [{ name: "Équipe NidiRoom" }],
  openGraph: {
    title: "NidiRoom — Logements étudiants de standing",
    description: "Des milliers de chambres vérifiées autour de vos campus.",
    type: "website",
    locale: "fr_FR",
  },
};

// ── Layout principal ────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${dmSans.variable} ${playfair.variable}`}
    >
      <body className="bg-[#FAF9F6] text-gray-800 min-h-screen flex flex-col font-body">
        {/*
          ToastProvider  : gère les notifications toast (succès/erreur)
          AuthProvider   : gère la session utilisateur globalement
          L'ordre est important : Auth est enfant de Toast
          pour pouvoir afficher des toasts depuis AuthContext
        */}
        <ToastProvider>
          <AuthProvider>

            {/* Navbar présente sur toutes les pages */}
            <Navbar />

            {/* Contenu principal de chaque page */}
            <main className="flex-1">
              {children}
            </main>

            {/* Pied de page commun */}
            <footer className="bg-[#0B2516] text-[#FAF9F6]/80 py-10 mt-auto border-t border-[#C5A059]/20">
              <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <span className="font-display text-white text-2xl font-bold tracking-wide">
                    Nidi<span className="text-[#C5A059]">Room</span>
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-[#FAF9F6]/70">
                    La plateforme de location de chambres de standing près de vos écoles.
                    Sécurisée, rapide et fiable.
                  </p>
                </div>
                <div>
                  <h4 className="text-[#C5A059] text-sm font-semibold uppercase tracking-wider mb-4 font-display">
                    Navigation
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/listings" className="hover:text-[#C5A059] transition-colors">Annonces</a></li>
                    <li><a href="/login" className="hover:text-[#C5A059] transition-colors">Connexion</a></li>
                    <li><a href="/register" className="hover:text-[#C5A059] transition-colors">Inscription</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-[#C5A059] text-sm font-semibold uppercase tracking-wider mb-4 font-display">
                    Mon espace
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/profile" className="hover:text-[#C5A059] transition-colors">Mon profil</a></li>
                    <li><a href="/host/dashboard" className="hover:text-[#C5A059] transition-colors">Tableau de bord hôte</a></li>
                    <li><a href="/reservations" className="hover:text-[#C5A059] transition-colors">Mes réservations</a></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-[#FAF9F6]/10 mt-8 pt-6 text-center text-xs text-[#FAF9F6]/50">
                © {new Date().getFullYear()} NidiRoom — Projet Réseau. Tous droits réservés.
              </div>
            </footer>

            {/* Conteneur des toasts (affiché par-dessus tout) */}
            <ToastContainer />

          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
