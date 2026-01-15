
import React, { useState } from 'react';
import { Position, TradeHistory } from '../types';

interface TradingTerminalProps {
  positions: Position[];
  history: TradeHistory[];
  balance: number;
  equity: number;
  onClosePosition: (id: string) => void;
}

const TradingTerminal: React.FC<TradingTerminalProps> = ({ positions, history, balance, equity, onClosePosition }) => {
  const [activeTab, setActiveTab] = useState<'TRADE' | 'HISTORY' | 'NEWS'>('TRADE');

  return (
    <div className="h-64 bg-slate-900 border-t border-slate-800 flex flex-col">
      <div className="flex bg-slate-950 border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('TRADE')}
          className={`px-4 py-2 text-xs font-semibold ${activeTab === 'TRADE' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-900' : 'text-slate-500'}`}
        >
          Trade
        </button>
        <button 
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 text-xs font-semibold ${activeTab === 'HISTORY' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-900' : 'text-slate-500'}`}
        >
          History
        </button>
        <button 
          onClick={() => setActiveTab('NEWS')}
          className={`px-4 py-2 text-xs font-semibold ${activeTab === 'NEWS' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-900' : 'text-slate-500'}`}
        >
          News
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'TRADE' && (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-900 text-slate-500 uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-2 font-normal">Symbol</th>
                <th className="px-4 py-2 font-normal">Ticket</th>
                <th className="px-4 py-2 font-normal">Type</th>
                <th className="px-4 py-2 font-normal">Lots</th>
                <th className="px-4 py-2 font-normal">Price</th>
                <th className="px-4 py-2 font-normal">Profit</th>
                <th className="px-4 py-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(pos => (
                <tr key={pos.id} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                  <td className="px-4 py-2 font-bold">{pos.symbol}</td>
                  <td className="px-4 py-2 text-slate-400">#{pos.id.slice(-6)}</td>
                  <td className={`px-4 py-2 font-bold ${pos.type === 'BUY' ? 'text-blue-400' : 'text-orange-400'}`}>{pos.type}</td>
                  <td className="px-4 py-2">{pos.lots.toFixed(2)}</td>
                  <td className="px-4 py-2">{pos.entryPrice.toFixed(5)}</td>
                  <td className={`px-4 py-2 font-mono font-bold ${pos.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pos.profit.toFixed(2)} USD
                  </td>
                  <td className="px-4 py-2">
                    <button 
                      onClick={() => onClosePosition(pos.id)}
                      className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded hover:bg-red-500/40 transition-colors"
                    >
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'HISTORY' && (
          <table className="w-full text-left text-xs">
             <thead className="sticky top-0 bg-slate-900 text-slate-500 uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-2 font-normal">Time</th>
                <th className="px-4 py-2 font-normal">Symbol</th>
                <th className="px-4 py-2 font-normal">Type</th>
                <th className="px-4 py-2 font-normal">Lots</th>
                <th className="px-4 py-2 font-normal">Price</th>
                <th className="px-4 py-2 font-normal">Profit</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-b border-slate-800/50">
                  <td className="px-4 py-2 text-slate-500">{new Date(h.closeTime).toLocaleDateString()}</td>
                  <td className="px-4 py-2 font-bold">{h.symbol}</td>
                  <td className={`px-4 py-2 font-bold ${h.type === 'BUY' ? 'text-blue-400' : 'text-orange-400'}`}>{h.type}</td>
                  <td className="px-4 py-2">{h.lots.toFixed(2)}</td>
                  <td className="px-4 py-2">{h.exitPrice.toFixed(5)}</td>
                  <td className={`px-4 py-2 font-mono font-bold ${h.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {h.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex gap-8 text-xs font-mono">
        <div>Balance: <span className="text-slate-100">{balance.toFixed(2)}</span></div>
        <div>Equity: <span className="text-slate-100 font-bold">{equity.toFixed(2)}</span></div>
        <div>Margin: <span className="text-slate-100">0.00</span></div>
        <div>Free Margin: <span className="text-slate-100">{equity.toFixed(2)}</span></div>
      </div>
    </div>
  );
};

export default TradingTerminal;
