import { triggerDesktopNotification } from "./desktopNotifier.js";

export function checkMilestoneCrossed(oldBalance, newBalance, targetCoins) {
  if (oldBalance < targetCoins && newBalance >= targetCoins) {
    triggerDesktopNotification("Objectif Atteint !", `Félicitations, vous avez franchi l'objectif de ${targetCoins} coins.`);
    return true;
  }
  return false;
}
