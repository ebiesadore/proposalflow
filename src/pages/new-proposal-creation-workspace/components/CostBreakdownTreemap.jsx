import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import Icon from '../../../components/AppIcon';

// ── Teal-to-navy color palette ──
const CATEGORY_COLOR_MAP = {
  'Internal Value-Added Scope': '#0D9488',
  'Margined Sub-Contractors': '#0F766E',
  'Zero Margined Supply': '#115E59',
  'Materials': '#0891B2',
  'Labor': '#0E7490',
  'Total Over Head': '#155E75',
  'Site Cost Total': '#164E63',
  'Total Logistics': '#1E6091',
  'Commission': '#1D4ED8',
  'Finance': '#172554',
  'Risk': '#1E3A5F',
};

const FALLBACK_COLORS = [
  '#0D9488', '#0F766E', '#0891B2', '#0E7490',
  '#155E75', '#164E63', '#1E6091', '#1D4ED8',
  '#1E40AF', '#172554', '#1E3A5F',
];

const getCategoryColor = (name, index) =>
  CATEGORY_COLOR_MAP?.[name] || FALLBACK_COLORS?.[index % FALLBACK_COLORS?.length];

// ── Map categories → icon type keys ──
const ICON_TYPE_MAP = {
  'Internal Value-Added Scope': 'building',
  'Margined Sub-Contractors': 'tools',
  'Zero Margined Supply': 'supply',
  'Materials': 'package',
  'Labor': 'worker',
  'Total Over Head': 'chart',
  'Site Cost Total': 'site',
  'Total Logistics': 'truck',
  'Commission': 'percent',
  'Finance': 'bank',
  'Risk': 'shield',
};

