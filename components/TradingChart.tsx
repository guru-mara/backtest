
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Candle, Position, ChartSettings, CandleType, DrawingTool, DrawingObject } from '../types';
import { calculateSMA, calculateEMA } from '../services/indicatorService';

interface TradingChartProps {
  data: Candle[];
  symbol: string;
  positions: Position[];
  settings: ChartSettings;
  activeTool: DrawingTool;
  drawings: DrawingObject[];
  onAddDrawing: (drawing: DrawingObject) => void;
}

const TradingChart: React.FC<TradingChartProps> = ({ 
  data, symbol, positions, settings, activeTool, drawings, onAddDrawing 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [xDomain, setXDomain] = useState<[number, number] | null>(null);
  const [yDomain, setYDomain] = useState<[number, number] | null>(null);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; price: number; time: number } | null>(null);
  const [drawingStart, setDrawingStart] = useState<{ x: number, y: number, time: number, price: number } | null>(null);

  const getPips = (priceDiff: number, sym: string) => {
    if (sym === 'XAGUSD') return (priceDiff / 0.01).toFixed(1);
    return priceDiff.toFixed(2); 
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    handleResize();
    return () => observer.disconnect();
  }, []);

  // Initialize Domains on data change or symbol change
  useEffect(() => {
    if (data.length > 0 && !xDomain) {
      const last100 = data.slice(Math.max(0, data.length - 100));
      setXDomain([last100[0].time, last100[last100.length - 1].time + (last100[last100.length-1].time - last100[0].time) * 0.1]);
    } else if (data.length > 0 && xDomain) {
      // Auto-pan to latest if we were at the end
      const isAtEnd = xDomain[1] >= data[data.length - 2].time;
      if (isAtEnd) {
        const diff = xDomain[1] - xDomain[0];
        const lastCandle = data[data.length - 1];
        setXDomain([lastCandle.time - diff * 0.9, lastCandle.time + diff * 0.1]);
      }
    }
  }, [data, symbol]);

  const themeColors = settings.colors;

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || data.length === 0 || !xDomain) return;

    const margin = { top: 30, right: 80, bottom: 30, left: 10 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Scales
    const x = d3.scaleTime().domain(xDomain).range([0, width]);
    
    // Auto-Y scaling based on visible candles
    const visibleData = data.filter(d => d.time >= xDomain[0] && d.time <= xDomain[1]);
    let finalYDomain: [number, number];
    
    if (yDomain) {
      finalYDomain = yDomain;
    } else if (visibleData.length > 0) {
      const yMin = d3.min(visibleData, d => d.low) || 0;
      const yMax = d3.max(visibleData, d => d.high) || 1;
      const pad = (yMax - yMin) * 0.15;
      finalYDomain = [yMin - pad, yMax + pad];
    } else {
      finalYDomain = [0, 100];
    }

    const y = d3.scaleLinear().domain(finalYDomain).range([height, 0]);

    const chartGroup = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Grid Lines
    if (settings.showGrid) {
      chartGroup.append("g")
        .attr("class", "grid")
        .attr("stroke", themeColors.grid)
        .attr("stroke-opacity", 0.15)
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ""));
        
      chartGroup.append("g")
        .attr("class", "grid")
        .attr("stroke", themeColors.grid)
        .attr("stroke-opacity", 0.1)
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(-height).tickFormat(() => ""));
    }

    // Axes
    const xAxis = d3.axisBottom(x).ticks(width / 100).tickSize(6);
    const yAxis = d3.axisRight(y).ticks(10).tickFormat(d3.format(".2f")).tickSize(6);

    chartGroup.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .attr("color", themeColors.text)
      .selectAll("text").style("font-size", "10px").style("font-weight", "600");

    chartGroup.append("g")
      .attr("transform", `translate(${width},0)`)
      .call(yAxis)
      .attr("color", themeColors.text)
      .selectAll("text").style("font-size", "10px").style("font-weight", "600");

    // Indicators
    settings.indicators.filter(i => i.visible).forEach(ind => {
      const indData = ind.type === 'SMA' ? calculateSMA(data, ind.period) : calculateEMA(data, ind.period);
      const line = d3.line<{ time: number; value: number }>()
        .x(d => x(d.time))
        .y(d => y(d.value))
        .defined(d => d.time >= xDomain[0] && d.time <= xDomain[1]);

      chartGroup.append("path")
        .datum(indData)
        .attr("fill", "none")
        .attr("stroke", ind.color)
        .attr("stroke-width", 1.5)
        .attr("d", line);
    });

    // Candles
    const candleWidth = Math.max(1.5, (width / visibleData.length) * 0.75);

    if (settings.candleType === CandleType.CANDLE) {
      const candles = chartGroup.selectAll(".candle").data(visibleData).enter().append("g");
      
      // Wicks
      candles.append("line")
        .attr("x1", d => x(d.time))
        .attr("x2", d => x(d.time))
        .attr("y1", d => y(d.high))
        .attr("y2", d => y(d.low))
        .attr("stroke", d => d.close >= d.open ? themeColors.up : themeColors.down)
        .attr("stroke-width", 1);

      // Bodies
      candles.append("rect")
        .attr("x", d => x(d.time) - candleWidth / 2)
        .attr("y", d => y(Math.max(d.open, d.close)))
        .attr("width", candleWidth)
        .attr("height", d => Math.max(0.5, Math.abs(y(d.open) - y(d.close))))
        .attr("fill", d => d.close >= d.open ? themeColors.up : themeColors.down)
        .attr("stroke", d => d.close >= d.open ? themeColors.up : themeColors.down)
        .attr("stroke-width", 0.5);
    }

    // Positions
    positions.filter(p => p.symbol === symbol).forEach(pos => {
      const py = y(pos.entryPrice);
      if (py >= 0 && py <= height) {
        chartGroup.append("line")
          .attr("x1", 0).attr("x2", width)
          .attr("y1", py).attr("y2", py)
          .attr("stroke", pos.type === 'BUY' ? '#3b82f6' : '#f43f5e')
          .attr("stroke-dasharray", "5,5")
          .attr("stroke-width", 1);
      }
    });

    // Drawings
    drawings.forEach(draw => {
      const g = chartGroup.append("g");
      if (draw.type === 'TRENDLINE' && draw.points.length === 2) {
        g.append("line")
          .attr("x1", x(draw.points[0].time)).attr("y1", y(draw.points[0].price))
          .attr("x2", x(draw.points[1].time)).attr("y2", y(draw.points[1].price))
          .attr("stroke", themeColors.line).attr("stroke-width", 2);
      } else if (draw.type === 'HLINE') {
        const hy = y(draw.points[0].price);
        g.append("line")
          .attr("x1", 0).attr("x2", width).attr("y1", hy).attr("y2", hy)
          .attr("stroke", themeColors.line).attr("stroke-width", 1.5).attr("stroke-dasharray", "4,2");
      } else if (draw.type === 'RECT' && draw.points.length === 2) {
        g.append("rect")
          .attr("x", Math.min(x(draw.points[0].time), x(draw.points[1].time)))
          .attr("y", Math.min(y(draw.points[0].price), y(draw.points[1].price)))
          .attr("width", Math.abs(x(draw.points[0].time) - x(draw.points[1].time)))
          .attr("height", Math.abs(y(draw.points[0].price) - y(draw.points[1].price)))
          .attr("fill", themeColors.line).attr("fill-opacity", 0.1).attr("stroke", themeColors.line);
      } else if (draw.type === 'RULER' && draw.points.length === 2) {
          const x1 = x(draw.points[0].time), y1 = y(draw.points[0].price);
          const x2 = x(draw.points[1].time), y2 = y(draw.points[1].price);
          const pips = getPips(Math.abs(draw.points[1].price - draw.points[0].price), symbol);
          g.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2).attr("stroke", "#fbbf24").attr("stroke-dasharray", "2,2");
          g.append("text").attr("x", x2 + 5).attr("y", y2).attr("fill", "#fbbf24").attr("font-size", "10px").attr("font-weight", "black").text(`${pips} Pips`);
      }
    });

    // Interaction Handlers
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .on("zoom", (event) => {
        if (activeTool === 'NONE') {
          const newXDomain = event.transform.rescaleX(x).domain();
          setXDomain(newXDomain as [number, number]);
          setYDomain(null); // Reset manual Y scaling to auto
        }
      });

    svg.call(zoom);

    // Manual Y Scaling (Dragging Price Axis)
    const priceAxisArea = svg.append("rect")
      .attr("x", width + margin.left)
      .attr("y", margin.top)
      .attr("width", margin.right)
      .attr("height", height)
      .attr("fill", "transparent")
      .style("cursor", "ns-resize");

    const dragY = d3.drag<SVGRectElement, unknown>()
      .on("drag", (event) => {
        const dy = event.dy;
        const currentY = y.domain();
        const factor = 1 + dy / height;
        const mid = (currentY[0] + currentY[1]) / 2;
        const range = (currentY[1] - currentY[0]) * factor;
        setYDomain([mid - range/2, mid + range/2]);
      });

    priceAxisArea.call(dragY);

    // Mouse Events for Drawings and Crosshair
    svg.on("mousedown", (event) => {
      if (activeTool === 'NONE') return;
      const [mx, my] = d3.pointer(event);
      const cx = mx - margin.left, cy = my - margin.top;
      if (cx < 0 || cx > width || cy < 0 || cy > height) return;
      
      const time = x.invert(cx).getTime();
      const price = y.invert(cy);

      if (activeTool === 'HLINE' || activeTool === 'TEXT') {
        onAddDrawing({ id: Math.random().toString(), type: activeTool, points: [{ time, price }] });
      } else {
        setDrawingStart({ x: mx, y: my, time, price });
      }
    });

    svg.on("mousemove", (event) => {
      const [mx, my] = d3.pointer(event);
      const cx = mx - margin.left, cy = my - margin.top;
      if (cx >= 0 && cx <= width && cy >= 0 && cy <= height) {
        setCrosshair({ x: mx, y: my, price: y.invert(cy), time: x.invert(cx).getTime() });
      } else setCrosshair(null);
    });

    svg.on("mouseup", (event) => {
      if (!drawingStart) return;
      const [mx, my] = d3.pointer(event);
      const cx = mx - margin.left, cy = my - margin.top;
      const time = x.invert(cx).getTime();
      const price = y.invert(cy);
      onAddDrawing({ id: Math.random().toString(), type: activeTool, points: [{ time: drawingStart.time, price: drawingStart.price }, { time, price }] });
      setDrawingStart(null);
    });

  }, [data, dimensions, xDomain, yDomain, positions, symbol, settings, activeTool, drawings, themeColors]);

  return (
    <div ref={containerRef} className="flex-1 relative cursor-crosshair select-none overflow-hidden h-full" style={{ backgroundColor: themeColors.bg }}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="block w-full h-full" />
      
      {/* Top Left Status Bar */}
      <div className="absolute top-4 left-16 pointer-events-none flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tighter" style={{ color: themeColors.line }}>{symbol}</span>
          <div className="px-2 py-1 rounded-lg border backdrop-blur-3xl flex items-center gap-3" style={{ backgroundColor: `${themeColors.bg}CC`, borderColor: themeColors.grid }}>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none" style={{ color: themeColors.text }}>
                {data.length > 0 ? new Date(data[data.length-1].time).toLocaleString() : '---'}
            </span>
            <div className="h-3 w-[1px]" style={{ backgroundColor: themeColors.grid }} />
            <span className="text-xs font-black font-mono" style={{ color: themeColors.up }}>
                {data.length > 0 ? data[data.length-1].close.toFixed(2) : '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Indicator Values Display */}
      <div className="absolute top-16 left-16 pointer-events-none flex flex-col gap-0.5">
        {settings.indicators.filter(i => i.visible).map(ind => (
          <div key={ind.id} className="text-[10px] font-bold" style={{ color: ind.color }}>
            {ind.type}({ind.period}): {data.length > 0 ? data[data.length-1].close.toFixed(2) : '0.00'}
          </div>
        ))}
      </div>

      {/* Crosshair Labels */}
      {settings.showCrosshair && crosshair && (
        <>
          <div className="absolute top-0 bottom-0 border-l border-dashed pointer-events-none" style={{ left: crosshair.x, borderColor: themeColors.crosshair, opacity: 0.3 }} />
          <div className="absolute left-0 right-0 border-t border-dashed pointer-events-none" style={{ top: crosshair.y, borderColor: themeColors.crosshair, opacity: 0.3 }} />
          <div className="absolute right-0 text-white text-[9px] px-2 py-0.5 font-black pointer-events-none rounded-l shadow-lg" style={{ top: crosshair.y - 10, backgroundColor: themeColors.crosshair }}>
            {crosshair.price.toFixed(2)}
          </div>
          <div className="absolute bottom-1 text-white text-[9px] px-2 py-1 font-black pointer-events-none rounded-md shadow-lg border" style={{ left: crosshair.x - 45, backgroundColor: themeColors.bg, borderColor: themeColors.grid }}>
            {new Date(crosshair.time).toLocaleDateString()}
          </div>
        </>
      )}

      {/* Active Drawing Preview */}
      {drawingStart && crosshair && (
        <div className="absolute pointer-events-none inset-0">
           <svg width="100%" height="100%">
             {(activeTool === 'TRENDLINE' || activeTool === 'ARROW' || activeTool === 'CHANNEL' || activeTool === 'RULER') && <line x1={drawingStart.x} y1={drawingStart.y} x2={crosshair.x} y2={crosshair.y} stroke={activeTool === 'RULER' ? '#fbbf24' : themeColors.line} strokeWidth="1.5" strokeDasharray="5,5" />}
             {activeTool === 'RECT' && <rect x={Math.min(drawingStart.x, crosshair.x)} y={Math.min(drawingStart.y, crosshair.y)} width={Math.abs(drawingStart.x - crosshair.x)} height={Math.abs(drawingStart.y - crosshair.y)} fill={themeColors.line} fillOpacity="0.1" stroke={themeColors.line} strokeDasharray="5,5" />}
           </svg>
        </div>
      )}
    </div>
  );
};

export default TradingChart;
