# EFAPP — ÉTAT D'AVANCEMENT DU PROJET (V5.4)

Ce document centralise l'état actuel du développement de l'application EFAPP, détaillant les fonctionnalités implémentées, l'architecture des données, et les règles métier en vigueur.

## 🏗️ ARCHITECTURE & PRINCIPES FONDAMENTAUX

1. **Local-First & Confidentialité Absolue**
   - Aucune base de données cloud (pas de Firebase, pas d'API externe).
   - Toutes les données sont stockées localement dans le navigateur via **IndexedDB** (utilisant Dexie.js).
   - Persistance garantie entre les sessions et les rechargements de page.
2. **Intégrité Comptable (Single Source of Truth)**
   - Toute modification de solde passe exclusivement par `applyCoinChange()`.
   - Il est impossible de muter le solde d'un compte sans générer un log de transaction (`coinLogs`).
3. **Règle Universelle des Spins**
   - Règle stricte et immuable dans toute l'application : **1 Spin = 100 Coins**.
   - Interface synchronisée : Saisir le nombre de spins remplit le coût, et vice-versa.
4. **Haute Fiabilité (Defensive Programming)**
   - L'application survit à une base de données totalement vide.
   - Aucun crash en cas de données manquantes (`undefined`, `null`, `[]`).

---

## 🚀 FONCTIONNALITÉS DÉPLOYÉES (COMPLETED)

### 1. Gestion des Comptes (Dashboard & Accounts)
- Création, édition et suppression de comptes.
- Suivi du solde en temps réel (Current Coins).
- Catégorisation par Tags (ex: Principal, Farm).
- Jauges de progression visuelles et motivation dynamique.

### 2. Bilan & Ledger (Bilan Tracker)
- Historique chronologique absolu des transactions.
- Affichage de l'ancien solde, du montant (Ajout/Retrait) et du nouveau solde.
- Système d'annulation (Undo) permettant d'inverser la dernière action (supprime le spin associé le cas échéant).

### 3. Spin Tracker & Analyse Comportementale
- Assistant en 4 étapes pour enregistrer un tirage.
- Mode **Protection 900** : Alerte si l'utilisateur descend sous le seuil critique pour garantir le prochain pass premium.
- Détection d'impulsivité : Analyse des émotions (Excité, Frustré, etc.) et de la préméditation pour catégoriser le tirage (Rationnel, Émotionnel, FOMO, Chasing).
- Suivi des joueurs obtenus et évaluation de la satisfaction (1 à 10).

### 4. Mental Coach & Friction Cognitive
- **Mode Urgence** : En cas de décision risquée, le bouton d'achat est verrouillé pendant 5 minutes (Cooldown) pour lutter contre le FOMO.
- **Post-Loss Recovery** : Déclenché après une lourde perte (ex: -900 coins avec faible satisfaction), fournissant un sas de décompression psychologique.
- Limite de dépense hebdomadaire avec alertes de dépassement.
- Suivi des Regrets (`regretLogs`) demandé à froid.

### 5. Analytics Pro & Visualisation
- Utilisation de `Recharts` pour des graphiques dynamiques.
- Évolution Historique des comptes (Area Chart).
- Distribution du portefeuille (Pie Chart).
- Bar Chart des gains vs dépenses (Net Growth/Decline).
- Tableau Bilan (Report) complet exportable en CSV ou PDF.

### 6. Leaderboard & Health Scores
- Classement des comptes basé sur leur solde.
- **Health Score Algorithmique** : Calcule un score sur 100 basé sur les spins des 30 derniers jours, pénalisant l'impulsivité, les regrets, et valorisant les longues séries sans faute.
- Tags de santé : *Elite*, *Good*, *Average*, *Risky*, *Evaluating*.

### 7. Achievements (Gamification)
- Système de récompenses récompensant la discipline financière.
- Succès tels que "Goal Hunter", "Elite Collector", "Consistance", "Discipline Elite", "Marathon".

### 8. Epic Calculator (Probabilités Stochastiques)
- Calcul hypergéométrique strict pour évaluer les chances d'obtenir des joueurs "Epic" dans une box de 150 joueurs.
- Simulation de Monte Carlo (10 000 tirages) pour validation empirique.
- Alertes Anti-FOMO si la probabilité de succès est trop faible.

### 9. Sécurité & Données
- **PIN Lock** : Écran de verrouillage global par code PIN.
- **Data Management** : Exportation de l'intégralité de la base de données au format JSON (Sauvegarde). Importation d'une sauvegarde existante. Possibilité de "Factory Reset".

### 10. Navigation Rapide
- **Command Palette** : Accessible via `Ctrl+K`. Outil global de recherche pour naviguer rapidement vers n'importe quelle page, chercher un compte, ou retrouver un tirage récent.

---

## 📂 STRUCTURE DE LA BASE DE DONNÉES (DEXIE.JS)

L'application repose sur le schéma relationnel local suivant :

1. **`accounts`** : `id, name, currentCoins, targetCoins, weeklyLimit, groupTag, createdAt`
2. **`coinLogs`** : `id, accountId, date, action, reason, amount, previousBalance, newBalance, linkedSpinId`
3. **`spinLogs`** : `id, accountId, date, packName, coinsSpent, spins, satisfactionScore, wasPlanned, emotionBefore, emotionAfter`
4. **`spinPlayers`** : `id, spinId, playerName`
5. **`regretLogs`** : `id, spinId, regret, createdAt`
6. **`settings`** : `key, value`
7. **`auditLogs`** (V2) : `id, date, actionType, details`

---

## 🛠️ PROCHAINES ÉTAPES (ROADMAP FUTUR)

Maintenant que la version V5.4 (Stabilisation Critique) est validée, les prochaines évolutions possibles incluent :

1. **Nouvelles fonctionnalités demandées (V6) :**
   - **Backup Center Pro** : Panneau dédié pour gérer les sauvegardes, vérifier leur intégrité, afficher la taille et le dernier backup.
   - **Activity Timeline** : Flux d'activité chronologique fusionnant les `coinLogs`, `spinLogs`, et `auditLogs` (ex: "EB5 +100 coins", "Backup Created").
   - **Storage Insights** : Nouvelle carte Analytics affichant la répartition de la base de données (Comptes %, Spins %, Logs %).
2. **Objectifs Avancés :**
   - Mise en place de calculs de vélocité prédictifs sur la génération de coins (Date estimée pour atteindre 900 coins).
   - Intégration d'un "Journal Émotionnel" granulaire corrélé aux performances in-game.
