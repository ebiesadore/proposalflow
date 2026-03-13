import React from 'react';
import Icon from '../../../components/AppIcon';

const RestoreConfirmModal = ({ isOpen, version, onClose, onConfirm, isRestoring }) => {
    if (!isOpen || !version) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4">
                <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                            <Icon name="AlertTriangle" size={20} className="text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">Restore Version</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                This will load the snapshot from <strong>V{version?.version_number} — {version?.version_label || `Version ${version?.version_number}`}</strong> into the workspace. Your current unsaved changes will be replaced.
                            </p>
                        </div>
                    </div>

                    <div className="bg-muted/40 rounded-lg p-3 mb-4 text-xs text-muted-foreground">
                        <Icon name="Info" size={12} className="inline mr-1" />
                        The current state will be saved as a new version before restoring.
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(version)}
                            disabled={isRestoring}
                            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#436958] text-white hover:bg-[#436958]/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                        >
                            {isRestoring ? (
                                <>
                                    <Icon name="Loader2" size={14} className="animate-spin" />
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <Icon name="RotateCcw" size={14} />
                                    Restore
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestoreConfirmModal;
