
import { Candle } from '../types';

/**
 * Generates synthetic historical data for a symbol from Jan 2024 to present.
 */
export const generateHistoricalData = (
  symbol: string, 
  startDate: Date = new Date('2024-01-01T00:00:00Z'),
  intervalMinutes: number = 60
): Candle[] => {
  const candles: Candle[] = [];
  const endDate = new Date(); // Present day
  
  let currentPrice = 1.0;
  if (symbol === 'GER40') currentPrice = 15000 + Math.random() * 2000;
  if (symbol === 'NAS100') currentPrice = 14000 + Math.random() * 3000;
  if (symbol === 'XAGUSD') currentPrice = 22 + Math.random() * 8;

  let currentTime = startDate.getTime();
  const endTime = endDate.getTime();
  const step = intervalMinutes * 60 * 1000;

  const volatility = symbol === 'XAGUSD' ? 0.002 : 0.0012;
  let trend = (Math.random() - 0.5) * 0.0001; 

  while (currentTime <= endTime) {
    if (Math.random() < 0.01) trend = (Math.random() - 0.5) * 0.0002;

    const noise = currentPrice * volatility * (Math.random() - 0.5);
    const bias = currentPrice * trend;
    
    const open = currentPrice;
    const close = currentPrice + noise + bias;
    
    const range = Math.abs(close - open) * (1 + Math.random());
    const high = Math.max(open, close) + (range * 0.2);
    const low = Math.min(open, close) - (range * 0.2);
    
    candles.push({
      time: currentTime,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 5000)
    });

    currentPrice = close;
    currentTime += step;
  }

  return candles;
};

export const calculateProfit = (type: 'BUY' | 'SELL', entry: number, exit: number, lots: number, symbol: string): number => {
  const diff = type === 'BUY' ? (exit - entry) : (entry - exit);
  if (symbol === 'XAGUSD') {
    return diff * lots * 5000; 
  } else {
    return diff * lots * 10;
  }
};
