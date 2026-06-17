"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Mail, User as UserIcon, Building2, BadgeCheck, LayoutDashboard, CalendarCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/auth";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login?redirect=/profile");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return <div className="min-h-screen bg-ivory pt-[120px] mx-auto px-6 max-w-2xl"><div className="skeleton rounded-2xl h-[280px]" /></div>;
  }

  const initials = `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase();
  const isHote = user.role === "HOTE";

  return (
    <div className={styles.pageWrap}>
      <div className={`mx-auto px-6 ${styles.container}`}>
        <div className={`rounded-2xl overflow-hidden mb-6 ${styles.profileCard}`}>
          <div className={styles.banner} />
          <div className="px-8 pb-8" style={{ marginTop: -44 }}>
            <div className={`flex items-center justify-center rounded-full mb-4 ${styles.avatar}`}>{initials}</div>
            <h1 className={styles.userName}>{user.prenom} {user.nom}</h1>
            <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full ${styles.roleBadge}`}>
              <BadgeCheck size={14} color="#C9943A" /> {isHote ? "Compte Hôte" : "Compte Voyageur"}
            </span>
          </div>
        </div>

        <div className={`rounded-2xl p-7 mb-6 ${styles.detailCard}`}>
          <h2 className={`mb-5 ${styles.detailTitle}`}>Mes informations</h2>
          <div className="flex flex-col gap-4">
            {[
              { Icon: UserIcon, label: "Nom complet", value: `${user.prenom} ${user.nom}` },
              { Icon: Mail, label: "Email", value: user.email },
              ...(isHote ? [{ Icon: Building2, label: "Raison sociale", value: user.raison_sociale || "—" }] : []),
            ].map(({ Icon, label, value }) => (
              <div key={label} className={`flex items-center gap-4 p-4 rounded-xl ${styles.infoRow}`}>
                <div className={`flex items-center justify-center rounded-full flex-shrink-0 ${styles.infoIconWrap}`}><Icon size={18} color="#1A3C2E" /></div>
                <div>
                  <p className={styles.infoLabel}>{label}</p>
                  <p className={styles.infoValue}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={isHote ? "/host/dashboard" : "/reservations"} className={`flex-1 flex items-center justify-center gap-2 rounded-xl ${styles.primaryLink}`}>
            {isHote ? <><LayoutDashboard size={16} /> Espace hôte</> : <><CalendarCheck size={16} /> Mes réservations</>}
          </Link>
          <button onClick={() => signOut()} className={`flex-1 flex items-center justify-center gap-2 rounded-xl ${styles.logoutBtn}`}>
            <LogOut size={16} /> Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
