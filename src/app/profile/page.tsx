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

  // Onglet actif pour la colonne droite
  const [activeTab, setActiveTab] = useState<"wallet" | "securite" | "hote">("wallet");

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("devenir") === "hote" && user?.role === "CLIENT") {
      setShowForm(true);
      setHoteStep(0);
      setActiveTab("hote");
    }
  }, [user]);

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
    if (error || !data) { showToast(error || "Erreur lors de l'envoi.", "error"); return; }
    showToast(data.message, "success");
    setStatutVerif(data.statut_verification);
    setShowForm(false);
  };

  const handleChangerMotDePasse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancienMdp || !nouveauMdp || !confirmMdp) { showToast("Tous les champs sont obligatoires.", "error"); return; }
    if (nouveauMdp.length < 6) { showToast("Le nouveau mot de passe doit contenir au moins 6 caractères.", "error"); return; }
    if (nouveauMdp !== confirmMdp) { showToast("Les deux mots de passe ne correspondent pas.", "error"); return; }
    setPwdSubmitting(true);
    const { data, error } = await changerMotDePasse({ ancien_mot_de_passe: ancienMdp, nouveau_mot_de_passe: nouveauMdp });
    setPwdSubmitting(false);
    if (error || !data) { showToast(error || "Erreur lors du changement.", "error"); return; }
    showToast(data.message || "Mot de passe modifié avec succès.", "success");
    setAncienMdp(""); setNouveauMdp(""); setConfirmMdp("");
    setShowPwdForm(false);
  };

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F3EC", paddingTop: "104px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div className="skeleton rounded-2xl" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  const initials = `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase();
  const isHote = user.role === "HOTE";

  const inputRow: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
    borderRadius: 12, background: "#F7F3EC", border: "1px solid rgba(26,60,46,0.08)",
  };

  const tabs = [
    { key: "wallet" as const, label: "Porte-monnaie" },
    { key: "securite" as const, label: "Sécurité" },
    ...(user.role === "CLIENT" ? [{ key: "hote" as const, label: "Devenir hôte" }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F7F3EC", paddingTop: "104px", paddingBottom: "40px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* ── LAYOUT PRINCIPAL 2 colonnes ── */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>

          {/* ══ COLONNE GAUCHE ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Carte identité */}
            <div className={styles.profileCard} style={{ borderRadius: 20, overflow: "hidden" }}>
              <div className={styles.banner} />
              <div style={{ padding: "0 24px 24px", marginTop: -44 }}>
                <div className={`flex items-center justify-center rounded-full mb-3 ${styles.avatar}`}>{initials}</div>
                <h1 className={styles.userName} style={{ fontSize: 26, textAlign: "center" }}>{user.prenom} {user.nom}</h1>
                <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${styles.roleBadge}`}>
                    <BadgeCheck size={14} color="#C9943A" /> {isHote ? "Compte Hôte" : "Compte Voyageur"}
                  </span>
                </div>
              </div>
            </div>

            {/* Infos */}
            <div className={styles.detailCard} style={{ borderRadius: 20, padding: "20px 20px" }}>
              <h2 className={styles.detailTitle} style={{ marginBottom: 14 }}>Mes informations</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { Icon: UserIcon, label: "Nom complet", value: `${user.prenom} ${user.nom}` },
                  { Icon: Mail, label: "Email", value: user.email },
                ].map(({ Icon, label, value }) => (
                  <div key={label} style={{ ...inputRow, background: "#F7F3EC" }}>
                    <div className={`flex items-center justify-center rounded-full flex-shrink-0 ${styles.infoIconWrap}`}><Icon size={16} color="#1A3C2E" /></div>
                    <div>
                      <p className={styles.infoLabel}>{label}</p>
                      <p className={styles.infoValue} style={{ fontSize: 14 }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href={isHote ? "/host/dashboard" : "/reservations"}
                className={`flex items-center justify-center gap-2 rounded-xl ${styles.primaryLink}`}
                style={{ padding: "12px 16px", textDecoration: "none" }}>
                {isHote ? <><LayoutDashboard size={16} /> Espace hôte</> : <><CalendarCheck size={16} /> Mes réservations</>}
              </Link>
              <button onClick={() => signOut()} className={`flex items-center justify-center gap-2 rounded-xl ${styles.logoutBtn}`} style={{ padding: "12px 16px" }}>
                <LogOut size={16} /> Se déconnecter
              </button>
            </div>
          </div>

          {/* ══ COLONNE DROITE ══ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

            {/* Onglets */}
            <div style={{ display: "flex", borderBottom: "2px solid rgba(26,60,46,0.1)", marginBottom: 20 }}>
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "12px 20px",
                    background: "none", border: "none", cursor: "pointer",
                    color: activeTab === tab.key ? "#1A3C2E" : "rgba(28,28,28,0.45)",
                    borderBottom: activeTab === tab.key ? "2px solid #C9943A" : "2px solid transparent",
                    marginBottom: -2,
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Porte-monnaie ── */}
            {activeTab === "wallet" && (
              <div className={styles.detailCard} style={{ borderRadius: 20, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h2 className={styles.detailTitle}>Mon porte-monnaie</h2>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 99, background: "#FBF5EA", border: "1px solid rgba(201,148,58,0.4)", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "#1A3C2E", fontSize: 16 }}>
                    <WalletIcon size={18} color="#C9943A" /> {formatPrix(wallet ? wallet.solde : 0)}
                  </span>
                </div>
                {wallet && wallet.transactions.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {wallet.transactions.slice(0, 10).map((t) => {
                      const montant = Number(t.montant);
                      const credit = montant >= 0;
                      return (
                        <div key={t.id} style={{ ...inputRow, flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                            <span className={styles.infoValue} style={{ fontSize: 13 }}>{txLabel(t.type)}{t.motif ? ` · ${t.motif}` : ""}</span>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: credit ? "#1A7F4E" : "#C4622D", whiteSpace: "nowrap" }}>
                              {credit ? "+" : "−"} {formatPrix(Math.abs(montant))}
                            </span>
                          </div>
                          <span className={styles.infoLabel}>{t.date_transaction ? new Date(t.date_transaction).toLocaleDateString("fr-FR") : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={styles.infoLabel} style={{ textAlign: "center", padding: "32px 0" }}>
                    Aucune transaction pour le moment. Vos gains, remboursements et paiements apparaîtront ici.
                  </p>
                )}
              </div>
            )}

            {/* ── Sécurité ── */}
            {activeTab === "securite" && (
              <div className={styles.detailCard} style={{ borderRadius: 20, padding: 28 }}>
                <h2 className={styles.detailTitle} style={{ marginBottom: 20 }}>Sécurité</h2>
                {!showPwdForm ? (
                  <div>
                    <p className={styles.infoLabel} style={{ marginBottom: 16 }}>Modifiez votre mot de passe régulièrement pour sécuriser votre compte.</p>
                    <button onClick={() => setShowPwdForm(true)} className={`rounded-xl px-6 py-3 ${styles.primaryLink}`}>
                      Changer mon mot de passe
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleChangerMotDePasse} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { placeholder: "Ancien mot de passe", value: ancienMdp, set: setAncienMdp },
                      { placeholder: "Nouveau mot de passe (6 caractères min.)", value: nouveauMdp, set: setNouveauMdp },
                      { placeholder: "Confirmer le nouveau mot de passe", value: confirmMdp, set: setConfirmMdp },
                    ].map(({ placeholder, value, set }) => (
                      <div key={placeholder} style={inputRow}>
                        <Lock size={16} color="#1A3C2E" />
                        <input type="password" placeholder={placeholder} value={value}
                          onChange={(e) => set(e.target.value)}
                          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }} required />
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button type="submit" disabled={pwdSubmitting} className={`flex-1 rounded-xl px-6 py-3 ${styles.primaryLink}`}>
                        {pwdSubmitting ? "Modification…" : "Valider"}
                      </button>
                      <button type="button" onClick={() => { setShowPwdForm(false); setAncienMdp(""); setNouveauMdp(""); setConfirmMdp(""); }}
                        className={`flex-1 rounded-xl ${styles.logoutBtn}`} style={{ padding: "12px 16px" }}>
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ── Devenir hôte ── */}
            {activeTab === "hote" && user.role === "CLIENT" && (
              <div className={styles.detailCard} style={{ borderRadius: 20, padding: 28 }}>
                <h2 className={styles.detailTitle} style={{ marginBottom: 20 }}>Devenir hôte</h2>

                {statutVerif === "APPROUVE" && (
                  <div style={{ ...inputRow, gap: 10, padding: 20, borderRadius: 12, background: "#E8F5EE", border: "1px solid rgba(26,127,78,0.3)" }}>
                    <BadgeCheck size={20} color="#1A7F4E" />
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#1A3C2E" }}>Votre demande a été approuvée. Votre compte a été promu en Hôte.</p>
                  </div>
                )}

                {statutVerif === "EN_ATTENTE" && (
                  <div style={{ ...inputRow, gap: 10, padding: 20, borderRadius: 12 }}>
                    <Clock size={20} color="#C9943A" />
                    <p className={styles.infoValue}>Votre demande est en cours d&apos;examen par un administrateur.</p>
                  </div>
                )}

                {statutVerif === "REJETE" && !showForm && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ ...inputRow, gap: 10, padding: 16, borderRadius: 12 }}>
                      <XCircle size={20} color="#C4622D" />
                      <p className={styles.infoValue}>Votre demande précédente a été rejetée. Vous pouvez la soumettre à nouveau.</p>
                    </div>
                    <button onClick={() => setShowForm(true)} className={`rounded-xl px-6 py-3 ${styles.primaryLink}`}>
                      Refaire une demande
                    </button>
                  </div>
                )}

                {(statutVerif === "NON_DEMANDE" || statutVerif === null) && !showForm && (
                  <div>
                    <p className={styles.infoLabel} style={{ marginBottom: 16 }}>Partagez votre espace et générez des revenus. La demande est validée sous 48h.</p>
                    <button onClick={() => setShowForm(true)} className={`rounded-xl px-6 py-3 ${styles.primaryLink}`}>
                      Devenir hôte
                    </button>
                  </div>
                )}

                {showForm && (
                  <form onSubmit={handleDevenirHote} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <StepIndicator steps={["Contact", "Paiement", "Identité"]} current={hoteStep} />

                    {hoteStep === 0 && (
                      <>
                        <p className={styles.infoLabel}>Votre numéro de téléphone permet aux voyageurs et à notre équipe de vous joindre.</p>
                        <div style={inputRow}>
                          <Phone size={16} color="#1A3C2E" />
                          <input type="tel" placeholder="Numéro de téléphone" value={telephone}
                            onChange={(e) => setTelephone(e.target.value)}
                            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }} />
                        </div>
                      </>
                    )}

                    {hoteStep === 1 && (
                      <>
                        <p className={styles.infoLabel}>Le compte de paiement sur lequel vous recevrez vos gains.</p>
                        {[
                          { placeholder: "Fournisseur (ex: MTN Mobile Money)", value: fournisseur, set: setFournisseur },
                          { placeholder: "Identifiant du compte (ex: numéro)", value: identifiant, set: setIdentifiant },
                        ].map(({ placeholder, value, set }) => (
                          <div key={placeholder} style={inputRow}>
                            <CreditCard size={16} color="#1A3C2E" />
                            <input type="text" placeholder={placeholder} value={value}
                              onChange={(e) => set(e.target.value)}
                              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }} />
                          </div>
                        ))}
                      </>
                    )}

                    {hoteStep === 2 && (
                      <>
                        <p className={styles.infoLabel}>Votre pièce d&apos;identité est vérifiée automatiquement avant l&apos;examen par un administrateur.</p>
                        <label style={{ ...inputRow, cursor: "pointer" }}>
                          <Upload size={16} color="#1A3C2E" />
                          <span className={styles.infoValue}>{photoCni ? photoCni.name : "Photo de votre CNI (jpg, png, webp)"}</span>
                          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => setPhotoCni(e.target.files?.[0] || null)} style={{ display: "none" }} />
                        </label>
                      </>
                    )}

                    <div style={{ display: "flex", gap: 10 }}>
                      {hoteStep > 0 && (
                        <button type="button" onClick={() => setHoteStep((s) => s - 1)} className={`flex-1 rounded-xl ${styles.logoutBtn}`} style={{ padding: "12px 16px" }}>
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
                      <button type="button" onClick={() => { setShowForm(false); setHoteStep(0); }}
                        className={`rounded-xl px-5 ${styles.logoutBtn}`} style={{ padding: "12px 16px" }}>
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
