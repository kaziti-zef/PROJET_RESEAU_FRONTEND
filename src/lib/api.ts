// ============================================================
// NidiRoom — lib/api.ts
// Toutes les fonctions d'appel vers le backend Spring Boot
// URL de base : http://localhost:8080 (Spring Boot par défaut)
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ── Types globaux ───────────────────── ─────────────────────

export interface ApiResponse<T> {
  données : T | nul ;
  erreur : chaîne | null ;
  statut : nombre ;
}

export interface User {
  id : numéro ;
  nom : chaîne de caractères ;
  prénom : chaîne de caractères ;
  courriel : chaîne de caractères ;
  rôle : "LOCATAIRE" | "CHAUDE" | « ADMINISTRATEUR » ;
  téléphone ? : chaîne de caractères ;
  photo ? : ficelle ;
  twoFactorEnabled ? : booléen ;
}

interface d'exportation Annonce {
  id : numéro ;
  titre : chaîne de caractères ;
  description : chaîne de caractères ;
  ville : chaîne de caractères ;
  adresse : chaîne de caractères ;
  prix_par_nuit: nombre;
  capacité : nombre ;
  superficie ?: nombre ;
  image_principale ?: chaîne de caractères ;
  images ?: chaîne[] ;
  note_moyenne ?: nombre ;
  nombre_avis?: nombre;
  hôtel ? : Utilisateur ;
  latitude ? : nombre ;
  longitude ? : nombre ;
  disponible : booléen ;
}

export interface Réservation {
  id : numéro ;
  annonce: Annonce;
  locataire : Utilisateur ;
  date_début : chaîne de caractères ;
  date_fin : chaîne de caractères ;
  statut : "EN_ATTENTE" | "CONFIRMÉ" | "ANNULÉ" | « TERMINÉ » ;
  montant_total : nombre ;
  créé_à : chaîne de caractères ;
}

interface d'exportation Avis {
  id : numéro ;
  auteur : Utilisateur ;
  annonce_id : numéro ;
  note : nombre ;
  commentaire : chaîne de caractères ;
  créé_à : chaîne de caractères ;
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

interface d'exportation AnnoncePayload {
  titre : chaîne de caractères ;
  description : chaîne de caractères ;
  ville : chaîne de caractères ;
  adresse : chaîne de caractères ;
  prix_par_nuit: nombre;
  capacité : nombre ;
  superficie ?: nombre ;
  latitude ? : nombre ;
  longitude ? : nombre ;
}

export interface ReservationPayload {
  annonce_id : numéro ;
  date_début : chaîne de caractères ;
  date_fin : chaîne de caractères ;
}

export interface SearchParams {
  ville ?: chaîne de caractères ;
  capacité ? : nombre ;
  prix_max ? : nombre ;
  prix_min?: nombre;
  page ? : numéro ;
  taille ? : nombre ;
}

// ── Principal utilitaire ───────────────────────────────────

/**
 * Fonction fetch centralisée.
 * Ajoute automatiquement le token JWT si présent dans localStorage.
 */
fonction asynchrone apiFetch<T>(
  point de terminaison : chaîne de caractères,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Récupère le token JWT stocké après connexion
  jeton constant =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(jeton ? { Autorisation : `Porteur ${jeton}` } : {}),
    ...options.headers,
  };

  essayer {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      en-têtes,
    });

    // Token expiré ou invalide → déconnexion automatique
    si (res.status === 401) {
      si (typeof fenêtre !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      return { data: null, error: "Session expirée. Reconnectez-vous.", status: 401 };
    }

    // Pas de contenu (DELETE, etc.)
    si (res.status === 204) {
      renvoie { données: null, erreur: null, statut: 204 };
    }

    const json = await res.json();

    si (!res.ok) {
      retour {
        données : nulles,
        erreur : json?.message || json?.erreur || "Une erreur est survenue.",
        statut : res.status,
      };
    }

    renvoie { données: json, erreur: null, statut: res.status };
  } attraper (erreur) {
    console.error("[Erreur API]", err);
    retour {
      données : nulles,
      error: "Impossible de joindre le serveur. Vérifiez que le backend est démarré.",
      statut : 0,
    };
  }
}

// ════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════

/** Connexion — retourner token JWT + infos utilisateur */
export async function login(payload: LoginPayload) {
  return apiFetch<{ token: string; user: User }>("/api/auth/login", {
    méthode : « POST »,
    corps : JSON.stringify(payload),
  });
}

/** Inscription */
export async function register(payload: RegisterPayload) {
  return apiFetch<{ token: string; user: User }>("/api/auth/register", {
    méthode : « POST »,
    corps : JSON.stringify(payload),
  });
}

/** Profil de l'utilisateur connecté */
export async function getMe() {
  retourner apiFetch<User>("/api/auth/me");
}

/** Déconnexion côté serveur (invalide le token si blacklist Redis) */
export async function logout() {
  return apiFetch<void>("/api/auth/logout", { method: "POST" });
}

