import React, { useState, useEffect } from "react";
import Sidebar from "../../components/ui/Sidebar";
import Breadcrumb from "../../components/ui/Breadcrumb";
import SystemsConfigTabs from "../../components/ui/SystemsConfigTabs";
import RoleBasedAccess from "../../components/ui/RoleBasedAccess";
import IntegrationStatus from "../../components/ui/IntegrationStatus";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import { externalTradeService } from "../../services/externalTradeService";

const ExternalTrade = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        tradeCategory: "",
        scopeOfWork: "",
        description: "",
    });
    const [errors, setErrors] = useState({});

    const tradeCategoryOptions = [
        { value: "electrical", label: "Electrical" },
        { value: "plumbing", label: "Plumbing" },
        { value: "hvac", label: "HVAC" },
        { value: "carpentry", label: "Carpentry" },
        { value: "masonry", label: "Masonry" },
        { value: "painting", label: "Painting" },
        { value: "roofing", label: "Roofing" },
        { value: "flooring", label: "Flooring" },
        { value: "specilist", label: "Specilist" },
        { value: "fire_safty", label: "Fire Safty" },
        { value: "steel_fabricator", label: "Steel Fabricator" },
        { value: "automation", label: "Automation" },
        { value: "plasterers", label: "Plasterers" },
    ];

    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async (retryCount = 0) => {
        try {
            setLoading(true);
            setError(null);
            const data = await externalTradeService?.getAllTrades();
            setTrades(data);
        } catch (error) {
            console.error("Error fetching trades:", error);

            // Retry once if it's a schema cache error
            if (retryCount === 0 && error?.message?.toLowerCase()?.includes("schema cache")) {
                setTimeout(() => fetchTrades(1), 1000);
                return;
            }

            setError(error?.message || "Failed to load trades");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddTradeModal = () => {
        setFormData({
            tradeCategory: "",
            scopeOfWork: "",
            description: "",
        });
        setErrors({});
        setIsAddTradeModalOpen(true);
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors?.[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData?.tradeCategory) {
            newErrors.tradeCategory = "Trade Category is required";
        }
        if (!formData?.scopeOfWork?.trim()) {
            newErrors.scopeOfWork = "Scope of Work is required";
        }
        if (!formData?.description?.trim()) {
            newErrors.description = "Description is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors)?.length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);
            await externalTradeService?.createTrade(formData);

            setIsAddTradeModalOpen(false);
            setFormData({
                tradeCategory: "",
                scopeOfWork: "",
                description: "",
            });

            await fetchTrades();
        } catch (error) {
            console.error("Error adding trade:", error);
            setErrors({ submit: error?.message || "Failed to add trade" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTrade = async (id) => {
        if (!window.confirm("Are you sure you want to delete this trade?")) {
            return;
        }

        try {
            await externalTradeService?.deleteTrade(id);
            await fetchTrades();
        } catch (error) {
            console.error("Error deleting trade:", error);
        }
    };

    const getCategoryLabel = (value) => {
        return tradeCategoryOptions?.find((opt) => opt?.value === value)?.label || value;
    };

    return (
        <RoleBasedAccess requiredPermission="admin">
            <div className="flex min-h-screen bg-background">
                <Sidebar collapsed={isSidebarCollapsed} onToggleCollapse={setIsSidebarCollapsed} />

                <main className="flex-1 ml-[68px] transition-smooth">
                    <div className="sticky top-0 z-40 bg-card border-b border-border">
                        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                                        External Trade
                                    </h1>
                                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                                        Manage external trade partners and configurations
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <IntegrationStatus compact />
                                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                        <Icon name="Building2" size={20} color="#FFFFFF" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SystemsConfigTabs />
                    </div>

                    <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
                        <Breadcrumb />

                        <div className="max-w-[1600px] mx-auto">
                            <div className="mb-6 flex justify-end">
                                <Button onClick={handleOpenAddTradeModal} className="flex items-center gap-2">
                                    <Icon name="Plus" size={18} />
                                    Add Trade
                                </Button>
                            </div>

                            <div className="bg-card rounded-lg border border-border shadow-brand">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-sm text-muted-foreground">Loading trades...</p>
                                    </div>
                                ) : trades?.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-8">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                            <Icon name="Building2" size={32} className="text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                                            No External Trades Yet
                                        </h3>
                                        <p className="text-sm text-muted-foreground text-center max-w-md">
                                            Click "Add Trade" to create your first external trade entry.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-muted/50 border-b border-border">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                                        Trade Code
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                                        Category
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                                        Scope of Work
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                                        Description
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {trades?.map((trade) => (
                                                    <tr key={trade?.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-md bg-primary/10 text-primary font-mono font-semibold text-sm">
                                                                {trade?.tradeCode}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-foreground">
                                                            {getCategoryLabel(trade?.tradeCategory)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate">
                                                            {trade?.scopeOfWork}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                                                            {trade?.description}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => handleDeleteTrade(trade?.id)}
                                                                className="text-destructive hover:text-destructive/80 transition-colors"
                                                                title="Delete trade"
                                                            >
                                                                <Icon name="Trash2" size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Trade Modal */}
            {isAddTradeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h3 className="text-lg font-heading font-semibold text-foreground">Add New Trade</h3>
                                <p className="text-sm text-muted-foreground mt-1">Trade code will be auto-generated</p>
                            </div>
                            <button
                                onClick={() => setIsAddTradeModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                disabled={submitting}
                            >
                                <Icon name="X" size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div className="space-y-6">
                                {/* Trade Category */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Trade Category <span className="text-destructive">*</span>
                                    </label>
                                    <Select
                                        value={formData?.tradeCategory}
                                        onChange={(value) => handleInputChange("tradeCategory", value)}
                                        options={tradeCategoryOptions}
                                        placeholder="Select trade category"
                                    />
                                    {errors?.tradeCategory && (
                                        <p className="text-sm text-destructive mt-1">{errors?.tradeCategory}</p>
                                    )}
                                </div>

                                {/* Scope of Work */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Scope of Work <span className="text-destructive">*</span>
                                    </label>
                                    <textarea
                                        value={formData?.scopeOfWork}
                                        onChange={(e) => handleInputChange("scopeOfWork", e?.target?.value)}
                                        placeholder="Enter scope of work"
                                        rows={4}
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                        disabled={submitting}
                                    />
                                    {errors?.scopeOfWork && (
                                        <p className="text-sm text-destructive mt-1">{errors?.scopeOfWork}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Description <span className="text-destructive">*</span>
                                    </label>
                                    <textarea
                                        value={formData?.description}
                                        onChange={(e) => handleInputChange("description", e?.target?.value)}
                                        placeholder="Enter description"
                                        rows={4}
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                        disabled={submitting}
                                    />
                                    {errors?.description && (
                                        <p className="text-sm text-destructive mt-1">{errors?.description}</p>
                                    )}
                                </div>

                                {errors?.submit && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                        <p className="text-sm text-destructive">{errors?.submit}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                            <Button
                                type="button"
                                onClick={() => setIsAddTradeModalOpen(false)}
                                variant="outline"
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? "Adding..." : "Add Trade"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </RoleBasedAccess>
    );
};

export default ExternalTrade;
