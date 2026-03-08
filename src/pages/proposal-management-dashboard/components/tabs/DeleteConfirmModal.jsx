import React from 'react';
import Icon from '../../../../components/AppIcon';
import Button from '../../../../components/ui/Button';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemNumber }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <Icon name="AlertTriangle" size={24} className="text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-semibold text-foreground">
                Delete Line Item
              </h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this item?
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-foreground">
              You are about to delete <span className="font-semibold">Line Item #{itemNumber}</span>. This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-destructive hover:bg-destructive/90"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;