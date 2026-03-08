import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkDeleteConfirmationModal = ({ isOpen, onClose, proposals, onConfirm }) => {
  const [step, setStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isDeleting) {
      setStep(1);
      onClose();
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1 && !isDeleting) {
      setStep(step - 1);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      setStep(1);
      onClose();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalValue = proposals?.reduce((sum, p) => sum + (p?.value || 0), 0);
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(value);
  };

  const getStepIcon = (stepNumber) => {
    if (step > stepNumber) return 'CheckCircle2';
    if (step === stepNumber) return 'Circle';
    return 'Circle';
  };

  const getStepColor = (stepNumber) => {
    if (step > stepNumber) return 'text-success';
    if (step === stepNumber) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-brand-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Icon name="Trash2" size={20} className="text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-foreground">
                  Delete Multiple Proposals
                </h3>
                <p className="text-sm text-muted-foreground">
                  Step {step} of 3
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-2 flex-1">
              <Icon name={getStepIcon(1)} size={20} className={getStepColor(1)} />
              <span className={`text-sm font-medium ${getStepColor(1)}`}>Selection</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2 flex-1">
              <Icon name={getStepIcon(2)} size={20} className={getStepColor(2)} />
              <span className={`text-sm font-medium ${getStepColor(2)}`}>Impact</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2 flex-1">
              <Icon name={getStepIcon(3)} size={20} className={getStepColor(3)} />
              <span className={`text-sm font-medium ${getStepColor(3)}`}>Confirm</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Step 1: Selection Confirmation */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Icon name="Info" size={20} className="text-primary" />
                  <h4 className="font-semibold text-foreground">Review Selected Proposals</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  You have selected {proposals?.length} proposal{proposals?.length !== 1 ? 's' : ''} for deletion. Please review the list below.
                </p>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Project No.</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Title</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Client</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {proposals?.map((proposal) => (
                        <tr key={proposal?.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm font-medium">{proposal?.project_number || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">{proposal?.title}</td>
                          <td className="px-4 py-3 text-sm">{proposal?.client?.company_name || 'Unknown Client'}</td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(proposal?.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Impact Warning */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="AlertTriangle" size={24} className="text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Deletion Impact Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Deleting these proposals will have the following impact on your system:
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                      <Icon name="FileText" size={20} className="text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{proposals?.length}</p>
                      <p className="text-xs text-muted-foreground">Proposals to Delete</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                      <Icon name="DollarSign" size={20} className="text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
                      <p className="text-xs text-muted-foreground">Total Value at Risk</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Icon name="AlertCircle" size={18} className="text-warning" />
                  Important Considerations
                </h5>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Icon name="Dot" size={20} className="flex-shrink-0 mt-0.5" />
                    <span>All proposal data, including project details and pricing information, will be permanently deleted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Dot" size={20} className="flex-shrink-0 mt-0.5" />
                    <span>Associated documents and attachments will be removed from the system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Dot" size={20} className="flex-shrink-0 mt-0.5" />
                    <span>This action cannot be undone - deleted proposals cannot be recovered</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Dot" size={20} className="flex-shrink-0 mt-0.5" />
                    <span>Client relationships and contact information will remain intact</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Final Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="AlertOctagon" size={32} className="text-destructive" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-2">Final Confirmation Required</h4>
                <p className="text-muted-foreground mb-4">
                  You are about to permanently delete {proposals?.length} proposal{proposals?.length !== 1 ? 's' : ''}.
                </p>
                <div className="bg-card rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">This action will:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✗ Remove {proposals?.length} proposal{proposals?.length !== 1 ? 's' : ''} from your database</li>
                    <li>✗ Delete {formatCurrency(totalValue)} worth of proposal value</li>
                    <li>✗ Cannot be reversed or undone</li>
                  </ul>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="ShieldAlert" size={20} className="text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">Before you proceed:</p>
                    <p>Make sure you have reviewed all selected proposals and understand that this action is irreversible. If you're unsure, consider exporting the data first.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={step === 1 ? handleClose : handleBack}
              disabled={isDeleting}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            <div className="flex items-center gap-3">
              {step < 3 ? (
                <Button
                  variant="default"
                  onClick={handleNext}
                  iconName="ArrowRight"
                  iconPosition="right"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  iconName={isDeleting ? 'Loader2' : 'Trash2'}
                  iconPosition="left"
                  className={isDeleting ? 'animate-pulse' : ''}
                >
                  {isDeleting ? 'Deleting...' : `Delete ${proposals?.length} Proposal${proposals?.length !== 1 ? 's' : ''}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteConfirmationModal;