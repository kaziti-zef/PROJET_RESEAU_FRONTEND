"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut, Mail, User as UserIcon, BadgeCheck,
  LayoutDashboard, CalendarCheck, Phone, CreditCard, Upload, Clock, XCircle, Lock, Wallet as WalletIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/auth";
import { demanderDevenirHote, getStatutVerification, changerMotDePasse, getMonWallet, StatutVerification, type Wallet } from "@/lib/api";
import { formatPrix } from "@/data/rooms";
import { StepIndicator } from "@/components/StepIndicator";
import { useToast } from "@/contexts/ToastContext";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { showToast } = useToast();

  const [statutVerif, setStatutVerif] = useState<StatutVerification | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [hoteStep, setHoteStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [telephone, setTelephone] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [identifiant, setIdentifiant] = useState("");
  const [photoCni, setPhotoCni] = useState<File | null>(null);

  const [showPwdForm, setShowPwdForm] = useState(false);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [ancienMdp, setAncienMdp] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmMdp, setConfirmMdp] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login?redirect=/profile");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user && user.role === "CLIENT") {
      getStatutVerification().then(({ data }) => {
        if (data) setStatutVerif(data.statut_verification);
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getMonWallet().then(({ data }) => { if (data) setWallet(data); });
  }, [user]);

  // Ouverture automatique du parcours "devenir hôte" après une
  // inscription avec l'intention hôte (?devenir=hote).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("devenir") === "hote" && user?.role === "CLIENT") {
      setShowForm(true);
      setHoteStep(0);
    }
  }, [user]);

  // Libellés lisibles des types de transaction du porte-monnaie
  const txLabel = (type: string): string => ({
    GAIN_HOTE: "Gain réservation",
    PAIEMENT: "Paiement",
    REMBOURSEMENT: "Remboursement",
    RECHARGE: "Rechargement",
  } as Record<string, string>)[type] || type;

  const handleDevenirHote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telephone || !fournisseur || !identifiant || !photoCni) {
      showToast("Tous les champs sont obligatoires, y compris la photo de la CNI.", "error");
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    form.append("telephone", telephone);
    form.append("fournisseur", fournisseur);
    form.append("identifiant", identifiant);
    form.append("photo_cni", photoCni);

    const { data, error } = await demanderDevenirHote(form);
    setSubmitting(false);

    if (error || !data) {
      showToast(error || "Erreur lors de l'envoi de la demande.", "error");
      return;
    }
    showToast(data.message, "success");
    setStatutVerif(data.statut_verification);
    setShowForm(false);
  };

  const handleChangerMotDePasse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancienMdp || !nouveauMdp || !confirmMdp) {
      showToast("Tous les champs sont obligatoires.", "error");
      return;
    }
    if (nouveauMdp.length < 6) {
      showToast("Le nouveau mot de passe doit contenir au moins 6 caractères.", "error");
      return;
    }
    if (nouveauMdp !== confirmMdp) {
      showToast("Les deux mots de passe ne correspondent pas.", "error");
      return;
    }
    setPwdSubmitting(true);
    const { data, error } = await changerMotDePasse({
      ancien_mot_de_passe: ancienMdp,
      nouveau_mot_de_passe: nouveauMdp,
    });
    setPwdSubmitting(false);

    if (error || !data) {
      showToast(error || "Erreur lors du changement de mot de passe.", "error");
      return;
    }
    showToast(data.message || "Mot de passe modifié avec succès.", "success");
    setAncienMdp("");
    setNouveauMdp("");
    setConfirmMdp("");
    setShowPwdForm(false);
  };

  if (isLoading || !user) {
    return <div className="min-h-screen bg-ivory pt-[120px] mx-auto px-6 max-w-2xl"><div className="skeleton rounded-2xl h-[280px]" /></div>;
  }

  const initials = `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase();
  const isHote = user.role === "HOTE";

  return (
    <div className={styles.pageWrap}>
      <div className={`mx-auto px-6 ${styles.container}`}>
        <div className={`rounded-2xl overflow-hidden mb-6 ${styles.profileCard}`}>
          <div className={styles.banner} />
          <div className="px-8 pb-8" style={{ marginTop: -44 }}>
            <div className={`flex items-center justify-center rounded-full mb-4 ${styles.avatar}`}>{initials}</div>
            <h1 className={styles.userName}>{user.prenom} {user.nom}</h1>
            <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full ${styles.roleBadge}`}>
              <BadgeCheck size={14} color="#C9943A" /> {isHote ? "Compte Hôte" : "Compte Voyageur"}
            </span>
          </div>
        </div>

        <div className={`rounded-2xl p-7 mb-6 ${styles.detailCard}`}>
          <h2 className={`mb-5 ${styles.detailTitle}`}>Mes informations</h2>
          <div className="flex flex-col gap-4">
            {[
              { Icon: UserIcon, label: "Nom complet", value: `${user.prenom} ${user.nom}` },
              { Icon: Mail, label: "Email", value: user.email },
            ].map(({ Icon, label, value }) => (
              <div key={label} className={`flex items-center gap-4 p-4 rounded-xl ${styles.infoRow}`}>
                <div className={`flex items-center justify-center rounded-full flex-shrink-0 ${styles.infoIconWrap}`}><Icon size={18} color="#1A3C2E" /></div>
                <div>
                  <p className={styles.infoLabel}>{label}</p>
                  <p className={styles.infoValue}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl p-7 mb-6 ${styles.detailCard}`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={styles.detailTitle}>Mon porte-monnaie</h2>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "#FBF5EA", border: "1px solid rgba(201,148,58,0.4)", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "#1A3C2E" }}>
              <WalletIcon size={16} color="#C9943A" /> {formatPrix(wallet ? wallet.solde : 0)}
            </span>
          </div>

          {wallet && wallet.transactions.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {wallet.transactions.slice(0, 8).map((t) => {
                const montant = Number(t.montant);
                const credit = montant >= 0;
                return (
                  <div key={t.id} className={`flex items-center justify-between gap-4 p-4 rounded-xl ${styles.infoRow}`}>
                    <div>
                      <p className={styles.infoValue}>{txLabel(t.type)}{t.motif ? ` · ${t.motif}` : ""}</p>
                      <p className={styles.infoLabel}>{t.date_transaction ? new Date(t.date_transaction).toLocaleDateString("fr-FR") : ""}</p>
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: credit ? "#1A7F4E" : "#C4622D", whiteSpace: "nowrap" }}>
                      {credit ? "+" : "−"} {formatPrix(Math.abs(montant))}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.infoLabel}>Aucune transaction pour le moment. Vos gains, remboursements et paiements apparaîtront ici.</p>
          )}
        </div>

        <div className={`rounded-2xl p-7 mb-6 ${styles.detailCard}`}>
          <h2 className={`mb-5 ${styles.detailTitle}`}>Sécurité</h2>

          {!showPwdForm && (
            <button onClick={() => setShowPwdForm(true)} className={`rounded-xl px-6 py-3 ${styles.primaryLink}`}>
              Changer mon mot de passe
            </button>
          )}

          {showPwdForm && (
            <form onSubmit={handleChangerMotDePasse} className="flex flex-col gap-4">
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "#F7F3EC" }}>
                <Lock size={18} color="#1A3C2E" />
                <input
                  type="password"
                  placeholder="Ancien mot de passe"
                  value={ancienMdp}
                  onChange={(e) => setAncienMdp(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "#F7F3EC" }}>
                <Lock size={18} color="#1A3C2E" />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe (6 caractères min.)"
                  value={nouveauMdp}
                  onChange={(e) => setNouveauMdp(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "#F7F3EC" }}>
                <Lock size={18} color="#1A3C2E" />
                <input
                  type="password"
                  placeholder="Confirmer le nouveau mot de passe"
                  value={confirmMdp}
                  onChange={(e) => setConfirmMdp(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={pwdSubmitting} className={`flex-1 rounded-xl px-6 py-3 ${styles.primaryLink}`}>
                  {pwdSubmitting ? "Modification en cours…" : "Valider"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPwdForm(false); setAncienMdp(""); setNouveauMdp(""); setConfirmMdp(""); }}
                  className={`flex-1 rounded-xl ${styles.logoutBtn}`}
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>

        {user.role === "CLIENT" && (
          <div className={`rounded-2xl p-7 mb-6 ${styles.detailCard}`}>
            <h2 className={`mb-5 ${styles.detailTitle}`}>Devenir hôte</h2>

            {statutVerif === "EN_ATTENTE" && (
              <div className={`flex items-center gap-3 p-4 rounded-xl ${styles.infoRow}`}>
                <Clock size={18} color="#C9943A" />
                <p className={styles.infoValue}>Votre demande est en attente de validation par un administrateur.</p>
              </div>
            )}

            {statutVerif === "REJETE" && !showForm && (
              <>
                <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${styles.infoRow}`}>
                  <XCircle size={18} color="#C4622D" />
                  <p className={styles.infoValue}>Votre demande précédente a été rejetée. Vous pouvez la soumettre à nouveau.</p>
                </div>
                <button onClick={() => setShowForm(true)} className={`rounded-xl px-6 py-3 ${styles.primaryLink}`}>
                  Refaire une demande
                </button>
              </>
            )}

            {(statutVerif === "NON_DEMANDE" || statutVerif === null) && !showForm && (
              <button onClick={() => setShowForm(true)} className={`rounded-xl px-6 py-3 ${styles.primaryLink}`}>
                Devenir hôte
              </button>
            )}

            {showForm && (
              <form onSubmit={handleDevenirHote} className="flex flex-col gap-4">
                <StepIndicator steps={["Contact", "Paiement", "Identité"]} current={hoteStep} />

                {hoteStep === 0 && (
                  <>
                    <p className={styles.infoLabel} style={{ marginBottom: -8 }}>
                      Votre numéro de téléphone permet aux voyageurs et à l&apos;équipe de vous joindre.
                    </p>
                    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "#F7F3EC" }}>
                      <Phone size={18} color="#1A3C2E" />
                      <input type="tel" placeholder="Numéro de téléphone" value={telephone}
                        onChange={(e) => setTelephone(e.target.value)} className="w-full bg-transparent outline-none" />
                    </div>
                  </>
                )}

                {hoteStep === 1 && (
                  <>
                    <p className={styles.infoLabel} style={{ marginBottom: -8 }}>
                      Le compte de paiement sur lequel vous recevrez vos gains.
                    </p>
                    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "#F7F3EC" }}>
                      <CreditCard size={18} color="#1A3C2E" />
                      <input type="text" placeholder="Fournisseur (ex: MTN Mobile Money)" value={fournisseur}
                        onChange={(e) => setFournisseur(e.target.value)} className="w-full bg-transparent outline-none" />
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "#F7F3EC" }}>
                      <CreditCard size={18} color="#1A3C2E" />
                      <input type="text" placeholder="Identifiant du compte (ex: numéro)" value={identifiant}
                        onChange={(e) => setIdentifiant(e.target.value)} className="w-full bg-transparent outline-none" />
                    </div>
                  </>
                )}

                {hoteStep === 2 && (
                  <>
                    <p className={styles.infoLabel} style={{ marginBottom: -8 }}>
                      Votre pièce d&apos;identité est vérifiée automatiquement avant l&apos;examen par un administrateur.
                    </p>
                    <label className="flex items-center gap-4 p-4 rounded-xl cursor-pointer" style={{ background: "#F7F3EC" }}>
                      <Upload size={18} color="#1A3C2E" />
                      <span className={styles.infoValue}>
                        {photoCni ? photoCni.name : "Photo de votre CNI (jpg, png, webp)"}
                      </span>
                      <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => setPhotoCni(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                  </>
                )}

                <div className="flex gap-3">
                  {hoteStep > 0 && (
                    <button type="button" onClick={() => setHoteStep((s) => s - 1)} className={`flex-1 rounded-xl ${styles.logoutBtn}`}>
                      Précédent
                    </button>
                  )}
                  {hoteStep < 2 && (
                    <button type="button"
                      onClick={() => {
                        if (hoteStep === 0 && !telephone) { showToast("Renseignez votre numéro de téléphone.", "error"); return; }
                        if (hoteStep === 1 && (!fournisseur || !identifiant)) { showToast("Renseignez le compte de paiement.", "error"); return; }
                        setHoteStep((s) => s + 1);
                      }}
                      className={`flex-1 rounded-xl px-6 py-3 ${styles.primaryLink}`}>
                      Suivant
                    </button>
                  )}
                  {hoteStep === 2 && (
                    <button type="submit" disabled={submitting} className={`flex-1 rounded-xl px-6 py-3 ${styles.primaryLink}`}>
                      {submitting ? "Vérification…" : "Envoyer ma demande"}
                    </button>
                  )}
                  <button type="button" onClick={() => { setShowForm(false); setHoteStep(0); }} className={`rounded-xl px-5 ${styles.logoutBtn}`}>
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={isHote ? "/host/dashboard" : "/reservations"} className={`flex-1 flex items-center justify-center gap-2 rounded-xl ${styles.primaryLink}`}>
            {isHote ? <><LayoutDashboard size={16} /> Espace hôte</> : <><CalendarCheck size={16} /> Mes réservations</>}
          </Link>
          <button onClick={() => signOut()} className={`flex-1 flex items-center justify-center gap-2 rounded-xl ${styles.logoutBtn}`}>
            <LogOut size={16} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}