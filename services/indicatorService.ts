
import { Candle } from '../types';

export const calculateSMA = (data: Candle[], period: number): { time: number; value: number }[] => {
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, c) => acc + c.close, 0);
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
};

export const calculateEMA = (data: Candle[], period: number): { time: number; value: number }[] => {
  const result = [];
  const k = 2 / (period + 1);
  let ema = data[0].close;
  
  result.push({ time: data[0].time, value: ema });

  for (let i = 1; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    if (i >= period - 1) {
      result.push({ time: data[i].time, value: ema });
    }
  }
  return result;
};

export const calculateRSI = (data: Candle[], period: number): { time: number; value: number }[] => {
  const result = [];
  if (data.length < period) return [];

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    result.push({ time: data[i].time, value: rsi });
  }
  return result;
};
