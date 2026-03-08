import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DocumentPreviewModal = ({ document, onClose, onDownload }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = document?.totalPages || 12;

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (!document) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-brand-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-1 line-clamp-1">
              {document?.proposalTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {document?.clientName} • v{document?.templateVersion}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            onClick={onClose}
          />
        </div>

        <div className="flex-1 overflow-hidden bg-muted p-4 md:p-6">
          <div className="bg-background rounded-lg shadow-brand-lg h-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="FileText" size={32} className="text-primary" />
              </div>
              <p className="text-base md:text-lg font-heading font-semibold text-foreground mb-2">
                PDF Preview
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Page {currentPage} of {totalPages}
              </p>
              <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-auto">
                <p className="text-sm text-muted-foreground">
                  Document preview would be rendered here using a PDF viewer library in production.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 md:p-6 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              iconName="ChevronLeft"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            />
            <span className="text-sm font-caption font-medium text-foreground px-3">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              iconName="ChevronRight"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Printer"
              iconPosition="left"
            >
              Print
            </Button>
            <Button
              variant="default"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={() => onDownload(document?.id)}
            >
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;