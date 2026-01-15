
import { MarketPair } from './types';

export const MARKET_PAIRS: MarketPair[] = [
  { symbol: 'GER40', name: 'DAX 40 Index', spread: 1.2, digits: 2 },
  { symbol: 'NAS100', name: 'Nasdaq 100 Index', spread: 1.5, digits: 2 },
  { symbol: 'XAGUSD', name: 'Silver / US Dollar', spread: 0.02, digits: 3 },
];

export const INITIAL_DEPOSIT = 10000;
export const LEVERAGE = 100;
