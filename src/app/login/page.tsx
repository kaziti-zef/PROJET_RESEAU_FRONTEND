"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Mail, Lock } from "lucide-react";
import { login } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import styles from "./login.module.css";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { setSession } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await login({ email, mot_de_passe: motDePasse });
    setLoading(false);
    if (error || !data) { showToast(error || "Connexion impossible.", "error"); return; }
    setSession(data.token, data.user);
    showToast(`Bienvenue, ${data.user.prenom} !`, "success");
    const redirect = sp.get("redirect");
    router.push(redirect || (data.user.role === "HOTE" ? "/host/dashboard" : "/"));
  }

  return (
    <div className={styles.wrapper}>
      <div className={`w-full ${styles.card}`}>
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className={`flex items-center justify-center rounded-full ${styles.logoIcon}`}><MapPin size={20} color="#1A3C2E" strokeWidth={2.5} /></div>
          <span className={styles.logoText}>Kamer<span className={styles.logoAccent}>Stay</span></span>
        </div>
        <h1 className={`text-center mb-1 ${styles.title}`}>Bon retour</h1>
        <p className={`text-center mb-8 ${styles.subtitle}`}>Connectez-vous pour réserver votre séjour.</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <div className={styles.inputWrap}><Mail size={16} color="#C9943A" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" /></div>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Mot de passe</span>
            <div className={styles.inputWrap}><Lock size={16} color="#C9943A" /><input type="password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="••••••••" /></div>
          </label>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className={`text-center mt-6 ${styles.footerText}`}>
          Pas encore de compte ? <Link href="/register" className={styles.footerLink}>Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-forest" />}><LoginInner /></Suspense>;
}
