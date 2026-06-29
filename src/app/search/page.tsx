"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal, Star, Wifi, Wind, Coffee, Waves, Shield, MapPin, X,
} from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { formatPrix, annonceToRoom, fallbackRooms, type Room } from "@/data/rooms";
import {
  getAnnonces, getTypesChambre, getCaracteristiques,
  type SearchParams, type TypeChambre, type Caracteristique,
} from "@/lib/api";
import styles from "./search.module.css";

const amenityLabels: Record<string, string> = {
  wifi: "WiFi", ac: "Climatisation", breakfast: "Petit-déjeuner", pool: "Piscine", restaurant: "Restaurant", security: "Sécurité 24h",
};
const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi size={14} />, ac: <Wind size={14} />, breakfast: <Coffee size={14} />,
  pool: <Waves size={14} />, restaurant: <span className="text-xs">🍽</span>, security: <Shield size={14} />,
};

// Limite haute : l'app affiche toutes les chambres disponibles (point 12)
const FETCH_LIMIT = 1000;

// Style du sélecteur "type" dans la barre latérale claire (cohérent avec les filtres).
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

  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState(150000);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedCaracs, setSelectedCaracs] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState(typeParam);
  const [types, setTypes] = useState<TypeChambre[]>([]);
  const [caracs, setCaracs] = useState<Caracteristique[]>([]);
  const [sortBy, setSortBy] = useState("pertinence");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Catalogues (types + caractéristiques) pour les filtres
  useEffect(() => {
    (async () => {
      const [t, c] = await Promise.all([getTypesChambre(), getCaracteristiques()]);
      if (t.data) setTypes(t.data);
      if (c.data) setCaracs(c.data);
    })();
  }, []);

  // Si l'URL change (?type=…), on resynchronise le filtre
  useEffect(() => { setSelectedType(typeParam); }, [typeParam]);

  // Récupération des chambres — le tri "pertinence" délègue le classement
  // au modèle côté serveur (scoring.service) via tri=pertinence + préférences.
  useEffect(() => {
    (async () => {
      setLoading(true);
      const params: SearchParams = { limit: FETCH_LIMIT };
      if (cityParam) params.ville = cityParam;
      if (selectedType) params.type = selectedType;
      if (sortBy === "pertinence") params.tri = "pertinence";
      else if (sortBy === "rating") params.tri = "populaire";
      if (selectedAmenities.length) params.equipements = selectedAmenities.join(",");
      if (selectedCaracs.length) params.caracteristiques = selectedCaracs.join(",");

      const { data } = await getAnnonces(params);
      if (data?.annonces?.length) setAllRooms(data.annonces.map(annonceToRoom));
      else setAllRooms(cityParam || selectedType ? [] : fallbackRooms);
      setLoading(false);
    })();
  }, [cityParam, selectedType, sortBy, selectedAmenities, selectedCaracs]);

  const filtered = useMemo(() => {
    // En mode "pertinence", équipements/caractéristiques sont des PRÉFÉRENCES
    // (le modèle classe), pas des filtres durs. Sinon ils filtrent strictement.
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
    // "pertinence" et "rating" : on conserve l'ordre renvoyé par le serveur
    return list;
  }, [allRooms, maxPrice, selectedStars, selectedAmenities, selectedCaracs, sortBy]);

  const toggleStar = (n: number) => setSelectedStars((p) => p.includes(n) ? p.filter((s) => s !== n) : [...p, n]);
  const toggleAmenity = (a: string) => setSelectedAmenities((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);
  const toggleCarac = (c: string) => setSelectedCaracs((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);

  const typeNom = types.find((t) => t.code === selectedType)?.nom;
  const titre = cityParam
    ? `Chambres à ${cityParam}`
    : typeNom ? `Chambres — ${typeNom}` : "Toutes les chambres";

  const FilterPanel = () => (
    <div>
      <div className="mb-8">
        <h4 className={`mb-4 ${styles.filterTitle}`}>Type de chambre</h4>
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={typeSelectStyle}>
          <option value="">Tous les types</option>
          {types.map((t) => (<option key={t.code} value={t.code}>{t.nom}</option>))}
        </select>
      </div>

      <div className="mb-8">
        <h4 className={`mb-4 ${styles.filterTitle}`}>Prix par nuit</h4>
        <div className="flex justify-between mb-3">
          <span className={styles.priceLabel}>0 FCFA</span>
          <span className={styles.priceValue}>{formatPrix(maxPrice)}</span>
        </div>
        <input type="range" min={10000} max={150000} step={5000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className={`w-full ${styles.filterRange}`} />
      </div>

      <div className="mb-8">
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

      <div className="mb-8">
        <h4 className={`mb-4 ${styles.filterTitle}`}>Équipements</h4>
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
          <h4 className={`mb-4 ${styles.filterTitle}`}>Caractéristiques</h4>
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

      <button onClick={() => { setMaxPrice(150000); setSelectedStars([]); setSelectedAmenities([]); setSelectedCaracs([]); setSelectedType(""); }} className={styles.resetBtn}>
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
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect}>
              <option value="pertinence" className="bg-forest">Pertinence</option>
              <option value="price_asc" className="bg-forest">Prix croissant</option>
              <option value="price_desc" className="bg-forest">Prix décroissant</option>
              <option value="rating" className="bg-forest">Mieux notées</option>
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
                <p className={styles.emptyTitle}>Aucune chambre</p>
                <p className={styles.emptyText}>Essayez d&apos;ajuster vos filtres ou un autre type.</p>
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
