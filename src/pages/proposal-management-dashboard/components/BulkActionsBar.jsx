import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';


const BulkActionsBar = ({ selectedCount, onClearSelection, onBulkAction }) => {

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-primary text-primary-foreground rounded-lg shadow-brand-2xl px-4 md:px-6 py-4 flex flex-col md:flex-row items-center gap-4 max-w-[95vw] md:max-w-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
            <Icon name="CheckSquare" size={20} color="currentColor" />
          </div>
          <div>
            <p className="font-caption font-medium text-sm">
              {selectedCount} proposal{selectedCount !== 1 ? 's' : ''} selected
            </p>
            <p className="font-caption text-xs opacity-80">
              Choose an action to apply
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Button
            variant="secondary"
            size="sm"
            iconName="CheckCircle"
            iconPosition="left"
            onClick={() => onBulkAction('approve')}
          >
            Approve
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconName="Download"
            iconPosition="left"
            onClick={() => onBulkAction('export')}
          >
            Export
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconName="Trash2"
            iconPosition="left"
            onClick={() => onBulkAction('bulkDelete')}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            Delete
          </Button>
          <div className="w-px h-8 bg-primary-foreground/20 hidden md:block" />
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClearSelection}
          >
            Clear
          </Button>
        </div>
      </div>
    </>
  );
};

export default BulkActionsBar;