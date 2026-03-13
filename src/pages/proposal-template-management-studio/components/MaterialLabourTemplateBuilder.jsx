import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import {
  createTemplate,
  updateTemplate,
  getTemplateById,
  addMaterialItem,
  updateMaterialItem,
  deleteMaterialItem,
  addLabourItem,
  updateLabourItem,
  deleteLabourItem,
} from '../../../services/templateService';
import { materialService } from '../../../services/materialService';

const UNIT_OPTIONS = ['m²', 'ft²', 'lm', 'ea', 'kg', 'L', 'hr', 'set', 'lot'];
const TEMPLATE_TYPE_OPTIONS = [
  { value: 'combined', label: 'Combined (Material + Labour)' },
  { value: 'material', label: 'Material Only' },
  { value: 'labour', label: 'Labour Only' },
];
const CATEGORY_OPTIONS = [
  { value: '', label: 'Select category...' },
  { value: 'Residential PPVC', label: 'Residential PPVC' },
  { value: 'Commercial Fit-Out', label: 'Commercial Fit-Out' },
  { value: 'Industrial', label: 'Industrial' },
  { value: 'Structural', label: 'Structural' },
  { value: 'Mechanical', label: 'Mechanical' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Finishing', label: 'Finishing' },
  { value: 'General', label: 'General' },
];

const emptyMaterial = () => ({
  _localId: Date.now() + Math.random(),
  itemName: '',
  supplier: '',
  unit: '',
  quantity: 0,
  unitCost: 0,
  wastePercent: 5,
  notes: '',
  isNew: true,
  libraryId: null,
});

const emptyLabour = (materialLocalId = null) => ({
  _localId: Date.now() + Math.random(),
  role: '',
  hours: 0,
  rate: 0,
  notes: '',
  isNew: true,
  materialId: materialLocalId, // links to material _localId or id
});

// ---- Material Library Search Modal ----
const MaterialLibrarySearchModal = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) { setQuery(''); setResults([]); return; }
    setLoading(true);
    materialService?.searchMaterials('')?.then(data => {
      setResults(data || []);
    })?.catch(() => setResults([]))?.finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = results?.filter(m =>
    !query || m?.name?.toLowerCase()?.includes(query?.toLowerCase()) ||
    m?.category?.toLowerCase()?.includes(query?.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-xl w-full max-w-lg mx-4 shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h3 className="text-base font-heading font-semibold text-foreground">Select from Material Library</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth">
            <Icon name="X" size={16} />
          </button>
        </div>
        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e?.target?.value)}
              placeholder="Search by name or category..."
              autoFocus
              className="w-full pl-8 pr-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered?.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {query ? 'No materials match your search' : 'No materials in library'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered?.map(mat => (
                <button
                  key={mat?.id}
                  onClick={() => onSelect(mat)}
                  className="w-full text-left px-5 py-3 hover:bg-muted/40 transition-smooth"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{mat?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{mat?.category} {mat?.unit ? `· ${mat?.unit}` : ''}</p>
                    </div>
                    <div className="text-sm font-semibold text-foreground flex-shrink-0">
                      ${parseFloat(mat?.unit_cost || 0)?.toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MaterialLabourTemplateBuilder = ({ template, onSave, onCancel }) => {
  const isEditing = !!template?.id;

  // Form metadata
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState(template?.category || '');
  const [templateType, setTemplateType] = useState(template?.templateType || 'combined');
  const [isActive, setIsActive] = useState(template?.isActive !== undefined ? template?.isActive : true);

  // Line items (local state — saved to DB on save)
  const [materialItems, setMaterialItems] = useState([]);
  const [labourItems, setLabourItems] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadingItems, setLoadingItems] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [pendingMaterialLocalId, setPendingMaterialLocalId] = useState(null);

  // Load existing items when editing
  useEffect(() => {
    if (isEditing && template?.id) {
      setLoadingItems(true);
      getTemplateById(template?.id)?.then(full => {
          setMaterialItems((full?.materialItems || [])?.map(m => ({ ...m, isNew: false })));
          setLabourItems((full?.labourItems || [])?.map(l => ({ ...l, isNew: false })));
        })?.catch(err => console.error('Failed to load template items:', err))?.finally(() => setLoadingItems(false));
    }
  }, [isEditing, template?.id]);

  const validate = () => {
    const errs = {};
    if (!name?.trim()) errs.name = 'Template name is required';
    setErrors(errs);
    return Object.keys(errs)?.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      setActiveTab('details');
      return;
    }
    try {
      setSaving(true);
      let savedTemplate;

      if (isEditing) {
        savedTemplate = await updateTemplate(template?.id, { name, description, category, templateType, isActive });
      } else {
        savedTemplate = await createTemplate({ name, description, category, templateType, isActive });
      }

      const templateId = savedTemplate?.id;

      // Save material items — track _localId → DB id mapping for labour materialId
      const localIdToDbId = {};
      const updatedMaterials = [];
      for (const item of materialItems) {
        if (item?.isNew) {
          const saved = await addMaterialItem(templateId, {
            itemName: item?.itemName,
            supplier: item?.supplier,
            unit: item?.unit,
            quantity: parseFloat(item?.quantity) || 0,
            unitCost: parseFloat(item?.unitCost) || 0,
            wastePercent: parseFloat(item?.wastePercent) || 5,
            notes: item?.notes,
            sortOrder: materialItems?.indexOf(item),
          });
          if (saved?.id) {
            localIdToDbId[item?._localId] = saved?.id;
            // Also map id→id for already-saved items referenced by labour
            localIdToDbId[item?.id] = saved?.id;
          }
          updatedMaterials?.push({ ...item, id: saved?.id, _localId: saved?.id, isNew: false, isDirty: false });
        } else if (item?.id && item?.isDirty) {
          await updateMaterialItem(item?.id, {
            itemName: item?.itemName,
            supplier: item?.supplier,
            unit: item?.unit,
            quantity: parseFloat(item?.quantity) || 0,
            unitCost: parseFloat(item?.unitCost) || 0,
            wastePercent: parseFloat(item?.wastePercent) || 5,
            notes: item?.notes,
          });
          localIdToDbId[item?._localId || item?.id] = item?.id;
          updatedMaterials?.push({ ...item, isNew: false, isDirty: false });
        } else if (item?.id) {
          localIdToDbId[item?._localId || item?.id] = item?.id;
          updatedMaterials?.push({ ...item, isNew: false, isDirty: false });
        } else {
          updatedMaterials?.push(item);
        }
      }

      // Save labour items — resolve materialId from localId mapping
      const updatedLabour = [];
      for (const item of labourItems) {
        const resolvedMaterialId = item?.materialId
          ? (localIdToDbId?.[item?.materialId] || item?.materialId)
          : null;

        if (item?.isNew) {
          const saved = await addLabourItem(templateId, {
            role: item?.role,
            hours: parseFloat(item?.hours) || 0,
            rate: parseFloat(item?.rate) || 0,
            total: (parseFloat(item?.hours) || 0) * (parseFloat(item?.rate) || 0),
            notes: item?.notes,
            materialId: resolvedMaterialId,
            sortOrder: labourItems?.indexOf(item),
          });
          updatedLabour?.push({ ...item, id: saved?.id, _localId: saved?.id, materialId: resolvedMaterialId, isNew: false, isDirty: false });
        } else if (item?.id && item?.isDirty) {
          await updateLabourItem(item?.id, {
            role: item?.role,
            hours: parseFloat(item?.hours) || 0,
            rate: parseFloat(item?.rate) || 0,
            total: (parseFloat(item?.hours) || 0) * (parseFloat(item?.rate) || 0),
            notes: item?.notes,
            materialId: resolvedMaterialId,
          });
          updatedLabour?.push({ ...item, materialId: resolvedMaterialId, isNew: false, isDirty: false });
        } else {
          updatedLabour?.push({ ...item, materialId: resolvedMaterialId, isNew: false, isDirty: false });
        }
      }

      // Update local state so _localId → real DB id and materialId references are correct
      // This ensures delete logic and lock icons work correctly without needing a reload
      setMaterialItems(updatedMaterials);
      setLabourItems(updatedLabour);

      onSave?.(savedTemplate);
    } catch (err) {
      console.error('Failed to save template:', err);
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Material item handlers ----
  const addMaterialRow = () => {
    const newMat = emptyMaterial();
    // Open library modal to select material
    setPendingMaterialLocalId(newMat?._localId);
    setMaterialItems(prev => [...prev, newMat]);
    setLibraryModalOpen(true);
  };

  const handleLibrarySelect = (libraryMaterial) => {
    // Populate the pending material row from library selection
    setMaterialItems(prev => prev?.map(item => {
      if (item?._localId === pendingMaterialLocalId) {
        return {
          ...item,
          itemName: libraryMaterial?.name || '',
          supplier: libraryMaterial?.supplier || '',
          unit: libraryMaterial?.unit || '',
          unitCost: parseFloat(libraryMaterial?.unit_cost) || 0,
          libraryId: libraryMaterial?.id,
          isDirty: true,
        };
      }
      return item;
    }));

    // Auto-create a linked labour row for this material
    const linkedLabour = emptyLabour(pendingMaterialLocalId);
    setLabourItems(prev => [...prev, linkedLabour]);

    // Clear pending and close modal — do NOT call handleLibraryModalClose (which would remove the row)
    setPendingMaterialLocalId(null);
    setLibraryModalOpen(false);
  };

  const handleLibraryModalClose = () => {
    // Only runs when user dismisses without selecting — remove the empty pending row
    if (pendingMaterialLocalId) {
      setMaterialItems(prev => prev?.filter(m => m?._localId !== pendingMaterialLocalId));
    }
    setPendingMaterialLocalId(null);
    setLibraryModalOpen(false);
  };

  const updateMaterialRow = (localId, field, value) => {
    setMaterialItems(prev => prev?.map(item =>
      (item?._localId === localId || item?.id === localId)
        ? { ...item, [field]: value, isDirty: true }
        : item
    ));
  };

  const removeMaterialRow = async (item) => {
    // For saved items: key is item.id (no _localId after save/reload)
    // For new unsaved items: key is item._localId
    const matKey = item?.id || item?._localId;

    if (!item?.isNew && item?.id) {
      try {
        await deleteMaterialItem(item?.id);
      } catch (err) {
        alert('Failed to delete material item.');
        return;
      }
    }

    // Auto-delete all labour rows linked to this material
    // Labour rows link via materialId which equals the material's id (after save) or _localId (before save)
    const linkedLabour = labourItems?.filter(l => l?.materialId === matKey);
    for (const l of linkedLabour) {
      if (!l?.isNew && l?.id) {
        try { await deleteLabourItem(l?.id); } catch (e) { /* ignore */ }
      }
    }
    setLabourItems(prev => prev?.filter(l => l?.materialId !== matKey));
    setMaterialItems(prev => prev?.filter(m => (m?.id || m?._localId) !== matKey));
  };

  // ---- Labour item handlers ----
  const addLabourRow = () => {
    // Standalone labour row — no material link
    setLabourItems(prev => [...prev, emptyLabour(null)]);
  };

  const updateLabourRow = (localId, field, value) => {
    setLabourItems(prev => prev?.map(item =>
      (item?._localId === localId || item?.id === localId)
        ? { ...item, [field]: value, isDirty: true }
        : item
    ));
  };

  const removeLabourRow = async (item) => {
    if (!item?.isNew && item?.id) {
      try {
        await deleteLabourItem(item?.id);
      } catch (err) {
        alert('Failed to delete labour item.');
        return;
      }
    }
    setLabourItems(prev => prev?.filter(l => (l?._localId || l?.id) !== (item?._localId || item?.id)));
  };

  const calcLabourTotal = (item) => {
    return ((parseFloat(item?.hours) || 0) * (parseFloat(item?.rate) || 0))?.toFixed(2);
  };

  const calcMaterialTotal = (item) => {
    const qty = parseFloat(item?.quantity) || 0;
    const cost = parseFloat(item?.unitCost) || 0;
    return (qty * cost)?.toFixed(2);
  };

  // Helper: get material name by _localId or id
  const getMaterialName = (matKey) => {
    if (!matKey) return null;
    const mat = materialItems?.find(m => m?._localId === matKey || m?.id === matKey);
    return mat?.itemName || null;
  };

  const showMaterials = templateType === 'material' || templateType === 'combined';
  const showLabour = templateType === 'labour' || templateType === 'combined';

  const tabs = [
    { id: 'details', label: 'Details', icon: 'FileText' },
    ...(showMaterials ? [{ id: 'materials', label: `Materials (${materialItems?.length})`, icon: 'Package' }] : []),
    ...(showLabour ? [{ id: 'labour', label: `Labour (${labourItems?.length})`, icon: 'Users' }] : []),
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">
              {isEditing ? 'Edit Template' : 'New Template'}
            </h2>
            <p className="text-xs text-muted-foreground">Material & Labour Template Builder</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Active</span>
            <button
              onClick={() => setIsActive(v => !v)}
              className={`w-10 h-5 rounded-full transition-all relative ${isActive ? 'bg-success' : 'bg-muted-foreground/30'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isActive ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button variant="default" iconName={saving ? undefined : 'Save'} iconPosition="left" onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : 'Save Template'}
          </Button>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex border-b border-border bg-card px-6 flex-shrink-0">
        {tabs?.map(tab => (
          <button
            key={tab?.id}
            onClick={() => setActiveTab(tab?.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-smooth ${
              activeTab === tab?.id
                ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name={tab?.icon} size={14} />
            {tab?.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="max-w-2xl space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Template Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={e => { setName(e?.target?.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                placeholder="e.g. Residential PPVC Standard Package"
                className={errors?.name ? 'border-destructive' : ''}
              />
              {errors?.name && <p className="text-xs text-destructive mt-1">{errors?.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e?.target?.value)}
                placeholder="Describe what this template is used for..."
                rows={3}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-smooth resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
              <Select
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={setCategory}
                placeholder="Select category..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Template Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TEMPLATE_TYPE_OPTIONS?.map(opt => (
                  <button
                    key={opt?.value}
                    onClick={() => setTemplateType(opt?.value)}
                    className={`p-3 rounded-lg border text-sm font-medium text-left transition-smooth ${
                      templateType === opt?.value
                        ? 'border-primary bg-primary/10 text-primary' :'border-border bg-card text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <Icon
                      name={opt?.value === 'material' ? 'Package' : opt?.value === 'labour' ? 'Users' : 'Combine'}
                      size={16}
                      className="mb-1.5"
                    />
                    <div>{opt?.label?.split(' (')?.[0]}</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      {opt?.value === 'material' ? 'Materials only' : opt?.value === 'labour' ? 'Labour only' : 'Both materials & labour'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Info" size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Template Summary</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {showMaterials && `${materialItems?.length} material item${materialItems?.length !== 1 ? 's' : ''}`}
                {showMaterials && showLabour && ' · '}
                {showLabour && `${labourItems?.length} labour item${labourItems?.length !== 1 ? 's' : ''}`}
                {!showMaterials && !showLabour && 'No items configured'}
              </p>
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-heading font-semibold text-foreground">Material Line Items</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select from Material Library — each material auto-creates a linked labour row
                </p>
              </div>
              <Button variant="outline" iconName="Search" iconPosition="left" onClick={addMaterialRow} size="sm">
                Add from Library
              </Button>
            </div>

            {loadingItems ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : materialItems?.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <Icon name="Package" size={32} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">No material items yet</p>
                <p className="text-xs text-muted-foreground mb-3">Materials are selected from the Material Library</p>
                <Button variant="outline" iconName="Search" iconPosition="left" onClick={addMaterialRow} size="sm">
                  Add from Library
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-3 py-2.5 font-caption font-medium text-muted-foreground min-w-[160px]">Material Name</th>
                      <th className="text-left px-3 py-2.5 font-caption font-medium text-muted-foreground min-w-[120px]">Supplier</th>
                      <th className="text-left px-3 py-2.5 font-caption font-medium text-muted-foreground w-24">Unit</th>
                      <th className="text-right px-3 py-2.5 font-caption font-medium text-muted-foreground w-20">Qty</th>
                      <th className="text-right px-3 py-2.5 font-caption font-medium text-muted-foreground w-24">Unit Cost</th>
                      <th className="text-right px-3 py-2.5 font-caption font-medium text-muted-foreground w-20">Waste %</th>
                      <th className="text-right px-3 py-2.5 font-caption font-medium text-muted-foreground w-24">Total</th>
                      <th className="text-left px-3 py-2.5 font-caption font-medium text-muted-foreground min-w-[120px]">Notes</th>
                      <th className="w-10 px-2 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialItems?.map((item, idx) => {
                      const rowKey = item?._localId || item?.id;
                      const linkedLabourCount = labourItems?.filter(l => l?.materialId === rowKey)?.length;
                      return (
                        <tr key={rowKey} className={`border-b border-border ${idx % 2 === 0 ? '' : 'bg-muted/5'}`}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={item?.itemName || ''}
                                onChange={e => updateMaterialRow(rowKey, 'itemName', e?.target?.value)}
                                placeholder="Material name"
                                className="w-full bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 py-0.5 text-sm"
                              />
                              {item?.libraryId && (
                                <span title="Sourced from Material Library" className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                                  <Icon name="BookOpen" size={9} className="text-primary" />
                                </span>
                              )}
                            </div>
                            {linkedLabourCount > 0 && (
                              <p className="text-xs text-primary/70 mt-0.5 pl-1">
                                {linkedLabourCount} linked labour row{linkedLabourCount > 1 ? 's' : ''}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item?.supplier || ''}
                              onChange={e => updateMaterialRow(rowKey, 'supplier', e?.target?.value)}
                              placeholder="Supplier"
                              className="w-full bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 py-0.5 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item?.unit || ''}
                              onChange={e => updateMaterialRow(rowKey, 'unit', e?.target?.value)}
                              className="w-full bg-input border border-border rounded text-foreground text-xs px-1 py-1 focus:outline-none focus:ring-1 focus:ring-primary/50"
                            >
                              <option value="">—</option>
                              {UNIT_OPTIONS?.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item?.quantity || ''}
                              onChange={e => updateMaterialRow(rowKey, 'quantity', e?.target?.value)}
                              placeholder="0"
                              min="0"
                              step="0.01"
                              className="w-full bg-transparent border-0 text-right text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 py-0.5 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item?.unitCost || ''}
                              onChange={e => updateMaterialRow(rowKey, 'unitCost', e?.target?.value)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="w-full bg-transparent border-0 text-right text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 py-0.5 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item?.wastePercent || ''}
                              onChange={e => updateMaterialRow(rowKey, 'wastePercent', e?.target?.value)}
                              placeholder="5"
                              min="0"
                              max="100"
                              step="0.5"
                              className="w-full bg-transparent border-0 text-right text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 py-0.5 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="text-sm font-medium text-foreground">${calcMaterialTotal(item)}</span>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item?.notes || ''}
                              onChange={e => updateMaterialRow(rowKey, 'notes', e?.target?.value)}
                              placeholder="Notes..."
                              className="w-full bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 py-0.5 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <button
                              onClick={() => removeMaterialRow(item)}
                              title="Delete material and linked labour rows"
                              className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth"
                            >
                              <Icon name="X" size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/20 border-t border-border">
                      <td colSpan={6} className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                        Total ({materialItems?.length} items):
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-bold text-foreground">
                        ${materialItems?.reduce((sum, item) => sum + parseFloat(calcMaterialTotal(item)), 0)?.toFixed(2)}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Labour Tab */}
        {activeTab === 'labour' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-heading font-semibold text-foreground">Labour Line Items</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Linked rows are auto-created per material. Add standalone rows manually.
                </p>
              </div>
              <Button variant="outline" iconName="Plus" iconPosition="left" onClick={addLabourRow} size="sm">
                Add Standalone Labour
              </Button>
            </div>

            {loadingItems ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : labourItems?.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <Icon name="Users" size={32} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">No labour items yet</p>
                <p className="text-xs text-muted-foreground mb-3">Labour rows are auto-created when you add materials, or add standalone rows manually</p>
                <Button variant="outline" iconName="Plus" iconPosition="left" onClick={addLabourRow} size="sm">
                  Add Standalone Labour
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-3 py-2.5 font-caption font-medium text-muted-foreground w-32">Linked Material</th>
                      <th className="text-left px-3 py-2.5 font-caption font-medium text-muted-foreground min-w-[180px]">Role / Description</th>
                      <th className="text-right px-3 py-2.5 font-caption font-medium text-muted-foreground w-24">Hours</th>
                      <th className="text-right px-3 py-2.5 font-caption font-medium text-muted-foreground w-28">Rate ($/hr)</th>
                      <th className="text-right px-3 py-2.5 font-caption font-medium text-muted-foreground w-28">Total ($)</th>
                      <th className="text-left px-3 py-2.5 font-caption font-medium text-muted-foreground min-w-[140px]">Notes</th>
                      <th className="w-10 px-2 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {labourItems?.map((item, idx) => {
                      const rowKey = item?._localId || item?.id;
                      const linkedMatName = getMaterialName(item?.materialId);
                      // isLinked: labour is linked if materialId is set (works for both new rows with _localId and saved rows with DB UUID)
                      const isLinked = item?.materialId != null && item?.materialId !== '';
                      return (
                        <tr key={rowKey} className={`border-b border-border ${isLinked ? 'bg-primary/3' : (idx % 2 === 0 ? '' : 'bg-muted/5')}`}>
                          <td className="px-3 py-2">
                            {isLinked ? (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                <span className="text-xs text-primary font-medium truncate max-w-[100px]" title={linkedMatName || 'Linked material'}>
                                  {linkedMatName || '—'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Standalone</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item?.role || ''}
                              onChange={e => updateLabourRow(rowKey, 'role', e?.target?.value)}
                              placeholder="e.g. Site Supervisor"
                              className="w-full bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 py-0.5 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item?.hours || ''}
                              onChange={e => updateLabourRow(rowKey, 'hours', e?.target?.value)}
                              placeholder="0"
                              min="0"
                              step="0.5"
                              className="w-full bg-transparent border-0 text-right text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 py-0.5 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item?.rate || ''}
                              onChange={e => updateLabourRow(rowKey, 'rate', e?.target?.value)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="w-full bg-transparent border-0 text-right text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 py-0.5 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="text-sm font-medium text-foreground">${calcLabourTotal(item)}</span>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item?.notes || ''}
                              onChange={e => updateLabourRow(rowKey, 'notes', e?.target?.value)}
                              placeholder="Notes..."
                              className="w-full bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 py-0.5 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            {isLinked ? (
                              <span title="Delete the linked material to remove this row" className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground/40 cursor-not-allowed">
                                <Icon name="Lock" size={12} />
                              </span>
                            ) : (
                              <button
                                onClick={() => removeLabourRow(item)}
                                className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth"
                              >
                                <Icon name="X" size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/20 border-t border-border">
                      <td colSpan={4} className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                        Total ({labourItems?.length} roles):
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-bold text-foreground">
                        ${labourItems?.reduce((sum, item) => sum + parseFloat(calcLabourTotal(item)), 0)?.toFixed(2)}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Linked to material (auto-created, deleted with material)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground italic">Standalone</span>
                <span>— manually added, independent</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Material Library Search Modal */}
      <MaterialLibrarySearchModal
        isOpen={libraryModalOpen}
        onClose={handleLibraryModalClose}
        onSelect={handleLibrarySelect}
      />
    </div>
  );
};

export default MaterialLabourTemplateBuilder;
