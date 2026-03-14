import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/ui/Sidebar";
import Breadcrumb from "../../components/ui/Breadcrumb";
import SystemsConfigTabs from "../../components/ui/SystemsConfigTabs";
import RoleBasedAccess from "../../components/ui/RoleBasedAccess";
import IntegrationStatus from "../../components/ui/IntegrationStatus";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import { externalTradeService, tradeCategoryService } from "../../services/externalTradeService";

const FALLBACK_CATEGORIES = [
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

const EMPTY_TRADE_FORM = { tradeCategory: "", scopeOfWork: "", description: "" };
const EMPTY_CATEGORY_FORM = { value: "", label: "" };

const ExternalTrade = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Categories state
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    // Add/Edit Trade modal
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [editingTradeId, setEditingTradeId] = useState(null);
    const [tradeForm, setTradeForm] = useState(EMPTY_TRADE_FORM);
    const [tradeErrors, setTradeErrors] = useState({});
    const [tradeSubmitting, setTradeSubmitting] = useState(false);

    // Manage Categories modal
    const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
    const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
    const [categoryErrors, setCategoryErrors] = useState({});
    const [categorySubmitting, setCategorySubmitting] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [deletingCategoryId, setDeletingCategoryId] = useState(null);

    useEffect(() => {
        fetchTrades();
        fetchCategories();
    }, []);

    const fetchTrades = async (retryCount = 0) => {
        try {
            setLoading(true);
            setError(null);
            const data = await externalTradeService?.getAllTrades();
            setTrades(data);
        } catch (err) {
            console.error("Error fetching trades:", err);
            if (retryCount === 0 && err?.message?.toLowerCase()?.includes("schema cache")) {
                setTimeout(() => fetchTrades(1), 1000);
                return;
            }
            setError(err?.message || "Failed to load trades");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = useCallback(async () => {
        try {
            setCategoriesLoading(true);
            const data = await tradeCategoryService?.getAllCategories();
            if (data?.length > 0) {
                setCategories(data);
            } else {
                // Seed defaults then re-fetch
                await tradeCategoryService?.seedDefaultCategories();
                const seeded = await tradeCategoryService?.getAllCategories();
                setCategories(seeded?.length > 0 ? seeded : FALLBACK_CATEGORIES);
            }
        } catch (err) {
            console.error("Error fetching trade categories:", err);
            setCategories(FALLBACK_CATEGORIES);
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    const getCategoryLabel = (value) => {
        return categories?.find((opt) => opt?.value === value)?.label || value;
    };

    // ─── Trade Modal ───────────────────────────────────────────────────────────

    const handleOpenAddTradeModal = () => {
        setTradeForm(EMPTY_TRADE_FORM);
        setTradeErrors({});
        setEditingTradeId(null);
        setIsTradeModalOpen(true);
    };

    const handleOpenEditTradeModal = (trade) => {
        setTradeForm({
            tradeCategory: trade?.tradeCategory || "",
            scopeOfWork: trade?.scopeOfWork || "",
            description: trade?.description || "",
        });
        setTradeErrors({});
        setEditingTradeId(trade?.id);
        setIsTradeModalOpen(true);
    };

    const handleTradeInputChange = (field, value) => {
        setTradeForm((prev) => ({ ...prev, [field]: value }));
        if (tradeErrors?.[field]) setTradeErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const validateTradeForm = () => {
        const newErrors = {};
        if (!tradeForm?.tradeCategory) newErrors.tradeCategory = "Trade Category is required";
        if (!tradeForm?.scopeOfWork?.trim()) newErrors.scopeOfWork = "Scope of Work is required";
        if (!tradeForm?.description?.trim()) newErrors.description = "Description is required";
        setTradeErrors(newErrors);
        return Object.keys(newErrors)?.length === 0;
    };

    const handleTradeSubmit = async () => {
        if (!validateTradeForm()) return;
        try {
            setTradeSubmitting(true);
            if (editingTradeId) {
                await externalTradeService?.updateTrade(editingTradeId, tradeForm);
            } else {
                await externalTradeService?.createTrade(tradeForm);
            }
            setIsTradeModalOpen(false);
            setTradeForm(EMPTY_TRADE_FORM);
            setEditingTradeId(null);
            await fetchTrades();
        } catch (err) {
            console.error("Error saving trade:", err);
            setTradeErrors({ submit: err?.message || "Failed to save trade" });
        } finally {
            setTradeSubmitting(false);
        }
    };

    const handleDeleteTrade = async (id) => {
        if (!window.confirm("Are you sure you want to delete this trade?")) return;
        try {
            await externalTradeService?.deleteTrade(id);
            await fetchTrades();
        } catch (err) {
            console.error("Error deleting trade:", err);
        }
    };

    // ─── Category Modal ────────────────────────────────────────────────────────

    const handleOpenCategoriesModal = () => {
        setCategoryForm(EMPTY_CATEGORY_FORM);
        setCategoryErrors({});
        setEditingCategoryId(null);
        setIsCategoriesModalOpen(true);
    };

    const handleEditCategory = (cat) => {
        setCategoryForm({ value: cat?.value || "", label: cat?.label || "" });
        setCategoryErrors({});
        setEditingCategoryId(cat?.id);
    };

    const handleCancelCategoryEdit = () => {
        setCategoryForm(EMPTY_CATEGORY_FORM);
        setCategoryErrors({});
        setEditingCategoryId(null);
    };

    const validateCategoryForm = () => {
        const newErrors = {};
        if (!categoryForm?.label?.trim()) newErrors.label = "Category name is required";
        if (!categoryForm?.value?.trim()) newErrors.value = "Category key is required";
        setCategoryErrors(newErrors);
        return Object.keys(newErrors)?.length === 0;
    };

    const handleCategorySubmit = async () => {
        if (!validateCategoryForm()) return;
        try {
            setCategorySubmitting(true);
            if (editingCategoryId) {
                await tradeCategoryService?.updateCategory(editingCategoryId, categoryForm);
            } else {
                await tradeCategoryService?.createCategory(categoryForm);
            }
            setCategoryForm(EMPTY_CATEGORY_FORM);
            setCategoryErrors({});
            setEditingCategoryId(null);
            await fetchCategories();
        } catch (err) {
            console.error("Error saving category:", err);
            setCategoryErrors({ submit: err?.message || "Failed to save category" });
        } finally {
            setCategorySubmitting(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        try {
            setDeletingCategoryId(id);
            await tradeCategoryService?.deleteCategory(id);
            await fetchCategories();
        } catch (err) {
            console.error("Error deleting category:", err);
        } finally {
            setDeletingCategoryId(null);
        }
    };

    const categoryOptions = categories?.map((c) => ({ value: c?.value, label: c?.label }));

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
                            <div className="mt-4 mb-6 flex justify-end gap-3">
                                <Button
                                    onClick={handleOpenCategoriesModal}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Icon name="Tags" size={18} />
                                    Manage Categories
                                </Button>
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
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleOpenEditTradeModal(trade)}
                                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                                    title="Edit trade"
                                                                >
                                                                    <Icon name="Pencil" size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTrade(trade?.id)}
                                                                    className="text-destructive hover:text-destructive/80 transition-colors"
                                                                    title="Delete trade"
                                                                >
                                                                    <Icon name="Trash2" size={18} />
                                                                </button>
                                                            </div>
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

            {/* Add / Edit Trade Modal */}
            {isTradeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h3 className="text-lg font-heading font-semibold text-foreground">
                                    {editingTradeId ? "Edit Trade" : "Add New Trade"}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {editingTradeId ? "Update trade details below" : "Trade code will be auto-generated"}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsTradeModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                disabled={tradeSubmitting}
                            >
                                <Icon name="X" size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Trade Category <span className="text-destructive">*</span>
                                    </label>
                                    <Select
                                        value={tradeForm?.tradeCategory}
                                        onChange={(value) => handleTradeInputChange("tradeCategory", value)}
                                        options={categoryOptions}
                                        placeholder="Select trade category"
                                    />
                                    {tradeErrors?.tradeCategory && (
                                        <p className="text-sm text-destructive mt-1">{tradeErrors?.tradeCategory}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Scope of Work <span className="text-destructive">*</span>
                                    </label>
                                    <textarea
                                        value={tradeForm?.scopeOfWork}
                                        onChange={(e) => handleTradeInputChange("scopeOfWork", e?.target?.value)}
                                        placeholder="Enter scope of work"
                                        rows={4}
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                        disabled={tradeSubmitting}
                                    />
                                    {tradeErrors?.scopeOfWork && (
                                        <p className="text-sm text-destructive mt-1">{tradeErrors?.scopeOfWork}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Description <span className="text-destructive">*</span>
                                    </label>
                                    <textarea
                                        value={tradeForm?.description}
                                        onChange={(e) => handleTradeInputChange("description", e?.target?.value)}
                                        placeholder="Enter description"
                                        rows={4}
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                        disabled={tradeSubmitting}
                                    />
                                    {tradeErrors?.description && (
                                        <p className="text-sm text-destructive mt-1">{tradeErrors?.description}</p>
                                    )}
                                </div>

                                {tradeErrors?.submit && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                        <p className="text-sm text-destructive">{tradeErrors?.submit}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                            <Button
                                type="button"
                                onClick={() => setIsTradeModalOpen(false)}
                                variant="outline"
                                disabled={tradeSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleTradeSubmit} disabled={tradeSubmitting}>
                                {tradeSubmitting ? (editingTradeId ? "Saving..." : "Adding...") : (editingTradeId ? "Save Changes" : "Add Trade")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Categories Modal */}
            {isCategoriesModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h3 className="text-lg font-heading font-semibold text-foreground">Manage Categories</h3>
                                <p className="text-sm text-muted-foreground mt-1">Add, edit or remove trade categories</p>
                            </div>
                            <button
                                onClick={() => setIsCategoriesModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Icon name="X" size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Add / Edit Category Form */}
                            <div className="bg-muted/30 rounded-lg p-4 mb-6 border border-border">
                                <h4 className="text-sm font-semibold text-foreground mb-3">
                                    {editingCategoryId ? "Edit Category" : "Add New Category"}
                                </h4>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">
                                            Display Name <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={categoryForm?.label}
                                            onChange={(e) => {
                                                const label = e?.target?.value;
                                                const autoValue = editingCategoryId
                                                    ? categoryForm?.value
                                                    : label?.toLowerCase()?.replace(/\s+/g, "_")?.replace(/[^a-z0-9_]/g, "");
                                                setCategoryForm((prev) => ({ ...prev, label, value: autoValue }));
                                                if (categoryErrors?.label) setCategoryErrors((prev) => ({ ...prev, label: "" }));
                                            }}
                                            placeholder="e.g. Electrical"
                                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                        {categoryErrors?.label && (
                                            <p className="text-xs text-destructive mt-1">{categoryErrors?.label}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1">
                                            Key <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={categoryForm?.value}
                                            onChange={(e) => {
                                                setCategoryForm((prev) => ({ ...prev, value: e?.target?.value }));
                                                if (categoryErrors?.value) setCategoryErrors((prev) => ({ ...prev, value: "" }));
                                            }}
                                            placeholder="e.g. electrical"
                                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                        {categoryErrors?.value && (
                                            <p className="text-xs text-destructive mt-1">{categoryErrors?.value}</p>
                                        )}
                                    </div>
                                </div>
                                {categoryErrors?.submit && (
                                    <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md mb-3">
                                        <p className="text-xs text-destructive">{categoryErrors?.submit}</p>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={handleCategorySubmit}
                                        disabled={categorySubmitting}
                                        className="text-sm"
                                    >
                                        {categorySubmitting ? "Saving..." : editingCategoryId ? "Save Changes" : "Add Category"}
                                    </Button>
                                    {editingCategoryId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCancelCategoryEdit}
                                            className="text-sm"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Categories List */}
                            <div className="space-y-2">
                                {categoriesLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : categories?.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">No categories yet.</p>
                                ) : (
                                    categories?.map((cat) => (
                                        <div
                                            key={cat?.id || cat?.value}
                                            className={`flex items-center justify-between px-4 py-3 rounded-md border transition-colors ${
                                                editingCategoryId === cat?.id
                                                    ? "border-primary bg-primary/5" :"border-border bg-card hover:bg-muted/30"
                                            }`}
                                        >
                                            <div>
                                                <span className="text-sm font-medium text-foreground">{cat?.label}</span>
                                                <span className="ml-2 text-xs text-muted-foreground font-mono">{cat?.value}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditCategory(cat)}
                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                    title="Edit category"
                                                >
                                                    <Icon name="Pencil" size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat?.id)}
                                                    disabled={deletingCategoryId === cat?.id}
                                                    className="text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                                                    title="Delete category"
                                                >
                                                    <Icon name="Trash2" size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end p-6 border-t border-border">
                            <Button
                                type="button"
                                onClick={() => setIsCategoriesModalOpen(false)}
                                variant="outline"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </RoleBasedAccess>
    );
};

export default ExternalTrade;
