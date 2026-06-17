"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, Users, Star, X } from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { formatFCFA } from "@/data/rooms";
import { imageUrl } from "@/lib/images";
import {
  getMesReservations, createPaiement, annulerReservation, createAvis,
  type Reservation, type ModePaiement, type StatutReservation,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import styles from "./reservations.module.css";

const STATUTS: Record<StatutReservation, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: "En attente de paiement", color: "#9A6B00", bg: "#FCEFC7" },
  CONFIRMEE:  { label: "Confirmée",               color: "#1A3C2E", bg: "#D7EBDD" },
  TERMINEE:   { label: "Terminée",                color: "#3A3A3A", bg: "#E8E2D6" },
  ANNULEE:    { label: "Annulée",                 color: "#A12A12", bg: "#F7D9D0" },
  REFUSEE:    { label: "Refusée",                 color: "#A12A12", bg: "#F7D9D0" },
};

const payModes: { id: ModePaiement; label: string; icon: string }[] = [
  { id: "MOBILE_MONEY", label: "Mobile Money (MTN / Orange)", icon: "📱" },
  { id: "CARTE", label: "Carte bancaire", icon: "💳" },
  { id: "ESPECES", label: "À l'hôtel (espèces)", icon: "🏨" },
];

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReservationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showToast } = useToast();

  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [payFor, setPayFor] = useState<Reservation | null>(null);
  const [payMode, setPayMode] = useState<ModePaiement>("MOBILE_MONEY");
  const [reviewFor, setReviewFor] = useState<Reservation | null>(null);
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await getMesReservations();
    setList(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.replace("/login?redirect=/reservations"); return; }
    if (!isLoading && user?.role !== "CLIENT") { showToast("Espace réservé aux comptes CLIENT.", "info"); return; }
    if (isAuthenticated) load();
  }, [isLoading, isAuthenticated, user, router, load, showToast]);

  async function confirmPay() {
    if (!payFor) return;
    setBusy(true);
    const { error } = await createPaiement({ reservation_id: payFor.idreservation, mode_paiement: payMode });
    setBusy(false);
    if (error) { showToast(error, "error"); return; }
    showToast("Paiement effectué — réservation confirmée !", "success");
    setPayFor(null); load();
  }

  async function cancel(r: Reservation) {
    const { error } = await annulerReservation(r.idreservation);
    if (error) { showToast(error, "error"); return; }
    showToast("Réservation annulée.", "info"); load();
  }

  async function submitReview() {
    if (!reviewFor) return;
    setBusy(true);
    const { error } = await createAvis({ reservation_id: reviewFor.idreservation, note, commentaire });
    setBusy(false);
    if (error) { showToast(error, "error"); return; }
    showToast("Merci pour votre avis !", "success");
    setReviewFor(null); setCommentaire(""); setNote(5); load();
  }

  return (
    <div className={styles.pageWrap}>
      <div className={`mx-auto px-6 ${styles.container}`}>
        <p className={`mb-1 ${styles.sectionTag}`}>Mon espace voyageur</p>
        <h1 className={`mb-8 ${styles.pageTitle}`}>Mes réservations</h1>

        {loading ? (
          <div className="flex flex-col gap-4">{[...Array(2)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-[150px]" />)}</div>
        ) : list.length === 0 ? (
          <div className={`text-center rounded-2xl p-12 ${styles.emptyCard}`}>
            <p className={styles.emptyTitle}>Aucune réservation pour l&apos;instant</p>
            <p className={`mb-6 ${styles.emptyText}`}>Trouvez votre prochain séjour au Cameroun.</p>
            <Link href="/search" className={styles.emptyLink}>Explorer les hôtels</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {list.map((r) => {
              const st = STATUTS[r.statut];
              const img = imageUrl(r.images?.[0]);
              return (
                <div key={r.idreservation} className={`rounded-2xl overflow-hidden flex flex-col md:flex-row ${styles.reservationCard}`}>
                  <div className={`relative ${styles.reservationImage}`}>
                    <ImageWithFallback src={img} alt={r.annonce_titre || "Chambre"} className="w-full h-full object-cover min-h-[150px]" />
                  </div>
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className={styles.reservationTitle}>{r.annonce_titre}</h3>
                      <span className={styles.statusBadge} style={{ color: st.color, background: st.bg }}>{st.label}</span>
                    </div>
                    <div className={`flex flex-wrap gap-4 mb-3 ${styles.reservationMeta}`}>
                      <span className="flex items-center gap-1.5"><MapPin size={14} color="#C4622D" />{[r.quartier, r.ville].filter(Boolean).join(", ")}</span>
                      <span className="flex items-center gap-1.5"><Calendar size={14} color="#C9943A" />{fmtDate(r.datedebut)} → {fmtDate(r.datefin)}</span>
                      <span className="flex items-center gap-1.5"><Users size={14} color="#1A3C2E" />{r.nombrepersonnes} pers.</span>
                    </div>
                    <div className={`mt-auto flex items-center justify-between pt-3 ${styles.divider}`}>
                      <span className={styles.reservationPrice}>{formatFCFA(Number(r.montanttotal))}</span>
                      <div className="flex gap-2">
                        {r.statut === "EN_ATTENTE" && (<button onClick={() => { setPayFor(r); setPayMode("MOBILE_MONEY"); }} className={styles.btnGold}>Payer</button>)}
                        {(r.statut === "EN_ATTENTE" || r.statut === "CONFIRMEE") && (<button onClick={() => cancel(r)} className={styles.btnOutline}>Annuler</button>)}
                        {r.statut === "TERMINEE" && (<button onClick={() => { setReviewFor(r); setNote(5); }} className={styles.btnGold}>Laisser un avis</button>)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {payFor && (
        <Modal onClose={() => setPayFor(null)} title="Procéder au paiement">
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(28,28,28,0.6)", marginBottom: 16 }}>
            {payFor.annonce_titre} — <strong style={{ color: "#C9943A" }}>{formatFCFA(Number(payFor.montanttotal))}</strong>
          </p>
          <div className="flex flex-col gap-2 mb-5">
            {payModes.map((m) => (
              <button key={m.id} onClick={() => setPayMode(m.id)}
                className={`flex items-center gap-3 p-3 rounded-xl text-left ${payMode === m.id ? styles.payOptionActive : styles.payOptionInactive}`}>
                <span className="text-xl">{m.icon}</span>
                <span className={styles.payOptionBtn}>{m.label}</span>
              </button>
            ))}
          </div>
          <button onClick={confirmPay} disabled={busy} className={`w-full ${styles.btnGold}`} style={{ padding: 14 }}>{busy ? "Traitement…" : "Confirmer le paiement"}</button>
        </Modal>
      )}

      {reviewFor && (
        <Modal onClose={() => setReviewFor(null)} title="Votre avis">
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(28,28,28,0.6)", marginBottom: 16 }}>{reviewFor.annonce_titre}</p>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setNote(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <Star size={28} fill={n <= note ? "#C9943A" : "none"} color="#C9943A" />
              </button>
            ))}
          </div>
          <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Partagez votre expérience…" rows={4} className={styles.textarea} />
          <button onClick={submitReview} disabled={busy} className={`w-full ${styles.btnGold}`} style={{ padding: 14 }}>{busy ? "Envoi…" : "Publier l'avis"}</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${styles.modalOverlay}`} onClick={onClose}>
      <div className={`w-full rounded-2xl p-7 ${styles.modalCard}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={styles.modalTitle}>{title}</h3>
          <button onClick={onClose} className={styles.modalClose}><X size={22} color="#1C1C1C" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
