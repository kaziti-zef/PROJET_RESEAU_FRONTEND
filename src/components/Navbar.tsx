"use client";
// ============================================================
//  NidiRoom — components/Navbar.tsx
//  Barre de navigation responsive, adaptée selon le rôle
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useSocket } from "@/lib/socket";
import { SocketNotification, getNotifIcon } from "@/lib/socket";

export default function Navbar() {
  const { user, isAuthenticated, clearSession } = useAuth();
  const { showToast } = useToast();
  const pathname  = usePathname();
  const router    = useRouter();

  const [menuOpen,  setMenuOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs,    setNotifs]    = useState<SocketNotification[]>([]);

  // ── Réception des notifications WebSocket ────────────────
  useSocket("notifications", (notif) => {
    setNotifs((prev) => [notif, ...prev].slice(0, 20)); // max 20
    showToast(`${getNotifIcon(notif.type)} ${notif.message}`, "info");
  });

  // Ferme le menu mobile au changement de page
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // ── Déconnexion ──────────────────────────────────────────
  const handleLogout = async () => {
    await clearSession();
    showToast("Vous avez été déconnecté.", "success");
    router.push("/login");
  };

  const unreadCount = notifs.filter((n) => !n.lu).length;

  // ── Liens selon le rôle ──────────────────────────────────
  const navLinks = isAuthenticated
    ? [
        { href: "/listings",     label: "Annonces" },
        { href: "/reservations", label: "Mes réservations" },
        ...(user?.role === "HOTE"
          ? [{ href: "/host/dashboard", label: "Tableau de bord" }]
          : []),
      ]
    : [{ href: "/listings", label: "Annonces" }];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="font-playfair text-2xl font-bold text-gray-900">
          Nidi<span className="text-red-500">Room</span>
        </Link>

        {/* Liens desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "text-red-500"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Cloche notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown notifications */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-800">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs text-red-500 font-medium">
                          {unreadCount} non lue(s)
                        </span>
                      )}
                    </div>
                    <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {notifs.length === 0 ? (
                        <li className="px-4 py-6 text-center text-sm text-gray-400">
                          Aucune notification
                        </li>
                      ) : (
                        notifs.map((n) => (
                          <li
                            key={n.id}
                            className={`px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                              !n.lu ? "bg-red-50" : ""
                            }`}
                          >
                            <p className="font-medium text-gray-800">
                              {getNotifIcon(n.type)} {n.titre}
                            </p>
                            <p className="text-gray-500 mt-0.5">{n.message}</p>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Profil */}
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs">
                  {user?.prenom?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="hidden lg:inline">{user?.prenom}</span>
              </Link>

              {/* Déconnexion */}
              <button
                onClick={handleLogout}
                className="text-sm font-semibold border-2 border-gray-200 px-4 py-1.5 rounded-full hover:border-gray-900 transition-colors"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold border-2 border-gray-200 px-4 py-1.5 rounded-full hover:border-gray-900 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
              >
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>

        {/* Burger mobile */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <div className={`w-5 h-0.5 bg-gray-800 mb-1 transition-transform ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
          <div className={`w-5 h-0.5 bg-gray-800 mb-1 transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <div className={`w-5 h-0.5 bg-gray-800 transition-transform ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block text-sm font-medium text-gray-700 hover:text-red-500 py-1"
            >
              {l.label}
            </Link>
          ))}
          <hr className="border-gray-100" />
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="block text-sm font-medium text-gray-700 py-1">
                Mon profil ({user?.prenom})
              </Link>
              <button
                onClick={handleLogout}
                className="block text-sm font-semibold text-red-500 py-1"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/login"    className="block text-sm font-medium text-gray-700 py-1">Connexion</Link>
              <Link href="/register" className="block text-sm font-semibold text-red-500 py-1">S&apos;inscrire</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
