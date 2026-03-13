import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { clientDocumentService } from '../../../services/clientDocumentService';

const DOCUMENT_TYPES = [
  { value: 'all', label: 'All Documents' },
  { value: 'legal', label: 'Legal', icon: 'Scale', color: 'text-red-500' },
  { value: 'financial', label: 'Financial', icon: 'DollarSign', color: 'text-orange-500' },
  { value: 'contractual', label: 'Contractual', icon: 'FileSignature', color: 'text-yellow-500' },
  { value: 'correspondence', label: 'Correspondence', icon: 'Mail', color: 'text-blue-500' },
];

const SENSITIVITY_CONFIG = {
  high: { label: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400', dot: 'bg-red-500' },
  medium: { label: 'Medium', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400', dot: 'bg-orange-500' },
  low: { label: 'Low', color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400', dot: 'bg-green-500' },
};

const FILE_ICON_MAP = {
  'application/pdf': 'FileText',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'FileText',
  'image/jpeg': 'Image',
  'image/png': 'Image',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Table',
};

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024)?.toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024))?.toFixed(1)} MB`;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })?.format(new Date(dateString));
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
const UploadModal = ({ clientId, onClose, onSuccess }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('legal');
  const [sensitivity, setSensitivity] = useState('high');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e?.preventDefault();
    setDragOver(false);
    const file = e?.dataTransfer?.files?.[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleFileSelect = (file) => {
    setError('');
    try {
      clientDocumentService?.validateFile(file);
      setSelectedFile(file);
      if (!documentName) setDocumentName(file?.name?.replace(/\.[^/.]+$/, ''));
    } catch (err) {
      setError(err?.message);
    }
  };

  const handleTypeChange = (type) => {
    setDocumentType(type);
    // Auto-set sensitivity based on type
    if (type === 'legal' || type === 'financial') setSensitivity('high');
    else if (type === 'contractual') setSensitivity('medium');
    else setSensitivity('low');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedFile) { setError('Please select a file'); return; }
    if (!documentName?.trim()) { setError('Please enter a document name'); return; }

    setUploading(true);
    setError('');
    try {
      await clientDocumentService?.uploadDocument({
        clientId,
        file: selectedFile,
        documentName: documentName?.trim(),
        documentType,
        sensitivity,
        expiryDate: expiryDate || null,
      });
      onSuccess();
    } catch (err) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-heading font-semibold text-foreground">Upload Document</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e?.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef?.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.jpg,.jpeg,.png,.xlsx"
              onChange={(e) => e?.target?.files?.[0] && handleFileSelect(e?.target?.files?.[0])}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <Icon name="FileCheck" size={24} className="text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{selectedFile?.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile?.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e?.stopPropagation(); setSelectedFile(null); setDocumentName(''); }}
                  className="ml-2 text-muted-foreground hover:text-destructive"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
            ) : (
              <>
                <Icon name="Upload" size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Drop file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, JPG, PNG, XLSX — max 10MB</p>
              </>
            )}
          </div>

          {/* Document Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Document Name</label>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e?.target?.value)}
              placeholder="e.g. Trade License 2025"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Document Type</label>
            <div className="grid grid-cols-2 gap-2">
              {DOCUMENT_TYPES?.filter(t => t?.value !== 'all')?.map((type) => (
                <button
                  key={type?.value}
                  type="button"
                  onClick={() => handleTypeChange(type?.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    documentType === type?.value
                      ? 'border-primary bg-primary/10 text-primary' :'border-border bg-background text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <Icon name={type?.icon} size={14} className={documentType === type?.value ? 'text-primary' : type?.color} />
                  {type?.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sensitivity */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sensitivity</label>
            <div className="flex gap-2">
              {['high', 'medium', 'low']?.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSensitivity(s)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium capitalize transition-colors ${
                    sensitivity === s
                      ? 'border-primary bg-primary/10 text-primary' :'border-border bg-background text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${SENSITIVITY_CONFIG?.[s]?.dot}`} />
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Expiry Date <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e?.target?.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <Icon name="AlertCircle" size={16} className="text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" variant="default" className="flex-1" disabled={uploading || !selectedFile}>
              {uploading ? (
                <span className="flex items-center gap-2">
                  <Icon name="Loader" size={14} className="animate-spin" />
                  Uploading...
                </span>
              ) : 'Upload Document'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteConfirmModal = ({ document, onConfirm, onCancel, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
          <Icon name="Trash2" size={20} className="text-destructive" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-foreground">Delete Document</h3>
          <p className="text-xs text-muted-foreground">This action cannot be undone</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Are you sure you want to delete <span className="font-medium text-foreground">"{document?.document_name}"</span>? The file will be permanently removed.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={deleting}>Cancel</Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={onConfirm}
          disabled={deleting}
        >
          {deleting ? (
            <span className="flex items-center gap-2">
              <Icon name="Loader" size={14} className="animate-spin" />
              Deleting...
            </span>
          ) : 'Delete'}
        </Button>
      </div>
    </div>
  </div>
);

// ── Main DocumentsTab ─────────────────────────────────────────────────────────
const DocumentsTab = ({ client }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // documentId

  const loadDocuments = useCallback(async () => {
    if (!client?.id) return;
    setLoading(true);
    setError('');
    try {
      const data = await clientDocumentService?.getDocumentsByClientId(client?.id, {
        documentType: activeFilter,
      });
      setDocuments(data);
    } catch (err) {
      setError(err?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [client?.id, activeFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleView = async (doc) => {
    setActionLoading(doc?.id);
    try {
      const url = await clientDocumentService?.getSignedUrl(doc?.file_path, doc?.bucket_name);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err?.message || 'Failed to open document');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (doc) => {
    setActionLoading(`dl-${doc?.id}`);
    try {
      const url = await clientDocumentService?.getSignedUrl(doc?.file_path, doc?.bucket_name);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc?.document_name;
      document.body?.appendChild(a);
      a?.click();
      document.body?.removeChild(a);
    } catch (err) {
      setError(err?.message || 'Failed to download document');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await clientDocumentService?.deleteDocument(deleteTarget?.id);
      setDeleteTarget(null);
      loadDocuments();
    } catch (err) {
      setError(err?.message || 'Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const typeConfig = DOCUMENT_TYPES?.reduce((acc, t) => { acc[t.value] = t; return acc; }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-heading font-semibold text-foreground">Client Documents</h3>
        <Button
          variant="default"
          size="sm"
          iconName="Upload"
          iconPosition="left"
          onClick={() => setShowUploadModal(true)}
        >
          Upload Document
        </Button>
      </div>
      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DOCUMENT_TYPES?.map((type) => (
          <button
            key={type?.value}
            onClick={() => setActiveFilter(type?.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === type?.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            {type?.icon && <Icon name={type?.icon} size={12} />}
            {type?.label}
          </button>
        ))}
      </div>
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <Icon name="AlertCircle" size={16} className="text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-destructive hover:text-destructive/70">
            <Icon name="X" size={14} />
          </button>
        </div>
      )}
      {/* Document List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Icon name="Loader" size={32} className="text-primary animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading documents...</p>
          </div>
        </div>
      ) : documents?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Icon name="FolderOpen" size={28} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No documents found</p>
          <p className="text-xs text-muted-foreground mb-4">
            {activeFilter !== 'all' ? `No ${activeFilter} documents uploaded yet` : 'Upload your first document to get started'}
          </p>
          <Button variant="outline" size="sm" iconName="Upload" iconPosition="left" onClick={() => setShowUploadModal(true)}>
            Upload Document
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {documents?.map((doc) => {
            const sensitivityCfg = SENSITIVITY_CONFIG?.[doc?.sensitivity] || SENSITIVITY_CONFIG?.low;
            const docTypeCfg = typeConfig?.[doc?.document_type] || {};
            const fileIcon = FILE_ICON_MAP?.[doc?.file_type] || 'File';
            const isExpiringSoon = doc?.expiry_date && new Date(doc.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const isExpired = doc?.expiry_date && new Date(doc.expiry_date) < new Date();

            return (
              <div
                key={doc?.id}
                className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
              >
                {/* File Icon */}
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name={fileIcon} size={20} className="text-primary" />
                </div>
                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-caption font-medium text-sm text-foreground truncate">
                      {doc?.document_name}
                    </h4>
                    {/* Sensitivity Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sensitivityCfg?.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sensitivityCfg?.dot}`} />
                      {sensitivityCfg?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {/* Type */}
                    <span className={`text-xs ${docTypeCfg?.color || 'text-muted-foreground'} flex items-center gap-1`}>
                      {docTypeCfg?.icon && <Icon name={docTypeCfg?.icon} size={11} />}
                      {docTypeCfg?.label || doc?.document_type}
                    </span>
                    {/* Size */}
                    <span className="text-xs text-muted-foreground">{formatFileSize(doc?.file_size)}</span>
                    {/* Upload Date */}
                    <span className="text-xs text-muted-foreground">Uploaded {formatDate(doc?.uploaded_at)}</span>
                    {/* Expiry */}
                    {doc?.expiry_date && (
                      <span className={`text-xs flex items-center gap-1 ${isExpired ? 'text-destructive' : isExpiringSoon ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        <Icon name="Calendar" size={11} />
                        {isExpired ? 'Expired' : 'Expires'} {formatDate(doc?.expiry_date)}
                      </span>
                    )}
                    {/* Bucket indicator */}
                    {doc?.bucket_name === 'client-documents-private' && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Icon name="Lock" size={11} />
                        Private
                      </span>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => handleView(doc)}
                    disabled={actionLoading === doc?.id}
                    title="View document"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === doc?.id
                      ? <Icon name="Loader" size={16} className="animate-spin" />
                      : <Icon name="Eye" size={16} />}
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={actionLoading === `dl-${doc?.id}`}
                    title="Download document"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === `dl-${doc?.id}`
                      ? <Icon name="Loader" size={16} className="animate-spin" />
                      : <Icon name="Download" size={16} />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(doc)}
                    title="Delete document"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Modals */}
      {showUploadModal && (
        <UploadModal
          clientId={client?.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => { setShowUploadModal(false); loadDocuments(); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          document={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
};

export default DocumentsTab;