/** Vérification du code 2FA */
export async function verify2FA(code: string) {
  return apiFetch<{ token: string; user: User }>("/api/auth/2fa/verify", {
    méthode : « POST »,
    corps : JSON.stringify({ code }),
  });
}

// ════════════════════════════════════════════════════════
// ANNONCES
// ════════════════════════════════════════════════════════

/** Liste des annonces avec filtres optionnels */
export async function getAnnonces(params?: SearchParams) {
  const requête = paramètres
    ? "?" + nouveaux paramètres de recherche d'URL(
        Objet.entrées(paramètres)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";
  return apiFetch<{ annonces: Annonce[]; total : nombre ; page : numéro }>(`/api/annonces${query}`);
}

/** Détail d'une annonce */
export async function getAnnonce(id: nombre) {
  return apiFetch<Annonce>(`/api/annonces/${id}`);
}

/** Créer une annonce (HOTE seulement) */
export async function createAnnonce(payload: AnnoncePayload) {
  return apiFetch<Annonce>("/api/annonces", {
    méthode : « POST »,
    corps : JSON.stringify(payload),
  });
}

/** Modifier une annonce */
export async function updateAnnonce(id: number, payload: Partial<AnnoncePayload>) {
  return apiFetch<Annonce>(`/api/annonces/${id}`, {
    méthode : "PUT",
    corps : JSON.stringify(payload),
  });
}

/** Supprimer une annonce */
export async function deleteAnnonce(id: nombre) {
  return apiFetch<void>(`/api/annonces/${id}`, { method: "DELETE" });
}

/** Uploader une image pour une annonce (MinIO) */
export async function uploadAnnonceImage(id: number, file: File) {
  jeton constant =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const formData = new FormData();
  formData.append("image", fichier);

  const res = await fetch(`${BASE_URL}/api/annonces/${id}/images`, {
    méthode : « POST »,
    en-têtes : jeton ? { Authorization : `Bearer ${token}` } : {},
    corps : formData,
  });
  const json = await res.json();
  renvoie { données: json, erreur: res.ok ? null : json?.message, statut: res.status };
}

// ════════════════════════════════════════════════════════
// RÉSERVATIONS
// ════════════════════════════════════════════════════════

/** Créer une réservation */
export async function createReservation(payload: ReservationPayload) {
  return apiFetch<Reservation>("/api/reservations", {
    méthode : « POST »,
    corps : JSON.stringify(payload),
  });
}

/** Mes réservations (en tant que locataire) */
export async function getMesReservations() {
  return apiFetch<Reservation[]>("/api/reservations/mes-reservations");
}

/** Réservations reçues (en tant qu'hôte) */
export async function getReservationsRecues() {
  retourner apiFetch<Reservation[]>("/api/reservations/recues");
}

/** Confirmer une réservation (HOTE) */
export async function confirmerReservation(id: nombre) {
  return apiFetch<Reservation>(`/api/reservations/${id}/confirmer`, {
    méthode : "PUT",
  });
}

/** Annuler une réservation */
export async function annulerReservation(id: nombre) {
  return apiFetch<Reservation>(`/api/reservations/${id}/annuler`, {
    méthode : "PUT",
  });
}

// ════════════════════════════════════════════════════════
// AVIS
// ════════════════════════════════════════════════════════

/** Avis d'une annonce */
export async function getAvis(annonceId: nombre) {
  return apiFetch<Avis[]>(`/api/annonces/${annonceId}/avis`);
}

/** Laisser un avis */
exporter la fonction asynchrone créerAvis(
  annonceId : numéro,
  payload: { note: nombre; commentaire: chaîne de caractères }
) {
  return apiFetch<Avis>(`/api/annonces/${annonceId}/avis`, {
    méthode : « POST »,
    corps : JSON.stringify(payload),
  });
}

// ════════════════════════════════════════════════════════
// PAIEMENTS
// ════════════════════════════════════════════════════════

/** Initier un paiement pour une réservation */
export async function initierPaiement(reservationId: nombre) {
  renvoie apiFetch<{ payment_url: chaîne; reference: chaîne }>(
    `/api/paiements/initier/${reservationId}`,
    { méthode: "POST" }
  );
}

/** Vérifier le statut d'un paiement */
export async function verifierPaiement(reference: string) {
  return apiFetch<{ statut: string; montant: number }>(
    `/api/paiements/verifier/${reference}`
  );
}

// ════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════

/** Récupérer les notifications de l'utilisateur */
export async function getNotifications() {
  return apiFetch<{ id: nombre; message: chaîne; lu: booléen; created_at: chaîne }[]>(
    "/api/notifications"
  );
}

/** Marquer une notification comme lu */
export async function marquerNotificationLue(id: nombre) {
  return apiFetch<void>(`/api/notifications/${id}/lire`, { method: "PUT" });
}
