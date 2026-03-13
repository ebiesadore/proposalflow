import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumb from '../../components/ui/Breadcrumb';
import SystemsConfigTabs from '../../components/ui/SystemsConfigTabs';
import RoleBasedAccess from '../../components/ui/RoleBasedAccess';
import Icon from '../../components/AppIcon';
import MaterialLabourTemplateList from './components/MaterialLabourTemplateList';
import MaterialLabourTemplateBuilder from './components/MaterialLabourTemplateBuilder';
import ContentLibraryTab from './components/ContentLibraryTab';
import ExportTemplatesTab from './components/ExportTemplatesTab';
import BulkOperationsPanel from './components/BulkOperationsPanel';
import { getExportTemplates, deleteExportTemplate } from '../../services/templateService';

// ---- Studio Tabs ----
const STUDIO_TABS = [
  { id: 'proposal', label: 'Proposal Templates', icon: 'FileText' },
  { id: 'content-library', label: 'Content Library', icon: 'BookOpen' },
  { id: 'material-labour', label: 'Material & Labour Templates', icon: 'Layers' },
  { id: 'export', label: 'Export Templates', icon: 'Download' },
];

const ProposalTemplateManagementStudio = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [studioTab, setStudioTab] = useState('proposal');

  // ---- Export Templates (Proposal Templates tab) — from Supabase ----
  const [exportTemplates, setExportTemplates] = useState([]);
  const [exportTemplatesLoading, setExportTemplatesLoading] = useState(false);
  const [exportTemplatesError, setExportTemplatesError] = useState(null);
  const [exportTemplateSearch, setExportTemplateSearch] = useState('');

  // ---- Delete confirmation state ----
  const [deleteTarget, setDeleteTarget] = useState(null); // template to delete
  const [isDeleting, setIsDeleting] = useState(false);

  // ---- Copy state ----
  const [copyingId, setCopyingId] = useState(null);

  // ---- Material & Labour Templates state ----
  const [mlView, setMlView] = useState('list');
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Load export templates when Proposal Templates tab is active
  useEffect(() => {
    if (studioTab !== 'proposal') return;
    const load = async () => {
      setExportTemplatesLoading(true);
      setExportTemplatesError(null);
      try {
        const data = await getExportTemplates();
        setExportTemplates(data || []);
      } catch (err) {
        setExportTemplatesError(err?.message || 'Failed to load export templates');
      } finally {
        setExportTemplatesLoading(false);
      }
    };
    load();
  }, [studioTab]);

  // ---- Edit handler — navigate to Export Designer with template data ----
  const handleEditTemplate = (tmpl) => {
    navigate('/proposal-export-template-designer', { state: { editTemplate: tmpl } });
  };

  // ---- Delete handlers ----
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteExportTemplate(deleteTarget?.id);
      setExportTemplates(prev => prev?.filter(t => t?.id !== deleteTarget?.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete template error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // ---- Copy handler ----
  const handleCopyTemplate = async (tmpl) => {
    setCopyingId(tmpl?.id);
    try {
      const { data, error } = await import('../../lib/supabase')?.then(m => {
        return m?.supabase
          ?.from('export_templates')
          ?.insert({
            name: `${tmpl?.name} Copy`,
            template_type: tmpl?.templateType || 'pdf',
            layout_config: tmpl?.layoutConfig || {},
            cover_page_settings: tmpl?.coverPageSettings || {},
            header_settings: tmpl?.headerSettings || {},
            footer_settings: tmpl?.footerSettings || {},
            is_default: false,
            is_active: true,
            created_by: tmpl?.createdBy || null,
          })
          ?.select()
          ?.single();
      });
      if (error) throw error;
      // Map the new record and prepend to list
      const newTmpl = {
        id: data?.id,
        name: data?.name,
        templateType: data?.template_type,
        layoutConfig: data?.layout_config,
        coverPageSettings: data?.cover_page_settings,
        headerSettings: data?.header_settings,
        footerSettings: data?.footer_settings,
        isDefault: data?.is_default,
        isActive: data?.is_active,
        createdBy: data?.created_by,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at,
      };
      setExportTemplates(prev => [newTmpl, ...prev]);
    } catch (err) {
      console.error('Copy template error:', err);
    } finally {
      setCopyingId(null);
    }
  };

  // ---- Material & Labour handlers ----
  const handleMlCreateNew = () => {
    setEditingTemplate(null);
    setMlView('builder');
  };

  const handleMlEdit = (template) => {
    setEditingTemplate(template);
    setMlView('builder');
  };

  const handleMlSave = () => {
    setMlView('list');
    setEditingTemplate(null);
  };

  const handleMlCancel = () => {
    setMlView('list');
    setEditingTemplate(null);
  };

  return (
    <RoleBasedAccess requiredPermission="admin">
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsed={isSidebarCollapsed} onToggleCollapse={setIsSidebarCollapsed} />

        <main className="flex-1 ml-[68px] transition-smooth">
          <div className="sticky top-0 z-40 bg-card border-b border-border">
            <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                    Template Management Studio
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Create, edit, and manage proposal templates with version control
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <Icon name="User" size={20} color="#FFFFFF" />
                  </div>
                </div>
              </div>
            </div>

            <SystemsConfigTabs />
          </div>

          <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <Breadcrumb />
            <div className="max-w-[1600px] mx-auto">

              {/* Studio Section Tabs */}
              <div className="flex justify-center mt-6 mb-8">
                <div className="flex gap-1 bg-muted/30 p-1.5 rounded-xl border border-border">
                  {STUDIO_TABS?.map(tab => (
                    <button
                      key={tab?.id}
                      onClick={() => {
                        setStudioTab(tab?.id);
                        if (tab?.id === 'material-labour') setMlView('list');
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                        studioTab === tab?.id
                          ? 'bg-card text-foreground shadow-sm border border-border'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon name={tab?.icon} size={15} />
                      {tab?.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ===== PROPOSAL TEMPLATES TAB ===== */}
              {studioTab === 'proposal' && (
                <div className="bg-card border border-border rounded-xl shadow-brand">
                  <div className="p-4 md:p-5 lg:p-6 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-heading font-semibold text-foreground flex items-center gap-2">
                        <Icon name="Download" size={16} className="text-primary" />
                        Saved Export Templates
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Templates created in the Export Template Designer
                      </p>
                    </div>
                    {exportTemplatesLoading && (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  <div className="p-4 md:p-5 lg:p-6">
                    {/* Search bar */}
                    <div className="relative mb-5">
                      <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search templates by name…"
                        value={exportTemplateSearch}
                        onChange={e => setExportTemplateSearch(e?.target?.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                      {exportTemplateSearch && (
                        <button
                          onClick={() => setExportTemplateSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      )}
                    </div>

                    {exportTemplatesError && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                        <Icon name="AlertCircle" size={14} className="text-destructive" />
                        <p className="text-sm text-destructive">{exportTemplatesError}</p>
                      </div>
                    )}

                    {!exportTemplatesLoading && exportTemplates?.length === 0 && !exportTemplatesError && (
                      <div className="text-center py-10">
                        <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
                          <Icon name="FileOutput" size={20} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">No export templates yet</p>
                        <p className="text-xs text-muted-foreground">
                          Create templates in the Export Template Designer — they'll appear here automatically.
                        </p>
                      </div>
                    )}

                    {exportTemplates?.length > 0 && (() => {
                      const filtered = exportTemplates?.filter(tmpl =>
                        tmpl?.name?.toLowerCase()?.includes(exportTemplateSearch?.toLowerCase())
                      );
                      if (filtered?.length === 0) {
                        return (
                          <div className="text-center py-10">
                            <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
                              <Icon name="SearchX" size={20} className="text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground mb-1">No templates found</p>
                            <p className="text-xs text-muted-foreground">
                              No templates match "<span className="font-medium">{exportTemplateSearch}</span>". Try a different name.
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filtered?.map(tmpl => {
                            const pageCount = tmpl?.layoutConfig?.pages?.length || 1;
                            const lastMod = tmpl?.updatedAt
                              ? new Date(tmpl?.updatedAt)?.toLocaleDateString()
                              : tmpl?.createdAt
                              ? new Date(tmpl?.createdAt)?.toLocaleDateString()
                              : '—';
                            const isCopying = copyingId === tmpl?.id;
                            return (
                              <div key={tmpl?.id} className="border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-brand transition-all group">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Icon name="FileOutput" size={16} className="text-primary" />
                                  </div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${
                                    tmpl?.templateType === 'pdf' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                                  }`}>
                                    {tmpl?.templateType || 'pdf'}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-foreground mb-1 truncate">{tmpl?.name}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                  <span className="flex items-center gap-1">
                                    <Icon name="FileText" size={10} />
                                    {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Icon name="Clock" size={10} />
                                    {lastMod}
                                  </span>
                                </div>
                                {/* Action buttons */}
                                <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                                  <button
                                    onClick={() => handleEditTemplate(tmpl)}
                                    title="Edit template"
                                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                  >
                                    <Icon name="Pencil" size={12} />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleCopyTemplate(tmpl)}
                                    disabled={isCopying}
                                    title="Copy template"
                                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isCopying ? (
                                      <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />Copying…</>
                                    ) : (
                                      <><Icon name="Copy" size={12} />Copy</>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(tmpl)}
                                    title="Delete template"
                                    className="flex items-center justify-center px-2 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                  >
                                    <Icon name="Trash2" size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ===== CONTENT LIBRARY TAB ===== */}
              {studioTab === 'content-library' && (
                <ContentLibraryTab />
              )}

              {/* ===== MATERIAL & LABOUR TEMPLATES TAB ===== */}
              {studioTab === 'material-labour' && (
                <>
                  {mlView === 'list' && (
                    <MaterialLabourTemplateList
                      onCreateNew={handleMlCreateNew}
                      onEdit={handleMlEdit}
                    />
                  )}
                  {mlView === 'builder' && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ minHeight: '70vh' }}>
                      <MaterialLabourTemplateBuilder
                        template={editingTemplate}
                        onSave={handleMlSave}
                        onCancel={handleMlCancel}
                      />
                    </div>
                  )}
                </>
              )}

              {/* ===== EXPORT TEMPLATES TAB ===== */}
              {studioTab === 'export' && (
                <ExportTemplatesTab />
              )}

            </div>
          </div>
        </main>

        <BulkOperationsPanel
          selectedCount={0}
          onClearSelection={() => {}}
          onBulkAction={() => {}}
        />

        {/* ===== DELETE CONFIRMATION MODAL ===== */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <Icon name="Trash2" size={18} className="text-destructive" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-semibold text-foreground">Delete Template</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>? This template will be permanently removed from Supabase.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Deleting…</>
                  ) : (
                    <><Icon name="Trash2" size={14} />Delete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleBasedAccess>
  );
};

export default ProposalTemplateManagementStudio;