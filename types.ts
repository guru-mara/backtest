
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Position {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  lots: number;
  tp?: number;
  sl?: number;
  openTime: number;
  profit: number;
}

export interface TradeHistory {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  lots: number;
  profit: number;
  openTime: number;
  closeTime: number;
}

export interface MarketPair {
  symbol: string;
  name: string;
  spread: number;
  digits: number;
}

export enum TimeFrame {
  M1 = 'M1',
  M5 = 'M5',
  M15 = 'M15',
  M30 = 'M30',
  H1 = 'H1',
  H4 = 'H4',
  D1 = 'D1'
}

export enum CandleType {
  CANDLE = 'CANDLE',
  AREA = 'AREA',
  BAR = 'BAR'
}

export interface IndicatorConfig {
  id: string;
  type: 'SMA' | 'EMA' | 'RSI' | 'BB';
  period: number;
  color: string;
  visible: boolean;
}

export interface ChartSettings {
  theme: 'dark' | 'light' | 'mt5' | 'custom';
  candleType: CandleType;
  showGrid: boolean;
  showIndicators: boolean;
  showCrosshair: boolean;
  indicators: IndicatorConfig[];
  colors: {
    bg: string;
    grid: string;
    text: string;
    up: string;
    down: string;
    line: string;
    crosshair: string;
  };
}

export type DrawingTool = 'NONE' | 'TRENDLINE' | 'HLINE' | 'RECT' | 'FIB' | 'TEXT' | 'ARROW' | 'CHANNEL' | 'CIRCLE' | 'RULER';

export interface DrawingObject {
  id: string;
  type: DrawingTool;
  points: { time: number; price: number }[];
  text?: string;
}

export interface AccountState {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  positions: Position[];
  history: TradeHistory[];
}
