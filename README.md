# eFootball Coin Manager Pro (EFAPP)

**EFAPP** is a Behavioral Decision Support System designed for eFootball players managing multiple accounts. It is explicitly NOT just a coin tracker or pack simulator. Its primary purpose is to instill discipline, reduce impulsive spending, and maximize the success rate of reaching the 900-coin threshold for the Premium Match Pass.

## 🚀 Installation & Lancement

```bash
npm install
npm run dev
```

Ouvre ensuite l'URL affichée dans le terminal (en général `http://localhost:5173`).

---

## 💾 Persistance des données & "Zero Cloud" (Important)

Toutes les données (comptes, soldes, historique) sont stockées dans **IndexedDB** (via Dexie.js), une base de données intégrée au navigateur.

- **100% Local :** Rien n'est stocké sur nos serveurs. Vous êtes l'unique propriétaire de vos données.
- **P2P Sync (PeerJS) :** Possibilité de synchroniser vos données entre vos différents appareils (PC / Mobile) en direct de pair-à-pair, sans serveur intermédiaire. Sécurisé, crypté et anonyme !
- **PWA (Progressive Web App) :** L'application est installable directement sur votre appareil, fonctionnant 100% hors-ligne comme une application native.
- **Sauvegarde manuelle :** Page *Paramètres* pour exporter/importer un fichier JSON si nécessaire.

---

## 🧠 Fonctionnalités Principales & Mental Coach

L'application est construite autour du concept de **Mental Coach** pour aider le joueur :

- **Multi-Account Management :** Suivi de l'évolution des coins par rapport à un objectif (défaut: 900).
- **Protection 900 :** Avertissements stricts en cas de chute sous le seuil.
- **Spin Tracker Wizard :** Enregistrement de chaque tirage pour lier la dépense à l'émotion.
- **Mode Urgence (I WANT TO SPIN) :** Cooldown statique de 5 minutes pour prévenir le FOMO.
- **Post-Loss Recovery :** Assistance psychologique pour éviter de chercher à "se refaire" après une grosse perte.
- **Analytics & Bilan Officiel :** Suivi visuel des performances (gains, dépenses, distribution) et exportation d'un bilan officiel PDF généré dynamiquement.
- **Local PIN Lock :** Verrouillage de l'application pour protéger les données sur un appareil partagé.

---

## 🗺️ Roadmap & État d'Avancement

### Phase 1: Core Skeleton & Persistence (COMPLETED)

* Local routing and Sidebar UI
- Account CRUD operations
- Centralized Coin Log ledger ensuring absolute balance integrity
- IndexedDB configuration via Dexie.js
- Local JSON Import/Export backup system

### Phase 2 & 3: Spin Tracker & Advanced Behavioral Friction (COMPLETED)

* 4-Step Spin Tracker Wizard (Automatic Coin Log generation)
- Protection 900 Mode & Impulsivity Detection
- Local PIN Lock system
- Mode Urgence (I WANT TO SPIN) with cooldown
- Post-Loss Recovery logic & Pending Regret tracking

### Phase 4 & 5: Scoring, Forecasting & Analytics (COMPLETED)

* Chart.js & Recharts integration for behavioral and financial metrics
- Goal Distribution & Milestone Achievement
- Professional PDF Official Bilan Export with charts and stamps

### Phase 6: Sync & Native Experience (COMPLETED)

* **PWA Integration:** Manifest & Service Workers via `vite-plugin-pwa` for offline, native-like installation.
* **P2P Cloud Sync:** Anonymous, server-less device synchronization using PeerJS.
* **Pro Architecture Refactoring:** Modularized UI (Separation of SpinTracker, Analytics, Settings, DataManagement).

## 📝 Changelog Récent

### Version 6.0 (Pro Max - Actuelle)

* **PWA (Progressive Web App) :** Bouton "Installer EFAPP" ajouté dans les paramètres. Fonctionne 100% hors-ligne.
- **Cloud Sync P2P :** Synchronisation de vos données entre appareils de pair-à-pair (PeerJS).
- **Architecture Modulaire :** Le "code spaghetti" a été nettoyé. Les gros fichiers (Analytics, Settings, SpinTracker) ont été découpés en composants professionnels et optimisés.

### Version 5.3 & Antérieures (Historique)

* **Analytics & Export PDF :** Intégration de `html2canvas` et `jspdf` pour générer un Bilan Comptable officiel.
- **Mental Coach & UI/UX :** Nouveau logo, Spin Wizard à 4 étapes, Mode Urgence, et Détection d'impulsivité.
- **Data Management :** Page dédiée pour les réinitialisations (Factory Reset, Logs), et export manuel JSON.
- **Sécurité :** Local PIN Lock.
