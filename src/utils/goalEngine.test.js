import { describe, it, expect } from 'vitest';
import { getNextGoal, getGoalDistribution, getForecast, GOALS } from './goalEngine.js';

describe('goalEngine', () => {
  describe('getNextGoal', () => {
    it('should return the correct goal and progress for 0 coins', () => {
      const result = getNextGoal(0);
      expect(result).toEqual({
        currentTier: 0,
        nextGoal: 900,
        remainingCoins: 900,
        progressPct: 0
      });
    });

    it('should return the correct goal and progress for coins within the first tier', () => {
      const result = getNextGoal(450);
      expect(result).toEqual({
        currentTier: 0,
        nextGoal: 900,
        remainingCoins: 450,
        progressPct: 50
      });
    });

    it('should correctly transition to the second tier', () => {
      const result = getNextGoal(900);
      expect(result).toEqual({
        currentTier: 1,
        nextGoal: 1800,
        remainingCoins: 900,
        progressPct: 0
      });
    });

    it('should correctly calculate progress within an advanced tier', () => {
      const result = getNextGoal(2250); // exactly halfway between 1800 and 2700
      expect(result).toEqual({
        currentTier: 2,
        nextGoal: 2700,
        remainingCoins: 450,
        progressPct: 50
      });
    });

    it('should handle values above the max goal', () => {
      const result = getNextGoal(5000);
      expect(result).toEqual({
        currentTier: 5,
        nextGoal: 4500,
        remainingCoins: 0,
        progressPct: 100
      });
    });
  });

  describe('getGoalDistribution', () => {
    it('should distribute accounts into correct tiers', () => {
      const accounts = [
        { currentCoins: 0 },
        { currentCoins: 899 },
        { currentCoins: 900 },
        { currentCoins: 1500 },
        { currentCoins: 1800 },
        { currentCoins: 3000 },
        { currentCoins: 5000 }
      ];

      const distribution = getGoalDistribution(accounts);
      expect(distribution['< 900']).toBe(2);
      expect(distribution['>= 900']).toBe(5);
      expect(distribution['>= 1800']).toBe(3);
      expect(distribution['>= 2700']).toBe(2);
      expect(distribution['>= 3600']).toBe(1);
      expect(distribution['>= 4500']).toBe(1);
    });

    it('should handle empty accounts array', () => {
      const distribution = getGoalDistribution([]);
      expect(distribution['< 900']).toBe(0);
      expect(distribution['>= 900']).toBe(0);
    });
  });

  describe('getForecast', () => {
    it('should return fallback if no logs or account provided', () => {
      const result1 = getForecast([], null);
      expect(result1.estimatedGoalDate).toBe('Pas assez de données');

      const result2 = getForecast(null, { id: 1 });
      expect(result2.estimatedGoalDate).toBe('Pas assez de données');
    });

    it('should handle case with no progression (0 delta)', () => {
      const account = { id: 1, currentCoins: 0 };
      const now = new Date();
      const logs = [
        { accountId: 1, date: new Date(now.getTime() - 2 * 86400000).toISOString().slice(0, 10), previousBalance: 0, newBalance: 0 }
      ];
      
      const result = getForecast(logs, account);
      expect(result.forecast7d).toBe(0);
      expect(result.estimatedGoalDate).toBe('Pas de progression actuellement');
    });

    it('should return Objectif atteint if goal is reached', () => {
      const account = { id: 1, currentCoins: 5000 };
      const now = new Date();
      const logs = [
        { accountId: 1, date: new Date(now.getTime() - 2 * 86400000).toISOString().slice(0, 10), previousBalance: 4000, newBalance: 5000 }
      ];
      
      const result = getForecast(logs, account);
      // Even if there's positive growth, if remaining coins <= 0, it should say Objectif atteint
      expect(result.estimatedGoalDate).toBe('Objectif atteint');
    });
  });
});
