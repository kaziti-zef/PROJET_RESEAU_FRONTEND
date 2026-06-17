"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.kenteBand} />

      <div className={`mx-auto px-6 py-16 ${styles.container}`}>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className={`flex items-center justify-center rounded-full ${styles.logoIcon}`}>
                <MapPin size={18} color="#1A3C2E" strokeWidth={2.5} />
              </div>
              <span className={styles.logoText}>
                Kamer<span className={styles.logoAccent}>Stay</span>
              </span>
            </div>
            <p className={styles.tagline}>
              La référence de la réservation hôtelière au Cameroun. Luxe, authenticité et prix garantis en FCFA.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                <span key={i} className={styles.socialIcon}>
                  <Icon size={16} color="rgba(247,243,236,0.7)" />
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className={styles.footerTitle}>Navigation</h4>
            {[
              { label: "Accueil", href: "/" },
              { label: "Rechercher", href: "/search" },
              { label: "Nos hôtels", href: "/search" },
              { label: "Espace hôte", href: "/host/dashboard" },
              { label: "Mes réservations", href: "/reservations" },
            ].map((item) => (
              <div key={item.label} className="mb-3">
                <Link href={item.href} className={styles.footerLink}>{item.label}</Link>
              </div>
            ))}
          </div>

          <div>
            <h4 className={styles.footerTitle}>Destinations</h4>
            {["Yaoundé", "Douala", "Kribi", "Limbé", "Bafoussam", "Ngaoundéré", "Garoua", "Bertoua"].map((city) => (
              <div key={city} className="mb-3">
                <Link href={`/search?city=${encodeURIComponent(city)}`} className={styles.footerLink}>{city}</Link>
              </div>
            ))}
          </div>

          <div>
            <h4 className={styles.footerTitle}>Contact</h4>
            <div className="flex flex-col gap-4">
              {[
                { Icon: MapPin, text: "Rue du Lac Vert, Yaoundé, Cameroun" },
                { Icon: Phone, text: "+237 699 000 111" },
                { Icon: Mail, text: "support@kamerstay.cm" },
              ].map(({ Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Icon size={16} color="#C9943A" className={styles.contactIcon} />
                  <span className={styles.contactText}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex flex-col md:flex-row items-center justify-between gap-4 pt-10 mt-10 ${styles.bottomDivider}`}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} KamerStay. Tous droits réservés. —{" "}
            <span className={styles.cfaHighlight}>Tous les prix affichés en Franc CFA (FCFA)</span>
          </p>
          <div className="flex gap-6">
            {["Confidentialité", "Conditions", "Cookies"].map((item) => (
              <span key={item} className={styles.footerLink} style={{ fontSize: "13px" }}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
