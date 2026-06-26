export function getPortfolioMotivation(accounts, coinLogs) {
  if (!accounts || accounts.length === 0) return { type: "info", message: "Aucun compte configuré." };
  
  const totalCoins = accounts.reduce((sum, a) => sum + a.currentCoins, 0);
  if (totalCoins === 0) {
    return { type: "info", message: "Commencez à accumuler vos premiers coins pour débloquer votre parcours." };
  }
  
  const above900 = accounts.filter(a => a.currentCoins >= 900).length;
  if (above900 > 0) {
    return { type: "success", message: `Excellent ! ${above900} compte(s) au-dessus de 900 coins. Maintenez l'élan.` };
  }
  
  return { type: "warn", message: "La constance est la clé. Continuez l'accumulation." };
}

export function getMotivationMessage(account, accounts, coinLogs) {
  if (!account) return { type: "info", message: "" };
  if (account.currentCoins >= account.targetCoins) {
    return { type: "success", message: "Objectif atteint ! Protégez votre progression." };
  }
  return { type: "info", message: "Gardez le cap, chaque coin compte." };
}
