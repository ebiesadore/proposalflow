import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const EditProposalModal = ({ isOpen, onClose, proposal, onSave, clients }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    value: '',
    status: '',
    description: ''
  });

  useEffect(() => {
    if (proposal) {
      setFormData({
        title: proposal?.title || '',
        client: proposal?.client || '',
        value: proposal?.value || '',
        status: proposal?.status || 'draft',
        description: proposal?.description || ''
      });
    }
  }, [proposal]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsLoading(true);
    try {
      await onSave(proposal?.id, formData);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Won', label: 'Won' }
  ];

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-card border border-border rounded-lg shadow-brand-lg">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="Edit" size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  Edit Proposal
                </h3>
                <p className="font-caption text-sm text-muted-foreground">
                  Update proposal information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted transition-smooth flex items-center justify-center"
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block font-caption text-sm font-medium text-foreground mb-2">
                Proposal Title *
              </label>
              <Input
                value={formData?.title}
                onChange={(e) => setFormData({ ...formData, title: e?.target?.value })}
                placeholder="Enter proposal title"
                required
              />
            </div>

            <div>
              <label className="block font-caption text-sm font-medium text-foreground mb-2">
                Client *
              </label>
              <Input
                value={formData?.client}
                onChange={(e) => setFormData({ ...formData, client: e?.target?.value })}
                placeholder="Enter client name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-caption text-sm font-medium text-foreground mb-2">
                  Value ($) *
                </label>
                <Input
                  type="number"
                  value={formData?.value}
                  onChange={(e) => setFormData({ ...formData, value: e?.target?.value })}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block font-caption text-sm font-medium text-foreground mb-2">
                  Status *
                </label>
                <Select
                  value={formData?.status}
                  onChange={(e) => setFormData({ ...formData, status: e?.target?.value })}
                  options={statusOptions}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-caption text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={formData?.description}
                onChange={(e) => setFormData({ ...formData, description: e?.target?.value })}
                placeholder="Enter proposal description"
                rows={4}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg font-caption text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-smooth resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={16} />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditProposalModal;