import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import {
  getTemplates,
  deleteTemplate,
  duplicateTemplate,
  updateTemplate,
} from '../../../services/templateService';

const TYPE_LABELS = {
  material: 'Material',
  labour: 'Labour',
  combined: 'Combined',
};

const TYPE_COLORS = {
  material: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  labour: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  combined: 'bg-accent/10 text-accent border border-accent/20',
};

const STATUS_COLORS = {
  true: 'bg-success/10 text-success border border-success/20',
  false: 'bg-muted text-muted-foreground border border-border',
};

const MaterialLabourTemplateList = ({ onCreateNew, onEdit }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTemplates();
      setTemplates(data || []);
    } catch (err) {
      setError('Failed to load templates. Please try again.');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = async (template) => {
    if (!window.confirm(`Delete template "${template?.name}"? This cannot be undone.`)) return;
    try {
      setDeletingId(template?.id);
      await deleteTemplate(template?.id);
      setTemplates(prev => prev?.filter(t => t?.id !== template?.id));
    } catch (err) {
      alert('Failed to delete template. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (template) => {
    try {
      setDuplicatingId(template?.id);
      const newTemplate = await duplicateTemplate(template?.id);
      setTemplates(prev => [newTemplate, ...prev]);
    } catch (err) {
      alert('Failed to duplicate template. Please try again.');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleToggleStatus = async (template) => {
    try {
      setTogglingId(template?.id);
      const updated = await updateTemplate(template?.id, { isActive: !template?.isActive });
      setTemplates(prev => prev?.map(t => t?.id === template?.id ? { ...t, isActive: updated?.isActive } : t));
    } catch (err) {
      alert('Failed to update template status.');
    } finally {
      setTogglingId(null);
    }
  };

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'material', label: 'Material' },
    { value: 'labour', label: 'Labour' },
    { value: 'combined', label: 'Combined' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const filtered = templates?.filter(t => {
    const matchSearch = !searchQuery || t?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) || t?.category?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    const matchType = filterType === 'all' || t?.templateType === filterType;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? t?.isActive : !t?.isActive);
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: templates?.length,
    active: templates?.filter(t => t?.isActive)?.length,
    material: templates?.filter(t => t?.templateType === 'material')?.length,
    labour: templates?.filter(t => t?.templateType === 'labour')?.length,
    combined: templates?.filter(t => t?.templateType === 'combined')?.length,
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr)?.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getItemCount = (template) => {
    const matCount = template?.materialItems?.length || 0;
    const labCount = template?.labourItems?.length || 0;
    return matCount + labCount;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats?.total, icon: 'Layers', color: 'text-primary' },
          { label: 'Active', value: stats?.active, icon: 'CheckCircle', color: 'text-success' },
          { label: 'Material', value: stats?.material, icon: 'Package', color: 'text-blue-400' },
          { label: 'Labour', value: stats?.labour, icon: 'Users', color: 'text-purple-400' },
          { label: 'Combined', value: stats?.combined, icon: 'Combine', color: 'text-accent' },
        ]?.map(stat => (
          <div key={stat?.label} className="bg-card border border-border rounded-lg p-3 md:p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${stat?.color}`}>
              <Icon name={stat?.icon} size={16} />
            </div>
            <div>
              <p className="text-xl font-heading font-bold text-foreground">{stat?.value}</p>
              <p className="text-xs text-muted-foreground">{stat?.label}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search templates by name or category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e?.target?.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select options={typeOptions} value={filterType} onChange={setFilterType} placeholder="Type" />
            <Select options={statusOptions} value={filterStatus} onChange={setFilterStatus} placeholder="Status" />
          </div>
          <Button variant="default" iconName="Plus" iconPosition="left" onClick={onCreateNew}>
            New Template
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <Icon name="AlertCircle" size={16} className="text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={loadTemplates} className="ml-auto text-xs text-destructive underline">Retry</button>
          </div>
        )}

        {/* Table */}
        {filtered?.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Icon name="Layers" size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
              {templates?.length === 0 ? 'No templates yet' : 'No templates match your filters'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {templates?.length === 0
                ? 'Create your first Material & Labour template to get started' :'Try adjusting your search or filters'}
            </p>
            {templates?.length === 0 && (
              <Button variant="default" iconName="Plus" iconPosition="left" onClick={onCreateNew}>
                Create First Template
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-caption font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-caption font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-caption font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-caption font-medium text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 font-caption font-medium text-muted-foreground">Items</th>
                  <th className="text-left px-4 py-3 font-caption font-medium text-muted-foreground">Created</th>
                  <th className="text-right px-4 py-3 font-caption font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((template, idx) => (
                  <tr
                    key={template?.id}
                    className={`border-b border-border transition-smooth hover:bg-muted/20 ${idx % 2 === 0 ? '' : 'bg-muted/5'}`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{template?.name}</p>
                        {template?.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{template?.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">{template?.category || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS?.[template?.templateType] || TYPE_COLORS?.combined}`}>
                        {TYPE_LABELS?.[template?.templateType] || 'Combined'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(template)}
                        disabled={togglingId === template?.id}
                        className="flex items-center gap-1.5 group"
                        title={template?.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {togglingId === template?.id ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <div className={`w-8 h-4 rounded-full transition-all relative ${template?.isActive ? 'bg-success' : 'bg-muted-foreground/30'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${template?.isActive ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        )}
                        <span className={`text-xs font-medium ${template?.isActive ? 'text-success' : 'text-muted-foreground'}`}>
                          {template?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-medium text-foreground">
                        {getItemCount(template)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(template?.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(template)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-smooth"
                          title="Edit template"
                        >
                          <Icon name="Edit2" size={14} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(template)}
                          disabled={duplicatingId === template?.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-smooth disabled:opacity-50"
                          title="Duplicate template"
                        >
                          {duplicatingId === template?.id ? (
                            <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Icon name="Copy" size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(template)}
                          disabled={deletingId === template?.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth disabled:opacity-50"
                          title="Delete template"
                        >
                          {deletingId === template?.id ? (
                            <div className="w-3 h-3 border border-destructive border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Icon name="Trash2" size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered?.length > 0 && (
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
            Showing {filtered?.length} of {templates?.length} templates
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialLabourTemplateList;
