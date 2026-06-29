"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Mail, Lock, User as UserIcon, BedDouble, Home } from "lucide-react";
import { register } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { showToast } = useToast();

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [intention, setIntention] = useState<"client" | "hote">("client");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Le compte est toujours créé en CLIENT. Choisir « hôte » enchaîne
    // ensuite sur la vérification d'identité (devenir hôte).
    const { data, error } = await register({ nom, prenom, email, mot_de_passe: motDePasse, role: "CLIENT" });
    setLoading(false);
    if (error || !data) { showToast(error || "Inscription impossible.", "error"); return; }
    setSession(data.token, data.user);
    if (intention === "hote") {
      showToast("Compte créé ! Finalisez votre vérification pour devenir hôte.", "success");
      router.push("/profile?devenir=hote");
    } else {
      showToast("Compte créé avec succès !", "success");
      router.push("/");
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={`w-full ${styles.card}`}>
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className={`flex items-center justify-center rounded-full ${styles.logoIcon}`}><MapPin size={20} color="#1A3C2E" strokeWidth={2.5} /></div>
          <span className={styles.logoText}>Kamer<span className={styles.logoAccent}>Stay</span></span>
        </div>
        <h1 className={`text-center mb-1 ${styles.title}`}>Créer un compte</h1>
        <p className={`text-center mb-7 ${styles.subtitle}`}>Rejoignez KamerStay en quelques secondes.</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {/* Choix de l'intention : réserver (client) ou louer (hôte) */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setIntention("client")}
              className="flex flex-col items-center gap-1.5 rounded-xl"
              style={{
                padding: "14px 10px", cursor: "pointer",
                background: intention === "client" ? "#F0F5F2" : "#fff",
                border: intention === "client" ? "2px solid #1A3C2E" : "2px solid rgba(26,60,46,0.12)",
              }}>
              <BedDouble size={20} color="#1A3C2E" />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A3C2E" }}>Je réserve</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(26,60,46,0.6)" }}>Voyageur</span>
            </button>
            <button type="button" onClick={() => setIntention("hote")}
              className="flex flex-col items-center gap-1.5 rounded-xl"
              style={{
                padding: "14px 10px", cursor: "pointer",
                background: intention === "hote" ? "#FBF5EA" : "#fff",
                border: intention === "hote" ? "2px solid #C9943A" : "2px solid rgba(26,60,46,0.12)",
              }}>
              <Home size={20} color="#C9943A" />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#1A3C2E" }}>Je loue mon logement</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(26,60,46,0.6)" }}>Hôte (vérification requise)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className={styles.field}><span className={styles.label}>Prénom</span><div className={styles.inputWrap}><UserIcon size={16} color="#C9943A" /><input required value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Amina" /></div></label>
            <label className={styles.field}><span className={styles.label}>Nom</span><div className={styles.inputWrap}><input required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Kouam" /></div></label>
          </div>
          <label className={styles.field}><span className={styles.label}>Email</span><div className={styles.inputWrap}><Mail size={16} color="#C9943A" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" /></div></label>
          <label className={styles.field}><span className={styles.label}>Mot de passe</span><div className={styles.inputWrap}><Lock size={16} color="#C9943A" /><input type="password" required minLength={6} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="•••••• (min. 6 caractères)" /></div></label>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Création…" : intention === "hote" ? "Créer mon compte et devenir hôte" : "Créer mon compte"}
          </button>
        </form>

        <p className={`text-center mt-2 ${styles.subtitle}`} style={{ fontSize: 13 }}>
          {intention === "hote"
            ? "Après inscription, vous fournirez une pièce d'identité à vérifier."
            : "Vous pourrez devenir hôte plus tard depuis votre profil."}
        </p>

        <p className={`text-center mt-6 ${styles.footerText}`}>
          Déjà inscrit ? <Link href="/login" className={styles.footerLink}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
