
import React from 'react';
import { MARKET_PAIRS } from '../constants';
import { MarketPair } from '../types';

interface MarketWatchProps {
  onSelectPair: (pair: MarketPair) => void;
  selectedSymbol: string;
}

const MarketWatch: React.FC<MarketWatchProps> = ({ onSelectPair, selectedSymbol }) => {
  // Helper to get dummy prices for visual display
  const getDummyPrice = (symbol: string) => {
    if (symbol === 'GER40') return { bid: '18420.5', ask: '18421.7' };
    if (symbol === 'NAS100') return { bid: '19105.2', ask: '19106.7' };
    if (symbol === 'XAGUSD') return { bid: '29.421', ask: '29.441' };
    return { bid: '0.00', ask: '0.00' };
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none">
      <div className="p-3 bg-slate-950 font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 flex justify-between">
        <span>Symbol</span>
        <div className="flex gap-4">
          <span>Bid</span>
          <span>Ask</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {MARKET_PAIRS.map((pair) => {
          const prices = getDummyPrice(pair.symbol);
          return (
            <div
              key={pair.symbol}
              onClick={() => onSelectPair(pair)}
              className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800 transition-colors ${
                selectedSymbol === pair.symbol ? 'bg-slate-800 border-l-2 border-blue-500' : ''
              }`}
            >
              <div>
                <div className="font-semibold text-sm">{pair.symbol}</div>
                <div className="text-[10px] text-slate-500">{pair.name}</div>
              </div>
              <div className="flex gap-3 text-xs font-mono">
                <span className="text-red-400">{prices.bid}</span>
                <span className="text-green-400">{prices.ask}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketWatch;
