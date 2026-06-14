// ============================================================
// NidiRoom — lib/socket.ts
// Connexion WebSocket temps réel (STOMP sur SockJS)
// Le backend Spring Boot reçoit les événements Kafka et les
// pousse aux clients via WebSocket/STOMP
// ============================================================
//
// DÉPENDANCES À INSTALLATEUR :
// npm install @stomp/stompjs sockjs-client
// npm install --save-dev @types/sockjs-client
// ============================================================

import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getToken } from "./auth";

// ── Configuration ──────────────────────────────────────────

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws";

// ── Types ──────────────────────────────────────────────────

type d'exportation NotificationType =
  | "RESERVATION_RECUE" // Hôtel : nouvelle réservation
  | "RESERVATION_CONFIRMEE" // Locataire : réservation confirmée
  | "RESERVATION_ANNULEE" // Les deux : réservation annulée
  | "PAIEMENT_RECU" // Hôte : paiement reçu
  | "NOUVEL_AVIS" // Hôte : nouvel avis laissé
  | "MESSAGE_RECU" // Message privé
  | "SYSTÈME"; // Système de notification

export interface SocketNotification {
  id : chaîne de caractères ;
  type : Type de notification ;
  titre : chaîne de caractères ;
  message : chaîne de caractères ;
  données ? : Enregistrement<string, inconnu> ; // données supplémentaires (ex : id réservation)
  horodatage : chaîne de caractères ;
  lu : booléen ;
}

export type NotificationHandler = (notif: SocketNotification) => void;

// ════════════════════════════════════════════════════════
// CLASSE PRINCIPALE — NidiRoomSocket
// ════════════════════════════════════════════════════════

classe NidiRoomSocket {
  client privé : Client | null = null ;
  abonnements privés : Map<string, StompSubscription> = new Map();
  gestionnaires privés : Map<string, Set<NotificationHandler>> = new Map();
  délai de reconnexion privé : nombre = 5000 ;
  privé isConnected : booléen = faux ;

  // ── Connexion ────────────────────────────────────────────

  /**
   * Initialisez et connectez le client STOMP.
   * À appeler après la connexion de l'utilisateur.
   * Le token JWT est passé dans les headers STOMP pour
   * que Spring Security valide la connexion WebSocket.
   */
  connecter(userId: nombre): Promise<void> {
    retourner une nouvelle promesse((résolution, rejet) => {
      si (this.isConnected) {
        résoudre();
        retour;
      }

      const token = getToken();
      si (!jeton) {
        rejet(new Error("Token JWT absent. Connectez-vous d'abord."));
        retour;
      }

      this.client = new Client({
        // SockJS comme transport (fallback si WebSocket natif bloqué)
        webSocketFactory: () => new SockJS(WS_URL),

        // Headers d'authentification envoyés lors du handshake STOMP
        connectHeaders: {
          Autorisation : `Porteur ${token}`,
          "user-id" : Chaîne(userId),
        },

        // Reconnexion automatique toutes les 5 secondes
        délai de reconnexion : this.reconnectDelay,

        // ── Connexion réussie ──
        onConnect: () => {
          console.log("[Socket] Connecté au serveur WebSocket");
          this.isConnected = true;

          // Abonnement aux notifications personnelles de l'utilisateur
          // Spring Boot publié sur /user/{userId}/queue/notifications
          ceci._s'abonner(
            `/user/${userId}/queue/notifications`,
            « notifications »,
            (msg) => this._dispatch("notifications", msg)
          );

          // Abonnement aux notifications globales (ex: annonces système)
          ceci._s'abonner(
            "/topic/annonces",
            "annonces-globales",
            (msg) => this._dispatch("annonces-globales", msg)
          );

          résoudre();
        },

        // ── Erreur STOMP ──
        onStompError: (frame) => {
          console.error("[Socket] Erreur STOMP :", frame.headers["message"]);
          this.isConnected = false;
          rejeter(nouvelle Erreur(frame.headers["message"]));
        },

        // ── Déconnexion ──
        onDisconnect: () => {
          console.log("[Socket] Déconnecté");
          this.isConnected = false;
        },

        // ── WebSocket fermé ──
        onWebSocketClose: () => {
          console.warn("[Socket] WebSocket fermé — tentative de reconnexion…");
          this.isConnected = false;
        },
      });

      this.client.activate();
    });
  }

  // ── Déconnexion ───────────────────── ─────────────────────

  /** Déconnectez proprement le WebSocket */
  déconnecter(): void {
    si (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.handlers.clear();
      this.client.désactiver();
      this.client = null;
      this.isConnected = false;
      console.log("[Socket] Déconnexion proprement effectuée");
    }
  }

  // ── Abonnement interne ───────────────────────────────────

  privé _s'abonner(
    destination : chaîne de caractères,
    clé : chaîne de caractères,
    rappel : (msg : IMessage) => void
  ): vide {
    si (!this.client || !this.isConnected) retourner;

    const sub = this.client.subscribe(destination, callback);
    this.subscriptions.set(key, sub);
  }

  // ── Envoi des messages reçus ──────────────────────────

  private _dispatch(channel: string, msg: IMessage): void {
    essayer {
      const notif: SocketNotification = JSON.parse(msg.body);
      const gestionnaires de canaux = this.gestionnaires.get(canal);
      si (gestionnaires de canaux) {
        channelHandlers.forEach((handler) => handler(notif));
      }
      // Dispatch global (tous les canaux)
      const globalHandlers = this.handlers.get("*");
      si (gestionnaires globaux) {
        globalHandlers.forEach((handler) => handler(notif));
      }
    } attraper (erreur) {
      console.error("[Socket] Erreur d'analyse du message :", err);
    }
  }

  // ── API publique ──────────────────── ─────────────────────

  /**
   * S'abonner aux notifications d'un canal.
   * @param canal "notifications" | "annonces-globales" | "*" (tous)
   * @param handler fonction appelée à chaque message reçu
   * @returns fonction de désabonnement
   *
   * @exemple
   * const unsub = socketService.on("notifications", (notif) => {
   * console.log("Nouvelle notif :", notif.message);
   * });
   * // Plus tard :
   * désabonnement();
   */
  on(channel: string, handler: NotificationHandler): () => void {
    si (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    this.handlers.get(channel)!.add(handler);

    // Retourne une fonction de désabonnement
    retourner () => {
      this.handlers.get(channel)?.delete(handler);
    };
  }

  /**
   * Envoyer un message au backend via STOMP.
   * Utilisé pour les actions temps réel (ex: marquer comme lu).
   */
  envoyer(destination : chaîne, corps : Record<chaîne, inconnu>) : void {
    si (!this.client || !this.isConnected) {
      console.warn("[Socket] Non connecté — message non envoyé");
      retour;
    }
    this.client.publish({
      destination,
      corps : JSON.stringify(corps),
      en-têtes : { "content-type": "application/json" },
    });
  }

  /** Marquer une notification comme lu via WebSocket */
  marquerLue(notifId: chaîne): void {
    this.send("/app/notifications/lire", { id: notifId });
  }

  /** Vérifiez si le socket est connecté */
  obtenir connecté(): booléen {
    retourner this.isConnected;
  }
}

