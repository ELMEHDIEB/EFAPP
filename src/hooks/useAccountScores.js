import { useState, useEffect } from 'react';

export function useAccountScores(accounts, fetchScoreFn) {
  const [scores, setScores] = useState({});

  useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    let cancelled = false;

    async function loadScores() {
      const data = {};
      for (const acc of accounts) {
        data[acc.id] = await fetchScoreFn(acc.id);
      }
      if (!cancelled) setScores(data);
    }
    
    loadScores();
    return () => { cancelled = true; };
  }, [accounts, fetchScoreFn]);

  return scores;
}
