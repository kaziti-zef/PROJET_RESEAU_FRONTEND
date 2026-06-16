# 🔄 Intégration Backend Node.js — Changements Effectués

## ✅ Résumé des modifications

Le frontend a été adapté pour fonctionner avec le backend Node.js/PostgreSQL au lieu de Spring Boot.

---

## 📋 Changements principaux

### 1. **Configuration des URLs** (`.env.local`)
- ✅ **Avant** : `http://localhost:8080` (Spring Boot)
- ✅ **Après** : `http://localhost:4000` (Node.js)

### 2. **Endpoints API** (`src/lib/api.ts`)

| Ressource | Avant | Après |
|-----------|-------|-------|
| **Connexion** | `/api/auth/login` | `/api/auth/connexion` |
| **Inscription** | `/api/auth/register` | `/api/auth/inscription` |
| **Profil** | `/api/auth/me` | `/api/auth/profil` |
| **Réservations (hôte)** | `/api/reservations/recues` | `/api/reservations/hote` |
| **Paiements** | `/initier/{id}` / `/verifier/{ref}` | `/api/paiements` (création) |
| **Avis** | `/api/annonces/{id}/avis` | `/api/avis` (création), `/api/avis/annonce/{id}` |

### 3. **Rôles utilisateur** (`src/lib/auth.ts`, `src/app/register/page.tsx`)
- ✅ **Avant** : `"LOCATAIRE"` | `"HOTE"` | `"ADMIN"`
- ✅ **Après** : `"CLIENT"` | `"HOTE"`

### 4. **WebSocket temps réel** (`src/lib/socket.ts`)
- ✅ **Avant** : STOMP over SockJS (`@stomp/stompjs`, `sockjs-client`)
- ✅ **Après** : Socket.io (`socket.io-client`)

**Événements reçus du serveur** :
```javascript
// Backend envoie :
socket.emit('reservation_confirmee', data)
socket.emit('nouvelle_reservation', data)
socket.emit('reservation_annulee', data)
```

### 5. **Authentification**
- ✅ **Suppression de la 2FA** : Pas implémentée dans le backend Node.js
  - Enlevé le formulaire 2FA dans `src/app/login/page.tsx`
  - Suppression des types `verify2FA()`

### 6. **Dépendances npm** (`package.json`)
```diff
- @stomp/stompjs: ^7.3.0
- sockjs-client: ^1.6.1
+ socket.io-client: ^4.7.2
```

---

## 📁 Fichiers modifiés

| Fichier | Changements |
|---------|-------------|
| `src/lib/api.ts` | URLs, rôles CLIENT, endpoints |
| `src/lib/auth.ts` | Suppression 2FA, rôles CLIENT |
| `src/lib/socket.ts` | Remplacement STOMP → Socket.io |
| `src/contexts/AuthContext.tsx` | Suppression import `apiLogout` |
| `src/app/login/page.tsx` | Suppression formulaire 2FA |
| `src/app/register/page.tsx` | Rôles CLIENT |
| `src/app/profile/page.tsx` | Suppression rôle ADMIN |
| `src/app/reservations/page.tsx` | `initierPaiement` → `createPaiement` |
| `src/components/Navbar.tsx` | Non modifié (OK) |
| `.env.local` | ✅ Créé |
| `package.json` | ✅ Mis à jour |

---

## 🚀 Démarrage du projet

### Frontend (Next.js)
```bash
cd PROJET_RESEAU_FRONTEND
npm install
npm run dev
# http://localhost:3000
```

### Backend (Node.js) — À configurer
```bash
cd ../room-renting-backend
npm install

# Configurer .env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tonMotDePasse
DB_NAME=room_renting_db
JWT_SECRET=room_renting_super_secret_key_2024
JWT_EXPIRES_IN=7d

npm run dev
# http://localhost:4000
```

---

## 🔗 Flux de connexion Socket.io

### 1. **Utilisateur se connecte** (login)
```typescript
// AuthContext → socketService.connect(userId)
socket.auth = {
  token: "Bearer <JWT>",
  userId: "123"
}
```

### 2. **Serveur valide et envoie événement**
```javascript
socket.on('connect', () => {
  // User connecté
})
```

### 3. **Notifications temps réel reçues**
```typescript
socket.on('reservation_confirmee', (data) => {
  // Afficher notification
})
```

---

## ⚠️ Problèmes connus

1. **Build production** : Erreur Turbopack avec Google Fonts (impact cosmétique, non-bloquant)
   - Développement fonctionne normalement
   - Solution : Attendre correction Next.js ou utiliser Webpack

2. **Déconnexion** : Le backend Node.js n'invalide pas les tokens (pas de Redis)
   - Impact : Token reste valide après déconnexion si pas expiré
   - Sécurité : Suffisant pour développement

---

## 📌 À vérifier avec votre backend

✅ **Endpoints** : Vérifiez que les routes correspondent
✅ **CORS** : Frontend sur `:3000`, Backend sur `:4000`
✅ **WebSocket** : Socket.io doit être activé (`io()`)
✅ **JWT** : Format du token et validation

---

## 🎯 Tests recommandés

1. Inscription avec un nouveau compte (CLIENT)
2. Inscription avec rôle HOTE
3. Connexion / Déconnexion
4. Réception des notifications WebSocket (créer une réservation)
5. Upload d'images (si implémenté)

---

## 📖 Documentation utile

- [Next.js 16 API Routes](https://nextjs.org/docs)
- [Socket.io Documentation](https://socket.io/docs/v4/client-api/)
- [Backend Room Renting - Voir README](../room-renting-backend/README.md)
