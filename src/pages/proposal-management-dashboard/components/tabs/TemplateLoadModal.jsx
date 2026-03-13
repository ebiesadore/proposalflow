import React, { useState, useEffect, useMemo } from 'react';
import Button from '../../../../components/ui/Button';
import Icon from '../../../../components/AppIcon';
import { getTemplates } from '../../../../services/templateService';

const APPLY_OPTIONS = [
  { value: 'both', label: 'Materials + Labour', icon: 'Layers' },
  { value: 'materials', label: 'Materials Only', icon: 'Package' },
  { value: 'labour', label: 'Labour Only', icon: 'Users' },
];

const TemplateLoadModal = ({ isOpen, onClose, onApply }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [applyOption, setApplyOption] = useState('both');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTemplate(null);
    setSearchQuery('');
    setCategoryFilter('');
    setApplyOption('both');
    setError(null);
    loadTemplates();
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTemplates({ isActive: true });
      setTemplates(data || []);
    } catch (err) {
      setError('Failed to load templates. Please try again.');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = [...new Set(templates?.map(t => t?.category).filter(Boolean))];
    return cats?.sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates?.filter(t => {
      const matchesSearch = !searchQuery ||
        t?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        t?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase());
      const matchesCategory = !categoryFilter || t?.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, categoryFilter]);

  const handleApply = () => {
    if (!selectedTemplate) return;
    setApplying(true);

    // Deep-copy template items into independent line items
    const materialItems = (selectedTemplate?.materialItems || [])?.map(item => ({
      id: Date.now() + Math.random(),
      no: item?.no || 1,
      item: item?.itemName || '',
      libraryItemId: item?.libraryItemId || null,
      costPSQF: (parseFloat(item?.quantity || 0) * parseFloat(item?.unitCost || 0)) || 0,
      costWastePSQF: 0,
      costWastePSQM: 0,
      perModulePrice: item?.perModulePrice || 0,
    }));

    const labourItems = (selectedTemplate?.labourItems || [])?.map(item => ({
      id: Date.now() + Math.random(),
      role: item?.role || '',
      hours: item?.hours || 0,
      rate: item?.rate || 0,
      total: item?.total || 0,
      labourCostPSQF: item?.labourCostPsqf || 0,
    }));

    onApply({
      applyOption,
      materialItems: applyOption === 'labour' ? [] : materialItems,
      labourItems: applyOption === 'materials' ? [] : labourItems,
      templateName: selectedTemplate?.name,
    });

    setApplying(false);
    onClose();
  };

  const getTypeLabel = (type) => {
    if (type === 'material') return 'Materials';
    if (type === 'labour') return 'Labour';
    return 'Combined';
  };

  const getTypeBadgeClass = (type) => {
    if (type === 'material') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (type === 'labour') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="FileTemplate" size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Load from Template</h2>
              <p className="text-xs text-muted-foreground">Select a template to append items to this entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — template list */}
          <div className="w-1/2 border-r border-border flex flex-col">
            {/* Search + Filter */}
            <div className="p-4 space-y-3 border-b border-border">
              <div className="relative">
                <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e?.target?.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {categories?.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e?.target?.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Categories</option>
                  {categories?.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Template list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <Icon name="Loader2" size={24} className="text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading templates...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
                  <Icon name="AlertCircle" size={24} className="text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                  <button onClick={loadTemplates} className="text-xs text-primary underline">Retry</button>
                </div>
              ) : filteredTemplates?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
                  <Icon name="FileX" size={24} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No templates found</p>
                </div>
              ) : (
                filteredTemplates?.map(template => (
                  <button
                    key={template?.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedTemplate?.id === template?.id
                        ? 'border-primary bg-primary/5 dark:bg-primary/10' :'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{template?.name}</p>
                        {template?.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template?.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeBadgeClass(template?.templateType)}`}>
                            {getTypeLabel(template?.templateType)}
                          </span>
                          {template?.category && (
                            <span className="text-xs text-muted-foreground">{template?.category}</span>
                          )}
                        </div>
                      </div>
                      {selectedTemplate?.id === template?.id && (
                        <Icon name="CheckCircle2" size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="Package" size={11} />
                        {template?.materialItems?.length || 0} materials
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Users" size={11} />
                        {template?.labourItems?.length || 0} labour
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right panel — preview + apply options */}
          <div className="w-1/2 flex flex-col">
            {selectedTemplate ? (
              <>
                {/* Preview */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{selectedTemplate?.name}</h3>
                    {selectedTemplate?.description && (
                      <p className="text-xs text-muted-foreground">{selectedTemplate?.description}</p>
                    )}
                  </div>

                  {/* Materials preview */}
                  {selectedTemplate?.materialItems?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="Package" size={13} className="text-blue-500" />
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                          Materials ({selectedTemplate?.materialItems?.length})
                        </span>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {selectedTemplate?.materialItems?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-muted/40 rounded text-xs">
                            <span className="text-foreground truncate flex-1">{item?.itemName || '—'}</span>
                            <span className="text-muted-foreground ml-2 flex-shrink-0">
                              ${(item?.unitCost || 0)?.toFixed(2)}/ft²
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Labour preview */}
                  {selectedTemplate?.labourItems?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="Users" size={13} className="text-green-500" />
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                          Labour ({selectedTemplate?.labourItems?.length})
                        </span>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {selectedTemplate?.labourItems?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-muted/40 rounded text-xs">
                            <span className="text-foreground truncate flex-1">{item?.role || '—'}</span>
                            <span className="text-muted-foreground ml-2 flex-shrink-0">
                              {item?.hours || 0}h @ ${(item?.rate || 0)?.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTemplate?.materialItems?.length === 0 && selectedTemplate?.labourItems?.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-24 text-center">
                      <Icon name="Info" size={20} className="text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">This template has no line items yet.</p>
                    </div>
                  )}
                </div>

                {/* Apply options */}
                <div className="border-t border-border p-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Apply Options</p>
                  <div className="grid grid-cols-3 gap-2">
                    {APPLY_OPTIONS?.map(opt => (
                      <button
                        key={opt?.value}
                        onClick={() => setApplyOption(opt?.value)}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                          applyOption === opt?.value
                            ? 'border-primary bg-primary/10 text-primary' :'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <Icon name={opt?.icon} size={15} />
                        <span className="text-center leading-tight">{opt?.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                      <Icon name="Info" size={12} className="flex-shrink-0 mt-0.5" />
                      Items will be appended to existing line items. All applied items are fully editable and independent from the template.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Icon name="MousePointerClick" size={28} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Select a template</p>
                <p className="text-xs text-muted-foreground">Choose a template from the list to preview its contents</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {filteredTemplates?.length} template{filteredTemplates?.length !== 1 ? 's' : ''} available
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={!selectedTemplate || applying}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              iconName="Download"
            >
              {applying ? 'Applying...' : 'Apply Template'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateLoadModal;
