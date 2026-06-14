"use client";
// ============================================================
//  NidiRoom — contexts/AuthContext.tsx
//  Fournit l'état de session à toute l'application
//  Connecte aussi le WebSocket dès que l'utilisateur se connecte
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  User,
  getUser,
  getToken,
  saveToken,
  saveUser,
  removeToken,
  removeUser,
  isTokenExpired,
} from "@/lib/auth";
import { socketService } from "@/lib/socket";
import { logout as apiLogout } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (token: string, user: User) => void;
  clearSession: () => Promise<void>;
}

// ── Création du contexte ───────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ───────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [token, setToken]             = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(true);

  // ── Initialisation au montage ────────────────────────────
  // Lit le localStorage et restaure la session si token valide

  useEffect(() => {
    const storedToken = getToken();
    const storedUser  = getUser();

    if (storedToken && storedUser && !isTokenExpired()) {
      setToken(storedToken);
      setUser(storedUser);

      // Reconnexion WebSocket au rechargement de page
      socketService.connect(storedUser.id).catch(() => {
        console.warn("[AuthContext] WebSocket non disponible au démarrage");
      });
    } else {
      // Token expiré → nettoyage
      removeToken();
      removeUser();
    }

    setIsLoading(false);
  }, []);

  // ── Sauvegarder une session (après login / register) ─────

  const setSession = useCallback((newToken: string, newUser: User) => {
    saveToken(newToken);
    saveUser(newUser);
    setToken(newToken);
    setUser(newUser);

    // Connexion WebSocket immédiate après login
    socketService.connect(newUser.id).catch(() => {
      console.warn("[AuthContext] WebSocket non disponible");
    });
  }, []);

  // ── Effacer la session (déconnexion) ─────────────────────

  const clearSession = useCallback(async () => {
    try {
      await apiLogout(); // invalide le token dans Redis
    } catch {
      // Déconnexion côté client même si le serveur est indisponible
    } finally {
      socketService.disconnect();
      removeToken();
      removeUser();
      setToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        setSession,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook d'accès au contexte ──────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  }
  return ctx;
}
