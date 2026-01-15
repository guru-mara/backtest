
import React, { useState, useEffect, useMemo, useRef } from 'react';
import MarketWatch from './components/MarketWatch';
import TradingChart from './components/TradingChart';
import { Candle, Position, MarketPair, TradeHistory, TimeFrame, CandleType, ChartSettings, DrawingTool, DrawingObject, IndicatorConfig } from './types';
import { MARKET_PAIRS, INITIAL_DEPOSIT } from './constants';
import { generateHistoricalData, calculateProfit } from './services/dataService';

const App: React.FC = () => {
  const [balance, setBalance] = useState(INITIAL_DEPOSIT);
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<TradeHistory[]>([]);
  const [selectedPair, setSelectedPair] = useState<MarketPair>(MARKET_PAIRS[0]);
  const [timeframe, setTimeframe] = useState<TimeFrame>(TimeFrame.H1);
  const [fullHistory, setFullHistory] = useState<Candle[]>([]);
  const [visibleData, setVisibleData] = useState<Candle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(300); 
  const [lots, setLots] = useState(1.0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);
  
  const [tradeBoxPos, setTradeBoxPos] = useState({ x: 300, y: 100 });
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });

  const [chartSettings, setChartSettings] = useState<ChartSettings>({
    theme: 'dark',
    candleType: CandleType.CANDLE,
    showGrid: true,
    showIndicators: true,
    showCrosshair: true,
    indicators: [
      { id: 'sma_20', type: 'SMA', period: 20, color: '#f59e0b', visible: false },
      { id: 'sma_50', type: 'SMA', period: 50, color: '#3b82f6', visible: false },
      { id: 'ema_20', type: 'EMA', period: 20, color: '#ec4899', visible: false },
    ],
    colors: {
        bg: '#020617',
        grid: '#1e293b',
        text: '#64748b',
        up: '#10b981',
        down: '#f43f5e',
        line: '#3b82f6',
        crosshair: '#3b82f6'
    }
  });
  
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>('NONE');
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);

  const timeframeMinutes: Record<TimeFrame, number> = {
    [TimeFrame.M1]: 1, [TimeFrame.M5]: 5, [TimeFrame.M15]: 15, [TimeFrame.M30]: 30,
    [TimeFrame.H1]: 60, [TimeFrame.H4]: 240, [TimeFrame.D1]: 1440,
  };

  useEffect(() => {
    const interval = timeframeMinutes[timeframe] || 60;
    const data = generateHistoricalData(selectedPair.symbol, new Date('2024-01-01T00:00:00Z'), interval);
    setFullHistory(data);
    const startIdx = Math.min(200, data.length);
    setVisibleData(data.slice(0, startIdx));
    setCurrentIndex(startIdx);
  }, [selectedPair, timeframe]);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= fullHistory.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const nextIndex = prev + 1;
          setVisibleData(fullHistory.slice(0, nextIndex));
          return nextIndex;
        });
      }, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, fullHistory, speed]);

  const handleNextStep = () => {
    setCurrentIndex(prev => {
      const nextIndex = Math.min(prev + 1, fullHistory.length - 1);
      setVisibleData(fullHistory.slice(0, nextIndex));
      return nextIndex;
    });
  };

  useEffect(() => {
    if (visibleData.length === 0) return;
    const currentPrice = visibleData[visibleData.length - 1].close;
    setPositions(prev => prev.map(pos => ({
      ...pos,
      profit: calculateProfit(pos.type, pos.entryPrice, currentPrice, pos.lots, pos.symbol)
    })));
  }, [visibleData]);

  const equity = useMemo(() => balance + positions.reduce((acc, pos) => acc + pos.profit, 0), [balance, positions]);

  const handleOpenPosition = (type: 'BUY' | 'SELL') => {
    if (visibleData.length === 0) return;
    const currentPrice = visibleData[visibleData.length - 1].close;
    const spread = MARKET_PAIRS.find(p => p.symbol === selectedPair.symbol)?.spread || 0;
    const spreadOffset = type === 'BUY' ? spread / 2 : -spread / 2;
    setPositions([...positions, {
      id: Math.random().toString(36).substring(7),
      symbol: selectedPair.symbol,
      type,
      entryPrice: currentPrice + spreadOffset,
      lots,
      openTime: visibleData[visibleData.length - 1].time,
      profit: 0
    }]);
  };

  const toggleIndicator = (id: string) => {
    setChartSettings(s => ({
      ...s,
      indicators: s.indicators.map(i => i.id === id ? { ...i, visible: !i.visible } : i)
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: chartSettings.colors.bg, color: chartSettings.colors.text }}>
      {!isFullScreen && (
        <MarketWatch onSelectPair={setSelectedPair} selectedSymbol={selectedPair.symbol} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center px-4 justify-between z-40 shadow-2xl" style={{ backgroundColor: `${chartSettings.colors.bg}CC`, borderColor: chartSettings.colors.grid }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white mr-4">{selectedPair.symbol}</span>
            <div className="flex gap-0.5 p-1 rounded-lg border" style={{ backgroundColor: chartSettings.colors.bg, borderColor: chartSettings.colors.grid }}>
              {Object.values(TimeFrame).map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)} className={`px-2 py-1 text-[10px] font-black rounded transition-all ${timeframe === tf ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{tf}</button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" strokeWidth="2"/></svg>
              <span>Indicators</span>
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 px-4 py-1.5 rounded-xl border" style={{ backgroundColor: `${chartSettings.colors.bg}80`, borderColor: chartSettings.colors.grid }}>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-tighter">Equity</span>
                    <span className="text-xs font-black font-mono" style={{ color: equity >= balance ? chartSettings.colors.up : chartSettings.colors.down }}>{equity.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90 ${isPlaying ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {isPlaying ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                </button>
                <button onClick={handleNextStep} className="h-8 px-3 rounded-lg font-black transition-all" style={{ backgroundColor: chartSettings.colors.grid, color: chartSettings.colors.text }}>NEXT</button>
                <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 text-slate-500 hover:text-blue-500 transition-all">
                  {isFullScreen ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
                </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden relative">
          {/* Toolbars (Floating left) */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5 p-2 rounded-2xl border backdrop-blur-2xl shadow-2xl" style={{ backgroundColor: `${chartSettings.colors.bg}CC`, borderColor: chartSettings.colors.grid }}>
            {(['TRENDLINE', 'HLINE', 'RECT', 'RULER'] as DrawingTool[]).map(tool => (
              <button 
                key={tool} 
                onClick={() => setActiveDrawingTool(activeDrawingTool === tool ? 'NONE' : tool)} 
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${activeDrawingTool === tool ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'hover:bg-blue-500/10 text-slate-500'}`} 
                title={tool}
              >
                {tool === 'TRENDLINE' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="2" y1="20" x2="22" y2="4"/></svg>}
                {tool === 'HLINE' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="2" y1="12" x2="22" y2="12"/></svg>}
                {tool === 'RECT' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="6" width="16" height="12"/></svg>}
                {tool === 'RULER' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 18V6m3 12V6m3 12V6m3 12V6"/></svg>}
              </button>
            ))}
            <div className="h-[1px] mx-1 my-1" style={{ backgroundColor: chartSettings.colors.grid }} />
            <button onClick={() => setDrawings([])} className="w-9 h-9 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all" title="Clear All"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
          </div>

          <TradingChart 
            data={visibleData} symbol={selectedPair.symbol} positions={positions} settings={chartSettings}
            activeTool={activeDrawingTool} drawings={drawings}
            onAddDrawing={(d) => { setDrawings([...drawings, d]); setActiveDrawingTool('NONE'); }}
          />
          
          <div 
            style={{ left: tradeBoxPos.x, top: tradeBoxPos.y, backgroundColor: `${chartSettings.colors.bg}E6`, borderColor: chartSettings.colors.grid }}
            className="absolute z-40 backdrop-blur-3xl border rounded-2xl p-4 shadow-2xl flex flex-col gap-3 min-w-[180px] select-none"
          >
            <div className="flex justify-between items-center border-b pb-2 mb-1" style={{ borderColor: chartSettings.colors.grid }}>
              <span className="text-xs font-black text-white">{selectedPair.symbol}</span>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div className="flex items-center justify-between bg-black/40 rounded-xl p-2 border" style={{ borderColor: chartSettings.colors.grid }}>
              <button onClick={() => setLots(l => Math.max(0.1, l-0.1))} className="w-7 h-7 rounded-lg hover:bg-white/10">-</button>
              <span className="text-sm font-black text-white">{lots.toFixed(1)}</span>
              <button onClick={() => setLots(l => l+0.1)} className="w-7 h-7 rounded-lg hover:bg-white/10">+</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleOpenPosition('BUY')} className="py-2.5 bg-emerald-600 rounded-xl text-[10px] font-black hover:bg-emerald-500">BUY</button>
              <button onClick={() => handleOpenPosition('SELL')} className="py-2.5 bg-rose-600 rounded-xl text-[10px] font-black hover:bg-rose-500">SELL</button>
            </div>
          </div>

          {/* Indicators Popover */}
          {showIndicatorsMenu && (
            <div className="absolute top-16 left-32 z-50 w-64 p-4 rounded-2xl border shadow-2xl backdrop-blur-3xl" style={{ backgroundColor: `${chartSettings.colors.bg}F2`, borderColor: chartSettings.colors.grid }}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase text-white">Indicators</span>
                <button onClick={() => setShowIndicatorsMenu(false)} className="text-slate-500">×</button>
              </div>
              <div className="flex flex-col gap-2">
                {chartSettings.indicators.map(ind => (
                  <button 
                    key={ind.id}
                    onClick={() => toggleIndicator(ind.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${ind.visible ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800 hover:border-slate-700'}`}
                  >
                    <span>{ind.type} ({ind.period})</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ind.color }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
