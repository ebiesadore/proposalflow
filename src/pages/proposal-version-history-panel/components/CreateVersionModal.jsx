import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const CreateVersionModal = ({ isOpen, onClose, onConfirm, isCreating }) => {
    const [versionLabel, setVersionLabel] = useState('');
    const [changeNotes, setChangeNotes] = useState('');
    const [versionStatus, setVersionStatus] = useState('draft');

    const handleSubmit = (e) => {
        e?.preventDefault();
        onConfirm({ versionLabel, changeNotes, versionStatus });
    };

    const handleClose = () => {
        setVersionLabel('');
        setChangeNotes('');
        setVersionStatus('draft');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Icon name="GitBranch" size={18} className="text-[#436958]" />
                        <h3 className="text-base font-semibold text-foreground">Create New Version</h3>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                        <Icon name="X" size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Version Label</label>
                        <input
                            type="text"
                            value={versionLabel}
                            onChange={(e) => setVersionLabel(e?.target?.value)}
                            placeholder="e.g. Revised Scope — Client Request"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#436958] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Initial Status</label>
                        <select
                            value={versionStatus}
                            onChange={(e) => setVersionStatus(e?.target?.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#436958] focus:border-transparent"
                        >
                            <option value="draft">Draft</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Change Notes</label>
                        <textarea
                            value={changeNotes}
                            onChange={(e) => setChangeNotes(e?.target?.value)}
                            placeholder="Describe what changed in this version..."
                            rows={3}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#436958] focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#436958] text-white hover:bg-[#436958]/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <Icon name="Loader2" size={14} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Icon name="Plus" size={14} />
                                    Create Version
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateVersionModal;
