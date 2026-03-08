import React, { useState } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumb from '../../components/ui/Breadcrumb';
import SystemsConfigTabs from '../../components/ui/SystemsConfigTabs';
import RoleBasedAccess from '../../components/ui/RoleBasedAccess';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import TemplateCard from './components/TemplateCard';
import TemplateEditor from './components/TemplateEditor';
import VersionHistory from './components/VersionHistory';
import BulkOperationsPanel from './components/BulkOperationsPanel';
import ComponentLibrary from './components/ComponentLibrary';

const ProposalTemplateManagementStudio = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('modified');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [previewMode, setPreviewMode] = useState('online');

  const templates = [
    {
      id: 1,
      name: 'Standard Business Proposal',
      version: '3.2',
      category: 'Standard',
      status: 'active',
      lastModified: '2026-01-27T10:30:00',
      lastModifiedBy: 'Sarah Johnson',
      usageCount: 156,
      content: '<h1>Business Proposal</h1>\n<p>Dear {{client_name}},</p>\n<p>We are pleased to present this comprehensive proposal for {{project_title}}.</p>',
    },
    {
      id: 2,
      name: 'Technical Implementation Proposal',
      version: '2.8',
      category: 'Technical',
      status: 'active',
      lastModified: '2026-01-26T14:20:00',
      lastModifiedBy: 'Michael Chen',
      usageCount: 89,
      content: '<h1>Technical Proposal</h1>\n<p>Technical specifications and implementation details.</p>',
    },
    {
      id: 3,
      name: 'Financial Services Agreement',
      version: '4.1',
      category: 'Financial',
      status: 'active',
      lastModified: '2026-01-25T09:15:00',
      lastModifiedBy: 'David Martinez',
      usageCount: 234,
      content: '<h1>Financial Agreement</h1>\n<p>Financial terms and conditions.</p>',
    },
    {
      id: 4,
      name: 'Marketing Campaign Proposal',
      version: '1.5',
      category: 'Marketing',
      status: 'draft',
      lastModified: '2026-01-24T16:45:00',
      lastModifiedBy: 'Emily Rodriguez',
      usageCount: 45,
      content: '<h1>Marketing Proposal</h1>\n<p>Campaign strategy and execution plan.</p>',
    },
    {
      id: 5,
      name: 'Legal Consulting Agreement',
      version: '5.0',
      category: 'Legal',
      status: 'active',
      lastModified: '2026-01-23T11:30:00',
      lastModifiedBy: 'Robert Taylor',
      usageCount: 178,
      content: '<h1>Legal Agreement</h1>\n<p>Legal terms and consulting services.</p>',
    },
    {
      id: 6,
      name: 'IT Infrastructure Proposal',
      version: '2.3',
      category: 'Technical',
      status: 'active',
      lastModified: '2026-01-22T13:00:00',
      lastModifiedBy: 'Jennifer Lee',
      usageCount: 67,
      content: '<h1>IT Infrastructure</h1>\n<p>Infrastructure setup and maintenance.</p>',
    },
    {
      id: 7,
      name: 'Consulting Services Template',
      version: '3.7',
      category: 'Standard',
      status: 'archived',
      lastModified: '2026-01-20T08:45:00',
      lastModifiedBy: 'William Brown',
      usageCount: 312,
      content: '<h1>Consulting Services</h1>\n<p>Professional consulting engagement.</p>',
    },
    {
      id: 8,
      name: 'Product Development Proposal',
      version: '1.2',
      category: 'Technical',
      status: 'draft',
      lastModified: '2026-01-19T15:20:00',
      lastModifiedBy: 'Amanda Wilson',
      usageCount: 23,
      content: '<h1>Product Development</h1>\n<p>Development roadmap and milestones.</p>',
    },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'Standard', label: 'Standard' },
    { value: 'Technical', label: 'Technical' },
    { value: 'Financial', label: 'Financial' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Legal', label: 'Legal' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' },
  ];

  const sortOptions = [
    { value: 'modified', label: 'Last Modified' },
    { value: 'name', label: 'Name' },
    { value: 'usage', label: 'Usage Count' },
    { value: 'version', label: 'Version' },
  ];

  const filteredTemplates = templates?.filter(template => {
      const matchesSearch = template?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template?.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || template?.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })?.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a?.name?.localeCompare(b?.name);
        case 'usage':
          return b?.usageCount - a?.usageCount;
        case 'version':
          return parseFloat(b?.version) - parseFloat(a?.version);
        case 'modified':
        default:
          return new Date(b.lastModified) - new Date(a.lastModified);
      }
    });

  const handleTemplateSelect = (id, checked) => {
    setSelectedTemplates(prev =>
      checked ? [...prev, id] : prev?.filter(templateId => templateId !== id)
    );
  };

  const handleSelectAll = () => {
    if (selectedTemplates?.length === filteredTemplates?.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(filteredTemplates?.map(t => t?.id));
    }
  };

  const handleEdit = (template) => {
    setActiveTemplate(template);
    setShowEditor(true);
  };

  const handleDuplicate = (template) => {
    alert(`Duplicating template: ${template?.name}`);
  };

  const handleArchive = (template) => {
    if (window.confirm(`Archive template "${template?.name}"?`)) {
      alert(`Template "${template?.name}" archived successfully`);
    }
  };

  const handlePreview = (template) => {
    setActiveTemplate(template);
    setShowEditor(true);
  };

  const handleSaveTemplate = (updatedTemplate) => {
    alert(`Template "${updatedTemplate?.name}" saved successfully`);
    setShowEditor(false);
    setActiveTemplate(null);
  };

  const handleBulkAction = (action) => {
    alert(`Applying ${action} to ${selectedTemplates?.length} templates`);
    setSelectedTemplates([]);
  };

  const handleVersionRestore = (version) => {
    alert(`Restoring version ${version?.version}`);
    setShowVersionHistory(false);
  };

  const handleInsertComponent = (content) => {
    alert('Component inserted into editor');
    setShowComponentLibrary(false);
  };

  const stats = [
    { label: 'Total Templates', value: templates?.length, icon: 'FileText', color: 'text-primary' },
    { label: 'Active', value: templates?.filter(t => t?.status === 'active')?.length, icon: 'CheckCircle', color: 'text-success' },
    { label: 'Drafts', value: templates?.filter(t => t?.status === 'draft')?.length, icon: 'Edit', color: 'text-warning' },
    { label: 'Total Usage', value: templates?.reduce((sum, t) => sum + t?.usageCount, 0), icon: 'TrendingUp', color: 'text-accent' },
  ];

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
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-8">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    iconName="Package"
                    iconPosition="left"
                    onClick={() => setShowComponentLibrary(true)}
                  >
                    Components
                  </Button>
                  <Button
                    variant="default"
                    iconName="Plus"
                    iconPosition="left"
                    onClick={() => {
                      setActiveTemplate(null);
                      setShowEditor(true);
                    }}
                  >
                    New Template
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                {stats?.map((stat) => (
                  <div
                    key={stat?.label}
                    className="bg-card border border-border rounded-lg p-4 md:p-5 lg:p-6 transition-smooth hover:shadow-brand"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center ${stat?.color}`}>
                        <Icon name={stat?.icon} size={20} />
                      </div>
                    </div>
                    <p className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-1">
                      {stat?.value}
                    </p>
                    <p className="text-sm text-muted-foreground font-caption">{stat?.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-xl shadow-brand mb-6">
                <div className="p-4 md:p-5 lg:p-6 border-b border-border">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        type="search"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e?.target?.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-auto">
                      <Select
                        options={categoryOptions}
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        placeholder="Category"
                      />
                      <Select
                        options={statusOptions}
                        value={selectedStatus}
                        onChange={setSelectedStatus}
                        placeholder="Status"
                      />
                      <Select
                        options={sortOptions}
                        value={sortBy}
                        onChange={setSortBy}
                        placeholder="Sort by"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-5 lg:p-6 border-b border-border">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTemplates?.length === filteredTemplates?.length && filteredTemplates?.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 transition-smooth"
                        aria-label="Select all templates"
                      />
                      <span className="text-sm font-caption text-muted-foreground">
                        {selectedTemplates?.length > 0
                          ? `${selectedTemplates?.length} selected`
                          : `${filteredTemplates?.length} templates`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-smooth ${
                          viewMode === 'grid' ?'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                        aria-label="Grid view"
                      >
                        <Icon name="Grid" size={18} />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-smooth ${
                          viewMode === 'list' ?'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                        aria-label="List view"
                      >
                        <Icon name="List" size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-5 lg:p-6">
                  {filteredTemplates?.length > 0 ? (
                    <div className={`grid gap-4 md:gap-5 lg:gap-6 ${
                      viewMode === 'grid' ?'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :'grid-cols-1'
                    }`}>
                      {filteredTemplates?.map((template) => (
                        <TemplateCard
                          key={template?.id}
                          template={template}
                          onEdit={handleEdit}
                          onDuplicate={handleDuplicate}
                          onArchive={handleArchive}
                          onPreview={handlePreview}
                          isSelected={selectedTemplates?.includes(template?.id)}
                          onSelect={handleTemplateSelect}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 md:py-16">
                      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                        <Icon name="Search" size={32} className="text-muted-foreground" />
                      </div>
                      <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-2">
                        No templates found
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground font-caption mb-6">
                        Try adjusting your filters or create a new template
                      </p>
                      <Button
                        variant="default"
                        iconName="Plus"
                        iconPosition="left"
                        onClick={() => {
                          setActiveTemplate(null);
                          setShowEditor(true);
                        }}
                      >
                        Create Template
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {showEditor && (
          <div className="fixed inset-0 bg-background z-50 overflow-hidden">
            <TemplateEditor
              template={activeTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setShowEditor(false);
                setActiveTemplate(null);
              }}
              onPreviewToggle={() => setPreviewMode(prev => prev === 'online' ? 'pdf' : 'online')}
              previewMode={previewMode}
            />
            <div className="absolute bottom-6 right-6 flex gap-2">
              <Button
                variant="outline"
                iconName="History"
                onClick={() => setShowVersionHistory(true)}
                aria-label="Version history"
              />
              <Button
                variant="outline"
                iconName="Package"
                onClick={() => setShowComponentLibrary(true)}
                aria-label="Component library"
              />
            </div>
          </div>
        )}

        {showVersionHistory && activeTemplate && (
          <VersionHistory
            template={activeTemplate}
            onRestore={handleVersionRestore}
            onClose={() => setShowVersionHistory(false)}
          />
        )}

        {showComponentLibrary && (
          <ComponentLibrary
            onInsert={handleInsertComponent}
            onClose={() => setShowComponentLibrary(false)}
          />
        )}

        <BulkOperationsPanel
          selectedCount={selectedTemplates?.length}
          onClearSelection={() => setSelectedTemplates([])}
          onBulkAction={handleBulkAction}
        />
      </div>
    </RoleBasedAccess>
  );
};

export default ProposalTemplateManagementStudio;