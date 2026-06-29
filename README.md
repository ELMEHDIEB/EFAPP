# eFootball Coin Manager Pro (EFAPP)

**EFAPP** is a Behavioral Decision Support System designed for eFootball players managing multiple accounts. It is explicitly NOT just a coin tracker or pack simulator. Its primary purpose is to instill discipline, reduce impulsive spending, and maximize the success rate of reaching the 900-coin threshold for the Premium Match Pass.

## 🚀 Installation & Lancement

```bash
npm install
npm run dev
```

Ouvre ensuite l'URL affichée dans le terminal (en général `http://localhost:5173`).

---

## 💾 Persistance des données (Important)

Toutes les données (comptes, soldes, historique) sont stockées dans **IndexedDB** (via Dexie.js), une base de données intégrée au navigateur.

- **100% Local :** Rien n'est envoyé sur internet. Aucun backend, aucun compte utilisateur. Les données ne quittent jamais l'appareil.
- **Permanence :** Ferme l'onglet, redémarre ton ordinateur, tout est conservé automatiquement.
- **Sauvegarde :** Utilise la page *Paramètres* pour exporter/importer un backup de tes données si tu changes d'ordinateur.

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

---

## 📝 Changelog Récent

### Version 2.0 (Complete)

* **Analytics & Export PDF :** Intégration de `html2canvas` et `jspdf` pour générer un Bilan Comptable avec graphiques capturés et tampons officiels.
- **UI/UX :** Nouveau logo officiel et nettoyage de l'interface du Sidebar.
- **Spin Tracker :** Ajout de la date personnalisée pour l'enregistrement de spins passés (sans déclencher le mode d'urgence).
- **Graphiques d'évolution :** Résolution temporelle à l'heure près pour une précision maximale sur l'axe X (format HH:mm).

### Version 1.x (Historique)

* Implémentation du Local PIN Lock, Weekly Spend Limits, et Mode Urgence.
- Création du flux Spin Tracker (4 étapes).
- Mise en place initiale du Dashboard analytique.
