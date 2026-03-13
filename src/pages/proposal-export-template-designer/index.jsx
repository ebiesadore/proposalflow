import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import contentLibraryService from '../../services/contentLibraryService';

// ─── A4 canvas dimensions ────────────────────────────────────────────────────
const A4_WIDTH_PX = 595;
const A4_HEIGHT_PX = 842;

// ─── mm ↔ px conversion (96 DPI, 1mm = 3.7795px) ────────────────────────────
const MM_TO_PX = 3.7795;
const pxToMm = (px) => parseFloat((px / MM_TO_PX)?.toFixed(2));
const mmToPx = (mm) => parseFloat((mm * MM_TO_PX)?.toFixed(2));

// ─── Proposal field options for Data Block ───────────────────────────────────
const DATA_FIELD_OPTIONS = [
  'Project Title', 'Client Name', 'Grand Total', 'Ft² Rate BUA',
  'Project Number', 'Proposal Date', 'Valid Until', 'Project Type',
  'Total Area (BUA)', 'Net Margin %', 'Contingency Amount', 'Project Duration',
];

// ─── Data Table dataset options ──────────────────────────────────────────────
const DATA_TABLE_OPTIONS = [
  'Modules', 'Commission Items', 'Milestones', 'Materials',
];

// ─── Content Library categories ─────────────────────────────────────────────
const CONTENT_LIBRARY_CATEGORIES = [
  { key: 'notes',                 label: 'Notes',                   icon: 'StickyNote',   color: 'yellow'  },
  { key: 'exclusions',            label: 'Exclusions',              icon: 'Ban',          color: 'red'     },
  { key: 'shipping_conditions',   label: 'Shipping Conditions',     icon: 'Truck',        color: 'blue'    },
  { key: 'materials_specs',       label: 'Materials & Specs',       icon: 'Layers',       color: 'violet'  },
  { key: 'scope_of_works',        label: 'Scope of Works',          icon: 'ClipboardList',color: 'indigo'  },
  { key: 'programme_delivery',    label: 'Programme of Delivery',   icon: 'CalendarDays', color: 'cyan'    },
  { key: 'price_payment',         label: 'Price & Payment Terms',   icon: 'CreditCard',   color: 'emerald' },
  { key: 'guarantees',            label: 'Guarantees',              icon: 'ShieldCheck',  color: 'green'   },
  { key: 'termination_disputes',  label: 'Termination & Disputes',  icon: 'Scale',        color: 'orange'  },
  { key: 'conduct_gifts',         label: 'Conduct & Corrupt Gifts', icon: 'UserX',        color: 'rose'    },
  { key: 'appendices',            label: 'Appendices',              icon: 'BookOpen',     color: 'slate'   },
];

// ─── Block type palette definitions ─────────────────────────────────────────
const BLOCK_PALETTE = [
  { type: 'text',       icon: 'Type',        label: 'Text Insert',          description: 'Free text with formatting' },
  { type: 'data',       icon: 'Database',    label: 'Data Block',           description: 'Single bound proposal value' },
  { type: 'table',      icon: 'Table',       label: 'Data Table',           description: 'Bound proposal data table' },
  { type: 'divider',    icon: 'Minus',       label: 'Divider',              description: 'Horizontal line separator' },
  { type: 'spacer',     icon: 'AlignJustify',label: 'Spacer',               description: 'Empty vertical space' },
  { type: 'image',      icon: 'Image',       label: 'Logo / Image',         description: 'Image upload placeholder' },
];

// ─── Default block dimensions ────────────────────────────────────────────────
const BLOCK_DEFAULTS = {
  text:    { w: 400, h: 120 },
  data:    { w: 220, h: 48  },
  table:   { w: 500, h: 180 },
  tnc:     { w: 500, h: 200 },
  divider: { w: 500, h: 20  },
  spacer:  { w: 500, h: 40  },
  image:   { w: 200, h: 150 },
};

// ─── Create a new block ──────────────────────────────────────────────────────
const createBlock = (type, x, y, categoryKey) => {
  const blockType = type?.startsWith('cl_') ? 'content_library' : type;
  const dims = BLOCK_DEFAULTS?.[blockType] ?? BLOCK_DEFAULTS?.[type] ?? { w: 500, h: 200 };
  const { w, h } = dims;
  const base = { id: `block-${Date.now()}-${Math.random()?.toString(36)?.slice(2)}`, type: blockType, x, y, w, h, padding: 4 };
  switch (blockType) {
    case 'text':            return { ...base, content: '', fontSize: 14, bold: false, italic: false, underline: false, color: '#000000', align: 'left' };
    case 'data':            return { ...base, field: DATA_FIELD_OPTIONS?.[0] };
    case 'table':           return { ...base, dataset: DATA_TABLE_OPTIONS?.[0] };
    case 'tnc':             return { ...base, content: '' };
    case 'divider':         return { ...base };
    case 'spacer':          return { ...base };
    case 'image':           return { ...base, imageUrl: null };
    case 'content_library': return { ...base, categoryKey: categoryKey ?? type?.replace('cl_', ''), content: '', entryTitle: '' };
    default:                return base;
  }
};

// ─── Create a blank page ─────────────────────────────────────────────────────
const createPage = (index) => ({
  id: `page-${Date.now()}-${index}`,
  label: `Page ${index + 1}`,
  blocks: [],
});

// ─── Page Thumbnail ───────────────────────────────────────────────────────────
const PageThumbnail = ({ page, index, isSelected, onSelect, onDelete, totalPages, isDragging, onDragStart, onDragOver, onDrop }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, index)}
    onDragOver={(e) => onDragOver(e, index)}
    onDrop={(e) => onDrop(e, index)}
    onClick={() => onSelect(index)}
    className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-lg cursor-pointer transition-all duration-150 select-none
      ${isSelected ? 'bg-primary/10 ring-2 ring-primary dark:bg-primary/20' : 'hover:bg-muted dark:hover:bg-muted/60'}
      ${isDragging ? 'opacity-40' : 'opacity-100'}
    `}
  >
    <div className={`w-[52px] bg-white dark:bg-zinc-100 border rounded shadow-sm flex items-center justify-center overflow-hidden
      ${isSelected ? 'border-primary' : 'border-border dark:border-zinc-300'}`}
      style={{ height: '74px' }}>
      <span className="text-[8px] text-zinc-300 font-mono">A4</span>
    </div>
    <span className={`text-[11px] font-caption font-medium truncate w-full text-center
      ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
      {page?.label}
    </span>
    {totalPages > 1 && (
      <button onClick={(e) => { e?.stopPropagation(); onDelete(index); }}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive/80 text-white items-center justify-center hidden group-hover:flex transition-all"
        title="Delete page">
        <Icon name="X" size={10} />
      </button>
    )}
    <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
      <Icon name="GripVertical" size={12} className="text-muted-foreground" />
    </div>
  </div>
);

