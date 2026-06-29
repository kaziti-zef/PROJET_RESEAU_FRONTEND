"use client";
// ============================================================
//  FooterConditional — affiche le Footer uniquement hors de
//  la page d'accueil (/). Sur /, la section #about de page.tsx
//  remplace ce rôle (zone verte).
// ============================================================

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export function FooterConditional() {
  const pathname = usePathname();
  // Sur la page d'accueil, le Footer est intégré dans la section #about
  if (pathname === "/") return null;
  return <Footer />;
}

export default FooterConditional;