// ════════════════════════════════════════════════════════
// SINGLETON — une seule instance dans toute l'application
// ════════════════════════════════════════════════════════

export const socketService = new NidiRoomSocket();

// ════════════════════════════════════════════════════════
// HOOK REACT — useSocket
// À utiliser dans les composants Next.js
// ════════════════════════════════════════════════════════

import { useEffect, useCallback } from "react";
import { getUser } from "./auth";

/**
 * Hook React pour s'abonner aux notifications WebSocket.
 *
 * @exemple
 * // Dans un composant :
 * useSocket("notifications", (notif) => {
 * setNotifications(prev => [notif, ...prev]);
 * afficherToast(notif.message);
 * });
 */
fonction export useSocket(
  canal : chaîne de caractères,
  gestionnaire : NotificationHandler
): vide {
  const stableHandler = useCallback(handler, []); // eslint-disable-line

  utiliserEffect(() => {
    // Ne s'exécute que côté client
    si (type de fenêtre === "undefined") retourner;

    const utilisateur = getUser();
    si (!utilisateur) retourner;

    // Connexion si pas déjà connecté
    si (!socketService.connecté) {
      socketService.connect(user.id).catch((err) => {
        console.error("[useSocket] Erreur de connexion :", err);
      });
    }

    // Abonnement au canal
    const unsub = socketService.on(channel, stableHandler);

    // Nettoyage au démontage du composant
    retourner () => {
      désabonnement();
    };
  }, [canal, gestionnaire stable]);
}

// ════════════════════════════════════════════════════════
// NOTIFICATIONS DES SERVICES PUBLICS
// ════════════════════════════════════════════════════════

/** Retourne l'emoji correspondant au type de notification */
export function getNotifIcon(type: NotificationType): string {
  const icônes: Record<NotificationType, chaîne> = {
    RÉSERVATION_SAUVETAGE : "📅",
    RÉSERVATION_CONFIRMÉE : "✅",
    RÉSERVATION_ANNULÉE : "❌",
    PAIEMENT_RECU: "💳",
    NOUVELLE_AVIS : "⭐",
    MESSAGE_RECU: "💬",
    SYSTÈME : "🔔",
  };
  retourner icônes[type] || "🔔";
}

/** Formater le timestamp d'une notification */
export function formatNotifTime(timestamp: string): string {
  const date = new Date(timestamp);
  const maintenant = nouvelle Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffJ = Math.floor(diffH / 24);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il ya ${diffMin} min` ;
  si (diffH < 24) retourner `Il ya ${diffH}h`;
  if (diffJ < 7) return `Il ya ${diffJ}j` ;
  retourner date.toLocaleDateString("fr-FR");
}
