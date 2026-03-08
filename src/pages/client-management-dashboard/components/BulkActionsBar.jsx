import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActionsBar = ({ selectedCount, onAction, onClear }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-card border border-border rounded-lg shadow-brand-xl px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Icon name="CheckCircle" size={20} className="text-primary" />
            <span className="font-caption font-medium text-sm text-foreground">
              {selectedCount} client{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Mail"
              iconPosition="left"
              onClick={() => onAction('email')}
            >
              Send Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Edit"
              iconPosition="left"
              onClick={() => onAction('edit')}
            >
              Update Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={() => onAction('export')}
            >
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={onClear}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;