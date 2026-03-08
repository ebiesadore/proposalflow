import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumb from '../../components/ui/Breadcrumb';
import RoleBasedAccess from '../../components/ui/RoleBasedAccess';
import IntegrationStatus from '../../components/ui/IntegrationStatus';
import DocumentQueueCard from './components/DocumentQueueCard';
import GenerationControlPanel from './components/GenerationControlPanel';
import DocumentPreviewModal from './components/DocumentPreviewModal';
import BulkOperationsBar from './components/BulkOperationsBar';
import ExportAnalytics from './components/ExportAnalytics';
import KeyboardShortcutsPanel from './components/KeyboardShortcutsPanel';

const PDFGenerationAndDocumentExportHub = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [documents, setDocuments] = useState([
    {
      id: 'doc-001',
      proposalTitle: 'Enterprise Cloud Migration Proposal',
      clientName: 'TechCorp Industries',
      templateVersion: '2.4',
      status: 'completed',
      fileSize: 2457600,
      generatedAt: '2026-01-27T10:15:00',
      downloadCount: 12,
      totalPages: 24
    },
    {
      id: 'doc-002',
      proposalTitle: 'Digital Transformation Strategy',
      clientName: 'Global Finance Group',
      templateVersion: '3.1',
      status: 'processing',
      progress: 67,
      fileSize: 0,
      generatedAt: '2026-01-27T13:30:00',
      downloadCount: 0,
      totalPages: 18
    },
    {
      id: 'doc-003',
      proposalTitle: 'Cybersecurity Assessment Report',
      clientName: 'Healthcare Solutions Inc',
      templateVersion: '1.8',
      status: 'completed',
      fileSize: 3145728,
      generatedAt: '2026-01-27T09:45:00',
      downloadCount: 8,
      totalPages: 32
    },
    {
      id: 'doc-004',
      proposalTitle: 'AI Implementation Roadmap',
      clientName: 'Retail Innovations LLC',
      templateVersion: '2.0',
      status: 'failed',
      fileSize: 0,
      generatedAt: '2026-01-27T11:20:00',
      downloadCount: 0,
      totalPages: 0
    },
    {
      id: 'doc-005',
      proposalTitle: 'Infrastructure Modernization Plan',
      clientName: 'Manufacturing Dynamics',
      templateVersion: '2.7',
      status: 'queued',
      fileSize: 0,
      generatedAt: '2026-01-27T13:35:00',
      downloadCount: 0,
      totalPages: 28
    },
    {
      id: 'doc-006',
      proposalTitle: 'Data Analytics Platform Proposal',
      clientName: 'Education Systems Corp',
      templateVersion: '1.5',
      status: 'completed',
      fileSize: 1835008,
      generatedAt: '2026-01-26T16:30:00',
      downloadCount: 15,
      totalPages: 20
    },
    {
      id: 'doc-007',
      proposalTitle: 'Mobile App Development Proposal',
      clientName: 'Logistics Partners Inc',
      templateVersion: '3.2',
      status: 'processing',
      progress: 34,
      fileSize: 0,
      generatedAt: '2026-01-27T13:25:00',
      downloadCount: 0,
      totalPages: 16
    },
    {
      id: 'doc-008',
      proposalTitle: 'Business Intelligence Solution',
      clientName: 'Energy Resources Ltd',
      templateVersion: '2.1',
      status: 'completed',
      fileSize: 2621440,
      generatedAt: '2026-01-27T08:00:00',
      downloadCount: 22,
      totalPages: 26
    }
  ]);

  const statusOptions = [
    { value: 'all', label: 'All Documents' },
    { value: 'completed', label: 'Completed' },
    { value: 'processing', label: 'Processing' },
    { value: 'queued', label: 'Queued' },
    { value: 'failed', label: 'Failed' }
  ];

  const analytics = {
    totalGenerated: '1,247',
    totalDownloads: '3,892',
    avgFileSize: '2.4 MB',
    avgProcessingTime: '38s'
  };

  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = doc?.proposalTitle?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                         doc?.clientName?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    const matchesStatus = filterStatus === 'all' || doc?.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDocumentSelect = (id, isSelected) => {
    setSelectedDocuments(prev => 
      isSelected ? [...prev, id] : prev?.filter(docId => docId !== id)
    );
  };

  const handleSelectAll = () => {
    setSelectedDocuments(filteredDocuments?.map(doc => doc?.id));
  };

  const handleDeselectAll = () => {
    setSelectedDocuments([]);
  };

  const handleDownload = (id) => {
    console.log('Downloading document:', id);
  };

  const handlePreview = (id) => {
    const doc = documents?.find(d => d?.id === id);
    setPreviewDocument(doc);
  };

  const handleRegenerate = (id) => {
    setDocuments(prev => prev?.map(doc => 
      doc?.id === id ? { ...doc, status: 'queued' } : doc
    ));
  };

  const handleGenerate = (options) => {
    console.log('Generating PDFs with options:', options);
    console.log('Selected documents:', selectedDocuments);
  };

  const handleBulkDownload = () => {
    console.log('Bulk downloading:', selectedDocuments);
  };

  const handleBulkEmail = () => {
    console.log('Bulk emailing:', selectedDocuments);
  };

  const handleBulkArchive = () => {
    console.log('Bulk archiving:', selectedDocuments);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedDocuments?.length} document(s)?`)) {
      setDocuments(prev => prev?.filter(doc => !selectedDocuments?.includes(doc?.id)));
      setSelectedDocuments([]);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e?.ctrlKey || e?.metaKey) {
        switch(e?.key?.toLowerCase()) {
          case 'a':
            e?.preventDefault();
            handleSelectAll();
            break;
          case 'd':
            e?.preventDefault();
            handleDeselectAll();
            break;
          case 'g':
            e?.preventDefault();
            if (selectedDocuments?.length > 0) {
              handleGenerate({});
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedDocuments]);

  return (
    <RoleBasedAccess requiredPermission="user">
      <Helmet>
        <title>PDF Generation Hub - NeXSYS CORE™</title>
        <meta name="description" content="Generate, manage, and export proposal documents with advanced PDF generation capabilities" />
      </Helmet>
      <div className="min-h-screen bg-background flex">
        <Sidebar 
          collapsed={isSidebarCollapsed} 
          onToggleCollapse={setIsSidebarCollapsed}
        />

        <main className="flex-1 ml-[68px] transition-smooth">
          <div className="sticky top-0 z-40 bg-card border-b border-border">
            <div className="px-4 md:px-6 lg:px-8 py-4 md:py-5 lg:py-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                    PDF Generation Hub
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Generate, manage, and export proposal documents
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <IntegrationStatus compact />
                  <Button
                    variant="default"
                    iconName="Plus"
                    iconPosition="left"
                  >
                    New Generation
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <Breadcrumb />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-card border border-border rounded-lg p-4 md:p-5 lg:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1">
                      <Input
                        type="search"
                        placeholder="Search proposals or clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e?.target?.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      iconName="Search"
                    />
                  </div>

                  <Select
                    label="Filter by Status"
                    options={statusOptions}
                    value={filterStatus}
                    onChange={setFilterStatus}
                  />
                </div>

                <BulkOperationsBar
                  selectedCount={selectedDocuments?.length}
                  totalCount={filteredDocuments?.length}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onBulkDownload={handleBulkDownload}
                  onBulkEmail={handleBulkEmail}
                  onBulkArchive={handleBulkArchive}
                  onBulkDelete={handleBulkDelete}
                />

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {filteredDocuments?.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                        <Icon name="FileText" size={32} className="text-muted-foreground" />
                      </div>
                      <p className="text-base font-heading font-semibold text-foreground mb-2">
                        No documents found
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  ) : (
                    filteredDocuments?.map(doc => (
                      <DocumentQueueCard
                        key={doc?.id}
                        document={doc}
                        isSelected={selectedDocuments?.includes(doc?.id)}
                        onSelect={handleDocumentSelect}
                        onDownload={handleDownload}
                        onPreview={handlePreview}
                        onRegenerate={handleRegenerate}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <GenerationControlPanel
                  selectedCount={selectedDocuments?.length}
                  onGenerate={handleGenerate}
                  onClearSelection={handleDeselectAll}
                />

                <ExportAnalytics analytics={analytics} />

                <KeyboardShortcutsPanel />

                <div className="bg-card border border-border rounded-lg p-4 md:p-5 lg:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                      <Icon name="AlertTriangle" size={20} className="text-warning" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-heading font-semibold text-foreground">
                        Quality Control Notice
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        All generated documents undergo automatic validation
                      </p>
                    </div>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-13">
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={16} className="text-success mt-0.5 flex-shrink-0" />
                      <span>Format compliance verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={16} className="text-success mt-0.5 flex-shrink-0" />
                      <span>Branding element validation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={16} className="text-success mt-0.5 flex-shrink-0" />
                      <span>Content completeness check</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle" size={16} className="text-success mt-0.5 flex-shrink-0" />
                      <span>Security protocol enforcement</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
          onDownload={handleDownload}
        />
      )}
    </RoleBasedAccess>
  );
};

export default PDFGenerationAndDocumentExportHub;