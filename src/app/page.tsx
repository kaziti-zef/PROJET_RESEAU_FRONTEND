"use client";
// ============================================================
//  NidiRoom — app/page.tsx
//  Page d'accueil : Hero + Recherche + Annonces en vedette
//  + Section "Comment ça marche" + CTA Hôte
// ============================================================

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAnnonces, Annonce } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

// ══════════════════════════════════════════════════════════
//  COMPOSANT CARTE ANNONCE
// ══════════════════════════════════════════════════════════

function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const router = useRouter();
  return (
    <article
      onClick={() => router.push(`/listings/${annonce.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl
                 hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-52 bg-gray-200 overflow-hidden">
        {annonce.image_principale ? (
          <img
            src={annonce.image_principale}
            alt={annonce.titre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-red-50 to-red-100">
            🏠
          </div>
        )}
        {/* Badge ville */}
        <span className="absolute top-3 left-3 bg-white text-gray-800 text-xs
                         font-bold px-3 py-1 rounded-full shadow-sm">
          {annonce.ville}
        </span>
        {/* Badge disponibilité */}
        {!annonce.disponible && (
          <span className="absolute top-3 right-3 bg-gray-800 text-white text-xs
                           font-bold px-3 py-1 rounded-full">
            Indisponible
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate mb-1">
          {annonce.titre}
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          👤 {annonce.capacite} pers.
          {annonce.superficie ? ` · 📐 ${annonce.superficie} m²` : ""}
        </p>
        <div className="flex items-center justify-between">
          <p className="font-bold text-gray-900">
            {Number(annonce.prix_par_nuit).toLocaleString("fr-FR")}
            <span className="text-gray-400 font-normal text-sm"> FCFA/nuit</span>
          </p>
          {annonce.note_moyenne && (
            <span className="text-xs text-gray-500">
              ⭐ {parseFloat(String(annonce.note_moyenne)).toFixed(1)}
              {annonce.nombre_avis ? ` (${annonce.nombre_avis})` : ""}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// ══════════════════════════════════════════════════════════
//  SQUELETTES DE CHARGEMENT
// ══════════════════════════════════════════════════════════

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md">
      <div className="h-52 skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="h-4 skeleton rounded w-1/3" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();

  // ── État recherche ─────────────────────────────────────
  const [ville,    setVille]    = useState("");
  const [capacite, setCapacite] = useState("");
  const [prixMax,  setPrixMax]  = useState("");

  // ── État annonces vedette ──────────────────────────────
  const [annonces,  setAnnonces]  = useState<Annonce[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);

  // ── Chargement des annonces au montage ─────────────────
  useEffect(() => {
    async function fetchAnnonces() {
      setLoading(true);
      const { data, error } = await getAnnonces({ size: 6 });
      if (error) {
        showToast("Impossible de charger les annonces.", "error");
      } else if (data) {
        setAnnonces(data.annonces ?? []);
        setTotal(data.total ?? 0);
      }
      setLoading(false);
    }
    fetchAnnonces();
  }, []); // eslint-disable-line

  // ── Soumission recherche ───────────────────────────────
  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (ville)    params.set("ville",    ville);
    if (capacite) params.set("capacite", capacite);
    if (prixMax)  params.set("prix_max", prixMax);
    router.push(`/listings?${params.toString()}`);
  }

  // ══════════════════════════════════════════════════════
  //  RENDU
  // ══════════════════════════════════════════════════════

  return (
    <>
      {/* ════════ HERO ════════ */}
      <section
        className="relative min-h-[92vh] flex items-center justify-center
                   bg-gray-900 overflow-hidden"
      >
        {/* Fond dégradé animé (remplace l'image si absente) */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-red-950 opacity-90" />

        {/* Cercles décoratifs */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-red-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-red-700 rounded-full opacity-10 blur-3xl" />

        <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
          {/* Eyebrow */}
          <p className="text-xs uppercase tracking-widest text-red-300 mb-4 font-medium">
            Location de chambres entre particuliers
          </p>

          {/* Titre */}
          <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold
                         leading-tight mb-6">
            Trouvez l&apos;endroit<br />
            <span className="text-red-400">qui vous ressemble.</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">
            Des milliers de chambres vérifiées, partout au pays.
            Réservez en quelques clics, en toute sécurité.
          </p>

          {/* ── FORMULAIRE DE RECHERCHE ── */}
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-2xl p-2 flex flex-col md:flex-row
                       gap-2 shadow-2xl max-w-2xl mx-auto"
          >
            {/* Ville */}
            <div className="flex-1 flex flex-col px-4 py-2 text-left
                            border-b md:border-b-0 md:border-r border-gray-100">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Ville
              </label>
              <input
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Ex : Yaoundé, Douala…"
                className="text-sm text-gray-800 outline-none mt-1 bg-transparent placeholder-gray-300"
              />
            </div>

            {/* Capacité */}
            <div className="flex-1 flex flex-col px-4 py-2 text-left
                            border-b md:border-b-0 md:border-r border-gray-100">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Personnes
              </label>
              <input
                type="number"
                value={capacite}
                onChange={(e) => setCapacite(e.target.value)}
                placeholder="Nombre"
                min={1}
                className="text-sm text-gray-800 outline-none mt-1 bg-transparent placeholder-gray-300"
              />
            </div>

            {/* Prix max */}
            <div className="flex-1 flex flex-col px-4 py-2 text-left">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Prix max (FCFA/nuit)
              </label>
              <input
                type="number"
                value={prixMax}
                onChange={(e) => setPrixMax(e.target.value)}
                placeholder="Ex : 25 000"
                min={0}
                className="text-sm text-gray-800 outline-none mt-1 bg-transparent placeholder-gray-300"
              />
            </div>

            {/* Bouton */}
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-600 text-white font-bold
                         px-6 py-3 rounded-xl transition-colors whitespace-nowrap
                         flex-shrink-0 text-sm"
            >
              🔍 Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* ════════ ANNONCES EN VEDETTE ════════ */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* En-tête section */}
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-gray-900">
                Annonces disponibles
              </h2>
              {!loading && (
                <p className="text-gray-400 mt-2 text-sm">
                  {total > 0
                    ? `${total} chambre(s) disponible(s) en ce moment`
                    : "Aucune annonce pour le moment"}
                </p>
              )}
            </div>
            <Link
              href="/listings"
              className="text-sm font-semibold text-red-500 hover:text-red-600
                         underline underline-offset-4 transition-colors"
            >
              Voir toutes les annonces →
            </Link>
          </div>

          {/* Grille */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : annonces.length > 0 ? (
              annonces.map((a) => <AnnonceCard key={a.id} annonce={a} />)
            ) : (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <p className="text-4xl mb-4">🏠</p>
                <p className="font-medium">Aucune annonce disponible.</p>
                <p className="text-sm mt-1">
                  Vérifiez que le backend est démarré sur le port 8080.
                </p>
              </div>
            )}
          </div>

          {/* Bouton voir plus */}
          {!loading && annonces.length > 0 && (
            <div className="text-center mt-12">
              <Link
                href="/listings"
                className="inline-block bg-red-500 hover:bg-red-600 text-white
                           font-bold px-8 py-3 rounded-full transition-colors text-sm"
              >
                Voir toutes les annonces
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ════════ COMMENT ÇA MARCHE ════════ */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-gray-900
                         text-center mb-14">
            Comment ça marche ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              {
                icon: "🔍",
                titre: "Recherchez",
                desc: "Filtrez par ville, prix ou capacité pour trouver la chambre idéale.",
              },
              {
                icon: "📅",
                titre: "Réservez",
                desc: "Choisissez vos dates et envoyez votre demande à l'hôte.",
              },
              {
                icon: "💳",
                titre: "Payez",
                desc: "Paiement sécurisé une fois la réservation confirmée par l'hôte.",
              },
              {
                icon: "⭐",
                titre: "Évaluez",
                desc: "Après votre séjour, laissez un avis pour aider la communauté.",
              },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center">
                {/* Numéro + icône */}
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center
                                  justify-center text-3xl border-2 border-red-100">
                    {step.icon}
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500
                                   text-white text-xs font-bold rounded-full
                                   flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.titre}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>

                {/* Flèche entre les étapes */}
                {i < 3 && (
                  <div className="hidden md:block absolute mt-8 text-gray-200 text-2xl
                                  translate-x-[160px]">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CTA HÔTE ════════ */}
      <section className="bg-gradient-to-r from-gray-900 to-red-950 py-20 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row
                        items-center justify-between gap-10">
          <div className="text-white max-w-xl">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4">
              Vous avez une chambre à louer ?
            </h2>
            <p className="text-gray-300 leading-relaxed mb-8">
              Rejoignez notre communauté d&apos;hôtes, publiez votre annonce
              gratuitement et commencez à recevoir des réservations dès aujourd&apos;hui.
              Gérez tout depuis votre tableau de bord.
            </p>
            <Link
              href="/register?role=HOTE"
              className="inline-block bg-red-500 hover:bg-red-600 text-white
                         font-bold px-8 py-3 rounded-full transition-colors text-sm"
            >
              Devenir hôte gratuitement →
            </Link>
          </div>
          <div className="text-8xl select-none hidden md:block">🏠</div>
        </div>
      </section>
    </>
  );
}
