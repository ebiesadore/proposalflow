import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { proposalService } from '../../services/proposalService';
import { useToast } from '../../contexts/ToastContext';
import VersionCard from './components/VersionCard';
import CreateVersionModal from './components/CreateVersionModal';
import RestoreConfirmModal from './components/RestoreConfirmModal';
import VersionFilters from './components/VersionFilters';

const ProposalVersionHistoryPanel = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const [versions, setVersions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedVersionId, setExpandedVersionId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [filters, setFilters] = useState({ search: '', status: '' });

    // Get proposal context from navigation state
    const proposalId = location?.state?.proposalId || sessionStorage.getItem('currentProposalId');
    const proposalTitle = location?.state?.proposalTitle || 'Proposal';

    const loadVersionHistory = useCallback(async () => {
        if (!proposalId) return;
        setIsLoading(true);
        try {
            const { data, error } = await proposalService?.getVersionHistory(proposalId);
            if (error) {
                showToast?.('Failed to load version history', 'error');
            } else {
                setVersions(data || []);
            }
        } catch (err) {
            showToast?.('Failed to load version history', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [proposalId, showToast]);

    useEffect(() => {
        loadVersionHistory();
    }, [loadVersionHistory]);

    // Filter versions
    const filteredVersions = useMemo(() => {
        return versions?.filter(v => {
            const matchesSearch = !filters?.search ||
                v?.change_notes?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
                v?.version_label?.toLowerCase()?.includes(filters?.search?.toLowerCase());
            const matchesStatus = !filters?.status || v?.version_status === filters?.status;
            return matchesSearch && matchesStatus;
        });
    }, [versions, filters]);

    const handleCreateVersion = async ({ versionLabel, changeNotes, versionStatus }) => {
        if (!proposalId) {
            showToast?.('No proposal selected', 'error');
            return;
        }
        setIsCreating(true);
        try {
            // Get current proposal data for snapshot
            const { data: proposalData } = await proposalService?.getProposalById(proposalId);
            const snapshot = proposalData || {};
            const proposalValue = parseFloat(proposalData?.value) || 0;

            const { data, error } = await proposalService?.createVersion(proposalId, snapshot, {
                versionLabel,
                changeNotes,
                versionStatus,
                proposalValue,
            });

            if (error) {
                showToast?.('Failed to create version', 'error');
            } else {
                showToast?.('Version created successfully', 'success');
                setShowCreateModal(false);
                await loadVersionHistory();
            }
        } catch (err) {
            showToast?.('Failed to create version', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const handleRestoreConfirm = async (version) => {
        setIsRestoring(true);
        try {
            const { data, error } = await proposalService?.restoreVersion(proposalId, version?.id);
            if (error) {
                showToast?.('Failed to restore version', 'error');
            } else {
                showToast?.(`Restored to V${version?.version_number}`, 'success');
                setShowRestoreModal(false);
                setSelectedVersion(null);
                // Navigate back to workspace with restored snapshot
                navigate('/new-proposal-creation-workspace', {
                    state: {
                        proposalId,
                        restoredSnapshot: data?.snapshot,
                        restoredVersionNumber: version?.version_number,
                    }
                });
            }
        } catch (err) {
            showToast?.('Failed to restore version', 'error');
        } finally {
            setIsRestoring(false);
        }
    };

    const handleStatusChange = async (versionId, newStatus) => {
        try {
            const { error } = await proposalService?.updateVersionStatus(versionId, newStatus);
            if (error) {
                showToast?.('Failed to update status', 'error');
            } else {
                showToast?.('Status updated', 'success');
                setVersions(prev => prev?.map(v =>
                    v?.id === versionId ? { ...v, version_status: newStatus } : v
                ));
            }
        } catch (err) {
            showToast?.('Failed to update status', 'error');
        }
    };

    const handlePreview = (version) => {
        // Open preview in workspace with read-only snapshot
        navigate('/new-proposal-creation-workspace', {
            state: {
                proposalId,
                previewSnapshot: version?.snapshot,
                previewVersionNumber: version?.version_number,
                readOnly: true,
            }
        });
    };

    return (
        <>
            <Helmet>
                <title>Version History — {proposalTitle}</title>
            </Helmet>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

                <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'ml-[68px]' : 'ml-[204px]'}`}>
                    {/* Header */}
                    <div className="bg-card border-b border-border px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate('/new-proposal-creation-workspace', { state: { proposalId } })}
                                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Icon name="ChevronLeft" size={16} />
                                    Back to Workspace
                                </button>
                                <span className="text-muted-foreground">/</span>
                                <div className="flex items-center gap-2">
                                    <Icon name="GitBranch" size={16} className="text-[#436958]" />
                                    <span className="font-semibold text-foreground">Version History</span>
                                </div>
                                {proposalTitle && (
                                    <>
                                        <span className="text-muted-foreground">/</span>
                                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">{proposalTitle}</span>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                disabled={!proposalId}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#436958] text-white hover:bg-[#436958]/90 disabled:opacity-50 transition-colors"
                            >
                                <Icon name="Plus" size={15} />
                                Create Version
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-hidden flex">
                        {/* Version Panel */}
                        <div className="w-full max-w-2xl mx-auto flex flex-col overflow-hidden">
                            {/* Filters */}
                            <VersionFilters
                                filters={filters}
                                onFiltersChange={setFilters}
                                versions={versions}
                            />

                            {/* Timeline */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {!proposalId ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center">
                                        <Icon name="AlertCircle" size={40} className="text-muted-foreground mb-3" />
                                        <p className="text-muted-foreground text-sm">No proposal selected.</p>
                                        <button
                                            onClick={() => navigate('/proposal-management-dashboard')}
                                            className="mt-3 text-sm text-[#436958] hover:underline"
                                        >
                                            Go to Dashboard
                                        </button>
                                    </div>
                                ) : isLoading ? (
                                    <div className="flex flex-col items-center justify-center h-64">
                                        <Icon name="Loader2" size={32} className="animate-spin text-[#436958] mb-3" />
                                        <p className="text-sm text-muted-foreground">Loading version history...</p>
                                    </div>
                                ) : filteredVersions?.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center">
                                        <Icon name="GitBranch" size={40} className="text-muted-foreground mb-3" />
                                        <p className="font-medium text-foreground mb-1">
                                            {versions?.length === 0 ? 'No versions yet' : 'No versions match filters'}
                                        </p>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {versions?.length === 0
                                                ? 'Create your first version to start tracking changes.' :'Try adjusting your search or filter criteria.'}
                                        </p>
                                        {versions?.length === 0 && (
                                            <button
                                                onClick={() => setShowCreateModal(true)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#436958] text-white hover:bg-[#436958]/90 transition-colors"
                                            >
                                                <Icon name="Plus" size={14} />
                                                Create First Version
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        {/* Timeline connector line */}
                                        {filteredVersions?.length > 1 && (
                                            <div className="absolute left-[26px] top-10 bottom-10 w-0.5 bg-border z-0" />
                                        )}

                                        <div className="space-y-3 relative z-10">
                                            {filteredVersions?.map((version, index) => (
                                                <VersionCard
                                                    key={version?.id}
                                                    version={version}
                                                    isLatest={index === 0}
                                                    isExpanded={expandedVersionId === version?.id}
                                                    onToggleExpand={() => setExpandedVersionId(
                                                        expandedVersionId === version?.id ? null : version?.id
                                                    )}
                                                    onPreview={handlePreview}
                                                    onRestore={(v) => {
                                                        setSelectedVersion(v);
                                                        setShowRestoreModal(true);
                                                    }}
                                                    onStatusChange={handleStatusChange}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CreateVersionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onConfirm={handleCreateVersion}
                isCreating={isCreating}
            />

            <RestoreConfirmModal
                isOpen={showRestoreModal}
                version={selectedVersion}
                onClose={() => {
                    setShowRestoreModal(false);
                    setSelectedVersion(null);
                }}
                onConfirm={handleRestoreConfirm}
                isRestoring={isRestoring}
            />
        </>
    );
};

export default ProposalVersionHistoryPanel;
