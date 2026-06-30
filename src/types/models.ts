export interface Account {
  id?: number;
  name: string;
  groupTag: string;
  currentCoins: number;
  createdAt: string;
}

export interface CoinLog {
  id?: number;
  accountId: number;
  date: string;
  action: 'add' | 'subtract' | 'daily_checkin' | 'sync' | 'spin' | string;
  reason: string;
  previousBalance: number;
  newBalance: number;
  createdAt: string;
}

export interface SpinLog {
  id?: number;
  accountId: number;
  date: string;
  packName: string;
  cost: number;
  type: string; // '1x', '10x', etc.
  targetPlayer: string;
  wasSuccessful: boolean;
  notes?: string;
}

export interface Player {
  id?: number;
  accountId: number;
  name: string;
  cardType: string;
  isBooster: boolean;
  overall: number;
  position: string;
  club: string;
  nation: string;
  efhubId: string;
}

export interface AuditLog {
  id?: number;
  date: string;
  actionType: string;
  details: string;
}

export interface Setting {
  key: string;
  value: any;
}
