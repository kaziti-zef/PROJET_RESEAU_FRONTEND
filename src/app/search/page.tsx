"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal, Star, Wifi, Wind, Coffee, Waves, Shield, MapPin, X, DollarSign,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { formatPrix, annonceToRoom, fallbackRooms, type Room } from "@/data/rooms";
import {
  getAnnonces, getTypesChambre, getCaracteristiques, getPays, getVilles,
  type SearchParams, type TypeChambre, type Caracteristique, type Pays, type Ville,
} from "@/lib/api";
import styles from "./search.module.css";

const amenityLabels: Record<string, string> = {
  wifi: "WiFi", ac: "Climatisation", breakfast: "Petit-déjeuner", pool: "Piscine", restaurant: "Restaurant", security: "Sécurité 24h",
};
const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi size={14} />, ac: <Wind size={14} />, breakfast: <Coffee size={14} />,
  pool: <Waves size={14} />, restaurant: <span className="text-xs">🍽</span>, security: <Shield size={14} />,
};

const FETCH_LIMIT = 1000;

const typeSelectStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#1A3C2E",
  background: "#fff", border: "1px solid rgba(26,60,46,0.18)", borderRadius: "8px",
  padding: "9px 12px", width: "100%", outline: "none", cursor: "pointer",
};

function SearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city") || "";
  const typeParam = searchParams.get("type") || "";
  const paysParam = searchParams.get("pays") || "";
  const checkInParam = searchParams.get("checkin") || "";
  const checkOutParam = searchParams.get("checkout") || "";
  const guestsParam = Number(searchParams.get("guests") || 1);

  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres locaux
  const [maxPrice, setMaxPrice] = useState(500000);
  const [budget, setBudget] = useState<string>(""); // champ budget total séjour
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedCaracs, setSelectedCaracs] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState(typeParam);
  const [selectedPays, setSelectedPays] = useState(paysParam);
  const [selectedVille, setSelectedVille] = useState(cityParam);
  const [sortBy, setSortBy] = useState("pertinence");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Catalogues
  const [types, setTypes] = useState<TypeChambre[]>([]);
  const [caracs, setCaracs] = useState<Caracteristique[]>([]);
  const [paysList, setPaysList] = useState<Pays[]>([]);
  const [villesList, setVillesList] = useState<Ville[]>([]);

  // Nombre de nuits (calculé depuis les dates)
  const nbNuits = useMemo(() => {
    if (!checkInParam || !checkOutParam) return 1;
    const d1 = new Date(checkInParam);
    const d2 = new Date(checkOutParam);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [checkInParam, checkOutParam]);

  // Charger catalogues au montage
  useEffect(() => {
    Promise.all([getTypesChambre(), getCaracteristiques(), getPays()]).then(([t, c, p]) => {
      if (t.data) setTypes(t.data);
      if (c.data) setCaracs(c.data);
      if (p.data) setPaysList(p.data);
    });
  }, []);

  // Villes selon pays sélectionné
  useEffect(() => {
    if (selectedPays) {
      getVilles(selectedPays).then(({ data }) => { if (data) setVillesList(data); });
    } else {
      getVilles().then(({ data }) => { if (data) setVillesList(data); });
    }
  }, [selectedPays]);

  // Sync params URL
  useEffect(() => { setSelectedType(typeParam); }, [typeParam]);
  useEffect(() => { setSelectedVille(cityParam); }, [cityParam]);
  useEffect(() => { setSelectedPays(paysParam); }, [paysParam]);

  // ── Récupération des chambres via le backend ──────────────
  // Quand tri=pertinence, on envoie budget+nb_nuits pour activer le scoring (PLNE)
  useEffect(() => {
    (async () => {
      setLoading(true);
      const params: SearchParams = { limit: FETCH_LIMIT };

      // Filtres durs (SQL côté backend)
      if (selectedVille) params.ville = selectedVille;
      if (selectedType) params.type = selectedType;
      if (selectedPays) params.pays = selectedPays;
      if (guestsParam > 1) params.capacite = guestsParam;

      // Tri + modèle de scoring
      if (sortBy === "pertinence") {
        params.tri = "pertinence";
        // Paramètres du modèle mathématique (PLNE)
        params.nb_nuits = nbNuits;
        if (budget) params.budget = Number(budget);
        else if (maxPrice < 500000) params.prix_max = maxPrice; // fallback : prix max / nuit
        if (selectedAmenities.length) params.equipements = selectedAmenities.join(",");
        if (selectedCaracs.length) params.caracteristiques = selectedCaracs.join(",");
      } else if (sortBy === "rating") {
        params.tri = "populaire";
      } else if (sortBy === "recent") {
        params.tri = "recent";
      }

      // Filtre prix (pour les tris non-pertinence ou comme filet de sécurité)
      if (maxPrice < 500000 && sortBy !== "pertinence") params.prix_max = maxPrice;

      const { data } = await getAnnonces(params);
      if (data?.annonces?.length) setAllRooms(data.annonces.map(annonceToRoom));
      else setAllRooms((selectedVille || selectedType || selectedPays) ? [] : fallbackRooms);
      setLoading(false);
    })();
  }, [selectedVille, selectedType, selectedPays, sortBy, selectedAmenities, selectedCaracs, budget, maxPrice, nbNuits, guestsParam]);

  const filtered = useMemo(() => {
    const filtreDur = sortBy !== "pertinence";
    let list = allRooms.filter((r) => {
      if (r.price > maxPrice) return false;
      if (selectedStars.length > 0 && !selectedStars.includes(r.stars)) return false;
      if (filtreDur && selectedAmenities.length > 0 && !selectedAmenities.every((a) => r.amenities.includes(a))) return false;
      if (filtreDur && selectedCaracs.length > 0 && !selectedCaracs.every((c) => (r.caracteristiques || []).includes(c))) return false;
      return true;
    });
    if (sortBy === "price_asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [allRooms, maxPrice, selectedStars, selectedAmenities, selectedCaracs, sortBy]);

  const toggleStar = (n: number) => setSelectedStars((p) => p.includes(n) ? p.filter((s) => s !== n) : [...p, n]);
  const toggleAmenity = (a: string) => setSelectedAmenities((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);
  const toggleCarac = (c: string) => setSelectedCaracs((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);

  const typeNom = types.find((t) => t.code === selectedType)?.nom;
  const paysNom = paysList.find((p) => p.code === selectedPays)?.nom;
  const titre = selectedVille
    ? `Chambres à ${selectedVille}`
    : typeNom ? `Chambres — ${typeNom}`
    : paysNom ? `Chambres en ${paysNom}`
    : "Toutes les chambres";

  // Devise du pays sélectionné (pour affichage du budget)
  const deviseSelectionnee = paysList.find((p) => p.code === selectedPays)?.devise_code || "FCFA";

  function resetFilters() {
    setMaxPrice(500000);
    setBudget("");
    setSelectedStars([]);
    setSelectedAmenities([]);
    setSelectedCaracs([]);
    setSelectedType("");
    setSelectedPays("");
    setSelectedVille("");
    router.push("/search");
  }

  const FilterPanel = () => (
    <div>
      {/* Pays */}
      <div className="mb-7">
        <h4 className={`mb-4 ${styles.filterTitle}`}>Pays</h4>
        <select value={selectedPays} onChange={(e) => { setSelectedPays(e.target.value); setSelectedVille(""); }} style={typeSelectStyle}>
          <option value="">Tous les pays</option>
          {paysList.map((p) => (<option key={p.code} value={p.code}>{p.nom}</option>))}
        </select>
      </div>

      {/* Ville */}
      <div className="mb-7">
        <h4 className={`mb-4 ${styles.filterTitle}`}>Ville</h4>
        <select value={selectedVille} onChange={(e) => setSelectedVille(e.target.value)} style={typeSelectStyle}>
          <option value="">Toutes les villes</option>
          {villesList.map((v) => (<option key={v.id} value={v.nom}>{v.nom}</option>))}
        </select>
      </div>

      {/* Type de chambre */}
      <div className="mb-7">
        <h4 className={`mb-4 ${styles.filterTitle}`}>Type de chambre</h4>
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={typeSelectStyle}>
          <option value="">Tous les types</option>
          {types.map((t) => (<option key={t.code} value={t.code}>{t.nom}</option>))}
        </select>
      </div>

      {/* Budget total séjour (alimente le modèle PLNE) */}
      <div className="mb-7">
        <h4 className={`mb-3 ${styles.filterTitle}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <DollarSign size={14} color="#C9943A" />
          Budget total séjour
        </h4>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "rgba(26,60,46,0.55)", marginBottom: 8 }}>
          Utilisé par le moteur de recommandation pour maximiser votre confort dans votre enveloppe.{nbNuits > 1 ? ` (${nbNuits} nuits)` : ""}
        </p>
        <div style={{ position: "relative" }}>
          <input
            type="number"
            min={0}
            step={1000}
            placeholder={`Budget en ${deviseSelectionnee}`}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            style={{ ...typeSelectStyle, paddingRight: "70px" }}
          />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#C9943A", fontWeight: 600 }}>
            {deviseSelectionnee}
          </span>
        </div>
      </div>

      {/* Prix / nuit (filtre dur complémentaire) */}
      <div className="mb-7">
        <h4 className={`mb-4 ${styles.filterTitle}`}>Prix par nuit (max)</h4>
        <div className="flex justify-between mb-3">
          <span className={styles.priceLabel}>0</span>
          <span className={styles.priceValue}>{formatPrix(maxPrice, paysList.find(p => p.code === selectedPays)?.devise_symbole)}</span>
        </div>
        <input type="range" min={5000} max={500000} step={5000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className={`w-full ${styles.filterRange}`} />
      </div>

      {/* Étoiles */}
      <div className="mb-7">
        <h4 className={`mb-4 ${styles.filterTitle}`}>Étoiles</h4>
        <div className="flex flex-col gap-2.5">
          {[5, 4, 3].map((n) => (
            <label key={n} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={selectedStars.includes(n)} onChange={() => toggleStar(n)} className={styles.checkbox} />
              <div className="flex items-center gap-1">{[...Array(n)].map((_, i) => (<Star key={i} size={14} fill="#C9943A" color="#C9943A" strokeWidth={0} />))}</div>
            </label>
          ))}
        </div>
      </div>

      {/* Équipements */}
      <div className="mb-7">
        <h4 className={`mb-4 ${styles.filterTitle}`}>Équipements{sortBy === "pertinence" ? " (préférences)" : ""}</h4>
        {sortBy === "pertinence" && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "rgba(26,60,46,0.55)", marginBottom: 8 }}>
            En mode Pertinence, ces critères influencent le classement.
          </p>
        )}
        <div className="flex flex-col gap-2.5">
          {Object.keys(amenityLabels).map((a) => (
            <label key={a} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={selectedAmenities.includes(a)} onChange={() => toggleAmenity(a)} className={styles.checkbox} />
              <span className={`flex items-center gap-2 ${styles.filterLabel}`}>{amenityIcons[a]}{amenityLabels[a]}</span>
            </label>
          ))}
        </div>
      </div>

      {caracs.length > 0 && (
        <div className="mb-4">
          <h4 className={`mb-4 ${styles.filterTitle}`}>Caractéristiques{sortBy === "pertinence" ? " (préférences)" : ""}</h4>
          <div className="flex flex-col gap-2.5">
            {caracs.map((c) => (
              <label key={c.code} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={selectedCaracs.includes(c.code)} onChange={() => toggleCarac(c.code)} className={styles.checkbox} />
                <span className={`flex items-center gap-2 ${styles.filterLabel}`}>{c.nom}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button onClick={resetFilters} className={styles.resetBtn}>
        Réinitialiser les filtres
      </button>
    </div>
  );

  return (
    <div className={styles.pageWrap}>
      <div className={styles.banner}>
        <div className={`mx-auto px-6 flex items-center justify-between flex-wrap gap-4 ${styles.bannerInner}`}>
          <div>
            <h1 className={styles.pageTitle}>{titre}</h1>
            <p className={styles.pageCount}>
              {loading ? "Chargement…" : `${filtered.length} chambre${filtered.length > 1 ? "s" : ""} trouvée${filtered.length > 1 ? "s" : ""}`}
              {nbNuits > 1 && !loading && ` · ${nbNuits} nuit${nbNuits > 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect}>
              <option value="pertinence" className="bg-forest">Pertinence (IA)</option>
              <option value="price_asc" className="bg-forest">Prix croissant</option>
              <option value="price_desc" className="bg-forest">Prix décroissant</option>
              <option value="rating" className="bg-forest">Mieux notées</option>
              <option value="recent" className="bg-forest">Récentes</option>
            </select>
            <button className={`md:hidden flex items-center gap-2 ${styles.mobileFilterBtn}`} onClick={() => setMobileFiltersOpen(true)}>
              <SlidersHorizontal size={16} /> Filtres
            </button>
          </div>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className={`fixed inset-0 z-50 flex ${styles.drawerOverlay}`}>
          <div className={`ml-auto w-80 h-full overflow-y-auto p-6 ${styles.drawerPanel}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={styles.drawerTitle}>Filtres</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className={styles.drawerClose}><X size={22} color="#1C1C1C" /></button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      <div className={`mx-auto px-6 py-10 ${styles.mainContent}`}>
        <div className="flex gap-8">
          <aside className={`hidden md:block flex-shrink-0 rounded-2xl p-7 ${styles.sidebar}`}>
            <div className="flex items-center gap-2 mb-7">
              <SlidersHorizontal size={18} color="#1A3C2E" />
              <h3 className={styles.sidebarTitle}>Filtres</h3>
            </div>
            <FilterPanel />
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="flex flex-col gap-5">{[...Array(3)].map((_, i) => (<div key={i} className="skeleton rounded-2xl h-[200px]" />))}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className={styles.emptyTitle}>Aucune chambre trouvée</p>
                <p className={styles.emptyText}>Essayez d&apos;ajuster vos filtres ou de changer de ville / pays.</p>
                <button onClick={resetFilters} style={{ marginTop: 16, padding: "10px 24px", background: "linear-gradient(135deg, #C9943A, #D9A84A)", color: "#1A3C2E", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                  Réinitialiser
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {filtered.map((room) => (
                  <div key={room.id} className={`rounded-2xl overflow-hidden flex flex-col md:flex-row ${styles.resultCard}`}>
                    <div className={`relative flex-shrink-0 overflow-hidden ${styles.resultImage}`}>
                      <ImageWithFallback src={room.image} alt={room.name} className="w-full h-full object-cover min-h-[200px]" />
                      {room.badge && (
                        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full ${styles.resultBadge}`}>{room.badge}</div>
                      )}
                    </div>
                    <div className="flex-1 p-6 flex flex-col">
                      <div className="flex items-start justify-between mb-1">
                        <span className={styles.resultHotel}>{room.type} · {room.hotel}</span>
                        <div className="flex items-center gap-1">{[...Array(room.stars)].map((_, i) => (<Star key={i} size={12} fill="#C9943A" color="#C9943A" strokeWidth={0} />))}</div>
                      </div>
                      <h3 className={`mb-2 ${styles.resultName}`}>{room.name}</h3>
                      <div className={`flex items-center gap-1 mb-3 ${styles.resultLocation}`}><MapPin size={13} />{room.location}</div>
                      <p className={`mb-4 ${styles.resultDesc}`}>{room.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {room.amenities.map((a) => (<span key={a} className={`flex items-center gap-1 px-2 py-1 rounded-full ${styles.resultAmenity}`}>{amenityIcons[a]}{amenityLabels[a]}</span>))}
                      </div>
                      <div className={`mt-auto flex items-center justify-between pt-4 ${styles.resultDivider}`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${styles.resultRating}`}>
                            <Star size={12} fill="#1A3C2E" color="#1A3C2E" />
                            <span className={styles.resultRatingText}>{room.rating || "—"}</span>
                          </div>
                          <span className={styles.resultReviews}>{room.reviews} avis</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={styles.resultPrice}>{formatPrix(room.price, room.devise)}</div>
                            <div className={styles.resultPeriod}>par nuit</div>
                          </div>
                          <button onClick={() => router.push(`/room/${room.id}`)} className={styles.viewBtn}>Voir &amp; réserver</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
      <SearchInner />
    </Suspense>
  );
}
