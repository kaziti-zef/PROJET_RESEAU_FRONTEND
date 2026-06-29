"use client";
// ============================================================
//  KamerStay — app/host/listings/create/page.tsx
//  Création d'une annonce — formulaire MULTI-ÉTAPES (C7).
//  Étapes : Logement → Localisation → Détails & options → Photos.
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImagePlus } from "lucide-react";
import {
  createAnnonce, getEquipements, getCaracteristiques, getTypesChambre, getPays, getVilles,
  type Equipement, type Caracteristique, type TypeChambre, type Pays, type Ville,
} from "@/lib/api";
import { StepIndicator } from "@/components/StepIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import styles from "../host-listings.module.css";

const STEPS = ["Logement", "Localisation", "Détails", "Photos"];

export default function CreateListingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [paysCode, setPaysCode] = useState("CM");
  const [ville, setVille] = useState("");
  const [quartier, setQuartier] = useState("");
  const [adresse, setAdresse] = useState("");
  const [prix, setPrix] = useState("");
  const [capacite, setCapacite] = useState(1);
  const [superficie, setSuperficie] = useState("");
  const [typeCode, setTypeCode] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<string[]>([]);
  const [caracs, setCaracs] = useState<Caracteristique[]>([]);
  const [selectedCaracs, setSelectedCaracs] = useState<string[]>([]);
  const [types, setTypes] = useState<TypeChambre[]>([]);
  const [pays, setPays] = useState<Pays[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.replace("/login?redirect=/host/listings/create"); return; }
    if (!isLoading && user && user.role !== "HOTE") { showToast("Espace réservé aux hôtes.", "info"); router.replace("/"); }
  }, [isLoading, isAuthenticated, user, router, showToast]);

  useEffect(() => {
    (async () => {
      const [eq, ca, ty, pa] = await Promise.all([
        getEquipements(), getCaracteristiques(), getTypesChambre(), getPays(),
      ]);
      if (eq.data) setEquipements(eq.data);
      if (ca.data) setCaracs(ca.data);
      if (ty.data) setTypes(ty.data);
      if (pa.data) setPays(pa.data);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await getVilles(paysCode);
      setVilles(data || []);
    })();
  }, [paysCode]);

  const deviseSymbole = pays.find((p) => p.code === paysCode)?.devise_symbole || "FCFA";

  const toggleEquip = (code: string) =>
    setSelectedEquip((p) => (p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));
  const toggleCarac = (code: string) =>
    setSelectedCaracs((p) => (p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []).slice(0, 5);
    setFiles(list);
    setPreviews(list.map((f) => URL.createObjectURL(f)));
  }

  // Validation par étape avant de passer à la suivante
  function next() {
    if (step === 0 && !titre) { showToast("Donnez un titre à votre annonce.", "error"); return; }
    if (step === 1 && !ville) { showToast("Indiquez la ville du logement.", "error"); return; }
    if (step === 2) {
      if (!prix || Number(prix) <= 0) { showToast("Indiquez un prix par nuit valide.", "error"); return; }
      if ((dateDebut && !dateFin) || (!dateDebut && dateFin)) { showToast("Renseignez les deux dates de validité, ou aucune.", "error"); return; }
      if (dateDebut && dateFin && dateFin < dateDebut) { showToast("La date de fin de validité doit suivre la date de début.", "error"); return; }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titre || !ville || !prix) { showToast("Titre, ville et prix sont obligatoires.", "error"); return; }
    setSaving(true);
    const form = new FormData();
    form.append("titre", titre);
    form.append("description", description);
    form.append("pays", paysCode);
    form.append("ville", ville);
    form.append("quartier", quartier);
    form.append("adresse", adresse);
    form.append("prixParNuit", String(prix));
    form.append("capacite", String(capacite));
    if (typeCode) form.append("type", typeCode);
    if (superficie) form.append("superficie", String(superficie));
    if (dateDebut) form.append("date_debut_validite", dateDebut);
    if (dateFin) form.append("date_fin_validite", dateFin);
    form.append("equipements", JSON.stringify(selectedEquip));
    form.append("caracteristiques", JSON.stringify(selectedCaracs));
    files.forEach((f) => form.append("images", f));
    const { error } = await createAnnonce(form);
    setSaving(false);
    if (error) { showToast(error, "error"); return; }
    showToast("Annonce publiée !", "success");
    router.push("/host/dashboard");
  }

  return (
    <div className={styles.pageWrap}>
      <div className={`${styles.container} mx-auto px-6`}>
        <Link href="/host/dashboard" className={`${styles.backLink} inline-flex items-center gap-2 mb-4`}>
          <ArrowLeft size={16} /> Retour au tableau de bord
        </Link>
        <h1 className={`${styles.pageTitle} mb-8`}>Nouvelle annonce</h1>

        <form onSubmit={onSubmit} className={`${styles.formCard} rounded-2xl p-7 flex flex-col gap-5`}>
          <StepIndicator steps={STEPS} current={step} />

          {/* ÉTAPE 0 — Logement */}
          {step === 0 && (
            <>
              <Field label="Titre de l'annonce *"><input className={styles.input} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Suite Panoramique Rainforest" /></Field>
              <Field label="Description"><textarea className={`${styles.input} ${styles.textarea}`} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez votre chambre, ses atouts, la vue…" /></Field>
              <Field label="Type de chambre">
                <select className={`${styles.input} ${styles.select}`} value={typeCode} onChange={(e) => setTypeCode(e.target.value)}>
                  <option value="">— Choisir un type —</option>
                  {types.map((t) => (<option key={t.code} value={t.code}>{t.nom}</option>))}
                </select>
              </Field>
            </>
          )}

          {/* ÉTAPE 1 — Localisation */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Pays *">
                  <select className={`${styles.input} ${styles.select}`} value={paysCode} onChange={(e) => { setPaysCode(e.target.value); setVille(""); }}>
                    {pays.map((p) => (<option key={p.code} value={p.code}>{p.nom} ({p.devise_symbole})</option>))}
                  </select>
                </Field>
                <Field label="Ville *">
                  <input className={styles.input} value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Limbé" list="villes-list" />
                  <datalist id="villes-list">
                    {villes.map((v) => (<option key={v.id} value={v.nom} />))}
                  </datalist>
                </Field>
              </div>
              <Field label="Quartier"><input className={styles.input} value={quartier} onChange={(e) => setQuartier(e.target.value)} placeholder="Down Beach" /></Field>
              <Field label="Adresse"><input className={styles.input} value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Rue, repère…" /></Field>
            </>
          )}

          {/* ÉTAPE 2 — Détails & options */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label={`Prix par nuit (${deviseSymbole}) *`}><input className={styles.input} type="number" min={0} value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="45000" /></Field>
                <Field label="Capacité (personnes) *">
                  <div className={`${styles.stepper} flex items-center gap-3`}>
                    <button type="button" onClick={() => setCapacite((c) => Math.max(1, c - 1))} className={styles.stepBtn}>−</button>
                    <span className={`${styles.stepValue} flex-1 text-center`}>{capacite}</span>
                    <button type="button" onClick={() => setCapacite((c) => c + 1)} className={styles.stepBtn}>+</button>
                  </div>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Superficie (m²) — optionnel"><input className={styles.input} type="number" min={0} value={superficie} onChange={(e) => setSuperficie(e.target.value)} placeholder="30" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Disponible du (optionnel)"><input className={styles.input} type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} /></Field>
                <Field label="Disponible jusqu'au (optionnel)"><input className={styles.input} type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} /></Field>
              </div>

              {equipements.length > 0 && (
                <Field label="Équipements (commodités fournies)">
                  <div className="flex flex-wrap gap-2.5">
                    {equipements.map((eq) => (
                      <label key={eq.code} className="flex items-center gap-2 cursor-pointer" style={{ border: "1px solid rgba(26,60,46,0.15)", borderRadius: "20px", padding: "6px 12px", background: selectedEquip.includes(eq.code) ? "rgba(201,148,58,0.18)" : "transparent" }}>
                        <input type="checkbox" checked={selectedEquip.includes(eq.code)} onChange={() => toggleEquip(eq.code)} />
                        <span className={styles.fieldLabel}>{eq.nom}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              )}

              {caracs.length > 0 && (
                <Field label="Caractéristiques (atouts du logement)">
                  <div className="flex flex-wrap gap-2.5">
                    {caracs.map((c) => (
                      <label key={c.code} className="flex items-center gap-2 cursor-pointer" style={{ border: "1px solid rgba(26,60,46,0.15)", borderRadius: "20px", padding: "6px 12px", background: selectedCaracs.includes(c.code) ? "rgba(201,148,58,0.18)" : "transparent" }}>
                        <input type="checkbox" checked={selectedCaracs.includes(c.code)} onChange={() => toggleCarac(c.code)} />
                        <span className={styles.fieldLabel}>{c.nom}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              )}
            </>
          )}

          {/* ÉTAPE 3 — Photos */}
          {step === 3 && (
            <Field label="Photos (jusqu'à 5)">
              <label className={`${styles.uploader} flex items-center gap-3 rounded-xl cursor-pointer`}>
                <ImagePlus size={18} color="#C9943A" />
                <span className={styles.uploaderText}>Choisir des images (jpg, png, webp)</span>
                <input type="file" accept="image/*" multiple hidden onChange={onFiles} />
              </label>
              {previews.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {previews.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" className={styles.previewImg} />
                  ))}
                </div>
              )}
            </Field>
          )}

          {/* Navigation du wizard */}
          <div className="flex gap-3 mt-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="flex-1 rounded-xl"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A3C2E", background: "transparent", border: "1px solid rgba(26,60,46,0.2)", padding: "13px", cursor: "pointer" }}>
                ← Précédent
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className={styles.submitBtn} style={{ flex: 1 }}>
                Suivant →
              </button>
            ) : (
              <button type="submit" disabled={saving} className={styles.submitBtn} style={{ flex: 1 }}>
                {saving ? "Publication…" : "Publier l'annonce"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}
