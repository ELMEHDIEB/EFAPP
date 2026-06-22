# eFootball Coin Manager Pro — Étape 1

Squelette de l'application : navigation (sidebar + routing) et gestion complète des comptes (CRUD), avec persistance permanente des données.

## Installation

```bash
npm install
npm run dev
```

Ouvre ensuite l'URL affichée dans le terminal (en général `http://localhost:5173`).

## Persistance des données — important

Toutes les données (comptes, soldes, historique) sont stockées dans **IndexedDB**, une base de données intégrée au navigateur, via la librairie Dexie.

Concrètement :
- Tu n'as **jamais besoin de réinsérer tes données**. Ferme l'onglet, redémarre ton ordinateur, relance `npm run dev` un autre jour : tout est encore là.
- Les données vivent dans le navigateur **et le port** où tu as ouvert l'app (ex: `localhost:5173`). Si tu changes de navigateur ou de machine, utilise **Paramètres → Exporter un backup** puis **Importer** sur l'autre machine.
- Rien n'est envoyé sur internet, tout reste en local.

## Ce qui est livré dans cette étape

- Navigation complète (Dashboard, Comptes, Spin tracker, Mental coach, Analytics, Paramètres) — seules Dashboard et Comptes sont fonctionnelles, les autres sont des emplacements réservés pour les prochaines étapes.
- Comptes : créer, modifier (nom/objectif/groupe), ajuster le solde (Ajouter / Retirer / Définir), supprimer.
- Chaque ajustement de solde écrit automatiquement une entrée dans `coinLogs` — le lien spin/transaction futur s'appuiera sur cette même fonction (`applyCoinChange`).
- Dashboard avec statistiques globales et barres de progression vers l'objectif (900 par défaut).
- Export/Import JSON complet dans Paramètres (sauvegarde manuelle).

## Structure du projet

```
src/
  db.js                 -> définition des 8 tables (IndexedDB / Dexie)
  accountActions.js     -> logique métier des comptes (la seule porte d'entrée pour modifier un solde)
  App.jsx                -> routing
  components/Sidebar.jsx
  pages/
    Dashboard.jsx        -> fonctionnel
    Accounts.jsx          -> fonctionnel
    SpinTracker.jsx       -> placeholder (étape 2)
    MentalCoach.jsx        -> placeholder (étape 5)
    Analytics.jsx          -> placeholder (étape 3-4)
    Settings.jsx           -> fonctionnel (backup)
```

## Prochaine étape

Étape 2 : Spin tracker — chaque spin enregistré créera automatiquement une entrée `coinLogs` (action `REMOVE`), en réutilisant `applyCoinChange`.
