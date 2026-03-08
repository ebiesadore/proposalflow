import React from 'react';
import Icon from '../../../components/AppIcon';

import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const DocumentQueueCard = ({ 
  document, 
  isSelected, 
  onSelect, 
  onDownload, 
  onPreview, 
  onRegenerate 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10';
      case 'processing':
        return 'text-warning bg-warning/10';
      case 'failed':
        return 'text-error bg-error/10';
      case 'queued':
        return 'text-muted-foreground bg-muted';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'CheckCircle';
      case 'processing':
        return 'Loader';
      case 'failed':
        return 'XCircle';
      case 'queued':
        return 'Clock';
      default:
        return 'Circle';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes?.[i];
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5 lg:p-6 transition-smooth hover:shadow-brand">
      <div className="flex items-start gap-3 md:gap-4">
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelect(document?.id, e?.target?.checked)}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-1 line-clamp-1">
                {document?.proposalTitle}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icon name="Building2" size={14} />
                  {document?.clientName}
                </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-1">
                  <Icon name="FileText" size={14} />
                  v{document?.templateVersion}
                </span>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-caption font-medium whitespace-nowrap ${getStatusColor(document?.status)}`}>
              <Icon 
                name={getStatusIcon(document?.status)} 
                size={14} 
                className={document?.status === 'processing' ? 'animate-spin' : ''}
              />
              <span className="capitalize">{document?.status}</span>
            </div>
          </div>

          {document?.status === 'processing' && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Processing...</span>
                <span>{document?.progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${document?.progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground mb-4">
            {document?.fileSize && (
              <span className="flex items-center gap-1">
                <Icon name="HardDrive" size={14} />
                {formatFileSize(document?.fileSize)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Icon name="Calendar" size={14} />
              {new Date(document.generatedAt)?.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
            {document?.downloadCount > 0 && (
              <span className="flex items-center gap-1">
                <Icon name="Download" size={14} />
                {document?.downloadCount} downloads
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {document?.status === 'completed' && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  iconName="Download"
                  iconPosition="left"
                  onClick={() => onDownload(document?.id)}
                >
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Eye"
                  iconPosition="left"
                  onClick={() => onPreview(document?.id)}
                >
                  Preview
                </Button>
              </>
            )}
            {document?.status === 'failed' && (
              <Button
                variant="destructive"
                size="sm"
                iconName="RefreshCw"
                iconPosition="left"
                onClick={() => onRegenerate(document?.id)}
              >
                Regenerate
              </Button>
            )}
            {document?.status === 'processing' && (
              <Button
                variant="ghost"
                size="sm"
                disabled
              >
                Processing...
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentQueueCard;