import React from 'react';

import Button from '../../../components/ui/Button';

const BulkOperationsBar = ({ 
  selectedCount, 
  totalCount,
  onSelectAll, 
  onDeselectAll,
  onBulkDownload,
  onBulkEmail,
  onBulkArchive,
  onBulkDelete
}) => {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant={allSelected ? "default" : "outline"}
            size="sm"
            iconName={allSelected ? "CheckSquare" : "Square"}
            iconPosition="left"
            onClick={allSelected ? onDeselectAll : onSelectAll}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
          <span className="text-sm font-caption font-medium text-muted-foreground">
            {selectedCount} of {totalCount} selected
          </span>
        </div>

        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            <Button
              variant="default"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={onBulkDownload}
            >
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Mail"
              iconPosition="left"
              onClick={onBulkEmail}
            >
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Archive"
              iconPosition="left"
              onClick={onBulkArchive}
            >
              Archive
            </Button>
            <Button
              variant="destructive"
              size="sm"
              iconName="Trash2"
              iconPosition="left"
              onClick={onBulkDelete}
            >
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkOperationsBar;