"use client";
// ============================================================
//  NidiRoom — app/page.tsx
//  Homepage : design African Luxury × Modern Sophistication
//  Tokens: Forest #1A3C2E | Gold #C9943A | Ivory #F7F3EC
// ============================================================

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAnnonces, Annonce } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

// ══════════════════════════════════════════════════════════
//  ICÔNES SVG INLINE
// ══════════════════════════════════════════════════════════

const IconSearch    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const IconPin       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconStar      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IconChevron   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>;
const IconShield    = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconCalendar  = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const IconHeadset   = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z"/></svg>;
const IconTag       = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01"/></svg>;

// ══════════════════════════════════════════════════════════
//  ÉTOILES
// ══════════════════════════════════════════════════════════

function Stars({ count = 5 }: { count?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < count ? "#C9943A" : "#E8DCCC" }}>
          <IconStar />
        </span>
      ))}
    </span>
  );
}

// ══════════════════════════════════════════════════════════
//  CARTE ANNONCE
// ══════════════════════════════════════════════════════════

function RoomCard({ annonce }: { annonce: Annonce }) {
  const router = useRouter();
  return (
    <article
      onClick={() => router.push(`/listings/${annonce.id}`)}
      className="card cursor-pointer flex flex-col"
      style={{ background: "#FFFFFF" }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: "220px" }}>
        {annonce.image_principale ? (
          <img src={annonce.image_principale} alt={annonce.titre}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: "linear-gradient(135deg, #1A3C2E 0%, #224D3A 100%)" }}>
            🏨
          </div>
        )}
        {/* Badge ville */}
        <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
          style={{ background: "rgba(26,60,46,0.85)", color: "#C9943A", backdropFilter: "blur(8px)" }}>
          <IconPin /> {annonce.ville}
        </span>
        {/* Badge meilleur prix (aléatoire pour démo) */}
        {annonce.note_moyenne && parseFloat(String(annonce.note_moyenne)) >= 4.5 && (
          <span className="price-badge-best absolute top-3 right-3 text-xs">
            Meilleur prix
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="flex flex-col flex-1 p-5">
        {/* Nom hôtel (accent) */}
        <p className="font-accent italic text-base mb-1" style={{ color: "#C9943A" }}>
          Hébergement de charme
        </p>
        {/* Titre */}
        <h3 className="font-body font-bold text-lg leading-snug mb-2 line-clamp-2"
          style={{ color: "#1C1C1C" }}>
          {annonce.titre}
        </h3>
        {/* Note */}
        {annonce.note_moyenne && (
          <div className="flex items-center gap-2 mb-3">
            <Stars count={Math.round(parseFloat(String(annonce.note_moyenne)))} />
            <span className="text-xs font-medium" style={{ color: "#6B7280" }}>
              {parseFloat(String(annonce.note_moyenne)).toFixed(1)}
              {annonce.nombre_avis ? ` (${annonce.nombre_avis} avis)` : ""}
            </span>
          </div>
        )}
        {/* Amenités rapides */}
        <div className="flex gap-3 text-xs mb-4" style={{ color: "#6B7280" }}>
          <span>👤 {annonce.capacite} pers.</span>
          {annonce.superficie && <span>📐 {annonce.superficie} m²</span>}
        </div>

        {/* Séparateur + Prix */}
        <div className="mt-auto">
          <hr style={{ borderColor: "#E8DCCC", margin: "0 0 14px" }} />
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-body font-bold text-xl" style={{ color: "#C9943A" }}>
                {Number(annonce.prix_par_nuit).toLocaleString("fr-FR")}
              </span>
              <span className="text-sm font-normal ml-1" style={{ color: "#9CA3AF" }}>
                FCFA / nuit
              </span>
            </div>
            <button className="btn-gold text-sm" style={{ padding: "9px 18px" }}>
              Réserver
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ══════════════════════════════════════════════════════════
//  SKELETON
// ══════════════════════════════════════════════════════════

function RoomSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton" style={{ height: "220px" }} />
      <div className="p-5 space-y-3">
        <div className="skeleton h-4 rounded w-1/3" />
        <div className="skeleton h-5 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="skeleton h-10 rounded" style={{ marginTop: "24px" }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  DESTINATIONS DATA
// ══════════════════════════════════════════════════════════

const DESTINATIONS = [
  { ville: "Yaoundé",    hotels: 7,  emoji: "🏛️", desc: "Capitale politique" },
  { ville: "Douala",     hotels: 12, emoji: "🌊", desc: "Capitale économique" },
  { ville: "Kribi",      hotels: 5,  emoji: "🏖️", desc: "Plages paradisiaques" },
  { ville: "Limbé",      hotels: 4,  emoji: "🌋", desc: "Mont Cameroun" },
  { ville: "Bafoussam",  hotels: 3,  emoji: "🌿", desc: "Hauts Plateaux" },
];

// ══════════════════════════════════════════════════════════
//  TESTIMONIALS DATA
// ══════════════════════════════════════════════════════════

const TESTIMONIALS = [
  {
    nom: "Amina K.",
    ville: "Yaoundé",
    note: 5,
    quote: "Une expérience inoubliable. Le Lodge Kribi Beach dépasse toutes les attentes — service impeccable et vue à couper le souffle sur l'Atlantique.",
  },
  {
    nom: "Jean-Paul M.",
    ville: "Douala",
    note: 5,
    quote: "Réservation en moins de 3 minutes, paiement via MTN Mobile Money sans friction. La Villa Bantu est exactement ce qu'on cherchait pour notre anniversaire.",
  },
  {
    nom: "Sarah B.",
    ville: "Paris",
    note: 5,
    quote: "Voyager au Cameroun n'a jamais été aussi simple. Des hôtels authentiques, des prix en FCFA transparents, et un support 24h/7 vraiment réactif.",
  },
];

// ══════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [ville,    setVille]    = useState("");
  const [capacite, setCapacite] = useState("");
  const [prixMax,  setPrixMax]  = useState("");
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getAnnonces({ size: 6 }).then(({ data, error }) => {
      if (error) showToast("Impossible de charger les annonces.", "error");
      else if (data) setAnnonces(data.annonces ?? []);
      setLoading(false);
    });
  }, []); // eslint-disable-line

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (ville)    p.set("ville", ville);
    if (capacite) p.set("capacite", capacite);
    if (prixMax)  p.set("prix_max", prixMax);
    router.push(`/listings?${p.toString()}`);
  }

  // ══════════════════════════════════════════════════════
  //  RENDU
  // ══════════════════════════════════════════════════════

  return (
    <>
      {/* ════════════════════════════════════════════════
          HERO — Full viewport
      ════════════════════════════════════════════════ */}
      <section
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg, #122B21 0%, #1A3C2E 45%, #2D5A3D 100%)",
          position: "relative",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
        className="kente-overlay"
      >
        {/* Cercles décoratifs dorés */}
        <div style={{
          position: "absolute", top: "-80px", right: "-80px",
          width: "480px", height: "480px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,148,58,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-120px", left: "-60px",
          width: "360px", height: "360px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,148,58,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        {/* Ligne dorée verticale décorative */}
        <div style={{
          position: "absolute", top: "15%", right: "8%",
          width: "1px", height: "220px",
          background: "linear-gradient(180deg, transparent, #C9943A, transparent)",
          opacity: 0.5,
        }} />

        <div className="container" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
          <div style={{ maxWidth: "760px" }}>

            {/* Eyebrow */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "40px", height: "1px", background: "#C9943A" }} />
              <span style={{
                fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600,
                letterSpacing: "3px", textTransform: "uppercase", color: "#C9943A",
              }}>
                Hébergements Premium au Cameroun
              </span>
            </div>

            {/* Titre hero */}
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(52px, 7vw, 84px)",
              fontWeight: 700,
              color: "#FFFFFF",
              lineHeight: 1.1,
              marginBottom: "24px",
              letterSpacing: "-1px",
            }}>
              Découvrez le Cameroun,<br />
              <span style={{ color: "#C9943A", fontStyle: "italic" }}>
                Une Chambre à la Fois.
              </span>
            </h1>

            {/* Sous-titre */}
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "18px", fontWeight: 400,
              color: "#F7F3EC", opacity: 0.85, marginBottom: "48px",
              lineHeight: 1.7, maxWidth: "540px",
            }}>
              Luxe, confort & âme locale — à partir de{" "}
              <strong style={{ color: "#C9943A" }}>15 000 FCFA/nuit</strong>.
              Des lodges de brousse aux hôtels urbains de standing.
            </p>

            {/* ── SEARCH BAR FROSTED GLASS ── */}
            <form onSubmit={handleSearch}
              className="glass"
              style={{
                borderRadius: "16px",
                padding: "10px",
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                maxWidth: "780px",
              }}
            >
              {/* Destination */}
              <div style={{ flex: "2", minWidth: "160px", position: "relative" }}>
                <label style={{
                  display: "block", fontSize: "10px", fontWeight: 700,
                  letterSpacing: "1.5px", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.7)", padding: "10px 16px 2px",
                }}>
                  Destination
                </label>
                <input type="text" value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Yaoundé, Kribi, Douala…"
                  style={{
                    width: "100%", padding: "4px 16px 10px",
                    background: "transparent", border: "none", outline: "none",
                    fontFamily: "var(--font-body)", fontSize: "15px",
                    color: "#FFFFFF", caretColor: "#C9943A",
                  }}
                />
              </div>

              {/* Séparateur */}
              <div style={{ width: "1px", background: "rgba(255,255,255,0.2)", margin: "8px 0" }} />

              {/* Personnes */}
              <div style={{ flex: "1", minWidth: "110px" }}>
                <label style={{
                  display: "block", fontSize: "10px", fontWeight: 700,
                  letterSpacing: "1.5px", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.7)", padding: "10px 16px 2px",
                }}>
                  Personnes
                </label>
                <input type="number" value={capacite} min={1}
                  onChange={(e) => setCapacite(e.target.value)}
                  placeholder="Nombre"
                  style={{
                    width: "100%", padding: "4px 16px 10px",
                    background: "transparent", border: "none", outline: "none",
                    fontFamily: "var(--font-body)", fontSize: "15px",
                    color: "#FFFFFF", caretColor: "#C9943A",
                  }}
                />
              </div>

              {/* Séparateur */}
              <div style={{ width: "1px", background: "rgba(255,255,255,0.2)", margin: "8px 0" }} />

              {/* Prix max */}
              <div style={{ flex: "1", minWidth: "130px" }}>
                <label style={{
                  display: "block", fontSize: "10px", fontWeight: 700,
                  letterSpacing: "1.5px", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.7)", padding: "10px 16px 2px",
                }}>
                  Budget max
                </label>
                <input type="number" value={prixMax} min={0}
                  onChange={(e) => setPrixMax(e.target.value)}
                  placeholder="FCFA / nuit"
                  style={{
                    width: "100%", padding: "4px 16px 10px",
                    background: "transparent", border: "none", outline: "none",
                    fontFamily: "var(--font-body)", fontSize: "15px",
                    color: "#FFFFFF", caretColor: "#C9943A",
                  }}
                />
              </div>

              {/* Bouton */}
              <button type="submit" className="btn-gold"
                style={{ borderRadius: "10px", padding: "0 28px", alignSelf: "stretch", minHeight: "56px" }}>
                <IconSearch />
                Rechercher
              </button>
            </form>

            {/* Destinations rapides */}
            <div style={{ marginTop: "28px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", alignSelf: "center" }}>
                Populaires :
              </span>
              {["Kribi", "Douala", "Limbé"].map((d) => (
                <button key={d}
                  onClick={() => { setVille(d); router.push(`/listings?ville=${d}`); }}
                  style={{
                    fontSize: "13px", fontFamily: "var(--font-body)", fontWeight: 500,
                    color: "#C9943A", background: "rgba(201,148,58,0.12)",
                    border: "1px solid rgba(201,148,58,0.3)",
                    padding: "5px 14px", borderRadius: "100px", cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats en bas du hero */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          borderTop: "1px solid rgba(201,148,58,0.2)",
          background: "rgba(18,43,33,0.8)",
          backdropFilter: "blur(10px)",
        }}>
          <div className="container">
            <div style={{
              display: "flex", gap: "0",
              flexWrap: "wrap",
            }}>
              {[
                { val: "31+",      label: "Hébergements vérifiés" },
                { val: "5 villes", label: "Destinations au Cameroun" },
                { val: "2 400+",   label: "Clients satisfaits" },
                { val: "24h/7",    label: "Support local" },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: "1", minWidth: "140px",
                  padding: "20px 32px",
                  borderRight: i < 3 ? "1px solid rgba(201,148,58,0.15)" : "none",
                }}>
                  <p style={{
                    fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700,
                    color: "#C9943A", lineHeight: 1,
                  }}>{s.val}</p>
                  <p style={{ fontSize: "12px", color: "rgba(247,243,236,0.6)", marginTop: "4px" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          DESTINATIONS POPULAIRES
      ════════════════════════════════════════════════ */}
      <section className="section" style={{ background: "#F7F3EC" }}>
        <div className="container">
          <div style={{ marginBottom: "40px" }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600,
              letterSpacing: "3px", textTransform: "uppercase",
              color: "#C9943A", marginBottom: "10px",
            }}>
              Explorez
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(32px, 4vw, 48px)", color: "#1A3C2E",
            }}>
              Destinations Populaires
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "20px",
          }}>
            {DESTINATIONS.map((d) => (
              <Link key={d.ville} href={`/listings?ville=${d.ville}`}
                className="card group"
                style={{
                  background: "#1A3C2E",
                  padding: "28px 24px",
                  display: "flex", flexDirection: "column",
                  gap: "10px", textDecoration: "none",
                  transition: "transform 0.25s, box-shadow 0.25s",
                }}
              >
                <span style={{ fontSize: "36px" }}>{d.emoji}</span>
                <div>
                  <p style={{
                    fontFamily: "var(--font-accent)", fontStyle: "italic",
                    fontSize: "22px", fontWeight: 600, color: "#FFFFFF",
                    marginBottom: "4px",
                  }}>{d.ville}</p>
                  <p style={{ fontSize: "13px", color: "rgba(247,243,236,0.65)" }}>
                    {d.desc}
                  </p>
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginTop: "8px",
                }}>
                  <span style={{
                    fontSize: "12px", fontWeight: 600, color: "#C9943A",
                    background: "rgba(201,148,58,0.15)", padding: "4px 10px",
                    borderRadius: "100px",
                  }}>
                    {d.hotels} hôtels
                  </span>
                  <span style={{ color: "#C9943A", transition: "transform 0.2s" }}
                    className="group-hover:translate-x-1">
                    <IconChevron />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SÉJOURS RECOMMANDÉS
      ════════════════════════════════════════════════ */}
      <section className="section" style={{ background: "#FFFFFF" }}>
        <div className="container">
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-end", flexWrap: "wrap", gap: "16px",
            marginBottom: "40px",
          }}>
            <div>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600,
                letterSpacing: "3px", textTransform: "uppercase",
                color: "#C9943A", marginBottom: "10px",
              }}>
                Sélection de la semaine
              </p>
              <h2 style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: "clamp(32px, 4vw, 48px)", color: "#1C1C1C",
              }}>
                Nos Séjours Recommandés
              </h2>
            </div>
            <Link href="/listings" style={{
              fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600,
              color: "#1A3C2E", borderBottom: "1px solid #1A3C2E",
              paddingBottom: "2px", display: "flex", alignItems: "center", gap: "4px",
            }}>
              Voir tout <IconChevron />
            </Link>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "28px",
          }}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <RoomSkeleton key={i} />)
              : annonces.length > 0
              ? annonces.map((a) => <RoomCard key={a.id} annonce={a} />)
              : (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0" }}>
                  <p style={{ fontSize: "48px", marginBottom: "16px" }}>🏨</p>
                  <p style={{ color: "#6B7280", fontSize: "15px" }}>
                    Aucune annonce disponible. Lancez le backend sur le port 8080.
                  </p>
                </div>
              )
            }
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          POURQUOI NOUS CHOISIR
      ════════════════════════════════════════════════ */}
      <section className="section kente-overlay"
        style={{ background: "#1A3C2E" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600,
              letterSpacing: "3px", textTransform: "uppercase",
              color: "#C9943A", marginBottom: "12px",
            }}>
              Notre engagement
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(32px, 4vw, 48px)", color: "#FFFFFF",
            }}>
              Pourquoi Réserver avec Nous ?
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "32px",
          }}>
            {[
              {
                icon: <IconShield />,
                titre: "Paiement Sécurisé",
                desc: "Mobile Money, Orange Money & carte bancaire acceptés. Vos données sont chiffrées.",
              },
              {
                icon: <IconCalendar />,
                titre: "Annulation Flexible",
                desc: "Annulez gratuitement jusqu'à 48h avant votre arrivée. Sans questions.",
              },
              {
                icon: <IconTag />,
                titre: "Prix Garantis en FCFA",
                desc: "Aucune surprise de change. Tous nos prix sont affichés en Franc CFA.",
              },
              {
                icon: <IconHeadset />,
                titre: "Support Local 24h/7",
                desc: "Une équipe camerounaise disponible par téléphone, WhatsApp ou email.",
              },
            ].map((f, i) => (
              <div key={i} style={{
                padding: "32px 24px",
                borderRadius: "12px",
                border: "1px solid rgba(201,148,58,0.2)",
                background: "rgba(255,255,255,0.04)",
                transition: "border-color 0.25s, background 0.25s",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,148,58,0.5)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(201,148,58,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,148,58,0.2)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                }}
              >
                <div style={{ color: "#C9943A", marginBottom: "16px" }}>{f.icon}</div>
                <h3 style={{
                  fontFamily: "var(--font-body)", fontWeight: 700,
                  fontSize: "17px", color: "#FFFFFF", marginBottom: "10px",
                }}>{f.titre}</h3>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(247,243,236,0.65)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          TÉMOIGNAGES
      ════════════════════════════════════════════════ */}
      <section className="section" style={{ background: "#F7F3EC" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600,
              letterSpacing: "3px", textTransform: "uppercase",
              color: "#C9943A", marginBottom: "12px",
            }}>
              Avis vérifiés
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(32px, 4vw, 48px)", color: "#1C1C1C",
            }}>
              Ce Que Disent Nos Clients
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: "#FFFFFF",
                borderRadius: "12px",
                padding: "28px",
                boxShadow: "0px 8px 24px rgba(0,0,0,0.06)",
                borderLeft: "4px solid #C4622D",
                display: "flex", flexDirection: "column", gap: "16px",
              }}>
                {/* Étoiles */}
                <Stars count={t.note} />
                {/* Citation */}
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "15px",
                  lineHeight: 1.75, color: "#484848", fontStyle: "italic",
                  flex: 1,
                }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Auteur */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #1A3C2E, #C9943A)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#FFFFFF", fontWeight: 700, fontSize: "16px",
                    flexShrink: 0,
                  }}>
                    {t.nom[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "14px", color: "#1C1C1C" }}>
                      {t.nom}
                    </p>
                    <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
                      <IconPin /> {t.ville}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          NEWSLETTER CTA
      ════════════════════════════════════════════════ */}
      <section className="kente-overlay"
        style={{
          background: "#1A3C2E",
          padding: "72px 0",
          position: "relative",
        }}>
        {/* Bordures kente haut/bas */}
        <div className="divider-gold" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <div className="divider-gold" style={{ position: "absolute", bottom: 0, left: 0, right: 0 }} />

        <div className="container" style={{ textAlign: "center" }}>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600,
            letterSpacing: "3px", textTransform: "uppercase",
            color: "#C9943A", marginBottom: "16px",
          }}>
            Newsletter
          </p>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 44px)", color: "#FFFFFF",
            marginBottom: "12px",
          }}>
            Partez à la Découverte du Cameroun
          </h2>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "16px",
            color: "rgba(247,243,236,0.7)", marginBottom: "36px",
            maxWidth: "480px", margin: "0 auto 36px",
          }}>
            Offres exclusives, nouvelles destinations et conseils de voyage
            directement dans votre boîte mail.
          </p>

          <div style={{
            display: "flex", gap: "0",
            maxWidth: "480px", margin: "0 auto",
            borderRadius: "10px", overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}>
            <input
              type="email"
              placeholder="votre@email.com"
              style={{
                flex: 1, padding: "16px 20px",
                fontFamily: "var(--font-body)", fontSize: "15px",
                border: "none", outline: "none",
                background: "#FFFFFF", color: "#1C1C1C",
              }}
            />
            <button className="btn-gold" style={{
              borderRadius: "0", padding: "16px 28px", whiteSpace: "nowrap",
            }}>
              S&apos;inscrire
            </button>
          </div>

          <p style={{
            fontSize: "12px", color: "rgba(255,255,255,0.35)",
            marginTop: "16px",
          }}>
            Pas de spam. Désabonnement en 1 clic.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CTA HÔTE
      ════════════════════════════════════════════════ */}
      <section className="section" style={{ background: "#FFFFFF" }}>
        <div className="container">
          <div style={{
            background: "linear-gradient(135deg, #F7F3EC 0%, #E8DCCC 100%)",
            borderRadius: "20px",
            padding: "56px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "32px",
            border: "1px solid #E8DCCC",
          }}>
            <div style={{ maxWidth: "520px" }}>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600,
                letterSpacing: "3px", textTransform: "uppercase",
                color: "#C9943A", marginBottom: "12px",
              }}>
                Espace hôte
              </p>
              <h2 style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: "clamp(28px, 3vw, 40px)", color: "#1A3C2E",
                marginBottom: "14px",
              }}>
                Vous avez une chambre à louer ?
              </h2>
              <p style={{
                fontSize: "15px", lineHeight: 1.75, color: "#484848",
                marginBottom: "28px",
              }}>
                Rejoignez notre communauté d&apos;hôtes camerounais. Publiez votre
                annonce gratuitement et commencez à recevoir des réservations dès aujourd&apos;hui.
              </p>
              <Link href="/register?role=HOTE" className="btn-gold">
                Devenir hôte gratuitement →
              </Link>
            </div>
            <div style={{
              fontSize: "96px",
              filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.15))",
              flexShrink: 0,
            }}>
              🏨
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