// ── Blueprint-style SVG line-art icons ──
const BlueprintIcon = ({ type, x, y, w, h }) => {
  if (w < 70 || h < 55) return null;

  const iconSize = Math.min(w, h) * 0.52;
  const cx = x + w * 0.74;
  const cy = y + h * 0.54;
  const s = iconSize;
  const sw = 1.2;

  switch (type) {
    case 'building': {
      const bx = cx - s / 2;
      const by = cy - s / 3;
      const bw = s;
      const bh = s * 0.66;
      return (
        <g opacity={0.15}>
          <rect x={bx} y={by} width={bw} height={bh} fill="none" stroke="white" strokeWidth={sw} />
          <path d={`M${bx} ${by} L${cx} ${by - bh * 0.4} L${bx + bw} ${by}`} fill="none" stroke="white" strokeWidth={sw} />
          <rect x={cx - bw * 0.15} y={by + bh * 0.35} width={bw * 0.3} height={bh * 0.65} fill="none" stroke="white" strokeWidth={sw} />
          <rect x={bx + bw * 0.1} y={by + bh * 0.15} width={bw * 0.2} height={bh * 0.25} fill="none" stroke="white" strokeWidth={sw * 0.8} />
          <rect x={bx + bw * 0.7} y={by + bh * 0.15} width={bw * 0.2} height={bh * 0.25} fill="none" stroke="white" strokeWidth={sw * 0.8} />
        </g>
      );
    }
    case 'tools': {
      return (
        <g opacity={0.15}>
          <path d={`M${cx - s * 0.25} ${cy + s * 0.28} L${cx + s * 0.18} ${cy - s * 0.12}`} stroke="white" strokeWidth={sw * 2.2} strokeLinecap="round" fill="none" />
          <circle cx={cx + s * 0.18} cy={cy - s * 0.12} r={s * 0.13} fill="none" stroke="white" strokeWidth={sw} />
          <path d={`M${cx + s * 0.06} ${cy + s * 0.28} L${cx - s * 0.12} ${cy - s * 0.16} L${cx + s * 0.06} ${cy - s * 0.28}`} fill="none" stroke="white" strokeWidth={sw * 1.6} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    }
    case 'supply': {
      const bSize = s * 0.24;
      return (
        <g opacity={0.15}>
          <rect x={cx - bSize * 1.3} y={cy + bSize * 0.3} width={bSize * 2.6} height={bSize * 1.05} fill="none" stroke="white" strokeWidth={sw} rx={1} />
          <rect x={cx - bSize * 1.05} y={cy - bSize * 0.65} width={bSize * 2.1} height={bSize * 1.05} fill="none" stroke="white" strokeWidth={sw} rx={1} />
          <rect x={cx - bSize * 0.8} y={cy - bSize * 1.55} width={bSize * 1.6} height={bSize * 1.05} fill="none" stroke="white" strokeWidth={sw} rx={1} />
          <line x1={cx} y1={cy + bSize * 0.3} x2={cx} y2={cy + bSize * 1.35} stroke="white" strokeWidth={sw * 0.6} />
          <line x1={cx} y1={cy - bSize * 0.65} x2={cx} y2={cy + bSize * 0.35} stroke="white" strokeWidth={sw * 0.6} />
        </g>
      );
    }
    case 'package': {
      const pw = s * 0.82;
      const ph = s * 0.62;
      const px = cx - pw / 2;
      const py = cy - ph / 2;
      return (
        <g opacity={0.15}>
          <rect x={px} y={py} width={pw} height={ph} fill="none" stroke="white" strokeWidth={sw} rx={2} />
          <line x1={px} y1={cy} x2={px + pw} y2={cy} stroke="white" strokeWidth={sw} />
          <line x1={cx} y1={py} x2={cx} y2={py + ph} stroke="white" strokeWidth={sw} />
          <path d={`M${px} ${py} L${px + pw * 0.15} ${py - ph * 0.22} L${px + pw + pw * 0.15} ${py - ph * 0.22} L${px + pw} ${py}`} fill="none" stroke="white" strokeWidth={sw * 0.8} />
          <line x1={px + pw + pw * 0.15} y1={py - ph * 0.22} x2={px + pw + pw * 0.15} y2={py + ph - ph * 0.22} stroke="white" strokeWidth={sw * 0.8} />
        </g>
      );
    }
    case 'worker': {
      return (
        <g opacity={0.15}>
          <circle cx={cx} cy={cy - s * 0.24} r={s * 0.13} fill="none" stroke="white" strokeWidth={sw} />
          <path d={`M${cx - s * 0.19} ${cy - s * 0.36} L${cx} ${cy - s * 0.45} L${cx + s * 0.19} ${cy - s * 0.36}`} fill="none" stroke="white" strokeWidth={sw} />
          <line x1={cx} y1={cy - s * 0.11} x2={cx} y2={cy + s * 0.16} stroke="white" strokeWidth={sw} />
          <line x1={cx - s * 0.2} y1={cy + s * 0.04} x2={cx + s * 0.2} y2={cy + s * 0.04} stroke="white" strokeWidth={sw} />
          <line x1={cx - s * 0.13} y1={cy + s * 0.16} x2={cx - s * 0.2} y2={cy + s * 0.34} stroke="white" strokeWidth={sw} />
          <line x1={cx + s * 0.13} y1={cy + s * 0.16} x2={cx + s * 0.2} y2={cy + s * 0.34} stroke="white" strokeWidth={sw} />
        </g>
      );
    }
    case 'chart': {
      const cw = s * 0.72;
      const ch = s * 0.62;
      const chartX = cx - cw / 2;
      const chartY = cy - ch / 2;
      return (
        <g opacity={0.15}>
          <line x1={chartX} y1={chartY} x2={chartX} y2={chartY + ch} stroke="white" strokeWidth={sw} />
          <line x1={chartX} y1={chartY + ch} x2={chartX + cw} y2={chartY + ch} stroke="white" strokeWidth={sw} />
          <path d={`M${chartX + cw * 0.05} ${chartY + ch * 0.6} L${chartX + cw * 0.28} ${chartY + ch * 0.3} L${chartX + cw * 0.52} ${chartY + ch * 0.5} L${chartX + cw * 0.78} ${chartY + ch * 0.15} L${chartX + cw * 0.95} ${chartY + ch * 0.25}`} fill="none" stroke="white" strokeWidth={sw * 1.3} strokeLinejoin="round" />
          <rect x={chartX + cw * 0.08} y={chartY + ch * 0.55} width={cw * 0.14} height={ch * 0.45} fill="none" stroke="white" strokeWidth={sw * 0.7} />
          <rect x={chartX + cw * 0.3} y={chartY + ch * 0.3} width={cw * 0.14} height={ch * 0.7} fill="none" stroke="white" strokeWidth={sw * 0.7} />
          <rect x={chartX + cw * 0.52} y={chartY + ch * 0.42} width={cw * 0.14} height={ch * 0.58} fill="none" stroke="white" strokeWidth={sw * 0.7} />
          <rect x={chartX + cw * 0.74} y={chartY + ch * 0.15} width={cw * 0.14} height={ch * 0.85} fill="none" stroke="white" strokeWidth={sw * 0.7} />
        </g>
      );
    }
    case 'site': {
      return (
        <g opacity={0.15}>
          <line x1={cx - s * 0.06} y1={cy + s * 0.32} x2={cx - s * 0.06} y2={cy - s * 0.37} stroke="white" strokeWidth={sw * 1.6} />
          <line x1={cx - s * 0.06} y1={cy - s * 0.37} x2={cx + s * 0.37} y2={cy - s * 0.37} stroke="white" strokeWidth={sw} />
          <line x1={cx + s * 0.37} y1={cy - s * 0.37} x2={cx + s * 0.2} y2={cy + s * 0.06} stroke="white" strokeWidth={sw} strokeDasharray="4,3" />
          <line x1={cx - s * 0.27} y1={cy + s * 0.32} x2={cx + s * 0.17} y2={cy + s * 0.32} stroke="white" strokeWidth={sw} />
          <rect x={cx - s * 0.37} y={cy + s * 0.06} width={s * 0.26} height={s * 0.26} fill="none" stroke="white" strokeWidth={sw * 0.8} />
        </g>
      );
    }
    case 'truck': {
      const tw = s * 0.92;
      const th = s * 0.48;
      const tx = cx - tw / 2;
      const ty = cy - th / 2;
      return (
        <g opacity={0.15}>
          <rect x={tx} y={ty} width={tw * 0.6} height={th} fill="none" stroke="white" strokeWidth={sw} rx={1} />
          <path d={`M${tx + tw * 0.6} ${ty + th} L${tx + tw * 0.6} ${ty + th * 0.25} L${tx + tw * 0.85} ${ty + th * 0.25} L${tx + tw} ${ty + th * 0.5} L${tx + tw} ${ty + th} Z`} fill="none" stroke="white" strokeWidth={sw} />
          <circle cx={tx + tw * 0.18} cy={ty + th + 5} r={5.5} fill="none" stroke="white" strokeWidth={sw} />
          <circle cx={tx + tw * 0.82} cy={ty + th + 5} r={5.5} fill="none" stroke="white" strokeWidth={sw} />
          <rect x={tx + tw * 0.64} y={ty + th * 0.35} width={tw * 0.14} height={th * 0.35} fill="none" stroke="white" strokeWidth={sw * 0.7} />
        </g>
      );
    }
    case 'percent': {
      return (
        <g opacity={0.15}>
          <circle cx={cx - s * 0.16} cy={cy - s * 0.16} r={s * 0.11} fill="none" stroke="white" strokeWidth={sw} />
          <circle cx={cx + s * 0.16} cy={cy + s * 0.16} r={s * 0.11} fill="none" stroke="white" strokeWidth={sw} />
          <line x1={cx + s * 0.24} y1={cy - s * 0.24} x2={cx - s * 0.24} y2={cy + s * 0.24} stroke="white" strokeWidth={sw * 1.4} />
        </g>
      );
    }
    case 'bank': {
      const bw = s * 0.72;
      const bh = s * 0.58;
      const bx = cx - bw / 2;
      const by = cy - bh / 2;
      return (
        <g opacity={0.15}>
          <rect x={bx} y={by + bh * 0.22} width={bw} height={bh * 0.78} fill="none" stroke="white" strokeWidth={sw} />
          <path d={`M${bx - bw * 0.05} ${by + bh * 0.22} L${cx} ${by - bh * 0.18} L${bx + bw + bw * 0.05} ${by + bh * 0.22}`} fill="none" stroke="white" strokeWidth={sw} />
          {[0.2, 0.4, 0.6, 0.8]?.map((p, i) => (
            <line key={i} x1={bx + bw * p} y1={by + bh * 0.32} x2={bx + bw * p} y2={by + bh * 0.88} stroke="white" strokeWidth={sw} />
          ))}
        </g>
      );
    }
    case 'shield': {
      return (
        <g opacity={0.15}>
          <path d={`M${cx} ${cy - s * 0.32} L${cx + s * 0.24} ${cy - s * 0.18} L${cx + s * 0.24} ${cy + s * 0.08} Q${cx + s * 0.2} ${cy + s * 0.3} ${cx} ${cy + s * 0.36} Q${cx - s * 0.2} ${cy + s * 0.3} ${cx - s * 0.24} ${cy + s * 0.08} L${cx - s * 0.24} ${cy - s * 0.18} Z`} fill="none" stroke="white" strokeWidth={sw} />
          <line x1={cx} y1={cy - s * 0.09} x2={cx} y2={cy + s * 0.09} stroke="white" strokeWidth={sw * 1.3} />
          <circle cx={cx} cy={cy + s * 0.17} r={2.2} fill="white" />
        </g>
      );
    }
    default:
      return null;
  }
};

// ── Text layout calculator ──
const getTextLayout = (w, h) => {
  if (w >= 220 && h >= 130) return { nameSize: 14, valueSize: 28, showPercent: true, percentSize: 12 };
  if (w >= 160 && h >= 95) return { nameSize: 12, valueSize: 22, showPercent: true, percentSize: 11 };
  if (w >= 110 && h >= 70) return { nameSize: 10, valueSize: 17, showPercent: false, percentSize: 9 };
  if (w >= 65 && h >= 48) return { nameSize: 8.5, valueSize: 12, showPercent: false, percentSize: 8 };
  return { nameSize: 7, valueSize: 9, showPercent: false, percentSize: 7 };
};

const formatCellName = (name, w) => {
  if (w >= 180) return name;
  if (w >= 130) return name?.length > 24 ? name?.substring(0, 22) + '…' : name;
  if (w >= 90) return name?.length > 16 ? name?.substring(0, 14) + '…' : name;
  if (w >= 60) return name?.length > 10 ? name?.substring(0, 8) + '..' : name;
  return name?.length > 6 ? name?.substring(0, 5) + '..' : name;
};

// ══════════════════════════════════════════════════════════════════
// CostBreakdownTreemap
// ══════════════════════════════════════════════════════════════════
const CostBreakdownTreemap = ({ data = [], grandTotal = 0, formatNumber }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const displayData = data;
  const displayGrandTotal = grandTotal;

  const fmt = formatNumber || ((v) => {
    if (v == null) return '0.00';
    return v?.toFixed(2)?.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  });

  const viewWidth = 1000;
  const viewHeight = 540;

  // ── Compute treemap cells ──
  const cells = useMemo(() => {
    const filtered = displayData?.filter(d => d?.value > 0);
    if (filtered?.length === 0) return [];

    const root = d3?.hierarchy({ children: filtered?.map((d, i) => ({ ...d, _index: i })) })?.sum(d => d?.value || 0)?.sort((a, b) => (b?.value || 0) - (a?.value || 0));

    d3?.treemap()?.size([viewWidth, viewHeight])?.padding(3)?.round(true)?.tile(d3?.treemapSquarify?.ratio(1.1))
      (root);

    return root.leaves()?.map((leaf) => ({
      ...leaf?.data,
      x: leaf?.x0,
      y: leaf?.y0,
      w: leaf?.x1 - leaf?.x0,
      h: leaf?.y1 - leaf?.y0,
      color: getCategoryColor(leaf?.data?.name, leaf?.data?._index),
      icon: ICON_TYPE_MAP?.[leaf?.data?.name] || 'building',
    }));
  }, [displayData]);

  const handleMouseMove = useCallback((e) => {
    const el = containerRef?.current;
    if (el) {
      const r = el?.getBoundingClientRect();
      setMousePos({ x: e?.clientX - r?.left, y: e?.clientY - r?.top });
    }
  }, []);

  // ── Empty state when no cost center data exists ──
  if (cells?.length === 0) {
    return (
      <div className="w-full rounded-lg border border-border flex items-center justify-center" style={{ minHeight: 420, background: '#0B1E2D' }}>
        <div className="text-center">
          <Icon name="PieChart" size={48} style={{ color: 'rgba(255,255,255,0.2)' }} className="mx-auto mb-3" />
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>No cost center data yet</p>
          <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Enter values in the tabs to see the visualization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-lg overflow-hidden select-none"
      style={{ background: '#0B1E2D' }}
      onMouseMove={handleMouseMove}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="w-full h-auto block"
        preserveAspectRatio="xMidYMid meet"
        style={{ minHeight: 440 }}
      >
        <defs>
          {/* Blueprint grid pattern */}
          <pattern id="bpGrid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M 26 0 L 0 0 0 26" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
          {/* Bottom gradient for depth */}
          <linearGradient id="cellShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
          </linearGradient>
          <linearGradient id="hoverGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width={viewWidth} height={viewHeight} fill="#0B1E2D" rx={8} />

        {cells?.map((cell, i) => {
          const layout = getTextLayout(cell?.w, cell?.h);
          const pct = displayGrandTotal > 0 ? ((cell?.value / displayGrandTotal) * 100)?.toFixed(1) : '0.0';
          const isTiny = cell?.w < 48 || cell?.h < 38;
          const isHov = hoveredCell?.name === cell?.name;

          return (
            <g
              key={`${cell?.name}-${i}`}
              onMouseEnter={() => setHoveredCell(cell)}
              onMouseLeave={() => setHoveredCell(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Coloured cell */}
              <rect
                x={cell?.x} y={cell?.y} width={cell?.w} height={cell?.h} rx={5} ry={5}
                fill={cell?.color}
                style={{ transition: 'opacity .2s, filter .2s', opacity: isHov ? 0.88 : 1, filter: isHov ? 'brightness(1.18)' : 'none' }}
              />
              {/* Grid texture */}
              <rect x={cell?.x} y={cell?.y} width={cell?.w} height={cell?.h} fill="url(#bpGrid)" rx={5} ry={5} />
              {/* Depth shadow */}
              <rect x={cell?.x} y={cell?.y + cell?.h * 0.5} width={cell?.w} height={cell?.h * 0.5} fill="url(#cellShadow)" rx={5} ry={5} />
              {/* Blueprint icon */}
              <BlueprintIcon type={cell?.icon} x={cell?.x} y={cell?.y} w={cell?.w} h={cell?.h} />
              {/* Hover glow */}
              {isHov && <rect x={cell?.x} y={cell?.y} width={cell?.w} height={cell?.h} fill="url(#hoverGlow)" rx={5} ry={5} />}
              {/* ── Text ── */}
              {!isTiny && (
                <>
                  {/* Name */}
                  <text
                    x={cell?.x + 11} y={cell?.y + layout?.nameSize + 10}
                    style={{ fontSize: layout?.nameSize, fontWeight: 600, fill: 'rgba(255,255,255,0.85)', pointerEvents: 'none', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '.01em' }}
                  >
                    {formatCellName(cell?.name, cell?.w)}
                  </text>

                  {/* Dollar value */}
                  <text
                    x={cell?.x + 11} y={cell?.y + layout?.nameSize + 10 + layout?.valueSize + 6}
                    style={{ fontSize: layout?.valueSize, fontWeight: 800, fill: '#fff', pointerEvents: 'none', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-.01em' }}
                  >
                    ${fmt(cell?.value || 0)}
                  </text>

                  {/* Percentage */}
                  {layout?.showPercent && (
                    <text
                      x={cell?.x + 11} y={cell?.y + layout?.nameSize + 10 + layout?.valueSize + 6 + layout?.percentSize + 9}
                      style={{ fontSize: layout?.percentSize, fontWeight: 500, fill: 'rgba(255,255,255,0.5)', pointerEvents: 'none', fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      {pct}%
                    </text>
                  )}
                </>
              )}
              {/* Tiny cells */}
              {isTiny && cell?.w > 30 && cell?.h > 20 && (
                <>
                  {cell?.h > 30 && (
                    <text
                      x={cell?.x + cell?.w / 2} y={cell?.y + cell?.h / 2 - 5}
                      textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: 7, fontWeight: 600, fill: 'rgba(255,255,255,0.7)', pointerEvents: 'none', fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      {formatCellName(cell?.name, cell?.w)}
                    </text>
                  )}
                  <text
                    x={cell?.x + cell?.w / 2} y={cell?.y + cell?.h / 2 + (cell?.h > 30 ? 7 : 0)}
                    textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 9, fontWeight: 800, fill: '#fff', pointerEvents: 'none', fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    ${fmt(cell?.value || 0)}
                  </text>
                </>
              )}
              {/* Subtle border */}
              <rect
                x={cell?.x + 0.5} y={cell?.y + 0.5} width={cell?.w - 1} height={cell?.h - 1}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} rx={5} ry={5}
              />
            </g>
          );
        })}
      </svg>
      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: Math.min(mousePos?.x + 16, (containerRef?.current?.offsetWidth || 600) - 230),
            top: mousePos?.y - 86 < 0 ? mousePos?.y + 14 : mousePos?.y - 86,
            background: 'rgba(8,18,32,0.96)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 10,
            padding: '12px 16px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 36px rgba(0,0,0,0.45)',
            minWidth: 190,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div style={{ width: 10, height: 10, borderRadius: 3, background: hoveredCell?.color, flexShrink: 0 }} />
            <span className="text-white font-bold text-[13px]">{hoveredCell?.name}</span>
          </div>
          <p className="font-extrabold text-[18px] mb-0.5" style={{ color: '#22D3EE' }}>
            ${fmt(hoveredCell?.value || 0)}
          </p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {displayGrandTotal > 0 ? ((hoveredCell?.value / displayGrandTotal) * 100)?.toFixed(2) : '0.00'}% of total cost centers
          </p>
        </div>
      )}
      {/* Legend strip */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 py-3" style={{ background: 'rgba(11,30,45,0.7)' }}>
        {cells?.map((c, i) => (
          <div
            key={`leg-${i}`}
            className="flex items-center gap-1.5 cursor-pointer"
            onMouseEnter={() => setHoveredCell(c)}
            onMouseLeave={() => setHoveredCell(null)}
            style={{ opacity: hoveredCell && hoveredCell?.name !== c?.name ? 0.45 : 1, transition: 'opacity .2s' }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c?.color, flexShrink: 0 }} />
            <span className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.65)' }}>{c?.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostBreakdownTreemap;