// ─── Block Controls (inline toolbar) ─────────────────────────────────────────
const BlockControls = ({ block, onUpdate, onDelete }) => {
  if (!block) return null;

  const btn = (active, onClick, title, icon, size = 12) => (
    <button onClick={onClick} title={title}
      className={`w-6 h-6 flex items-center justify-center rounded text-xs transition-colors
        ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
      <Icon name={icon} size={size} />
    </button>
  );

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {block?.type === 'text' && (
        <>
          <select value={block?.fontSize ?? 14}
            onChange={e => onUpdate({ fontSize: Number(e?.target?.value) })}
            className="h-6 text-[10px] bg-muted border border-border rounded px-1 text-foreground">
            {[8,9,10,11,12,14,16,18,20,24,28,32,36,48]?.map(s => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>
          {btn(block?.bold,      () => onUpdate({ bold:      !block?.bold }),      'Bold',      'Bold')}
          {btn(block?.italic,    () => onUpdate({ italic:    !block?.italic }),    'Italic',    'Italic')}
          {btn(block?.underline, () => onUpdate({ underline: !block?.underline }), 'Underline', 'Underline')}
          <div className="w-px h-4 bg-border mx-0.5" />
          {btn(block?.align==='left',   () => onUpdate({ align: 'left' }),   'Align Left',    'AlignLeft')}
          {btn(block?.align==='center', () => onUpdate({ align: 'center' }), 'Align Center',  'AlignCenter')}
          {btn(block?.align==='right',  () => onUpdate({ align: 'right' }),  'Align Right',   'AlignRight')}
          <div className="w-px h-4 bg-border mx-0.5" />
          <label className="flex items-center gap-1 cursor-pointer" title="Text colour">
            <Icon name="Palette" size={11} className="text-muted-foreground" />
            <input type="color" value={block?.color ?? '#000000'}
              onChange={e => onUpdate({ color: e?.target?.value })}
              className="w-5 h-5 rounded border-0 cursor-pointer p-0 bg-transparent" />
          </label>
        </>
      )}
      {block?.type === 'data' && (
        <select value={block?.field ?? DATA_FIELD_OPTIONS?.[0]}
          onChange={e => onUpdate({ field: e?.target?.value })}
          className="h-6 text-[10px] bg-muted border border-border rounded px-1 text-foreground">
          {DATA_FIELD_OPTIONS?.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      )}
      {block?.type === 'table' && (
        <select value={block?.dataset ?? DATA_TABLE_OPTIONS?.[0]}
          onChange={e => onUpdate({ dataset: e?.target?.value })}
          className="h-6 text-[10px] bg-muted border border-border rounded px-1 text-foreground">
          {DATA_TABLE_OPTIONS?.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}
      <div className="w-px h-4 bg-border mx-0.5" />
      <button onClick={onDelete} title="Delete block"
        className="w-6 h-6 flex items-center justify-center rounded text-destructive hover:bg-destructive/10 transition-colors">
        <Icon name="Trash2" size={11} />
      </button>
    </div>
  );
};

// ─── Properties Panel ─────────────────────────────────────────────────────────
const PropertiesPanel = ({ block, onUpdate, onDelete, onMoveForward, onSendBack, snapToGrid, onSnapToGridChange }) => {
  const [lockAspect, setLockAspect] = useState(false);
  const aspectRatio = useRef(block?.w && block?.h ? block?.w / block?.h : 1);

  useEffect(() => {
    if (block?.w && block?.h) {
      aspectRatio.current = block?.w / block?.h;
    }
  }, [block?.id]);

  if (!block) return null;

  const [w, h] = [block?.w ?? 100, block?.h ?? 100];
  const xMm = pxToMm(block?.x ?? 0);
  const yMm = pxToMm(block?.y ?? 0);
  const wMm = pxToMm(w);
  const hMm = pxToMm(h);
  const paddingMm = pxToMm(block?.padding ?? 4);

  const handleX = (val) => {
    const px = mmToPx(parseFloat(val) || 0);
    onUpdate({ x: Math.max(0, Math.min(A4_WIDTH_PX - w, px)) });
  };
  const handleY = (val) => {
    const px = mmToPx(parseFloat(val) || 0);
    onUpdate({ y: Math.max(0, Math.min(A4_HEIGHT_PX - h, px)) });
  };
  const handleW = (val) => {
    const px = Math.max(mmToPx(5), mmToPx(parseFloat(val) || 5));
    if (lockAspect) {
      const newH = Math.round(px / aspectRatio?.current);
      onUpdate({ w: Math.round(px), h: Math.max(10, newH) });
    } else {
      onUpdate({ w: Math.round(px) });
    }
  };
  const handleH = (val) => {
    const px = Math.max(mmToPx(5), mmToPx(parseFloat(val) || 5));
    if (lockAspect) {
      const newW = Math.round(px * aspectRatio?.current);
      onUpdate({ h: Math.round(px), w: Math.max(10, newW) });
    } else {
      onUpdate({ h: Math.round(px) });
    }
  };
  const handlePadding = (val) => {
    const px = Math.max(0, mmToPx(parseFloat(val) || 0));
    onUpdate({ padding: Math.round(px) });
  };

  const getCategoryMeta = (key) => CONTENT_LIBRARY_CATEGORIES?.find(c => c?.key === key);
  const blockLabel = block?.type === 'content_library' ? (getCategoryMeta(block?.categoryKey)?.label ??'Content Library')
    : (BLOCK_PALETTE?.find(b => b?.type === block?.type)?.label ?? block?.type);
  const blockIcon = block?.type === 'content_library' ? (getCategoryMeta(block?.categoryKey)?.icon ??'BookOpen')
    : (BLOCK_PALETTE?.find(b => b?.type === block?.type)?.icon ?? 'Square');

  const MmInput = ({ label, value, onChange, min = 0, max = 999 }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-caption text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1 bg-muted/60 border border-border rounded-md px-2 py-1">
        <input
          type="number"
          defaultValue={value}
          key={`${block?.id}-${label}-${value}`}
          min={min}
          max={max}
          step="0.1"
          onBlur={(e) => onChange(e?.target?.value)}
          onKeyDown={(e) => { if (e?.key === 'Enter') onChange(e?.target?.value); }}
          onMouseDown={(e) => e?.stopPropagation()}
          className="w-full bg-transparent text-[11px] font-mono text-foreground outline-none border-0 focus:ring-0 min-w-0"
        />
        <span className="text-[9px] text-muted-foreground shrink-0">mm</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border bg-primary/5 dark:bg-primary/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center shrink-0">
            <Icon name={blockIcon} size={12} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-caption font-semibold text-foreground truncate">{blockLabel}</p>
            <p className="text-[9px] text-muted-foreground font-mono">Properties</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* Position */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Icon name="Move" size={11} className="text-muted-foreground" />
            <span className="text-[10px] font-caption font-semibold text-foreground uppercase tracking-wider">Position</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MmInput label="X (left)" value={xMm} onChange={handleX} min={0} max={pxToMm(A4_WIDTH_PX)} />
            <MmInput label="Y (top)"  value={yMm} onChange={handleY} min={0} max={pxToMm(A4_HEIGHT_PX)} />
          </div>
        </div>

        <div className="w-full h-px bg-border" />

        {/* Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Icon name="Maximize2" size={11} className="text-muted-foreground" />
              <span className="text-[10px] font-caption font-semibold text-foreground uppercase tracking-wider">Size</span>
            </div>
            {block?.type === 'image' && (
              <button
                onClick={() => {
                  const newLock = !lockAspect;
                  setLockAspect(newLock);
                  if (newLock && block?.w && block?.h) {
                    aspectRatio.current = block?.w / block?.h;
                  }
                }}
                title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-caption transition-colors
                  ${lockAspect ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted text-muted-foreground border border-border hover:border-primary/40'}`}
              >
                <Icon name={lockAspect ? 'Lock' : 'Unlock'} size={9} />
                <span>{lockAspect ? 'Locked' : 'Free'}</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MmInput label="Width"  value={wMm} onChange={handleW} min={5} max={pxToMm(A4_WIDTH_PX)} />
            <MmInput label="Height" value={hMm} onChange={handleH} min={5} max={pxToMm(A4_HEIGHT_PX)} />
          </div>
        </div>

        <div className="w-full h-px bg-border" />

        {/* Padding */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Icon name="SquareDashed" size={11} className="text-muted-foreground" />
            <span className="text-[10px] font-caption font-semibold text-foreground uppercase tracking-wider">Padding</span>
          </div>
          <MmInput label="Inner spacing" value={paddingMm} onChange={handlePadding} min={0} max={50} />
        </div>

        <div className="w-full h-px bg-border" />

        {/* Snap to grid */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Icon name="Grid3x3" size={11} className="text-muted-foreground" />
            <span className="text-[10px] font-caption font-semibold text-foreground uppercase tracking-wider">Canvas</span>
          </div>
          <button
            onClick={() => onSnapToGridChange(!snapToGrid)}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg border transition-colors text-[11px] font-caption
              ${snapToGrid
                ? 'bg-primary/10 border-primary/40 text-primary dark:bg-primary/15' :'bg-muted/50 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}
          >
            <div className="flex items-center gap-2">
              <Icon name="Magnet" size={12} />
              <span>Snap to Grid</span>
            </div>
            <div className={`w-8 h-4 rounded-full transition-colors relative ${snapToGrid ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${snapToGrid ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>

        <div className="w-full h-px bg-border" />

        {/* Layer order */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Icon name="Layers" size={11} className="text-muted-foreground" />
            <span className="text-[10px] font-caption font-semibold text-foreground uppercase tracking-wider">Layer Order</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onMoveForward}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg border border-border bg-muted/40 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors"
              title="Move Forward"
            >
              <Icon name="ArrowUp" size={13} />
              <span className="text-[9px] font-caption">Forward</span>
            </button>
            <button
              onClick={onSendBack}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg border border-border bg-muted/40 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors"
              title="Send Back"
            >
              <Icon name="ArrowDown" size={13} />
              <span className="text-[9px] font-caption">Send Back</span>
            </button>
          </div>
        </div>

      </div>
      {/* Delete footer */}
      <div className="p-3 border-t border-border shrink-0">
        <button
          onClick={() => onDelete(block?.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-destructive/40 text-destructive text-xs font-caption hover:bg-destructive/10 transition-colors"
        >
          <Icon name="Trash2" size={12} />
          <span>Delete Block</span>
        </button>
      </div>
    </div>
  );
};

// ─── Content Library Select Template Popup ───────────────────────────────────
const ContentLibraryPopup = ({ categoryKey, onSelect, onClose }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const meta = CONTENT_LIBRARY_CATEGORIES?.find(c => c?.key === categoryKey);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // The ContentLibraryTab saves entries using the full label string (e.g. "Termination & Disputes")
        // so we must query by the label, not the short key.
        const categoryLabel = meta?.label ?? categoryKey;
        const data = await contentLibraryService?.getByCategory(categoryLabel);
        setEntries(data || []);
      } catch (err) {
        setError('Failed to load entries. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [categoryKey, meta]);

  const filtered = entries?.filter(e =>
    !search || e?.title?.toLowerCase()?.includes(search?.toLowerCase()) || e?.content?.toLowerCase()?.includes(search?.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-[480px] max-h-[600px] flex flex-col"
        onClick={e => e?.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-border bg-card dark:bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name={meta?.icon ?? 'BookOpen'} size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-heading font-semibold text-foreground">{meta?.label ?? 'Content Library'}</p>
              <p className="text-[10px] text-muted-foreground">Select a saved entry to insert</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="X" size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 border-b border-border dark:border-border shrink-0">
          <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-1.5">
            <Icon name="Search" size={13} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e?.target?.value)}
              placeholder="Search entries…"
              className="flex-1 bg-transparent text-xs text-foreground outline-none border-0 placeholder:text-muted-foreground"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Icon name="Loader2" size={20} className="text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Loading entries…</p>
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Icon name="AlertCircle" size={20} className="text-destructive" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
          {!loading && !error && filtered?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Icon name="FileX" size={24} className="text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground text-center">
                {search ? 'No entries match your search.' : `No saved entries for ${meta?.label ?? 'this category'} yet.`}
              </p>
              {!search && (
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  Add entries in Template Studio → Content Library
                </p>
              )}
            </div>
          )}
          {!loading && !error && filtered?.map(entry => (
            <button
              key={entry?.id}
              onClick={() => onSelect(entry)}
              className="w-full text-left rounded-lg border border-border bg-background hover:border-primary/60 hover:bg-primary/5 transition-all p-3 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-caption font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {entry?.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {entry?.content ? entry?.content?.replace(/<[^>]*>/g, '')?.replace(/\n/g, ' ')?.slice(0, 120) + (entry?.content?.length > 120 ? '…' : '') : 'No content preview'}
                  </p>
                </div>
                <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                  <Icon name="Plus" size={11} className="text-primary" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border dark:border-border shrink-0 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {!loading && !error ? `${filtered?.length} entr${filtered?.length === 1 ? 'y' : 'ies'}` : ''}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-caption text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Canvas Block Renderer ────────────────────────────────────────────────────
const CanvasBlock = ({ block, zoom, isSelected, onSelect, onUpdate, onDelete, canvasRef, snapToGrid, onOpenContentLibrary }) => {
  const blockRef = useRef(null);
  const dragState = useRef(null);
  const resizeState = useRef(null);

  const GRID_SIZE_PX = 20;

  const snapVal = (val) => snapToGrid ? Math.round(val / GRID_SIZE_PX) * GRID_SIZE_PX : val;

  const handleMouseDownMove = (e) => {
    if (e?.target?.closest('[data-resize]') || e?.target?.closest('[data-toolbar]') || e?.target?.closest('[data-action]')) return;
    e?.preventDefault();
    e?.stopPropagation();
    onSelect();
    const canvasRect = canvasRef?.current?.getBoundingClientRect();
    const w = block?.w ?? 0;
    const h = block?.h ?? 0;
    dragState.current = {
      startMouseX: e?.clientX,
      startMouseY: e?.clientY,
      startX: block?.x,
      startY: block?.y,
      canvasLeft: canvasRect?.left ?? 0,
      canvasTop: canvasRect?.top ?? 0,
    };

    const onMove = (me) => {
      if (!dragState?.current) return;
      const dx = (me?.clientX - dragState?.current?.startMouseX) / zoom;
      const dy = (me?.clientY - dragState?.current?.startMouseY) / zoom;
      const rawX = dragState?.current?.startX + dx;
      const rawY = dragState?.current?.startY + dy;
      const newX = Math.round(Math.max(0, Math.min(A4_WIDTH_PX - w, rawX - w / 2)));
      const newY = Math.round(Math.max(0, Math.min(A4_HEIGHT_PX - h, rawY - h / 2)));
      onUpdate({ x: Math.round(newX), y: Math.round(newY) });
    };
    const onUp = () => {
      dragState.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleMouseDownResize = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    resizeState.current = {
      startMouseX: e?.clientX,
      startMouseY: e?.clientY,
      startW: block?.w,
      startH: block?.h,
    };
    const onMove = (me) => {
      if (!resizeState?.current) return;
      const dw = (me?.clientX - resizeState?.current?.startMouseX) / zoom;
      const dh = (me?.clientY - resizeState?.current?.startMouseY) / zoom;
      const minW = 60, minH = 20;
      const maxW = A4_WIDTH_PX - block?.x;
      const maxH = A4_HEIGHT_PX - block?.y;
      onUpdate({
        w: Math.round(Math.max(minW, Math.min(maxW, resizeState?.current?.startW + dw))),
        h: Math.round(Math.max(minH, Math.min(maxH, resizeState?.current?.startH + dh))),
      });
    };
    const onUp = () => {
      resizeState.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const scaledX = block?.x * zoom;
  const scaledY = block?.y * zoom;
  const scaledW = block?.w * zoom;
  const scaledH = block?.h * zoom;

  return (
    <div
      ref={blockRef}
      onMouseDown={handleMouseDownMove}
      onClick={(e) => { e?.stopPropagation(); onSelect(); }}
      style={{
        position: 'absolute',
        left: scaledX,
        top: scaledY,
        width: scaledW,
        height: scaledH,
        zIndex: isSelected ? 20 : 10,
        cursor: 'move',
        userSelect: 'none',
      }}
      className={`group ${isSelected ? 'ring-2 ring-primary ring-offset-0' : 'ring-1 ring-transparent hover:ring-primary/40'}`}
    >
      {/* Inline toolbar (shown when selected) */}
      {isSelected && (
        <div
          data-toolbar
          onMouseDown={e => e?.stopPropagation()}
          style={{
            position: 'absolute',
            top: -36,
            left: 0,
            zIndex: 30,
            minWidth: 'max-content',
          }}
          className="flex items-center gap-1 bg-card border border-border rounded-lg shadow-lg px-2 py-1"
        >
          <BlockControls block={block} onUpdate={onUpdate} onDelete={onDelete} />
        </div>
      )}
      {/* Block content */}
      <BlockContent block={block} zoom={zoom} onUpdate={onUpdate} isSelected={isSelected} onOpenContentLibrary={onOpenContentLibrary} />
      {/* Resize handle */}
      <div
        data-resize
        onMouseDown={handleMouseDownResize}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 12,
          height: 12,
          cursor: 'se-resize',
          zIndex: 25,
        }}
        className={`${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'} transition-opacity`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M11 1L1 11M11 6L6 11M11 11" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
};

// ─── Block Content Renderer ────────────────────────────────────────────────────
const BlockContent = ({ block, zoom, onUpdate, isSelected, onOpenContentLibrary }) => {
  const scaledFont = (block?.fontSize ?? 14) * zoom;

  switch (block?.type) {
    case 'text':
      return (
        <div className="w-full h-full bg-white/80 border border-dashed border-indigo-300 overflow-hidden"
          style={{ padding: `${(block?.padding ?? 4) * zoom}px` }}>
          <textarea
            value={block?.content ?? ''}
            onChange={e => onUpdate({ content: e?.target?.value })}
            onMouseDown={e => e?.stopPropagation()}
            placeholder="Type your text here…"
            className="w-full h-full bg-transparent resize-none outline-none border-0 placeholder:text-zinc-300"
            style={{
              fontSize: scaledFont,
              fontWeight: block?.bold ? 700 : 400,
              fontStyle: block?.italic ? 'italic' : 'normal',
              textDecoration: block?.underline ? 'underline' : 'none',
              color: block?.color ?? '#000000',
              textAlign: block?.align ?? 'left',
              lineHeight: 1.5,
            }}
          />
        </div>
      );

    case 'data':
      return (
        <div className="w-full h-full bg-blue-50/80 border border-dashed border-blue-300 flex items-center overflow-hidden"
          style={{ padding: `${(block?.padding ?? 4) * zoom}px ${8 * zoom}px`, gap: `${6 * zoom}px` }}>
          <Icon name="Database" size={Math.max(10, 13 * zoom)} className="text-blue-400 shrink-0" />
          <span className="font-mono text-blue-700 truncate font-medium"
            style={{ fontSize: Math.max(8, 11 * zoom) }}>
            {`{{ ${block?.field ?? 'Field'} }}`}
          </span>
        </div>
      );

    case 'table':
      return (
        <div className="w-full h-full bg-violet-50/80 border border-dashed border-violet-300 flex flex-col overflow-hidden"
          style={{ padding: `${(block?.padding ?? 4) * zoom}px` }}>
          <div className="flex items-center gap-1 mb-1" style={{ gap: `${4 * zoom}px`, marginBottom: `${4 * zoom}px` }}>
            <Icon name="Table" size={Math.max(10, 12 * zoom)} className="text-violet-400 shrink-0" />
            <span className="font-mono text-violet-700 font-medium truncate"
              style={{ fontSize: Math.max(8, 10 * zoom) }}>
              {block?.dataset ?? 'Dataset'} Table
            </span>
          </div>
          <div className="flex-1 border border-violet-200 rounded overflow-hidden">
            <div className="bg-violet-100 border-b border-violet-200 flex" style={{ height: `${18 * zoom}px` }}>
              {['Col 1','Col 2','Col 3','Col 4']?.map(c => (
                <div key={c} className="flex-1 border-r border-violet-200 last:border-r-0 flex items-center justify-center">
                  <span className="text-violet-500 font-mono" style={{ fontSize: Math.max(6, 8 * zoom) }}>{c}</span>
                </div>
              ))}
            </div>
            {[1,2,3]?.map(r => (
              <div key={r} className="flex border-b border-violet-100 last:border-b-0" style={{ height: `${16 * zoom}px` }}>
                {[1,2,3,4]?.map(c => (
                  <div key={c} className="flex-1 border-r border-violet-100 last:border-r-0 bg-white/60" />
                ))}
              </div>
            ))}
          </div>
        </div>
      );

    case 'tnc':
      return (
        <div className="w-full h-full bg-amber-50/80 border border-dashed border-amber-300 overflow-hidden"
          style={{ padding: `${(block?.padding ?? 4) * zoom}px` }}>
          <div className="flex items-center gap-1 mb-1" style={{ gap: `${4 * zoom}px`, marginBottom: `${4 * zoom}px` }}>
            <Icon name="FileCheck" size={Math.max(10, 11 * zoom)} className="text-amber-500 shrink-0" />
            <span className="text-amber-700 font-caption font-semibold"
              style={{ fontSize: Math.max(7, 9 * zoom) }}>Terms & Conditions</span>
          </div>
          <textarea
            value={block?.content ?? ''}
            onChange={e => onUpdate({ content: e?.target?.value })}
            onMouseDown={e => e?.stopPropagation()}
            placeholder="Type your terms and conditions here…"
            className="w-full bg-transparent resize-none outline-none border-0 placeholder:text-amber-300 text-amber-900"
            style={{
              fontSize: Math.max(7, 9 * zoom),
              lineHeight: 1.5,
              height: `calc(100% - ${(18 * zoom)}px)`,
            }}
          />
        </div>
      );

    case 'divider':
      return (
        <div className="w-full h-full flex items-center" style={{ padding: `0 ${(block?.padding ?? 4) * zoom}px` }}>
          <div className="w-full border-t-2 border-zinc-400" />
        </div>
      );

    case 'spacer':
      return (
        <div className="w-full h-full bg-zinc-100/60 border border-dashed border-zinc-300 flex flex-col items-center justify-center gap-1">
          <span className="text-zinc-300 font-mono" style={{ fontSize: Math.max(7, 9 * zoom) }}>
            spacer — {pxToMm(block?.h ?? 0)?.toFixed(1)}mm
          </span>
        </div>
      );

    case 'image':
      return (
        <div className="w-full h-full bg-emerald-50/80 border border-dashed border-emerald-300 flex flex-col items-center justify-center gap-1">
          {block?.imageUrl ? (
            <img src={block?.imageUrl} alt="Uploaded" className="w-full h-full object-contain" />
          ) : (
            <>
              <Icon name="Image" size={Math.max(14, 24 * zoom)} className="text-emerald-300" />
              <span className="text-emerald-400 font-caption" style={{ fontSize: Math.max(7, 9 * zoom) }}>
                Logo / Image
              </span>
              <label className="cursor-pointer" onMouseDown={e => e?.stopPropagation()}>
                <span className="text-emerald-600 underline" style={{ fontSize: Math.max(7, 8 * zoom) }}>
                  Upload
                </span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e?.target?.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => onUpdate({ imageUrl: ev?.target?.result });
                      reader?.readAsDataURL(file);
                    }
                  }} />
              </label>
            </>
          )}
        </div>
      );

    case 'content_library': {
      const meta = CONTENT_LIBRARY_CATEGORIES?.find(c => c?.key === block?.categoryKey);
      const hasContent = block?.content && block?.content?.trim()?.length > 0;
      return (
        <div className="w-full h-full bg-indigo-50/80 border border-dashed border-indigo-300 flex flex-col overflow-hidden"
          style={{ padding: `${(block?.padding ?? 4) * zoom}px` }}>
          {/* Category header */}
          <div className="flex items-center justify-between shrink-0" style={{ marginBottom: `${6 * zoom}px` }}>
            <div className="flex items-center" style={{ gap: `${4 * zoom}px` }}>
              <Icon name={meta?.icon ?? 'BookOpen'} size={Math.max(10, 11 * zoom)} className="text-indigo-500 shrink-0" />
              <span className="text-indigo-700 font-caption font-semibold truncate"
                style={{ fontSize: Math.max(7, 9 * zoom) }}>
                {meta?.label ?? block?.categoryKey}
              </span>
            </div>
            {/* Select Template button */}
            <button
              data-action
              onMouseDown={e => e?.stopPropagation()}
              onClick={e => {
                e?.stopPropagation();
                onOpenContentLibrary?.(block?.id, block?.categoryKey);
              }}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors shrink-0"
              style={{
                gap: `${3 * zoom}px`,
                padding: `${2 * zoom}px ${6 * zoom}px`,
                fontSize: Math.max(7, 8 * zoom),
              }}
              title="Select a saved template entry"
            >
              <Icon name="Library" size={Math.max(8, 9 * zoom)} />
              <span className="font-caption font-medium whitespace-nowrap">Select Template</span>
            </button>
          </div>
          {/* Content area */}
          {hasContent ? (
            <textarea
              value={block?.content ?? ''}
              onChange={e => onUpdate({ content: e?.target?.value })}
              onMouseDown={e => e?.stopPropagation()}
              className="flex-1 w-full bg-transparent resize-none outline-none border-0 text-indigo-900"
              style={{
                fontSize: Math.max(7, 9 * zoom),
                lineHeight: 1.5,
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-1 opacity-50">
              <Icon name="MousePointerClick" size={Math.max(12, 18 * zoom)} className="text-indigo-400" />
              <span className="text-indigo-400 font-caption text-center"
                style={{ fontSize: Math.max(7, 8 * zoom) }}>
                Click "Select Template" to insert content
              </span>
            </div>
          )}
          {/* Entry title badge */}
          {block?.entryTitle && (
            <div className="shrink-0 mt-1 flex items-center" style={{ gap: `${3 * zoom}px` }}>
              <Icon name="Tag" size={Math.max(7, 8 * zoom)} className="text-indigo-400" />
              <span className="text-indigo-400 font-mono truncate" style={{ fontSize: Math.max(6, 7 * zoom) }}>
                {block?.entryTitle}
              </span>
            </div>
          )}
        </div>
      );
    }

    default:
      return <div className="w-full h-full bg-muted border border-dashed border-border" />;
  }
};

// ─── Block Palette Card (right panel) ────────────────────────────────────────
const PaletteCard = ({ type, icon, label, description, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, type)}
    className="group relative rounded-lg border border-border bg-card hover:border-primary/60 hover:bg-primary/5 dark:hover:bg-primary/10 cursor-grab active:cursor-grabbing transition-all select-none flex flex-col items-center justify-center gap-1.5 p-2 w-[80px] h-[80px]"
    title={description}
  >
    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
      <Icon name={icon} size={15} className="text-primary" />
    </div>
    <p className="text-[10px] font-caption font-semibold text-foreground leading-tight text-center line-clamp-2">{label}</p>
    {/* Tooltip */}
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 hidden group-hover:block">
      <div className="bg-popover text-popover-foreground text-[10px] rounded px-2 py-1 shadow-md border border-border whitespace-nowrap max-w-[160px] text-center">
        {description}
      </div>
    </div>
  </div>
);

// ─── Content Library Palette Button (matches PaletteCard style) ──────────────
const ContentLibraryPaletteButton = ({ category, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, `cl_${category?.key}`, category?.key)}
    className="group relative rounded-lg border border-border bg-card hover:border-primary/60 hover:bg-primary/5 dark:hover:bg-primary/10 cursor-grab active:cursor-grabbing transition-all select-none flex flex-col items-center justify-center gap-1.5 p-2 w-[80px] h-[80px]"
    title={`${category?.label} T&C clause block`}
  >
    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
      <Icon name={category?.icon} size={15} className="text-primary" />
    </div>
    <p className="text-[10px] font-caption font-semibold text-foreground leading-tight text-center line-clamp-2">{category?.label}</p>
    {/* Tooltip */}
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 hidden group-hover:block">
      <div className="bg-popover text-popover-foreground text-[10px] rounded px-2 py-1 shadow-md border border-border whitespace-nowrap max-w-[160px] text-center">
        {category?.label} T&amp;C clause block
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ProposalExportTemplateDesigner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Check if we're editing an existing template (passed via navigation state)
  const editTemplate = location?.state?.editTemplate || null;

  const [templateName, setTemplateName] = useState(editTemplate?.name || 'Untitled Export Template');
  const [editTemplateId, setEditTemplateId] = useState(editTemplate?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Load pages from existing template if editing, otherwise start fresh
  const [pages, setPages] = useState(() => {
    if (editTemplate?.layoutConfig?.pages?.length > 0) {
      return editTemplate?.layoutConfig?.pages?.map((p, i) => ({
        id: p?.id || `page-${i}`,
        label: p?.label || `Page ${i + 1}`,
        blocks: p?.blocks || [],
      }));
    }
    return [createPage(0)];
  });
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Content Library popup state
  const [contentLibraryPopup, setContentLibraryPopup] = useState(null); // { blockId, categoryKey }

  const canvasRef = useRef(null);
  const dragIndexRef = useRef(null);
  const [draggingIndex, setDraggingIndex] = useState(null);

  const handleToggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);

  const handleCanvasClick = useCallback(() => setSelectedBlockId(null), []);

  // ── Page management ────────────────────────────────────────────────────────
  const handleAddPage = useCallback(() => {
    setPages(prev => {
      const newPages = [...prev, createPage(prev?.length)];
      return newPages;
    });
    setSelectedPageIndex(prev => prev + 1);
  }, []);

  const handleDeletePage = useCallback((index) => {
    setPages(prev => {
      const updated = prev?.filter((_, i) => i !== index);
      return updated?.map((p, i) => ({ ...p, label: `Page ${i + 1}` }));
    });
    setSelectedPageIndex(prev => {
      if (index <= prev && prev > 0) return prev - 1;
      return prev;
    });
  }, []);

  // ── Page drag-to-reorder ───────────────────────────────────────────────────
  const handlePageDragStart = useCallback((e, index) => {
    dragIndexRef.current = index;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handlePageDragOver = useCallback((e, index) => {
    e?.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handlePageDrop = useCallback((e, dropIndex) => {
    e?.preventDefault();
    const dragIndex = dragIndexRef?.current;
    if (dragIndex === null || dragIndex === dropIndex) { setDraggingIndex(null); return; }
    setPages(prev => {
      const updated = [...prev];
      const [dragged] = updated?.splice(dragIndex, 1);
      updated?.splice(dropIndex, 0, dragged);
      return updated?.map((p, i) => ({ ...p, label: `Page ${i + 1}` }));
    });
    setSelectedPageIndex(dropIndex);
    dragIndexRef.current = null;
    setDraggingIndex(null);
  }, []);

  // ── Block palette drag ─────────────────────────────────────────────────────
  const handlePaletteDragStart = useCallback((e, type, categoryKey) => {
    e?.dataTransfer?.setData('block-type', type);
    if (categoryKey) e?.dataTransfer?.setData('category-key', categoryKey);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleCanvasDragOver = useCallback((e) => {
    e?.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleCanvasDrop = useCallback((e) => {
    e?.preventDefault();
    const type = e?.dataTransfer?.getData('block-type');
    if (!type) return;
    const categoryKey = e?.dataTransfer?.getData('category-key') || null;
    const canvasRect = canvasRef?.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const rawX = (e?.clientX - canvasRect?.left) / zoom;
    const rawY = (e?.clientY - canvasRect?.top) / zoom;

    // Determine actual block type and dimensions
    const actualType = type?.startsWith('cl_') ? 'content_library' : type;
    const dims = BLOCK_DEFAULTS?.[actualType] ?? { w: 500, h: 200 };
    const { w, h } = dims;
    const x = Math.round(Math.max(0, Math.min(A4_WIDTH_PX - w, rawX - w / 2)));
    const y = Math.round(Math.max(0, Math.min(A4_HEIGHT_PX - h, rawY - h / 2)));
    const newBlock = createBlock(type, x, y, categoryKey);
    setPages(prev => prev?.map((p, i) =>
      i === selectedPageIndex ? { ...p, blocks: [...p?.blocks, newBlock] } : p
    ));
    setSelectedBlockId(newBlock?.id);
  }, [zoom, selectedPageIndex]);

  // ── Block update ───────────────────────────────────────────────────────────
  const handleBlockUpdate = useCallback((blockId, updates) => {
    setPages(prev => prev?.map((p, i) =>
      i === selectedPageIndex
        ? { ...p, blocks: p?.blocks?.map(b => b?.id === blockId ? { ...b, ...updates } : b) }
        : p
    ));
  }, [selectedPageIndex]);

  // ── Block delete ───────────────────────────────────────────────────────────
  const handleBlockDelete = useCallback((blockId) => {
    setPages(prev => prev?.map((p, i) =>
      i === selectedPageIndex
        ? { ...p, blocks: p?.blocks?.filter(b => b?.id !== blockId) }
        : p
    ));
    setSelectedBlockId(null);
  }, [selectedPageIndex]);

  // ── Layer order: Move Forward ──────────────────────────────────────────────
  const handleMoveForward = useCallback(() => {
    if (!selectedBlockId) return;
    setPages(prev => prev?.map((p, i) => {
      if (i !== selectedPageIndex) return p;
      const blocks = [...p?.blocks];
      const idx = blocks?.findIndex(b => b?.id === selectedBlockId);
      if (idx < blocks?.length - 1) {
        [blocks[idx], blocks[idx + 1]] = [blocks?.[idx + 1], blocks?.[idx]];
      }
      return { ...p, blocks };
    }));
  }, [selectedBlockId, selectedPageIndex]);

  // ── Layer order: Send Back ─────────────────────────────────────────────────
  const handleSendBack = useCallback(() => {
    if (!selectedBlockId) return;
    setPages(prev => prev?.map((p, i) => {
      if (i !== selectedPageIndex) return p;
      const blocks = [...p?.blocks];
      const idx = blocks?.findIndex(b => b?.id === selectedBlockId);
      if (idx > 0) {
        [blocks[idx], blocks[idx - 1]] = [blocks?.[idx - 1], blocks?.[idx]];
      }
      return { ...p, blocks };
    }));
  }, [selectedBlockId, selectedPageIndex]);

  // ── Content Library popup handlers ────────────────────────────────────────
  const handleOpenContentLibrary = useCallback((blockId, categoryKey) => {
    setContentLibraryPopup({ blockId, categoryKey });
  }, []);

  const handleContentLibrarySelect = useCallback((entry) => {
    if (!contentLibraryPopup?.blockId) return;
    // Strip HTML tags for plain text insertion, keep content editable
    const plainContent = entry?.content
      ? entry?.content?.replace(/<br\s*\/?>/gi, '\n')?.replace(/<[^>]*>/g, '')
      : '';
    handleBlockUpdate(contentLibraryPopup?.blockId, {
      content: plainContent,
      entryTitle: entry?.title ?? '',
    });
    setContentLibraryPopup(null);
  }, [contentLibraryPopup, handleBlockUpdate]);

  const handleCloseContentLibraryPopup = useCallback(() => {
    setContentLibraryPopup(null);
  }, []);

  // ── Save template ──────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!templateName?.trim()) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const layoutConfig = {
        pages: pages?.map(p => ({
          id: p?.id,
          label: p?.label,
          blocks: p?.blocks,
        })),
        version: 2,
        canvasSize: { width: A4_WIDTH_PX, height: A4_HEIGHT_PX },
      };

      if (editTemplateId) {
        // UPDATE existing template
        const { error } = await supabase?.from('export_templates')?.update({
          name: templateName?.trim(),
          layout_config: layoutConfig,
        })?.eq('id', editTemplateId);
        if (error) throw error;
      } else {
        // INSERT new template
        const { error } = await supabase?.from('export_templates')?.insert({
          name: templateName?.trim(),
          template_type: 'pdf',
          layout_config: layoutConfig,
          cover_page_settings: {},
          header_settings: {},
          footer_settings: {},
          is_default: false,
          is_active: true,
          created_by: user?.id ?? null,
        });
        if (error) throw error;
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Save template error:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 4000);
    } finally {
      setIsSaving(false);
    }
  }, [templateName, pages, user, editTemplateId]);

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const handleZoomIn    = () => setZoom(z => Math.min(z + 0.1, 2));
  const handleZoomOut   = () => setZoom(z => Math.max(z - 0.1, 0.4));
  const handleZoomReset = () => setZoom(1);

  // ── Keyboard delete ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if ((e?.key === 'Delete' || e?.key === 'Backspace') && selectedBlockId) {
        const active = document.activeElement;
        if (active && (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.tagName === 'SELECT')) return;
        handleBlockDelete(selectedBlockId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedBlockId, handleBlockDelete]);

  const selectedPage = pages?.[selectedPageIndex];
  const selectedBlock = selectedPage?.blocks?.find(b => b?.id === selectedBlockId) ?? null;

  const propertiesActive = !!selectedBlock;

  return (
    <div className="flex h-screen bg-background dark:bg-background overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} />
      <div className="flex-1 flex flex-col min-w-0 ml-[68px]">

        {/* ── Top Toolbar ── */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border dark:border-border bg-card dark:bg-card shrink-0 z-10">
          <button onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted dark:hover:bg-muted transition-smooth text-muted-foreground hover:text-foreground"
            title="Go back">
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div className="w-px h-6 bg-border dark:bg-border" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Icon name="FileOutput" size={18} className="text-primary shrink-0" />
            <input type="text" value={templateName}
              onChange={e => setTemplateName(e?.target?.value)}
              className="flex-1 min-w-0 bg-input border border-border dark:border-border rounded-md px-3 py-1.5 text-sm font-heading font-semibold text-foreground dark:text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-smooth max-w-sm"
              placeholder="Template name…" maxLength={120} />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-muted/50 dark:bg-muted/30 rounded-lg px-2 py-1">
            <button onClick={handleZoomOut}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted dark:hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth"
              title="Zoom out"><Icon name="Minus" size={12} /></button>
            <button onClick={handleZoomReset}
              className="text-xs font-mono text-muted-foreground hover:text-foreground w-12 text-center transition-smooth"
              title="Reset zoom">{Math.round(zoom * 100)}%</button>
            <button onClick={handleZoomIn}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted dark:hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth"
              title="Zoom in"><Icon name="Plus" size={12} /></button>
          </div>

          {saveStatus === 'success' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-caption">
              <Icon name="CheckCircle" size={14} /><span>Saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-xs text-destructive font-caption">
              <Icon name="AlertCircle" size={14} /><span>Save failed</span>
            </div>
          )}

          <button onClick={handleSave} disabled={isSaving || !templateName?.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-caption font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth">
            {isSaving ? (
              <><Icon name="Loader2" size={14} className="animate-spin" /><span>Saving…</span></>
            ) : (
              <><Icon name="Save" size={14} /><span>Save Template</span></>
            )}
          </button>
        </header>

        {/* ── Three-panel workspace ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── LEFT: Page Manager ── */}
          <aside className="w-[100px] shrink-0 flex flex-col border-r border-border dark:border-border bg-card dark:bg-card overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border dark:border-border">
              <span className="text-[11px] font-caption font-semibold text-muted-foreground uppercase tracking-wider">Pages</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-1">
              {pages?.map((page, index) => (
                <PageThumbnail key={page?.id} page={page} index={index}
                  isSelected={selectedPageIndex === index}
                  onSelect={setSelectedPageIndex}
                  onDelete={handleDeletePage}
                  totalPages={pages?.length}
                  isDragging={draggingIndex === index}
                  onDragStart={handlePageDragStart}
                  onDragOver={handlePageDragOver}
                  onDrop={handlePageDrop} />
              ))}
            </div>
            <div className="p-2 border-t border-border dark:border-border">
              <button onClick={handleAddPage}
                className="w-full flex flex-col items-center gap-1 py-2 rounded-lg border border-dashed border-border dark:border-border hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 text-muted-foreground hover:text-primary transition-smooth group"
                title="Add page">
                <Icon name="Plus" size={14} className="group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-caption">Add Page</span>
              </button>
            </div>
          </aside>

          {/* ── CENTER: A4 Canvas ── */}
          <main className="flex-1 min-w-0 overflow-auto bg-muted/40 dark:bg-muted/20 flex flex-col items-center py-8 px-6">
            {/* Page indicator */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm font-heading font-medium text-zinc-500">{selectedPage?.label}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setSelectedPageIndex(p => Math.max(0, p - 1))}
                  disabled={selectedPageIndex === 0}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted dark:hover:bg-muted disabled:opacity-30 text-muted-foreground transition-smooth">
                  <Icon name="ChevronLeft" size={12} />
                </button>
                <button onClick={() => setSelectedPageIndex(p => Math.min(pages?.length - 1, p + 1))}
                  disabled={selectedPageIndex === pages?.length - 1}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted dark:hover:bg-muted disabled:opacity-30 text-muted-foreground transition-smooth">
                  <Icon name="ChevronRight" size={12} />
                </button>
              </div>
            </div>

            {/* A4 canvas */}
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              onDragOver={handleCanvasDragOver}
              onDrop={handleCanvasDrop}
              className="relative bg-white shadow-2xl rounded-sm"
              style={{
                width: `${A4_WIDTH_PX * zoom}px`,
                height: `${A4_HEIGHT_PX * zoom}px`,
                minWidth: `${A4_WIDTH_PX * zoom}px`,
                minHeight: `${A4_HEIGHT_PX * zoom}px`,
              }}
            >
              {/* Grid guide overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="smallGrid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse">
                    <path d={`M ${20 * zoom} 0 L 0 ${20 * zoom}`} fill="none" stroke="rgba(99,102,241,0.06)" strokeWidth="0.5" strokeLinecap="round"/>
                  </pattern>
                  <pattern id="grid" width={100 * zoom} height={100 * zoom} patternUnits="userSpaceOnUse">
                    <rect width={100 * zoom} height={100 * zoom} fill="url(#smallGrid)" />
                    <path d={`M ${100 * zoom} 0 L 0 ${100 * zoom}`} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="0.5" strokeLinecap="round"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Margin guides */}
              <div className="absolute border border-dashed border-indigo-200/60 pointer-events-none"
                style={{ top: `${28 * zoom}px`, left: `${28 * zoom}px`, right: `${28 * zoom}px`, bottom: `${28 * zoom}px` }} />

              {/* Empty state */}
              {(!selectedPage?.blocks || selectedPage?.blocks?.length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <Icon name="LayoutTemplate" size={40} className="text-zinc-400" />
                    <div className="text-center">
                      <p className="text-sm font-heading font-medium text-zinc-500">{selectedPage?.label}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Drag blocks from the right panel</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Blocks */}
              {selectedPage?.blocks?.map(block => (
                <CanvasBlock
                  key={block?.id}
                  block={block}
                  zoom={zoom}
                  isSelected={selectedBlockId === block?.id}
                  onSelect={() => setSelectedBlockId(block?.id)}
                  onUpdate={(updates) => handleBlockUpdate(block?.id, updates)}
                  onDelete={() => handleBlockDelete(block?.id)}
                  canvasRef={canvasRef}
                  snapToGrid={snapToGrid}
                  onOpenContentLibrary={handleOpenContentLibrary}
                />
              ))}

              {/* Page number footer */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pointer-events-none"
                style={{ height: `${24 * zoom}px` }}>
                <span className="text-zinc-300 font-mono" style={{ fontSize: `${10 * zoom}px` }}>
                  {selectedPageIndex + 1} / {pages?.length}
                </span>
              </div>
            </div>

            <p className="mt-3 text-[10px] font-mono text-muted-foreground/60">A4 — 210 × 297 mm</p>
          </main>

          {/* ── RIGHT: Properties Panel (when block selected) or Block Palette ── */}
          <aside
            className={`shrink-0 flex flex-col border-l border-border dark:border-border bg-card dark:bg-card overflow-hidden w-[196px]`}
          >
            {propertiesActive ? (
              /* ── Properties Panel ── */
              (<>
                {/* Header with toggle back to palette */}
                <div className="px-3 py-2.5 border-b border-border dark:border-border flex items-center justify-between shrink-0">
                  <span className="text-[11px] font-caption font-semibold text-muted-foreground uppercase tracking-wider">Properties</span>
                  <button
                    onClick={() => setSelectedBlockId(null)}
                    title="Close properties panel"
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon name="X" size={11} />
                  </button>
                </div>
                <PropertiesPanel
                  block={selectedBlock}
                  onUpdate={(updates) => handleBlockUpdate(selectedBlock?.id, updates)}
                  onDelete={handleBlockDelete}
                  onMoveForward={handleMoveForward}
                  onSendBack={handleSendBack}
                  snapToGrid={snapToGrid}
                  onSnapToGridChange={setSnapToGrid}
                />
              </>)
            ) : (
              /* ── Block Palette ── */
              (<>
                <div className="px-3 py-2.5 border-b border-border dark:border-border shrink-0">
                  <span className="text-[11px] font-caption font-semibold text-muted-foreground uppercase tracking-wider">Block Types</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  <p className="text-[10px] text-muted-foreground px-1 pb-1">Drag a block onto the canvas</p>
                  <div className="grid grid-cols-2 gap-2">
                    {BLOCK_PALETTE?.map(bt => (
                      <PaletteCard key={bt?.type} {...bt} onDragStart={handlePaletteDragStart} />
                    ))}
                  </div>

                  {/* ── Content Library Section ── */}
                  <div className="pt-1">
                    <div className="flex items-center gap-1.5 px-1 pb-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[9px] font-caption font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">T&amp;C Clauses</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {CONTENT_LIBRARY_CATEGORIES?.map(cat => (
                        <ContentLibraryPaletteButton
                          key={cat?.key}
                          category={cat}
                          onDragStart={handlePaletteDragStart}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Snap to grid toggle in palette footer */}
                <div className="p-2 border-t border-border shrink-0">
                  <button
                    onClick={() => setSnapToGrid(s => !s)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-colors text-[10px] font-caption
                      ${snapToGrid
                        ? 'bg-primary/10 border-primary/40 text-primary dark:bg-primary/15' :'bg-muted/50 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon name="Magnet" size={11} />
                      <span>Snap to Grid</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full transition-colors relative ${snapToGrid ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${snapToGrid ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  </button>
                </div>
              </>)
            )}
          </aside>

        </div>
      </div>

      {/* ── Content Library Popup ── */}
      {contentLibraryPopup && (
        <ContentLibraryPopup
          categoryKey={contentLibraryPopup?.categoryKey}
          onSelect={handleContentLibrarySelect}
          onClose={handleCloseContentLibraryPopup}
        />
      )}
    </div>
  );
};

export default ProposalExportTemplateDesigner;
