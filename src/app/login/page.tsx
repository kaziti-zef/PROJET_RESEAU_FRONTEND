"use client";
// ============================================================
//  NidiRoom — app/login/page.tsx
//  Page de connexion : JWT
// ============================================================

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { login } from "@/lib/api";
import { isAuthenticated, isTokenExpired } from "@/lib/auth";

// ══════════════════════════════════════════════════════════
//  PAGE LOGIN
// ══════════════════════════════════════════════════════════

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { showToast } = useToast();

  // ── Champs formulaire ──────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // ── États UI ───────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // ══════════════════════════════════════════════════════
  //  SOUMISSION
  // ══════════════════════════════════════════════════════

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateCredentials()) return;

    setLoading(true);
    setErrors({});

    const { data, error } = await login({
      email: email.trim(),
      mot_de_passe: password,
    });

    setLoading(false);
    
    console.log("[Login] Réponse:", { data , error });

    if (error || !data) {
      setErrors({ form: error || "Identifiants incorrects." });
      showToast("Échec de la connexion.", "error");
      return;
    }
    console.log(data.user)
    if (!data.user && !data.token) {
      console.error("[Login] Structure invalide:", data.token);
      setErrors({ form: "Erreur: Réponse du serveur invalide." });
      showToast("Erreur serveur - données invalides.", "error");
      return;
    }

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
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-white rounded-2xl shadow-lg p-8">

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

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
        </div>

        {/* Mention sécurité */}
        <p className="text-center text-xs text-gray-400 mt-6">
          🔒 Connexion sécurisée — JWT + Node.js
        </p>
      </div>
    </div>
  );
}
