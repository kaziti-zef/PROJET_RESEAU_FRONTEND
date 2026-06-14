// ============================================================
// NidiRoom — lib/auth.ts
// Gestion de la session JWT, du stockage et de la 2FA
// Utilisé par toutes les pages protégées
// ============================================================

import { User, login, register, logout as apiLogout } from "./api";

// ── Types ──────────────────────────────────────────────────

export interface AuthState {
  utilisateur : Utilisateur | null ;
  jeton : chaîne de caractères | null ;
  isAuthenticated : booléen ;
}

export interface LoginPayload {
  courriel : chaîne de caractères ;
  mot_de_passe : chaîne de caractères ;
}

export interface RegisterPayload {
  nom : chaîne de caractères ;
  prénom : chaîne de caractères ;
  courriel : chaîne de caractères ;
  mot_de_passe : chaîne de caractères ;
  rôle : "LOCATAIRE" | "HÔTE" ;
  téléphone ? : chaîne de caractères ;
}

// ════════════════════════════════════════════════════════
// STOCKAGE LOCAL (localStorage)
// Toutes les fonctions vérifient qu'on est côté client
// (Next.js fait du SSR — localStorage n'existe pas côté serveur)
// ════════════════════════════════════════════════════════

/** Sauvegarde du token JWT dans localStorage */
export function saveToken(token: string): void {
  si (type de fenêtre === "undefined") retourner;
  localStorage.setItem("token", token);
}

/** Récupère le token JWT */
export function getToken(): chaîne | null {
  si (typeof fenêtre === "undefined") retourner null ;
  retourner localStorage.getItem("token");
}

/** Supprime le token JWT */
fonction d'exportation removeToken(): void {
  si (type de fenêtre === "undefined") retourner;
  localStorage.removeItem("token");
}

/** Sauvegarde des informations utilisateur */
export function saveUser(user: User): void {
  si (type de fenêtre === "undefined") retourner;
  localStorage.setItem("user", JSON.stringify(user));
}

/** Récupère les infos utilisateur */
export function getUser(): User | null {
  si (typeof fenêtre === "undefined") retourner null ;
  essayer {
    const raw = localStorage.getItem("user");
    retourner brut ? (JSON.parse(raw) as User) : null;
  } attraper {
    renvoyer null ;
  }
}

/** Supprime les infos utilisateur */
export function removeUser(): void {
  si (type de fenêtre === "undefined") retourner;
  localStorage.removeItem("user");
}

/** Retourne l'état complet de la session */
export function getAuthState(): AuthState {
  const token = getToken();
  const utilisateur = getUser();
  retour {
    jeton,
    utilisateur,
    estAuthentifié : !!jeton && !!utilisateur,
  };
}

// ════════════════════════════════════════════════════════
// CONNEXION / INSCRIPTION / DÉCONNEXION
// ════════════════════════════════════════════════════════

/**
 * Connecte l'utilisateur :
 * 1. Appelez POST /api/auth/login
 * 2. Stocker le token + user dans localStorage
 * 3. Retourne { succès, erreur, nécessite2FA }
 */
exporter la fonction asynchrone signIn(
  courriel : chaîne de caractères,
  mot_de_passe: chaîne
): Promise<{ success: boolean; error: string | null; requires2FA?: boolean }> {
  const { data, error } = wait login({ email, mot_de_passe });

  si (erreur || !données) {
    return { success: false, error: error || "Erreur de connexion." };
  }

  // Le backend peut signaler que la 2FA est requise
  si ((données comme { nécessite2FA?: booléen }).nécessite2FA) {
    // On stocke le token temporaire pour la vérification 2FA
    enregistrerToken(données.token);
    renvoie { succès: faux, erreur: nul, nécessite l'authentification à deux facteurs: vrai };
  }

  enregistrerToken(données.token);
  enregistrerUtilisateur(données.utilisateur);
  renvoyer { succès: vrai, erreur: nul };
}

/**
 * Inscrire un nouvel utilisateur :
 * 1. Appelez POST /api/auth/register
 2. Stockez le token + utilisateur
 * 3. Retourne { succès, erreur }
 */
exporter la fonction asynchrone signUp(
  charge utile : RegisterPayload
): Promise<{ succès: booléen; erreur: chaîne | null }> {
  const { données, erreur } = await register(payload);

  si (erreur || !données) {
    return { succès : faux, erreur : erreur || "Erreur lors de l'inscription." } ;
  }

  enregistrerToken(données.token);
  enregistrerUtilisateur(données.utilisateur);
  renvoyer { succès: vrai, erreur: nul };
}

/**
 * Déconnecte l'utilisateur :
 * 1. Appelez POST /api/auth/logout (invalide le token côté Redis)
 2. Supprime localStorage
 * 3. Redirige vers /login
 */
export async function signOut(): Promise<void> {
  essayer {
    attendre apiLogout(); // invalide le token dans Redis (liste noire)
  } attraper {
    // Même si le serveur est indisponible, on déconnecte côté client
  } enfin {
    supprimerToken();
    supprimerUtilisateur();
    si (typeof fenêtre !== "undefined") {
      window.location.href = "/login";
    }
  }
}

// ════════════════════════════════════════════════════════
// VÉRIFICATIONS DE RÔLE
// ════════════════════════════════════════════════════════

/** L'utilisateur connecté est-il un hôte ? */
export function isHote(): boolean {
  const utilisateur = getUser();
  retourner utilisateur?.role === "HOTE";
}

/** L'utilisateur connecté est-il un admin ? */
export function isAdmin(): boolean {
  const utilisateur = getUser();
  retourner utilisateur?.role === "ADMIN";
}

/** L'utilisateur est-il connecté ? */
export function isAuthenticated(): boolean {
  retourner !!getToken() && !!getUser();
}

// ════════════════════════════════════════════════════════
// DÉCODAGE DU TOKEN JWT
// Utile pour vérifier l'expiration sans appel réseau
// ════════════════════════════════════════════════════════

interface JWTPayload {
  sous : chaîne ; // email ou identifiant utilisateur
  rôle : chaîne de caractères ;
  exp : nombre ; // horodatage d'expiration
  iat : numéro ; // timestamp d'émission
}

/**
 * Décoder le payload d'un token JWT (sans vérification de signature).
 * La vérification de signature se fait côté backend Spring Security.
 */
fonction export decodeToken(token: chaîne): JWTPayload | null {
  essayer {
    const base64Payload = token.split(".")[1];
    const decoded = atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"));
    renvoie JSON.parse(décodé) comme JWTPayload ;
  } attraper {
    renvoyer null ;
  }
}

/**
 * Vérifiez si le token JWT stocké est expiré.
 * Retourne vrai si expiré ou absent.
 */
export function isTokenExpired(): boolean {
  const token = getToken();
  si (!token) retourner vrai ;

  const payload = décoderToken(token);
  si (!payload) retourner vrai ;

  // exp est en secondes, Date.now() en millisecondes
  const now = Math.floor(Date.now() / 1000);
  retourner payload.exp < maintenant;
}

/**
 * Hook utilitaire : vérifiez la session et redirige si nécessaire.
 * À appeler au chargement des pages protégées.
 */
export function requireAuth(redirectTo: string = "/login"): boolean {
  si (typeof fenêtre === "undefined") retourner faux ;

  si (!isAuthenticated() || isTokenExpired()) {
    supprimerToken();
    supprimerUtilisateur();
    fenêtre.location.href = redirectionVer;
    renvoyer faux ;
  }
  renvoyer vrai ;
}

/**
 * Redirige si l'utilisateur est déjà connecté.
 * À appeler sur les pages /login et /register.
 */
export function redirectIfAuthenticated(redirectTo: string = "/"): void {
  si (type de fenêtre === "undefined") retourner;
  si (isAuthenticated() && !isTokenExpired()) {
    fenêtre.location.href = redirectionVer;
  }
}
