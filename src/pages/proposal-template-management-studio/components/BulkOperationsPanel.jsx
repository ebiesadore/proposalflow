import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkOperationsPanel = ({ selectedCount, onClearSelection, onBulkAction }) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const actionOptions = [
    { value: '', label: 'Select bulk action...', disabled: true },
    { value: 'activate', label: 'Activate Templates' },
    { value: 'archive', label: 'Archive Templates' },
    { value: 'duplicate', label: 'Duplicate Templates' },
    { value: 'change_category', label: 'Change Category' },
    { value: 'export', label: 'Export Templates' },
    { value: 'delete', label: 'Delete Templates' },
  ];

  const handleApply = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onBulkAction(selectedAction);
    setSelectedAction('');
    setIsProcessing(false);
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <div className="bg-card border border-border rounded-xl shadow-brand-2xl p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="CheckSquare" size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-caption font-semibold text-foreground">
                {selectedCount} template{selectedCount !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={onClearSelection}
                className="text-xs text-primary hover:text-primary/80 transition-smooth font-caption"
              >
                Clear selection
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select
                options={actionOptions}
                value={selectedAction}
                onChange={setSelectedAction}
                placeholder="Select action"
              />
            </div>
            <Button
              variant="default"
              iconName="Play"
              iconPosition="left"
              onClick={handleApply}
              loading={isProcessing}
              disabled={!selectedAction}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOperationsPanel;