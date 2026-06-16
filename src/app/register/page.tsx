"use client";
// ============================================================
//  NidiRoom — app/register/page.tsx
//  Page d'inscription : Locataire ou Hôte
//  Pré-sélection du rôle via ?role=HOTE dans l'URL
// ============================================================

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { register } from "@/lib/api";
import { isAuthenticated, isTokenExpired } from "@/lib/auth";

// ══════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════

type Role = "CLIENT" | "HOTE";

interface FormData {
  nom:           string;
  prenom:        string;
  email:         string;
  telephone:     string;
  mot_de_passe:  string;
  confirmation:  string;
  role:          Role;
  raison_sociale: string;  // Pour les HOTEs (optionnel pour CLIENTs)
}

type FormErrors = Partial<Record<keyof FormData | "form", string>>;

// ══════════════════════════════════════════════════════════
//  PAGE REGISTER
// ══════════════════════════════════════════════════════════

export default function RegisterPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const { showToast }  = useToast();

  // ── Pré-sélection du rôle depuis l'URL ────────────────
  const roleFromUrl = searchParams.get("role")?.toUpperCase() as Role | null;

  // ── État du formulaire ─────────────────────────────────
  const [form, setForm] = useState<FormData>({
    nom:          "",
    prenom:       "",
    email:        "",
    telephone:    "",
    mot_de_passe: "",
    confirmation: "",
    role:         roleFromUrl === "HOTE" ? "HOTE" : "CLIENT",
    raison_sociale: "",
  });

  const [errors,   setErrors]   = useState<FormErrors>({});
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);
  const [showConf, setShowConf] = useState(false);

  // ── Redirection si déjà connecté ──────────────────────
  useEffect(() => {
    if (isAuthenticated() && !isTokenExpired()) {
      router.replace("/");
    }
  }, []); // eslint-disable-line

  // ── Mise à jour d'un champ ─────────────────────────────
  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Efface l'erreur du champ dès que l'utilisateur retape
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // ══════════════════════════════════════════════════════
  //  VALIDATION
  // ══════════════════════════════════════════════════════

  function validate(): boolean {
    const errs: FormErrors = {};

    if (!form.prenom.trim())
      errs.prenom = "Le prénom est requis.";

    if (!form.nom.trim())
      errs.nom = "Le nom est requis.";

    if (!form.email.trim())
      errs.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Format d'email invalide.";

    if (form.telephone && !/^(\+?\d{8,15})$/.test(form.telephone.replace(/\s/g, "")))
      errs.telephone = "Numéro de téléphone invalide.";

    if (!form.mot_de_passe)
      errs.mot_de_passe = "Le mot de passe est requis.";
    else if (form.mot_de_passe.length < 8)
      errs.mot_de_passe = "Minimum 8 caractères.";
    else if (!/[A-Z]/.test(form.mot_de_passe))
      errs.mot_de_passe = "Doit contenir au moins une majuscule.";
    else if (!/[0-9]/.test(form.mot_de_passe))
      errs.mot_de_passe = "Doit contenir au moins un chiffre.";

    if (!form.confirmation)
      errs.confirmation = "Veuillez confirmer le mot de passe.";
    else if (form.mot_de_passe !== form.confirmation)
      errs.confirmation = "Les mots de passe ne correspondent pas.";
    if (form.role === "HOTE" && !form.raison_sociale.trim())
      errs.raison_sociale = "La raison sociale est obligatoire pour un hôte.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ══════════════════════════════════════════════════════
  //  SOUMISSION
  // ══════════════════════════════════════════════════════

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const { data, error } = await register({
      nom:          form.nom.trim(),
      prenom:       form.prenom.trim(),
      email:        form.email.trim().toLowerCase(),
      mot_de_passe: form.mot_de_passe,
      role:         form.role,
      ...(form.telephone ? { telephone: form.telephone.trim() } : {}),
      ...(form.role === "HOTE" ? { raison_sociale: form.raison_sociale.trim() } : {}),
    });

    setLoading(false);

    console.log("[Register] Réponse:", { data, error });

    if (error || !data) {
      setErrors({ form: error || "Erreur lors de l'inscription." });
      showToast("Inscription échouée.", "error");
      return;
    }

    // Vérifier que la réponse contient user et token
    if (!data.user || !data.token) {
      console.error("[Register] Structure invalide:", data);
      setErrors({ form: "Erreur: Réponse du serveur invalide." });
      showToast("Erreur serveur - données invalides.", "error");
      return;
    }

    setSession(data.token, data.user);
    showToast(
      `Bienvenue ${data.user.prenom} ! Votre compte ${form.role === "HOTE" ? "hôte" : "client"} est créé. 🎉`,
      "success",
      5000
    );

    // Redirection selon le rôle
    if (data.user.role === "HOTE") {
      router.push("/host/dashboard");
    } else {
      router.push("/listings");
    }
  }

  // ── Force du mot de passe ──────────────────────────────
  function getPasswordStrength(): { label: string; color: string; width: string } {
    const pwd = form.mot_de_passe;
    if (!pwd) return { label: "", color: "bg-gray-200", width: "w-0" };

    let score = 0;
    if (pwd.length >= 8)            score++;
    if (pwd.length >= 12)           score++;
    if (/[A-Z]/.test(pwd))          score++;
    if (/[0-9]/.test(pwd))          score++;
    if (/[^A-Za-z0-9]/.test(pwd))   score++;

    if (score <= 1) return { label: "Très faible", color: "bg-red-400",    width: "w-1/5" };
    if (score === 2) return { label: "Faible",      color: "bg-orange-400", width: "w-2/5" };
    if (score === 3) return { label: "Moyen",       color: "bg-yellow-400", width: "w-3/5" };
    if (score === 4) return { label: "Fort",        color: "bg-green-400",  width: "w-4/5" };
    return                 { label: "Très fort",    color: "bg-green-600",  width: "w-full" };
  }

  const pwdStrength = getPasswordStrength();

  // ══════════════════════════════════════════════════════
  //  RENDU
  // ══════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-playfair text-3xl font-bold text-gray-900">
            Nidi<span className="text-red-500">Room</span>
          </Link>
          <p className="text-gray-400 text-sm mt-2">
            Créez votre compte gratuitement
          </p>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* ── SÉLECTEUR DE RÔLE ── */}
          <div className="mb-7">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Je souhaite…
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["CLIENT", "HOTE"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update("role", r)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2
                              transition-all text-sm font-semibold
                              ${form.role === r
                                ? "border-red-500 bg-red-50 text-red-600"
                                : "border-gray-200 text-gray-500 hover:border-gray-300"
                              }`}
                >
                  <span className="text-2xl">
                    {r === "CLIENT" ? "🔍" : "🏠"}
                  </span>
                  <span>
                    {r === "CLIENT" ? "Louer une chambre" : "Proposer ma chambre"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── CHAMP RAISON SOCIALE (HOTEs) ── */}
          {form.role === "HOTE" && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Raison Sociale <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.raison_sociale}
                onChange={(e) => update("raison_sociale", e.target.value)}
                placeholder="Ex: Dupont SARL"
                className={`w-full px-4 py-3 border rounded-xl text-sm outline-none
                            transition-colors placeholder-gray-300 text-gray-800
                            ${errors.raison_sociale
                              ? "border-red-400 focus:border-red-500"
                              : "border-gray-200 focus:border-red-400"}`}
              />
              {errors.raison_sociale && (
                <p className="text-red-500 text-xs mt-1">{errors.raison_sociale}</p>
              )}
              <p className="text-xs text-amber-700 mt-2">
                🏢 Nom de votre entreprise ou raison sociale (obligatoire pour les hôtes)
              </p>
            </div>
          )}

          {/* ── FORMULAIRE ── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Erreur globale */}
            {errors.form && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl
                              text-sm text-red-700 font-medium">
                ⚠️ {errors.form}
              </div>
            )}

            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={(e) => update("prenom", e.target.value)}
                  placeholder="Jean"
                  autoComplete="given-name"
                  className={`w-full px-4 py-3 border rounded-xl text-sm outline-none
                              transition-colors placeholder-gray-300 text-gray-800
                              ${errors.prenom
                                ? "border-red-400 focus:border-red-500"
                                : "border-gray-200 focus:border-red-400"}`}
                />
                {errors.prenom && (
                  <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => update("nom", e.target.value)}
                  placeholder="Dupont"
                  autoComplete="family-name"
                  className={`w-full px-4 py-3 border rounded-xl text-sm outline-none
                              transition-colors placeholder-gray-300 text-gray-800
                              ${errors.nom
                                ? "border-red-400 focus:border-red-500"
                                : "border-gray-200 focus:border-red-400"}`}
                />
                {errors.nom && (
                  <p className="text-red-500 text-xs mt-1">{errors.nom}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Adresse email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="votre@email.com"
                autoComplete="email"
                className={`w-full px-4 py-3 border rounded-xl text-sm outline-none
                            transition-colors placeholder-gray-300 text-gray-800
                            ${errors.email
                              ? "border-red-400 focus:border-red-500"
                              : "border-gray-200 focus:border-red-400"}`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Téléphone
                <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
              </label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => update("telephone", e.target.value)}
                placeholder="+237 6XX XXX XXX"
                autoComplete="tel"
                className={`w-full px-4 py-3 border rounded-xl text-sm outline-none
                            transition-colors placeholder-gray-300 text-gray-800
                            ${errors.telephone
                              ? "border-red-400 focus:border-red-500"
                              : "border-gray-200 focus:border-red-400"}`}
              />
              {errors.telephone && (
                <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.mot_de_passe}
                  onChange={(e) => update("mot_de_passe", e.target.value)}
                  placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm
                              outline-none transition-colors placeholder-gray-300
                              text-gray-800
                              ${errors.mot_de_passe
                                ? "border-red-400 focus:border-red-500"
                                : "border-gray-200 focus:border-red-400"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPwd ? "Masquer" : "Afficher"}
                >
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Barre de force */}
              {form.mot_de_passe && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300
                                    ${pwdStrength.color} ${pwdStrength.width}`} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Force : <span className="font-medium">{pwdStrength.label}</span>
                  </p>
                </div>
              )}

              {errors.mot_de_passe && (
                <p className="text-red-500 text-xs mt-1">{errors.mot_de_passe}</p>
              )}
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConf ? "text" : "password"}
                  value={form.confirmation}
                  onChange={(e) => update("confirmation", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm
                              outline-none transition-colors placeholder-gray-300
                              text-gray-800
                              ${errors.confirmation
                                ? "border-red-400 focus:border-red-500"
                                : form.confirmation && form.confirmation === form.mot_de_passe
                                  ? "border-green-400"
                                  : "border-gray-200 focus:border-red-400"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConf(!showConf)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConf ? "Masquer" : "Afficher"}
                >
                  {showConf ? "🙈" : "👁️"}
                </button>
                {/* Indicateur correspondance */}
                {form.confirmation && form.confirmation === form.mot_de_passe && (
                  <span className="absolute right-10 top-1/2 -translate-y-1/2
                                   text-green-500 text-sm">
                    ✓
                  </span>
                )}
              </div>
              {errors.confirmation && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmation}</p>
              )}
            </div>

            {/* Récapitulatif rôle */}
            <div className={`p-3 rounded-xl text-sm border
                            ${form.role === "HOTE"
                              ? "bg-amber-50 border-amber-200 text-amber-800"
                              : "bg-blue-50 border-blue-200 text-blue-800"}`}>
              {form.role === "HOTE" ? (
                <p>🏠 Vous créez un compte <strong>Hôte</strong> — vous pourrez publier
                   et gérer vos annonces depuis votre tableau de bord.</p>
              ) : (
                <p>🔍 Vous créez un compte <strong>Locataire</strong> — vous pourrez
                   rechercher et réserver des chambres.</p>
              )}
            </div>

            {/* Bouton inscription */}
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
                  Création du compte…
                </span>
              ) : (
                `Créer mon compte ${form.role === "HOTE" ? "hôte" : "locataire"}`
              )}
            </button>

            {/* Lien connexion */}
            <p className="text-center text-sm text-gray-500 pt-1">
              Déjà un compte ?{" "}
              <Link href="/login"
                    className="text-red-500 hover:text-red-600 font-semibold">
                Se connecter
              </Link>
            </p>
          </form>
        </div>

        {/* Mention sécurité */}
        <p className="text-center text-xs text-gray-400 mt-6">
          🔒 Données sécurisées — Spring Security + JWT + chiffrement BCrypt
        </p>
      </div>
    </div>
  );
}
