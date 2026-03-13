import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

import { getExportTemplates } from '../../../services/templateService';
import exportInstanceService from '../../../services/exportInstanceService';


// ─── A4 canvas dimensions (same as Export Designer) ─────────────────────────
const A4_WIDTH_PX = 595;
const A4_HEIGHT_PX = 842;

// ─── Proposal data field mapping ─────────────────────────────────────────────
const resolveDataField = (field, proposal) => {
  if (!proposal) return `[${field}]`;
  const map = {
    'Project Title': proposal?.title || proposal?.project_name || '—',
    'Client Name': proposal?.client?.company_name || '—',
    'Grand Total': proposal?.value ? `$${Number(proposal?.value)?.toLocaleString()}` : '—',
    'Project Number': proposal?.project_number || '—',
    'Proposal Date': proposal?.created_at ? new Date(proposal?.created_at)?.toLocaleDateString() : '—',
    'Project Type': proposal?.project_type || '—',
    'Net Margin %': proposal?.margin_percentage ? `${proposal?.margin_percentage}%` : '—',
    'Ft² Rate BUA': proposal?.ft2_rate_bua ? `$${proposal?.ft2_rate_bua}` : '—',
    'Project Duration': proposal?.project_duration?.total || '—',
    'Valid Until': proposal?.deadline ? new Date(proposal?.deadline)?.toLocaleDateString() : '—',
    'Total Area (BUA)': '—',
    'Contingency Amount': '—',
  };
  return map?.[field] ?? `[${field}]`;
};

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Select Template' },
    { num: 2, label: 'Choose Proposal' },
    { num: 3, label: 'Customise' },
    { num: 4, label: 'Export' },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps?.map((step, i) => (
        <React.Fragment key={step?.num}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              currentStep === step?.num
                ? 'bg-primary text-primary-foreground shadow-md'
                : currentStep > step?.num
                ? 'bg-success text-white' :'bg-muted text-muted-foreground'
            }`}>
              {currentStep > step?.num ? <Icon name="Check" size={14} /> : step?.num}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${
              currentStep === step?.num ? 'text-foreground' : 'text-muted-foreground'
            }`}>{step?.label}</span>
          </div>
          {i < steps?.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 transition-all ${
              currentStep > step?.num ? 'bg-success' : 'bg-border'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Step 1: Template Browser ─────────────────────────────────────────────────
const TemplateBrowser = ({ onSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getExportTemplates({ isActive: true });
        setTemplates(data || []);
      } catch (err) {
        setError(err?.message || 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">Loading templates…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Icon name="AlertCircle" size={24} className="text-destructive" />
        </div>
        <p className="text-destructive font-medium mb-2">Failed to load templates</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  if (templates?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Icon name="FileOutput" size={28} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-2">No export templates yet</h3>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          Create export templates in the Export Template Designer first, then come back here to allocate them to proposals.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-1">Select a Template</h3>
        <p className="text-sm text-muted-foreground">Choose the export template you want to use for this proposal</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates?.map(template => {
          const pageCount = template?.layoutConfig?.pages?.length || 1;
          const lastMod = template?.updatedAt
            ? new Date(template?.updatedAt)?.toLocaleDateString()
            : template?.createdAt
            ? new Date(template?.createdAt)?.toLocaleDateString()
            : '—';

          return (
            <div
              key={template?.id}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-brand transition-all group cursor-pointer"
              onClick={() => onSelect(template)}
            >
              {/* Template preview thumbnail */}
              <div className="w-full bg-muted/40 border border-border rounded-lg mb-4 flex items-center justify-center overflow-hidden"
                style={{ height: '120px' }}>
                <div className="flex flex-col items-center gap-1 opacity-40">
                  <Icon name="FileOutput" size={28} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-mono">A4</span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-2 mb-3">
                <h4 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors">
                  {template?.name}
                </h4>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                  template?.templateType === 'pdf' ?'bg-primary/10 text-primary' :'bg-accent/10 text-accent'
                }`}>
                  {template?.templateType || 'pdf'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Icon name="FileText" size={11} />
                  {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="Clock" size={11} />
                  {lastMod}
                </span>
              </div>

              <Button
                variant="default"
                className="w-full"
                onClick={(e) => { e?.stopPropagation(); onSelect(template); }}
              >
                Select
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Step 2: Proposal Search ──────────────────────────────────────────────────
const ProposalSearch = ({ selectedTemplate, onSelect, onBack }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const doSearch = useCallback(async (term) => {
    if (!term || term?.trim()?.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const data = await exportInstanceService?.searchProposals(term);
      setResults(data || []);
      setShowDropdown(true);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e?.target?.value;
    setQuery(val);
    clearTimeout(debounceRef?.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef?.current && !wrapperRef?.current?.contains(e?.target)) {
        setShowDropdown(false);
      }
    };
    document?.addEventListener('mousedown', handler);
    return () => document?.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="FileOutput" size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Selected template</p>
            <p className="text-sm font-semibold text-foreground">{selectedTemplate?.name}</p>
          </div>
          <button
            onClick={onBack}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Icon name="ArrowLeft" size={12} />
            Change
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-1">Search for a Proposal</h3>
        <p className="text-sm text-muted-foreground">Search by proposal name, project number, or client name</p>
      </div>

      <div ref={wrapperRef} className="relative max-w-xl">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {loading
              ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              : <Icon name="Search" size={16} className="text-muted-foreground" />
            }
          </div>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => results?.length > 0 && setShowDropdown(true)}
            placeholder="Type proposal name, number, or client…"
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        {showDropdown && results?.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-72 overflow-y-auto">
            {results?.map(proposal => (
              <button
                key={proposal?.id}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 flex items-start gap-3"
                onClick={() => {
                  setShowDropdown(false);
                  setQuery(proposal?.title || proposal?.project_name || '');
                  onSelect(proposal);
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="FileText" size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {proposal?.title || proposal?.project_name || 'Untitled'}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {proposal?.project_number && (
                      <span className="text-xs text-muted-foreground">#{proposal?.project_number}</span>
                    )}
                    {proposal?.client?.company_name && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Icon name="Building2" size={10} />
                        {proposal?.client?.company_name}
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      proposal?.status === 'Active' ? 'bg-success/10 text-success' :
                      proposal?.status === 'Draft'? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
                    }`}>
                      {proposal?.status || 'Draft'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown && results?.length === 0 && !loading && query?.trim()?.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 px-4 py-6 text-center">
            <Icon name="SearchX" size={20} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No proposals found for "{query}"</p>
          </div>
        )}
      </div>

      {query?.trim()?.length === 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          Start typing to search across all your proposals
        </p>
      )}
    </div>
  );
};

// ─── Block renderer for canvas ────────────────────────────────────────────────
const BlockRenderer = ({ block, proposal, isSelected, onClick, onUpdate, onDelete }) => {
  const style = {
    position: 'absolute',
    left: block?.x,
    top: block?.y,
    width: block?.w,
    height: block?.h,
    padding: block?.padding ?? 4,
    boxSizing: 'border-box',
    cursor: 'pointer',
    outline: isSelected ? '2px solid #6366f1' : '1px dashed transparent',
    borderRadius: 3,
    background: isSelected ? 'rgba(99,102,241,0.04)' : 'transparent',
    transition: 'outline 0.1s',
    userSelect: 'none',
  };

  const renderContent = () => {
    switch (block?.type) {
      case 'text':
        return (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onUpdate?.({ content: e?.target?.innerText })}
            style={{
              fontSize: block?.fontSize ?? 14,
              fontWeight: block?.bold ? 'bold' : 'normal',
              fontStyle: block?.italic ? 'italic' : 'normal',
              textDecoration: block?.underline ? 'underline' : 'none',
              color: block?.color ?? '#000000',
              textAlign: block?.align ?? 'left',
              width: '100%',
              height: '100%',
              outline: 'none',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {block?.content || ''}
          </div>
        );
      case 'data':
        return (
          <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
            <span style={{ fontSize: 10, color: '#9ca3af', display: 'block', marginBottom: 2 }}>
              {block?.field}
            </span>
            <span>{resolveDataField(block?.field, proposal)}</span>
          </div>
        );
      case 'table':
        return (
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>{block?.dataset}</div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 4 }}>
              [Table: {block?.dataset}]
            </div>
          </div>
        );
      case 'divider':
        return <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '8px 0' }} />;
      case 'spacer':
        return <div style={{ height: '100%' }} />;
      case 'image':
        return (
          <div style={{
            width: '100%', height: '100%',
            background: '#f3f4f6',
            border: '1px dashed #d1d5db',
            borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 4,
          }}>
            {block?.imageUrl
              ? <img src={block?.imageUrl} alt="Block image" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              : <>
                  <span style={{ fontSize: 20 }}>🖼</span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>Image</span>
                </>
            }
          </div>
        );
      case 'content_library':
        return (
          <div style={{ fontSize: 11, color: '#374151', overflow: 'hidden', height: '100%' }}>
            <div style={{ fontWeight: 600, marginBottom: 2, color: '#6366f1', fontSize: 10 }}>
              {block?.categoryKey?.replace(/_/g, ' ')?.toUpperCase()}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {block?.content || '[Content Library Block]'}
            </div>
          </div>
        );
      default:
        return <div style={{ fontSize: 11, color: '#9ca3af' }}>[{block?.type}]</div>;
    }
  };

  return (
    <div style={style} onClick={(e) => { e?.stopPropagation(); onClick?.(); }}>
      {renderContent()}
      {isSelected && (
        <button
          onClick={(e) => { e?.stopPropagation(); onDelete?.(); }}
          style={{
            position: 'absolute', top: -10, right: -10,
            width: 20, height: 20, borderRadius: '50%',
            background: '#ef4444', color: '#fff',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, zIndex: 10,
          }}
          title="Remove block"
        >✕</button>
      )}
    </div>
  );
};

