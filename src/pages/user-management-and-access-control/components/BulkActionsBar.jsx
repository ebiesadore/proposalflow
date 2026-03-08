import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActionsBar = ({ selectedCount, onActivate, onDeactivate, onChangeRole, onResetPassword, onDelete, onClearSelection }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-card border border-border rounded-lg shadow-brand-2xl px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="CheckSquare" size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-caption font-medium text-foreground">
                {selectedCount} user{selectedCount > 1 ? 's' : ''} selected
              </p>
              <button
                onClick={onClearSelection}
                className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
              >
                Clear selection
              </button>
            </div>
          </div>

          <div className="h-8 w-px bg-border hidden md:block" />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onActivate}
              iconName="CheckCircle"
              iconPosition="left"
              iconSize={16}
            >
              Activate
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onDeactivate}
              iconName="XCircle"
              iconPosition="left"
              iconSize={16}
            >
              Deactivate
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onChangeRole}
              iconName="Shield"
              iconPosition="left"
              iconSize={16}
            >
              Change Role
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onResetPassword}
              iconName="Key"
              iconPosition="left"
              iconSize={16}
            >
              Reset Password
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              iconName="Trash2"
              iconPosition="left"
              iconSize={16}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;