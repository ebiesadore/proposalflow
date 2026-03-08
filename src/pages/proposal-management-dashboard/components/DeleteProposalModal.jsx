import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DeleteProposalModal = ({ isOpen, onClose, proposal, onConfirm, actionStatus }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // FEATURE FLAG: Enhanced loading states
  const LOADING_STATES_ENABLED = import.meta.env?.VITE_ENABLE_LOADING_STATES === 'true';

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(proposal?.id);
      
      // Enhanced loading states: Show success briefly before closing
      if (LOADING_STATES_ENABLED) {
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get current action status from optimistic UI
  const currentStatus = actionStatus || (isDeleting ? 'deleting' : null);

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-brand-lg p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <Icon name="AlertTriangle" size={24} className="text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                Delete Proposal
              </h3>
              <p className="font-caption text-sm text-muted-foreground mb-1">
                Are you sure you want to delete this proposal?
              </p>
              <p className="font-caption text-sm font-medium text-foreground">
                {proposal?.title}
              </p>
              <p className="font-caption text-xs text-muted-foreground mt-2">
                This action cannot be undone. All proposal data will be permanently removed.
              </p>
              
              {/* Phase 1: Enhanced Status Indicators */}
              {LOADING_STATES_ENABLED && currentStatus && (
                <div className="mt-3 flex items-center gap-2">
                  {currentStatus === 'deleting' && (
                    <>
                      <Icon name="Loader2" size={14} className="animate-spin text-destructive" />
                      <span className="text-xs font-medium text-destructive">Deleting...</span>
                    </>
                  )}
                  {currentStatus === 'deleted' && (
                    <>
                      <Icon name="CheckCircle2" size={14} className="text-success" />
                      <span className="text-xs font-medium text-success">Deleted successfully</span>
                    </>
                  )}
                  {currentStatus === 'error' && (
                    <>
                      <Icon name="AlertCircle" size={14} className="text-destructive" />
                      <span className="text-xs font-medium text-destructive">Delete failed</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Icon name="Trash2" size={16} />
                  Delete Proposal
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteProposalModal;