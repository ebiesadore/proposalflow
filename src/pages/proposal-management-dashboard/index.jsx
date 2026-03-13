import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/ui/Sidebar";

import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";

import ProposalDataGrid from "./components/ProposalDataGrid";
import BulkActionsBar from "./components/BulkActionsBar";
import DashboardStats from "./components/DashboardStats";
import DeleteProposalModal from "./components/DeleteProposalModal";
import EditProposalModal from "./components/EditProposalModal";
import BulkDeleteConfirmationModal from "./components/BulkDeleteConfirmationModal";

import { proposalService } from "../../services/proposalService";
import { useProposalRealtime } from "../../hooks/useProposalRealtime";
import { useOptimisticUI } from "../../hooks/useOptimisticUI";
import { useAuth } from "../../contexts/AuthContext";
import { useSaveQueue } from "../../hooks/useSaveQueue";

const ProposalManagementDashboard = () => {
    const navigate = useNavigate();
    const { user, sessionRestored } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedProposals, setSelectedProposals] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState({ column: "createdDate", direction: "desc" });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

    const [error, setError] = useState(null);

    // FEATURE FLAGS
    const OPTIMISTIC_UI_ENABLED = import.meta.env?.VITE_ENABLE_OPTIMISTIC_UI === "true";
    const LOADING_STATES_ENABLED = import.meta.env?.VITE_ENABLE_LOADING_STATES === "true";
    const SAVE_QUEUE_ENABLED = import.meta.env?.VITE_ENABLE_SAVE_QUEUE === "true";

    // Phase 1: Optimistic UI Hook
    const optimisticUI = useOptimisticUI({ enabled: OPTIMISTIC_UI_ENABLED });

    // Save Queue Hook
    const saveQueue = useSaveQueue({
        saveFn: async (saveData, options) => {
            await proposalService?.updateProposal(saveData?.id, saveData?.data, options);
        },
        enabled: SAVE_QUEUE_ENABLED,
        maxRetries: 1,
        retryDelay: 1000,
        timeout: 60000,
    });

    const {
        proposals: rawProposals,
        loading: proposalsLoading,
        error: realtimeError,
        refetch: refetchProposals,
    } = useProposalRealtime();

    const proposals = useMemo(() => {
        if (!rawProposals) return [];

        return rawProposals?.map((proposal) => {
            // Calculate total area (Ft²) from modules
            const calculateTotalAreaFt2 = () => {
                const modules = proposal?.modules || [];
                return modules?.reduce((sum, m) => {
                    const quantity = parseFloat(m?.quantity) || 0;
                    const areaFt2 = parseFloat(m?.areaFeet) || parseFloat(m?.areaMM) / 0.092903 || 0;
                    return sum + quantity * areaFt2;
                }, 0);
            };

            // Calculate Total Production Duration (Program)
            const calculateTotalProductionDuration = () => {
                const design = proposal?.project_duration?.design || {};
                const procurement = proposal?.project_duration?.procurement || {};
                const production = proposal?.project_duration?.production || {};

                const designTotal =
                    parseFloat(design?.concept || 0) +
                    parseFloat(design?.schematic || 0) +
                    parseFloat(design?.detailedDesign || 0) +
                    parseFloat(design?.productionIFC || 0);

                const procurementTotal = Math.max(
                    parseFloat(procurement?.local || 0),
                    parseFloat(procurement?.shortLead || 0),
                    parseFloat(procurement?.longLead || 0),
                );

                const productionTotal = parseFloat(production?.productionWeek || 0);

                return designTotal + procurementTotal + productionTotal;
            };

            // Read saved values from proposal data
            const savedGrandTotal = proposal?.revenue_centers?.grandTotal || 0;
            const savedFt2RateBUA = parseFloat(proposal?.ft2_rate_bua) || 0;

            return {
                id: proposal?.id,
                project_number: proposal?.project_number,
                client: proposal?.client,
                title: proposal?.title,
                projectName: proposal?.project_details?.projectName || proposal?.title,
                status: proposal?.status || "Draft",
                statusLabel: proposal?.status
                    ? proposal?.status?.charAt(0)?.toUpperCase() + proposal?.status?.slice(1)
                    : "Draft",
                projectType: proposal?.project_details?.projectType || proposal?.project_type || "Standard",
                program: calculateTotalProductionDuration(),
                assignedTo: proposal?.client?.primary_contact || "No Contact",
                createdDate: proposal?.created_at,
                value: savedGrandTotal,
                ft2RateBUA: savedFt2RateBUA,
                totalAreaFt2: calculateTotalAreaFt2(),
                rawData: proposal,
            };
        });
    }, [rawProposals]);

    // OPTIMIZATION: Memoize stats with stable proposals reference
    // Only recalculate when proposals array reference actually changes
    const dashboardStats = React.useMemo(() => {
        // Early return if no proposals to prevent unnecessary calculations
        if (!proposals || proposals?.length === 0) {
            return {
                total: 0,
                active: 0,
                pending: 0,
                totalValue: 0,
                draft: 0,
                approved: 0,
                closed: 0,
                won: 0,
                totalArea: 0,
            };
        }

        console.log("[Dashboard] Recalculating dashboard stats");

        return {
            total: proposals?.length,
            active: proposals?.filter((p) => ["Pending", "Approved"]?.includes(p?.status))?.length,
            pending: proposals?.filter((p) => p?.status === "Pending")?.length,
            totalValue: proposals?.reduce((sum, p) => sum + p?.value, 0),
            draft: proposals?.filter((p) => p?.status === "Draft")?.length,
            approved: proposals?.filter((p) => p?.status === "Approved")?.length,
            closed: proposals?.filter((p) => p?.status === "Closed")?.length,
            won: proposals?.filter((p) => p?.status === "Won")?.length,
            totalArea: (proposals
                ?.filter((p) => p?.status !== "Closed")
                ?.reduce((sum, p) => sum + (p?.totalAreaFt2 || 0), 0) || 0) * 0.092903,
        };
    }, [proposals]); // CRITICAL: Memoize stats to prevent recalculation on every render

    // OPTIMIZATION: Memoize clients with stable proposals reference
    const clients = React.useMemo(() => {
        // Early return if no proposals
        if (!proposals || proposals?.length === 0) return [];

        console.log("[Dashboard] Recalculating clients list");

        return [...new Set(proposals.map((p) => p?.client?.company_name).filter(Boolean))]?.map((clientName) => ({
            id: clientName?.toLowerCase()?.replace(/\s+/g, "-"),
            name: clientName,
        }));
    }, [proposals]); // CRITICAL: Memoize clients list

    // Pagination logic
    const totalPages = Math.ceil(proposals?.length / itemsPerPage);
    const paginatedProposals = proposals?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset to page 1 when itemsPerPage changes
    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const handleStatusChange = async (proposalId, newStatus) => {
        try {
            const proposal = proposals?.find((p) => p?.id === proposalId);
            if (!proposal) return;

            await proposalService?.updateProposal(proposalId, {
                status: newStatus,
            });

            // Update happens through realtime hook automatically
        } catch (error) {
            console.error("Error updating proposal status:", error);
            alert("Failed to update proposal status. Please try again.");
        }
    };

    const handleSort = (column) => {
        setSortConfig((prev) => ({
            column,
            direction: prev?.column === column && prev?.direction === "asc" ? "desc" : "asc",
        }));
    };

    const handleEditProposal = (proposal) => {
        // Navigate to proposal creation workspace with proposal ID for editing
        navigate("/new-proposal-creation-workspace", { state: { proposalId: proposal?.id } });
    };

    const handleDeleteProposal = async (proposalId) => {
        try {
            // Phase 1: Optimistic Delete
            const result = await optimisticUI?.optimisticDelete(
                proposalId,
                proposals,
                () => {},
                async (id) => {
                    await proposalService?.deleteProposal(id);
                    // Invalidate cache after successful delete
                },
            );

            if (result?.success) {
                console.log("[Optimistic UI] Proposal deleted successfully");
            } else {
                console.error("[Optimistic UI] Delete failed:", result?.error);
                setError(result?.error?.message || "Failed to delete proposal");
            }
        } catch (error) {
            console.error("Delete error:", error);
            setError(error?.message || "Failed to delete proposal");
        }
    };

    const handleOpenDeleteModal = (proposal) => {
        setSelectedProposal(proposal);
        setDeleteModalOpen(true);
    };

    const handleSaveProposal = async (proposalId, formData) => {
        try {
            const saveData = {
                title: formData?.title,
                description: formData?.description,
                value: parseFloat(formData?.value),
                status: formData?.status,
            };

            if (SAVE_QUEUE_ENABLED) {
                // Use save queue to prevent concurrent saves
                saveQueue?.enqueueSave(
                    { id: proposalId, data: saveData },
                    {
                        priority: "high", // Manual saves get priority
                        onSuccess: () => {
                            console.log("[Save Queue] Proposal saved successfully");
                        },
                        onError: (error) => {
                            console.error("[Save Queue] Failed to save proposal:", error);
                            alert("Failed to update proposal. Please try again.");
                        },
                    },
                );
            } else {
                // Direct save (legacy mode)
                await proposalService?.updateProposal(proposalId, saveData);
            }
        } catch (error) {
            console.error("Failed to update proposal:", error);
            alert("Failed to update proposal. Please try again.");
        }
    };

    const handleBulkAction = (action, value) => {
        console.log(`Bulk action: ${action}`, value);
        if (action === "bulkDelete") {
            setBulkDeleteModalOpen(true);
        } else {
            setSelectedProposals([]);
        }
    };

    const handleBulkDelete = async () => {
        try {
            // Delete all selected proposals
            const deletePromises = selectedProposals?.map((proposalId) => proposalService?.deleteProposal(proposalId));

            await Promise.all(deletePromises);

            // Clear selection and refresh
            setSelectedProposals([]);
            setBulkDeleteModalOpen(false);
        } catch (error) {
            console.error("Bulk delete failed:", error);
            alert(`Failed to delete proposals: ${error?.message}`);
            throw error;
        }
    };

    const handleConfirmDelete = async () => {
        if (selectedProposal) {
            await handleDeleteProposal(selectedProposal?.id);
            setDeleteModalOpen(false);
            setSelectedProposal(null);
        }
    };

    const getActionStatus = (proposalId) => {
        if (LOADING_STATES_ENABLED && OPTIMISTIC_UI_ENABLED) {
            return optimisticUI?.getActionStatus?.(proposalId) || "idle";
        }
        return "idle";
    };

    const handleExport = () => {
        console.log("Exporting proposals to Excel/CSV");
    };

    const handleNewProposal = () => {
        navigate("/new-proposal-creation-workspace");
    };

    const fetchProposals = async () => {
        setError(null);
        if (refetchProposals) {
            await refetchProposals();
        }
    };

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e?.ctrlKey || e?.metaKey) {
                if (e?.key === "e") {
                    e?.preventDefault();
                    handleExport();
                }
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, []);

    return (
        <>
            <Helmet>
                <title>Proposal Management Dashboard - NeXSYS CORE™</title>
                <meta
                    name="description"
                    content="Comprehensive proposal lifecycle management with tracking, bulk operations, and real-time status updates for enterprise proposal teams"
                />
            </Helmet>
            <div className="flex h-screen overflow-hidden bg-background dark:bg-background">
                <Sidebar
                    isOpen={!sidebarOpen}
                    onToggle={() => setSidebarOpen(!sidebarOpen)}
                    onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
                    collapsed={sidebarOpen}
                />

                <div className="flex-1 ml-[68px] transition-smooth">
                    <header className="bg-card border-b border-border sticky top-0 z-30">
                        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                                        Proposal Management Dashboard
                                    </h1>
                                    <p className="text-muted-foreground font-caption">
                                        Track, manage, and optimize your proposal pipeline with real-time updates
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="default"
                                        iconName="Download"
                                        iconPosition="left"
                                        onClick={handleExport}
                                    >
                                        Export
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={() => navigate("/new-proposal-creation-workspace")}
                                        className="flex items-center gap-2"
                                    >
                                        <Icon name="add" className="text-xl" />
                                        New Proposal
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="p-4 md:p-6 lg:p-8">
                        <div className="space-y-6 md:space-y-8">
                            <DashboardStats stats={dashboardStats} />

                            <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <Icon name="Filter" size={20} className="text-primary" />
                                        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
                                            All Proposals
                                        </h2>
                                        <span className="px-3 py-1 bg-muted rounded-full text-sm font-caption font-medium text-foreground">
                                            {proposals?.length}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    {error || realtimeError ? (
                                        <div className="bg-card rounded-lg border border-border shadow-brand p-12 text-center">
                                            <Icon
                                                name="AlertCircle"
                                                size={32}
                                                className="mx-auto mb-4 text-destructive"
                                            />
                                            <p className="text-destructive font-caption mb-2">
                                                Failed to load proposals
                                            </p>
                                            <p className="text-muted-foreground font-caption text-sm">
                                                {error || realtimeError}
                                            </p>
                                            <Button onClick={fetchProposals} className="mt-4">
                                                <Icon name="RefreshCw" size={16} />
                                                Retry
                                            </Button>
                                        </div>
                                    ) : proposalsLoading && proposals?.length === 0 ? (
                                        <div className="bg-card rounded-lg border border-border shadow-brand p-12 text-center">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                                            <p className="text-muted-foreground font-caption">Loading proposals...</p>
                                        </div>
                                    ) : proposals?.length === 0 ? (
                                        <div className="bg-card rounded-lg border border-border shadow-brand p-12 text-center">
                                            <Icon
                                                name="FileText"
                                                size={32}
                                                className="mx-auto mb-4 text-muted-foreground"
                                            />
                                            <p className="text-muted-foreground font-caption">No proposals found</p>
                                        </div>
                                    ) : (
                                        <ProposalDataGrid
                                            proposals={paginatedProposals}
                                            selectedProposals={selectedProposals}
                                            onSelectionChange={setSelectedProposals}
                                            onSort={handleSort}
                                            sortConfig={sortConfig}
                                            onEdit={handleEditProposal}
                                            onDelete={handleDeleteProposal}
                                            onOpenDeleteModal={handleOpenDeleteModal}
                                            onStatusChange={handleStatusChange}
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            itemsPerPage={itemsPerPage}
                                            totalItems={proposals?.length}
                                            onPageChange={setCurrentPage}
                                            onItemsPerPageChange={handleItemsPerPageChange}
                                            getActionStatus={getActionStatus}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>

                <BulkActionsBar
                    selectedCount={selectedProposals?.length}
                    onClearSelection={() => setSelectedProposals([])}
                    onBulkAction={handleBulkAction}
                />

                <DeleteProposalModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    proposal={selectedProposal}
                    onConfirm={handleConfirmDelete}
                    actionStatus={selectedProposal ? getActionStatus(selectedProposal?.id) : "idle"}
                />

                <EditProposalModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    proposal={selectedProposal}
                    onSave={handleSaveProposal}
                    clients={clients}
                />

                <BulkDeleteConfirmationModal
                    isOpen={bulkDeleteModalOpen}
                    onClose={() => setBulkDeleteModalOpen(false)}
                    onConfirm={handleBulkDelete}
                    count={selectedProposals?.length}
                    proposals={selectedProposals}
                />
            </div>
        </>
    );
};

export default ProposalManagementDashboard;