// ─── Step 3: Customisation Canvas ─────────────────────────────────────────────
const CustomisationCanvas = ({ selectedTemplate, selectedProposal, onSave, onBack, saving }) => {
  const [pages, setPages] = useState([]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [zoom, setZoom] = useState(0.9);

  // Load template layout on mount
  useEffect(() => {
    const layoutConfig = selectedTemplate?.layoutConfig || {};
    const templatePages = layoutConfig?.pages;
    if (Array.isArray(templatePages) && templatePages?.length > 0) {
      // Deep clone to avoid mutating the master template
      setPages(JSON.parse(JSON.stringify(templatePages)));
    } else {
      // Blank canvas if no pages defined
      setPages([{ id: 'page-1', label: 'Page 1', blocks: [] }]);
    }
  }, [selectedTemplate]);

  const currentPage = pages?.[currentPageIdx];

  const updateBlock = (blockId, updates) => {
    setPages(prev => prev?.map((page, idx) =>
      idx !== currentPageIdx ? page : {
        ...page,
        blocks: page?.blocks?.map(b => b?.id === blockId ? { ...b, ...updates } : b),
      }
    ));
  };

  const deleteBlock = (blockId) => {
    setPages(prev => prev?.map((page, idx) =>
      idx !== currentPageIdx ? page : {
        ...page,
        blocks: page?.blocks?.filter(b => b?.id !== blockId),
      }
    ));
    setSelectedBlockId(null);
  };

  const addTextBlock = () => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type: 'text',
      x: 40, y: 40,
      w: 400, h: 80,
      padding: 4,
      content: 'New text block — click to edit',
      fontSize: 14,
      bold: false, italic: false, underline: false,
      color: '#000000', align: 'left',
    };
    setPages(prev => prev?.map((page, idx) =>
      idx !== currentPageIdx ? page : { ...page, blocks: [...page?.blocks, newBlock] }
    ));
    setSelectedBlockId(newBlock?.id);
  };

  const selectedBlock = currentPage?.blocks?.find(b => b?.id === selectedBlockId);

  const getCustomLayout = () => ({ pages });

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={14} />
            Back
          </button>
          <div className="w-px h-4 bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">Customising for</p>
            <p className="text-sm font-semibold text-foreground">
              {selectedProposal?.title || selectedProposal?.project_name || 'Proposal'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            title="Zoom out"
          >
            <Icon name="ZoomOut" size={14} className="text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            title="Zoom in"
          >
            <Icon name="ZoomIn" size={14} className="text-muted-foreground" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="outline"
            iconName="Plus"
            iconPosition="left"
            onClick={addTextBlock}
          >
            Add Text
          </Button>
          <Button
            variant="default"
            iconName={saving ? 'Loader' : 'Save'}
            iconPosition="left"
            onClick={() => onSave(getCustomLayout())}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save & Continue'}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Page list */}
        <div className="w-20 shrink-0 flex flex-col gap-2 overflow-y-auto">
          {pages?.map((page, idx) => (
            <button
              key={page?.id}
              onClick={() => { setCurrentPageIdx(idx); setSelectedBlockId(null); }}
              className={`w-full aspect-[1/1.414] rounded border flex items-center justify-center text-[9px] font-mono transition-all ${
                idx === currentPageIdx
                  ? 'border-primary bg-primary/5 text-primary' :'border-border bg-muted/30 text-muted-foreground hover:border-primary/40'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-muted/20 rounded-xl border border-border p-4 flex items-start justify-center">
          <div
            style={{
              width: A4_WIDTH_PX * zoom,
              height: A4_HEIGHT_PX * zoom,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              position: 'relative',
              background: '#ffffff',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              flexShrink: 0,
            }}
            onClick={() => setSelectedBlockId(null)}
          >
            {currentPage?.blocks?.map(block => (
              <BlockRenderer
                key={block?.id}
                block={block}
                proposal={selectedProposal}
                isSelected={selectedBlockId === block?.id}
                onClick={() => setSelectedBlockId(block?.id)}
                onUpdate={(updates) => updateBlock(block?.id, updates)}
                onDelete={() => deleteBlock(block?.id)}
              />
            ))}

            {currentPage?.blocks?.length === 0 && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: '#d1d5db', gap: 8,
              }}>
                <span style={{ fontSize: 32 }}>📄</span>
                <span style={{ fontSize: 12 }}>Template layout will appear here</span>
                <span style={{ fontSize: 11 }}>Use "Add Text" to add custom blocks</span>
              </div>
            )}
          </div>
        </div>

        {/* Properties panel */}
        {selectedBlock && (
          <div className="w-52 shrink-0 bg-card border border-border rounded-xl p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Block Properties</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="text-xs font-medium text-foreground capitalize">{selectedBlock?.type?.replace(/_/g, ' ')}</p>
              </div>
              {selectedBlock?.type === 'text' && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Font Size</p>
                    <select
                      value={selectedBlock?.fontSize ?? 14}
                      onChange={e => updateBlock(selectedBlock?.id, { fontSize: Number(e?.target?.value) })}
                      className="w-full text-xs bg-muted border border-border rounded px-2 py-1 text-foreground"
                    >
                      {[8,9,10,11,12,14,16,18,20,24,28,32]?.map(s => (
                        <option key={s} value={s}>{s}px</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { key: 'bold', icon: 'Bold', label: 'B' },
                      { key: 'italic', icon: 'Italic', label: 'I' },
                      { key: 'underline', icon: 'Underline', label: 'U' },
                    ]?.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => updateBlock(selectedBlock?.id, { [key]: !selectedBlock?.[key] })}
                        className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                          selectedBlock?.[key]
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Color</p>
                    <input
                      type="color"
                      value={selectedBlock?.color ?? '#000000'}
                      onChange={e => updateBlock(selectedBlock?.id, { color: e?.target?.value })}
                      className="w-full h-8 rounded border border-border cursor-pointer"
                    />
                  </div>
                </>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Position</p>
                <p className="text-xs text-foreground">x: {Math.round(selectedBlock?.x)}, y: {Math.round(selectedBlock?.y)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Size</p>
                <p className="text-xs text-foreground">{Math.round(selectedBlock?.w)} × {Math.round(selectedBlock?.h)}</p>
              </div>
              <button
                onClick={() => deleteBlock(selectedBlock?.id)}
                className="w-full py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
              >
                Remove Block
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg">
        <Icon name="Info" size={14} className="text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          Changes here are saved as a <strong className="text-foreground">proposal-specific instance</strong> only. The master template is never modified.
        </p>
      </div>
    </div>
  );
};

// ─── Step 4: Export Actions ───────────────────────────────────────────────────
const ExportActions = ({ instance, selectedTemplate, selectedProposal, onBack, onExportComplete }) => {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportedFiles, setExportedFiles] = useState(instance?.generatedFiles || []);
  const [error, setError] = useState(null);

  const handleExport = async (format) => {
    const setter = format === 'pdf' ? setExportingPdf : setExportingDocx;
    setter(true);
    setError(null);

    try {
      // Generate a simple text-based file (real PDF/DOCX generation would require a server-side function)
      const proposalName = selectedProposal?.title || selectedProposal?.project_name || 'proposal';
      const templateName = selectedTemplate?.name || 'template';
      const timestamp = new Date()?.toISOString()?.replace(/[:.]/g, '-')?.slice(0, 19);
      const fileName = `${proposalName?.replace(/\s+/g, '-')}_${templateName?.replace(/\s+/g, '-')}_${timestamp}.${format}`;

      // Create a placeholder file blob
      const content = format === 'pdf'
        ? `%PDF-1.4\n% Export for: ${proposalName}\n% Template: ${templateName}\n% Generated: ${new Date()?.toLocaleString()}\n% Proposal #: ${selectedProposal?.project_number || 'N/A'}\n% Client: ${selectedProposal?.client?.company_name || 'N/A'}`
        : `[DOCX Export]\nProposal: ${proposalName}\nTemplate: ${templateName}\nGenerated: ${new Date()?.toLocaleString()}\nProject #: ${selectedProposal?.project_number || 'N/A'}\nClient: ${selectedProposal?.client?.company_name || 'N/A'}`;

      const mimeType = format === 'pdf' ?'application/pdf' :'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const blob = new Blob([content], { type: mimeType });
      const file = new File([blob], fileName, { type: mimeType });

      // Upload to Supabase Storage
      const uploaded = await exportInstanceService?.uploadExportFile(instance?.id, file, fileName);

      // Log against the instance
      const fileEntry = {
        fileName,
        format,
        path: uploaded?.path,
        signedUrl: uploaded?.signedUrl,
        uploadedAt: uploaded?.uploadedAt,
      };

      await exportInstanceService?.appendGeneratedFile(instance?.id, fileEntry);

      const updated = [...exportedFiles, fileEntry];
      setExportedFiles(updated);
      onExportComplete?.(updated);

      // Trigger browser download
      const a = document?.createElement('a');
      a.href = URL?.createObjectURL(blob);
      a.download = fileName;
      a?.click();
      URL?.revokeObjectURL(a?.href);

    } catch (err) {
      console.error('Export error:', err);
      setError(err?.message || `Failed to export as ${format?.toUpperCase()}`);
    } finally {
      setter(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="ArrowLeft" size={14} />
          Back to Canvas
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-1">Export Document</h3>
        <p className="text-sm text-muted-foreground">
          Generate and download the export for <strong className="text-foreground">{selectedProposal?.title || selectedProposal?.project_name}</strong>
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6 max-w-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Template</p>
            <p className="font-medium text-foreground">{selectedTemplate?.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Proposal</p>
            <p className="font-medium text-foreground">{selectedProposal?.title || selectedProposal?.project_name}</p>
          </div>
          {selectedProposal?.project_number && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Project #</p>
              <p className="font-medium text-foreground">{selectedProposal?.project_number}</p>
            </div>
          )}
          {selectedProposal?.client?.company_name && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Client</p>
              <p className="font-medium text-foreground">{selectedProposal?.client?.company_name}</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4 max-w-lg">
          <Icon name="AlertCircle" size={14} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Export buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => handleExport('pdf')}
          disabled={exportingPdf || exportingDocx}
          className="flex items-center gap-3 px-6 py-4 bg-destructive/10 border border-destructive/20 rounded-xl hover:bg-destructive/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center group-hover:bg-destructive/30 transition-colors">
            {exportingPdf
              ? <div className="w-5 h-5 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
              : <Icon name="FileText" size={18} className="text-destructive" />
            }
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground text-sm">Export as PDF</p>
            <p className="text-xs text-muted-foreground">Generate & download PDF</p>
          </div>
        </button>

        <button
          onClick={() => handleExport('docx')}
          disabled={exportingPdf || exportingDocx}
          className="flex items-center gap-3 px-6 py-4 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
            {exportingDocx
              ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              : <Icon name="FileOutput" size={18} className="text-primary" />
            }
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground text-sm">Export as DOCX</p>
            <p className="text-xs text-muted-foreground">Generate & download Word doc</p>
          </div>
        </button>
      </div>

      {/* Version history */}
      {exportedFiles?.length > 0 && (
        <div className="max-w-lg">
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Icon name="History" size={14} className="text-muted-foreground" />
            Export History ({exportedFiles?.length})
          </p>
          <div className="space-y-2">
            {exportedFiles?.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  file?.format === 'pdf' ? 'bg-destructive/10' : 'bg-primary/10'
                }`}>
                  <Icon
                    name={file?.format === 'pdf' ? 'FileText' : 'FileOutput'}
                    size={14}
                    className={file?.format === 'pdf' ? 'text-destructive' : 'text-primary'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{file?.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {file?.uploadedAt ? new Date(file?.uploadedAt)?.toLocaleString() : '—'}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                  file?.format === 'pdf' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                }`}>
                  {file?.format}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main ExportTemplatesTab ──────────────────────────────────────────────────
const ExportTemplatesTab = () => {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [currentInstance, setCurrentInstance] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setStep(2);
  };

  const handleProposalSelect = (proposal) => {
    setSelectedProposal(proposal);
    setStep(3);
  };

  const handleSaveCanvas = async (customLayoutJson) => {
    setSaving(true);
    setError(null);
    try {
      let instance;
      if (currentInstance) {
        instance = await exportInstanceService?.updateInstanceLayout(currentInstance?.id, customLayoutJson);
      } else {
        instance = await exportInstanceService?.createExportInstance({
          templateId: selectedTemplate?.id,
          proposalId: selectedProposal?.id,
          customLayoutJson,
        });
      }
      setCurrentInstance(instance);
      setStep(4);
    } catch (err) {
      setError(err?.message || 'Failed to save customisation');
    } finally {
      setSaving(false);
    }
  };

  const handleExportComplete = (files) => {
    if (currentInstance) {
      setCurrentInstance(prev => ({ ...prev, generatedFiles: files }));
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedTemplate(null);
    setSelectedProposal(null);
    setCurrentInstance(null);
    setError(null);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 md:p-8" style={{ minHeight: '70vh' }}>
      <StepIndicator currentStep={step} />

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
          <Icon name="AlertCircle" size={14} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-destructive hover:text-destructive/80">
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {step === 1 && (
        <TemplateBrowser onSelect={handleTemplateSelect} />
      )}

      {step === 2 && (
        <ProposalSearch
          selectedTemplate={selectedTemplate}
          onSelect={handleProposalSelect}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <div style={{ minHeight: '60vh' }}>
          <CustomisationCanvas
            selectedTemplate={selectedTemplate}
            selectedProposal={selectedProposal}
            onSave={handleSaveCanvas}
            onBack={() => setStep(2)}
            saving={saving}
          />
        </div>
      )}

      {step === 4 && currentInstance && (
        <ExportActions
          instance={currentInstance}
          selectedTemplate={selectedTemplate}
          selectedProposal={selectedProposal}
          onBack={() => setStep(3)}
          onExportComplete={handleExportComplete}
        />
      )}

      {/* Start over button */}
      {step > 1 && (
        <div className="mt-8 pt-6 border-t border-border flex justify-end">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="RotateCcw" size={12} />
            Start over
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportTemplatesTab;
