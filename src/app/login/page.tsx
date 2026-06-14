"use client";
// ============================================================
//  NidiRoom — app/login/page.tsx
//  Page de connexion : JWT + détection 2FA
// ============================================================

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { login, verify2FA } from "@/lib/api";
import { isAuthenticated, isTokenExpired, saveToken, saveUser } from "@/lib/auth";

// ══════════════════════════════════════════════════════════
//  ÉTAPES DU FORMULAIRE
// ══════════════════════════════════════════════════════════

type Step = "credentials" | "2fa";

// ══════════════════════════════════════════════════════════
//  PAGE LOGIN
// ══════════════════════════════════════════════════════════

export default function LoginPage() {
  const router       = useRouter();
  const { setSession } = useAuth();
  const { showToast }  = useToast();

  // ── Étape courante ─────────────────────────────────────
  const [step, setStep] = useState<Step>("credentials");

  // ── Champs formulaire ──────────────────────────────────
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [code2FA,    setCode2FA]    = useState("");

  // ── États UI ───────────────────────────────────────────
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  // ── Redirection si déjà connecté ──────────────────────
  useEffect(() => {
    if (isAuthenticated() && !isTokenExpired()) {
      router.replace("/");
    }
  }, []); // eslint-disable-line

  // ══════════════════════════════════════════════════════
  //  VALIDATION
  // ══════════════════════════════════════════════════════

  function validateCredentials(): boolean {
    const errs: Record<string, string> = {};
    if (!email.trim())
      errs.email = "L'adresse email est requise.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Format d'email invalide.";
    if (!password)
      errs.password = "Le mot de passe est requis.";
    else if (password.length < 6)
      errs.password = "Minimum 6 caractères.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validate2FA(): boolean {
    const errs: Record<string, string> = {};
    if (!code2FA.trim())
      errs.code2FA = "Le code est requis.";
    else if (!/^\d{6}$/.test(code2FA))
      errs.code2FA = "Le code doit contenir 6 chiffres.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ══════════════════════════════════════════════════════
  //  SOUMISSION — ÉTAPE 1 : Identifiants
  // ══════════════════════════════════════════════════════

  async function handleCredentialsSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateCredentials()) return;

    setLoading(true);
    setErrors({});

    const { data, error } = await login({
      email:        email.trim(),
      mot_de_passe: password,
    });

    setLoading(false);

    if (error || !data) {
      setErrors({ form: error || "Identifiants incorrects." });
      showToast("Échec de la connexion.", "error");
      return;
    }

    // ── Cas 1 : 2FA requise ──────────────────────────────
    if ((data as { requires2FA?: boolean }).requires2FA) {
      // On stocke le token temporaire pour la vérification 2FA
      saveToken(data.token);
      showToast("Veuillez entrer votre code 2FA.", "info");
      setStep("2fa");
      return;
    }

    // ── Cas 2 : Connexion directe ────────────────────────
    setSession(data.token, data.user);
    showToast(`Bienvenue, ${data.user.prenom} ! 👋`, "success");

    // Redirection selon le rôle
    if (data.user.role === "HOTE") {
      router.push("/host/dashboard");
    } else {
      router.push("/listings");
    }
  }

  // ══════════════════════════════════════════════════════
  //  SOUMISSION — ÉTAPE 2 : Code 2FA
  // ══════════════════════════════════════════════════════

  async function handle2FASubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate2FA()) return;

    setLoading(true);
    setErrors({});

    const { data, error } = await verify2FA(code2FA.trim());

    setLoading(false);

    if (error || !data) {
      setErrors({ code2FA: error || "Code invalide ou expiré." });
      showToast("Code 2FA incorrect.", "error");
      return;
    }

    setSession(data.token, data.user);
    showToast(`Bienvenue, ${data.user.prenom} ! 🔐`, "success");

    if (data.user.role === "HOTE") {
      router.push("/host/dashboard");
    } else {
      router.push("/listings");
    }
  }

  // ══════════════════════════════════════════════════════
  //  RENDU
  // ══════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-playfair text-3xl font-bold text-gray-900">
            Nidi<span className="text-red-500">Room</span>
          </Link>
          <p className="text-gray-400 text-sm mt-2">
            {step === "credentials"
              ? "Connectez-vous à votre compte"
              : "Vérification en deux étapes"}
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* ── Indicateur d'étape (si 2FA) ── */}
          {step === "2fa" && (
            <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50
                            border border-blue-100 rounded-xl">
              <span className="text-2xl">🔐</span>
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  Authentification à deux facteurs
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Entrez le code à 6 chiffres de votre application d&apos;authentification.
                </p>
              </div>
            </div>
          )}

          {/* ════ FORMULAIRE IDENTIFIANTS ════ */}
          {step === "credentials" && (
            <form onSubmit={handleCredentialsSubmit} noValidate className="space-y-5">

              {/* Erreur globale */}
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl
                                text-sm text-red-700 font-medium">
                  ⚠️ {errors.form}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  className={`w-full px-4 py-3 border rounded-xl text-sm outline-none
                              transition-colors bg-white text-gray-800
                              placeholder-gray-300
                              ${errors.email
                                ? "border-red-400 focus:border-red-500"
                                : "border-gray-200 focus:border-red-400"
                              }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Mot de passe */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Mot de passe
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm
                                outline-none transition-colors bg-white text-gray-800
                                placeholder-gray-300
                                ${errors.password
                                  ? "border-red-400 focus:border-red-500"
                                  : "border-gray-200 focus:border-red-400"
                                }`}
                  />
                  {/* Toggle visibilité */}
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               text-gray-400 hover:text-gray-600 transition-colors
                               text-lg"
                    aria-label={showPwd ? "Masquer" : "Afficher"}
                  >
                    {showPwd ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Bouton connexion */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300
                           disabled:cursor-not-allowed text-white font-bold py-3
                           rounded-xl transition-colors text-sm mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                              stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Connexion en cours…
                  </span>
                ) : (
                  "Se connecter"
                )}
              </button>

              {/* Lien inscription */}
              <p className="text-center text-sm text-gray-500 pt-2">
                Pas encore de compte ?{" "}
                <Link href="/register"
                      className="text-red-500 hover:text-red-600 font-semibold">
                  S&apos;inscrire gratuitement
                </Link>
              </p>
            </form>
          )}

          {/* ════ FORMULAIRE 2FA ════ */}
          {step === "2fa" && (
            <form onSubmit={handle2FASubmit} noValidate className="space-y-5">

              {/* Code 2FA */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Code de vérification (6 chiffres)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code2FA}
                  onChange={(e) =>
                    setCode2FA(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  autoFocus
                  className={`w-full px-4 py-4 border rounded-xl text-center
                              text-2xl font-bold tracking-[0.5em] outline-none
                              transition-colors bg-white text-gray-800
                              placeholder-gray-200
                              ${errors.code2FA
                                ? "border-red-400 focus:border-red-500"
                                : "border-gray-200 focus:border-red-400"
                              }`}
                />
                {errors.code2FA && (
                  <p className="text-red-500 text-xs mt-1">{errors.code2FA}</p>
                )}
              </div>

              {/* Bouton vérifier */}
              <button
                type="submit"
                disabled={loading || code2FA.length !== 6}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300
                           disabled:cursor-not-allowed text-white font-bold py-3
                           rounded-xl transition-colors text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                              stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Vérification…
                  </span>
                ) : (
                  "Vérifier le code"
                )}
              </button>

              {/* Retour */}
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setCode2FA("");
                  setErrors({});
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-700
                           font-medium transition-colors py-1"
              >
                ← Retour à la connexion
              </button>
            </form>
          )}
        </div>

        {/* Mention sécurité */}
        <p className="text-center text-xs text-gray-400 mt-6">
          🔒 Connexion sécurisée — JWT + Spring Security OAuth 2.0
        </p>
      </div>
    </div>
  );
}
