"use client";
// ============================================================
//  NidiRoom — app/reservations/page.tsx
//  Suivi des réservations du locataire connecté
//  Statuts : EN_ATTENTE | CONFIRMEE | ANNULEE | TERMINEE
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getMesReservations,
  annulerReservation,
  createPaiement,
  Reservation,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useSocket } from "@/lib/socket";

// ══════════════════════════════════════════════════════════
//  UTILITAIRES STATUT
// ══════════════════════════════════════════════════════════

type Statut = Reservation["statut"];

const STATUT_CONFIG: Record<Statut,{ label: string; color: string; icon: string }> = {
  EN_ATTENTE: { label: "En attente", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "⏳" },
  CONFIRMEE:  { label: "Confirmée",  color: "bg-green-100 text-green-800 border-green-200",   icon: "✅" },
  ANNULEE:    { label: "Annulée",    color: "bg-red-100 text-red-700 border-red-200",          icon: "❌" },
  TERMINEE:   { label: "Terminée",   color: "bg-gray-100 text-gray-600 border-gray-200",       icon: "🏁" },
};

function StatutBadge({ statut }: { statut: Statut }) {
  const cfg = STATUT_CONFIG[statut];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function diffJours(debut: string, fin: string): number {
  return Math.max(1, Math.ceil((new Date(fin).getTime() - new Date(debut).getTime()) / 86400000));
}

// ══════════════════════════════════════════════════════════
//  COMPOSANT CARTE RÉSERVATION
// ══════════════════════════════════════════════════════════

function ReservationCard({
  reservation, onAnnuler, onPayer, actionLoading,
}: {
  reservation: Reservation;
  onAnnuler: (id: number) => void;
  onPayer: (id: number) => void;
  actionLoading: number | null;
}) {
  const { annonce, statut } = reservation;
  const nuits = diffJours(reservation.date_debut, reservation.date_fin);
  const isLoading = actionLoading === reservation.id;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${statut === "ANNULEE" ? "opacity-70" : ""}`}>
      <div className={`h-1.5 w-full
        ${statut === "CONFIRMEE"  ? "bg-green-400"  : ""}
        ${statut === "EN_ATTENTE" ? "bg-yellow-400" : ""}
        ${statut === "ANNULEE"    ? "bg-red-400"    : ""}
        ${statut === "TERMINEE"   ? "bg-gray-300"   : ""}`}
      />
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Image */}
          <div className="flex-shrink-0 w-full sm:w-32 h-28 rounded-xl overflow-hidden bg-gray-100">
            {annonce?.image_principale ? (
              <img src={annonce.image_principale} alt={annonce.titre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-red-50 to-orange-50">🏠</div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <Link href={`/listings/${annonce?.id}`}
                  className="font-bold text-gray-900 hover:text-red-500 transition-colors text-base line-clamp-1">
                  {annonce?.titre ?? "Annonce supprimée"}
                </Link>
                <p className="text-gray-400 text-xs mt-0.5">📍 {annonce?.ville ?? "—"}</p>
              </div>
              <StatutBadge statut={statut} />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Arrivée</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(reservation.date_debut)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Départ</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(reservation.date_fin)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                <p className="text-xs text-red-400 font-medium uppercase tracking-wide mb-1">Durée</p>
                <p className="text-sm font-bold text-red-700">{nuits} nuit{nuits > 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Montant + actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Montant total</p>
                <p className="font-bold text-gray-900 text-lg">
                  {Number(reservation.montant_total).toLocaleString("fr-FR")}
                  <span className="text-gray-400 font-normal text-sm"> FCFA</span>
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {statut === "CONFIRMEE" && (
                  <button onClick={() => onPayer(reservation.id)} disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5">
                    {isLoading ? (
                      <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>Redirection…</>
                    ) : <>💳 Payer maintenant</>}
                  </button>
                )}
                {annonce?.id && (
                  <Link href={`/listings/${annonce.id}`}
                    className="border border-gray-200 hover:border-gray-400 text-gray-600 font-medium px-4 py-2 rounded-xl text-xs transition-colors">
                    Voir l&apos;annonce
                  </Link>
                )}
                {statut === "EN_ATTENTE" && (
                  <button onClick={() => onAnnuler(reservation.id)} disabled={isLoading}
                    className="border border-red-200 hover:bg-red-50 text-red-600 font-medium px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-50">
                    {isLoading ? "Annulation…" : "Annuler"}
                  </button>
                )}
              </div>
            </div>

            {/* Messages info statut */}
            {statut === "EN_ATTENTE" && (
              <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mt-3">
                ⏳ En attente de confirmation par l&apos;hôte. Vous serez notifié dès qu&apos;il répond.
              </p>
            )}
            {statut === "CONFIRMEE" && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-3">
                ✅ Réservation confirmée ! Procédez au paiement pour finaliser.
              </p>
            )}
            {statut === "ANNULEE" && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
                ❌ Cette réservation a été annulée.
              </p>
            )}
            {statut === "TERMINEE" && (
              <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mt-3">
                🏁 Séjour terminé. Pensez à laisser un avis sur l&apos;annonce !
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  SQUELETTES
// ══════════════════════════════════════════════════════════

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden">
      <div className="h-1.5 skeleton w-full" />
      <div className="p-6 flex gap-5">
        <div className="w-32 h-28 skeleton rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 skeleton rounded w-2/3" />
          <div className="h-3 skeleton rounded w-1/3" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-14 skeleton rounded-xl" />
            <div className="h-14 skeleton rounded-xl" />
            <div className="h-14 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════

type FiltreStatut = "TOUT" | Statut;

const FILTRES: { value: FiltreStatut; label: string }[] = [
  { value: "TOUT",       label: "Toutes"     },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "CONFIRMEE",  label: "Confirmées" },
  { value: "TERMINEE",   label: "Terminées"  },
  { value: "ANNULEE",    label: "Annulées"   },
];

export default function ReservationsPage() {
  const router              = useRouter();
  const { isAuthenticated } = useAuth();
  const { showToast }       = useToast();

  const [reservations,  setReservations]  = useState<Reservation[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filtre,        setFiltre]        = useState<FiltreStatut>("TOUT");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      showToast("Connectez-vous pour voir vos réservations.", "warning");
      router.push("/login");
    }
  }, [isAuthenticated]); // eslint-disable-line

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      setLoading(true);
      const { data, error } = await getMesReservations();
      if (error) showToast("Erreur lors du chargement des réservations.", "error");
      else setReservations(data ?? []);
      setLoading(false);
    }
    load();
  }, [isAuthenticated]); // eslint-disable-line

  // Mise à jour temps réel WebSocket
  useSocket("notifications", (notif) => {
    if (notif.type === "RESERVATION_CONFIRMEE" || notif.type === "RESERVATION_ANNULEE") {
      getMesReservations().then(({ data }) => { if (data) setReservations(data); });
    }
  });

  async function handleAnnuler(id: number) {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) return;
    setActionLoading(id);
    const { error } = await annulerReservation(id);
    setActionLoading(null);
    if (error) { showToast(error || "Erreur lors de l'annulation.", "error"); return; }
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, statut: "ANNULEE" } : r));
    showToast("Réservation annulée.", "success");
  }

  async function handlePayer(id: number) {
    setActionLoading(id);
    const { data, error } = await createPaiement({ reservation_id: id });
    setActionLoading(null);
    if (error || !data) { showToast(error || "Erreur lors du paiement.", "error"); return; }
    window.location.href = data.payment_url;
  }

  const reservationsFiltrees = filtre === "TOUT"
    ? reservations
    : reservations.filter((r) => r.statut === filtre);

  const compteurs = {
    TOUT:       reservations.length,
    EN_ATTENTE: reservations.filter((r) => r.statut === "EN_ATTENTE").length,
    CONFIRMEE:  reservations.filter((r) => r.statut === "CONFIRMEE").length,
    TERMINEE:   reservations.filter((r) => r.statut === "TERMINEE").length,
    ANNULEE:    reservations.filter((r) => r.statut === "ANNULEE").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold text-gray-900">Mes réservations</h1>
        <p className="text-gray-400 mt-2 text-sm">
          {loading ? "Chargement…" : `${reservations.length} réservation${reservations.length > 1 ? "s" : ""} au total`}
        </p>
      </div>

      {/* Onglets filtre */}
      <div className="flex gap-2 flex-wrap mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
        {FILTRES.map(({ value, label }) => (
          <button key={value} onClick={() => setFiltre(value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5
              ${filtre === value ? "bg-red-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
            {label}
            {compteurs[value] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                ${filtre === value ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>
                {compteurs[value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : reservationsFiltrees.length > 0 ? (
        <div className="space-y-4">
          {reservationsFiltrees.map((r) => (
            <ReservationCard key={r.id} reservation={r}
              onAnnuler={handleAnnuler} onPayer={handlePayer} actionLoading={actionLoading} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-5xl mb-4">{filtre === "TOUT" ? "📅" : STATUT_CONFIG[filtre as Statut]?.icon ?? "📅"}</p>
          <h3 className="font-semibold text-gray-700 text-lg mb-2">
            {filtre === "TOUT" ? "Aucune réservation" : `Aucune réservation ${STATUT_CONFIG[filtre as Statut]?.label.toLowerCase()}`}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {filtre === "TOUT" ? "Vous n'avez pas encore effectué de réservation." : "Aucune réservation ne correspond à ce filtre."}
          </p>
          {filtre === "TOUT" && (
            <Link href="/listings"
              className="inline-block bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-full text-sm transition-colors">
              Parcourir les annonces
            </Link>
          )}
        </div>
      )}

      {/* Légende statuts */}
      {!loading && reservations.length > 0 && (
        <div className="mt-10 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Guide des statuts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.entries(STATUT_CONFIG) as [Statut, typeof STATUT_CONFIG[Statut]][]).map(([statut]) => (
              <div key={statut} className="flex items-start gap-3">
                <StatutBadge statut={statut} />
                <p className="text-xs text-gray-500 leading-relaxed">
                  {statut === "EN_ATTENTE" && "L'hôte n'a pas encore répondu à votre demande."}
                  {statut === "CONFIRMEE"  && "L'hôte a accepté. Procédez au paiement."}
                  {statut === "ANNULEE"    && "La réservation a été annulée (par vous ou l'hôte)."}
                  {statut === "TERMINEE"   && "Séjour terminé. Vous pouvez laisser un avis."}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
