import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DeleteClientModal = ({ client, isOpen, onClose, onConfirm, isDeleting }) => {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');

  // Reset state when modal opens/closes or client changes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setConfirmText('');
    }
  }, [isOpen, client?.id]);

  if (!isOpen || !client) return null;

  const handleClose = () => {
    setStep(1);
    setConfirmText('');
    onClose();
  };

  const handleFirstConfirm = () => {
    setStep(2);
  };

  const isConfirmTextValid = confirmText?.trim()?.toLowerCase() === 'delete';

  const handleFinalConfirm = () => {
    if (isConfirmTextValid && !isDeleting) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-brand border border-border w-full max-w-md">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Icon name="AlertTriangle" size={20} className="text-destructive" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground">
                {step === 1 ? 'Delete Client?' : 'Confirm Deletion'}
              </h3>
            </div>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="text-muted-foreground hover:text-foreground transition-smooth disabled:opacity-50"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">
                  {client?.companyName || client?.company_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {client?.primaryContact || client?.primary_contact} • {client?.email}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  Are you sure you want to delete this client?
                </p>
                <p className="text-sm text-muted-foreground">
                  This action will permanently remove:
                </p>
                <ul className="space-y-1 ml-4">
                  <li className="text-sm text-muted-foreground flex items-center gap-2">
                    <Icon name="Circle" size={6} className="fill-current" />
                    Client information and contact details
                  </li>
                  <li className="text-sm text-muted-foreground flex items-center gap-2">
                    <Icon name="Circle" size={6} className="fill-current" />
                    Associated proposals and documents
                  </li>
                  <li className="text-sm text-muted-foreground flex items-center gap-2">
                    <Icon name="Circle" size={6} className="fill-current" />
                    Communication history
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-xs text-warning font-medium">
                  ⚠️ This action cannot be undone
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                To confirm deletion, please type <span className="font-semibold text-destructive">DELETE</span> below:
              </p>

              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e?.target?.value)}
                onKeyDown={(e) => {
                  if (e?.key === 'Enter' && isConfirmTextValid && !isDeleting) {
                    handleFinalConfirm();
                  }
                }}
                placeholder="Type DELETE to confirm"
                disabled={isDeleting}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                autoFocus
              />

              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-xs text-destructive font-medium">
                  🚨 Final warning: This will permanently delete {client?.companyName || client?.company_name}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          {step === 1 ? (
            <Button
              variant="destructive"
              onClick={handleFirstConfirm}
              disabled={isDeleting}
              iconName="ArrowRight"
              iconPosition="right"
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleFinalConfirm}
              disabled={!isConfirmTextValid || isDeleting}
              iconName={isDeleting ? 'Loader2' : 'Trash2'}
              iconPosition="left"
            >
              {isDeleting ? 'Deleting...' : 'Delete Client'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteClientModal;