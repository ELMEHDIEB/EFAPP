# EFAPP (eFootball Coin Manager Pro)

## Overview
EFAPP is a Behavioral Decision Support System designed for eFootball players managing multiple accounts. It is explicitly NOT just a coin tracker or pack simulator. Its primary purpose is to instill discipline, reduce impulsive spending, and maximize the success rate of reaching the 900-coin threshold for the Premium Match Pass.

## Technology Stack
* Frontend: React, Vite, Tailwind CSS
* Persistence: Dexie.js (IndexedDB)
* Charts: Chart.js (Planned)
* Environment: 100% Local Browser Environment

## Non-Negotiable Product Constraints
* 100% Local Data Storage
* No Backend / No Cloud Sync
* No User Accounts / No Authentication via servers
* Data Never Leaves the Device
* No Real Money Tracking

## Core Systems
* **Multi-Account Management**: Track progress towards targets (default 900 coins).
* **Mental Coach Core**: Fully integrated into the Spin Workflow.
  * *Protection 900*: Hard warnings when dipping below the 900 threshold.
  * *Impulse Detection*: Emotion and planning checks before spending.
  * *Emergency Mode*: Static 5-minute cooldown to prevent FOMO.
  * *Post-Loss Recovery*: Circuit breakers to prevent "chasing" behavior after large losses.
* **Security**: Local PIN Lock to prevent unauthorized access on shared devices.

## Current Goal
Finalize the Behavioral Decision Support ecosystem by implementing the Emotional Journal, Discipline Score, and Analytics, ensuring the app remains entirely local and focused on psychological assistance.
