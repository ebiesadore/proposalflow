import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumb from '../../components/ui/Breadcrumb';
import SystemsConfigTabs from '../../components/ui/SystemsConfigTabs';
import RoleBasedAccess from '../../components/ui/RoleBasedAccess';
import IntegrationStatus from '../../components/ui/IntegrationStatus';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { additionalScopeService, scopeCategoryService } from '../../services/additionalScopeService';

const FALLBACK_CATEGORIES = [
  { value: 'site_preparation', label: 'Site Preparation' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'security_systems', label: 'Security Systems' },
  { value: 'signage', label: 'Signage' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'technology', label: 'Technology' },
  { value: 'permits', label: 'Permits & Fees' },
  { value: 'consultinging', label: 'Consulting Services' },
  { value: 'testing', label: 'Testing & Inspection' },
  { value: 'warranty', label: 'Warranty & Maintenance' },
  { value: 'vertical_mobility', label: 'Vertical Mobility' },
  { value: 'facade', label: 'Facade' },
  { value: 'footing', label: 'Footing' },
  { value: 'mep', label: 'MEP' },
  { value: 'shaft', label: 'Shaft' },
  { value: 'balustrade', label: 'Balustrade' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'fit_out', label: 'Fit Out' },
  { value: 'other', label: 'Other' },
];

const EMPTY_SCOPE_FORM = { scopeCategory: '', scopeOfWork: '', description: '' };
const EMPTY_CATEGORY_FORM = { value: '', label: '' };

const AdditionalScope = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Scopes state
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Categories state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Add/Edit Scope modal
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [editingScopeId, setEditingScopeId] = useState(null);
  const [scopeForm, setScopeForm] = useState(EMPTY_SCOPE_FORM);
  const [scopeErrors, setScopeErrors] = useState({});
  const [scopeSubmitting, setScopeSubmitting] = useState(false);

  // Manage Categories modal
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [categoryErrors, setCategoryErrors] = useState({});
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  useEffect(() => {
    fetchScopes();
    fetchCategories();
  }, []);

  const fetchScopes = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const data = await additionalScopeService?.getAllScopes();
      setScopes(data);
    } catch (err) {
      console.error('Error fetching scopes:', err);
      if (retryCount === 0 && err?.message?.toLowerCase()?.includes('schema cache')) {
        setTimeout(() => fetchScopes(1), 1000);
        return;
      }
      setError(err?.message || 'Failed to load scopes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await scopeCategoryService?.getAllCategories();
      setCategories(data?.length > 0 ? data : FALLBACK_CATEGORIES);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const getCategoryOptions = useCallback(() => {
    return categories?.map(c => ({ value: c?.value, label: c?.label }));
  }, [categories]);

  const getCategoryLabel = useCallback((value) => {
    return categories?.find(c => c?.value === value)?.label || value;
  }, [categories]);

  // ─── Scope Modal ────────────────────────────────────────────────────────────

  const handleOpenAddScope = () => {
    setEditingScopeId(null);
    setScopeForm(EMPTY_SCOPE_FORM);
    setScopeErrors({});
    setIsScopeModalOpen(true);
  };

  const handleOpenEditScope = (scope) => {
    setEditingScopeId(scope?.id);
    setScopeForm({
      scopeCategory: scope?.scopeCategory || '',
      scopeOfWork: scope?.scopeOfWork || '',
      description: scope?.description || '',
    });
    setScopeErrors({});
    setIsScopeModalOpen(true);
  };

  const handleScopeInputChange = (field, value) => {
    setScopeForm(prev => ({ ...prev, [field]: value }));
    if (scopeErrors?.[field]) {
      setScopeErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateScopeForm = () => {
    const newErrors = {};
    if (!scopeForm?.scopeCategory) newErrors.scopeCategory = 'Scope Category is required';
    if (!scopeForm?.scopeOfWork?.trim()) newErrors.scopeOfWork = 'Scope of Work is required';
    if (!scopeForm?.description?.trim()) newErrors.description = 'Description is required';
    setScopeErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleScopeSubmit = async () => {
    if (!validateScopeForm()) return;
    try {
      setScopeSubmitting(true);
      if (editingScopeId) {
        await additionalScopeService?.updateScope(editingScopeId, scopeForm);
      } else {
        await additionalScopeService?.createScope(scopeForm);
      }
      setIsScopeModalOpen(false);
      setScopeForm(EMPTY_SCOPE_FORM);
      await fetchScopes();
    } catch (err) {
      console.error('Error saving scope:', err);
      setScopeErrors({ submit: err?.message || 'Failed to save scope' });
    } finally {
      setScopeSubmitting(false);
    }
  };

  const handleDeleteScope = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scope?')) return;
    try {
      await additionalScopeService?.deleteScope(id);
      await fetchScopes();
    } catch (err) {
      console.error('Error deleting scope:', err);
    }
  };

  // ─── Category Modal ──────────────────────────────────────────────────────────

  const handleOpenManageCategories = () => {
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategoryErrors({});
    setIsCategoriesModalOpen(true);
  };

  const handleEditCategory = (cat) => {
    setEditingCategoryId(cat?.id);
    setCategoryForm({ value: cat?.value || '', label: cat?.label || '' });
    setCategoryErrors({});
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategoryErrors({});
  };

  const handleCategoryInputChange = (field, value) => {
    setCategoryForm(prev => ({ ...prev, [field]: value }));
    if (categoryErrors?.[field]) {
      setCategoryErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateCategoryForm = () => {
    const newErrors = {};
    if (!categoryForm?.label?.trim()) newErrors.label = 'Label is required';
    if (!editingCategoryId && !categoryForm?.value?.trim()) newErrors.value = 'Value is required';
    setCategoryErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleCategorySubmit = async () => {
    if (!validateCategoryForm()) return;
    try {
      setCategorySubmitting(true);
      if (editingCategoryId) {
        await scopeCategoryService?.updateCategory(editingCategoryId, { label: categoryForm?.label });
      } else {
        const slug = categoryForm?.value?.trim()
          ? categoryForm?.value?.trim()?.toLowerCase()?.replace(/\s+/g, '_')
          : categoryForm?.label?.trim()?.toLowerCase()?.replace(/\s+/g, '_');
        await scopeCategoryService?.createCategory({ value: slug, label: categoryForm?.label?.trim() });
      }
      setEditingCategoryId(null);
      setCategoryForm(EMPTY_CATEGORY_FORM);
      await fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      setCategoryErrors({ submit: err?.message || 'Failed to save category' });
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      setDeletingCategoryId(id);
      await scopeCategoryService?.deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  return (
    <RoleBasedAccess requiredPermission="admin">
      <div className="flex min-h-screen bg-background">
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggleCollapse={setIsSidebarCollapsed}
        />

        <main className="flex-1 ml-[68px] transition-smooth">
          <div className="sticky top-0 z-40 bg-card border-b border-border">
            <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                    Additional Scope
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Manage additional scope items and configurations
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <IntegrationStatus compact />
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <Icon name="FileText" size={20} color="#FFFFFF" />
                  </div>
                </div>
              </div>
            </div>

            <SystemsConfigTabs />
          </div>

          <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <Breadcrumb />

            <div className="max-w-[1600px] mx-auto">
              <div className="mt-4 mb-6 flex items-center justify-end gap-3">
                <Button
                  onClick={handleOpenManageCategories}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Icon name="Tag" size={18} />
                  Manage Categories
                </Button>
                <Button
                  onClick={handleOpenAddScope}
                  className="flex items-center gap-2"
                >
                  <Icon name="Plus" size={18} />
                  Add Scope
                </Button>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-brand transition-colors">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading scopes...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12 px-8">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                ) : scopes?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <Icon name="FileText" size={32} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Additional Scopes Yet
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
                      Click "Add Scope" to create your first additional scope entry.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Scope Code</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Category</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Scope of Work</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Description</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {scopes?.map((scope) => (
                          <tr key={scope?.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-md bg-primary/10 text-primary font-mono font-semibold text-sm">
                                {scope?.scopeCode}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                              {getCategoryLabel(scope?.scopeCategory)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                              {scope?.scopeOfWork}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                              {scope?.description}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleOpenEditScope(scope)}
                                  className="text-primary hover:text-primary/80 transition-colors p-1"
                                  title="Edit scope"
                                  disabled={!scope?.id}
                                >
                                  <Icon name="Pencil" size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteScope(scope?.id)}
                                  className="text-destructive hover:text-destructive/80 transition-colors p-1 disabled:opacity-40"
                                  title="Delete scope"
                                  disabled={!scope?.id || scopeSubmitting}
                                >
                                  {scopeSubmitting
                                    ? <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                                    : <Icon name="Trash2" size={18} />
                                  }
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

      {/* Add / Edit Scope Modal */}
      {isScopeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-gray-100">
                  {editingScopeId ? 'Edit Scope' : 'Add New Scope'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {editingScopeId ? 'Update the scope details below' : 'Scope code will be auto-generated'}
                </p>
              </div>
              <button
                onClick={() => setIsScopeModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                disabled={scopeSubmitting}
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Scope Category <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={scopeForm?.scopeCategory}
                    onChange={(value) => handleScopeInputChange('scopeCategory', value)}
                    options={getCategoryOptions()}
                    placeholder="Select scope category"
                  />
                  {scopeErrors?.scopeCategory && (
                    <p className="text-sm text-destructive mt-1">{scopeErrors?.scopeCategory}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Scope of Work <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={scopeForm?.scopeOfWork}
                    onChange={(e) => handleScopeInputChange('scopeOfWork', e?.target?.value)}
                    placeholder="Enter scope of work"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-colors"
                    disabled={scopeSubmitting}
                  />
                  {scopeErrors?.scopeOfWork && (
                    <p className="text-sm text-destructive mt-1">{scopeErrors?.scopeOfWork}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={scopeForm?.description}
                    onChange={(e) => handleScopeInputChange('description', e?.target?.value)}
                    placeholder="Enter description"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-colors"
                    disabled={scopeSubmitting}
                  />
                  {scopeErrors?.description && (
                    <p className="text-sm text-destructive mt-1">{scopeErrors?.description}</p>
                  )}
                </div>

                {scopeErrors?.submit && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{scopeErrors?.submit}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={() => setIsScopeModalOpen(false)}
                variant="outline"
                disabled={scopeSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleScopeSubmit}
                disabled={scopeSubmitting}
              >
                {scopeSubmitting
                  ? (editingScopeId ? 'Saving...' : 'Adding...')
                  : (editingScopeId ? 'Save Changes' : 'Add Scope')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {isCategoriesModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-gray-100">
                  Manage Categories
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add, edit or remove scope categories
                </p>
              </div>
              <button
                onClick={() => setIsCategoriesModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Add / Edit Category Form */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {editingCategoryId ? 'Edit Category' : 'Add New Category'}
                </h4>
                <div className="space-y-3">
                  {!editingCategoryId && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Value (slug) <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={categoryForm?.value}
                        onChange={(e) => handleCategoryInputChange('value', e?.target?.value)}
                        placeholder="e.g. civil_works"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-colors"
                        disabled={categorySubmitting}
                      />
                      {categoryErrors?.value && (
                        <p className="text-xs text-destructive mt-1">{categoryErrors?.value}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Label <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={categoryForm?.label}
                      onChange={(e) => handleCategoryInputChange('label', e?.target?.value)}
                      placeholder="e.g. Civil Works"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-colors"
                      disabled={categorySubmitting}
                    />
                    {categoryErrors?.label && (
                      <p className="text-xs text-destructive mt-1">{categoryErrors?.label}</p>
                    )}
                  </div>
                  {categoryErrors?.submit && (
                    <p className="text-xs text-destructive">{categoryErrors?.submit}</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      onClick={handleCategorySubmit}
                      disabled={categorySubmitting}
                      className="text-sm py-1.5 px-4"
                    >
                      {categorySubmitting
                        ? 'Saving...' : (editingCategoryId ?'Save Changes' : 'Add Category')}
                    </Button>
                    {editingCategoryId && (
                      <Button
                        type="button"
                        onClick={handleCancelCategoryEdit}
                        variant="outline"
                        disabled={categorySubmitting}
                        className="text-sm py-1.5 px-4"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Categories List */}
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {categories?.map((cat) => (
                    <div
                      key={cat?.id || cat?.value}
                      className={`flex items-center justify-between px-4 py-3 transition-colors ${
                        editingCategoryId === cat?.id
                          ? 'bg-primary/5 dark:bg-primary/10' :'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cat?.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{cat?.value}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditCategory(cat)}
                          className="text-primary hover:text-primary/80 transition-colors p-1"
                          title="Edit category"
                          disabled={!cat?.id}
                        >
                          <Icon name="Pencil" size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat?.id)}
                          className="text-destructive hover:text-destructive/80 transition-colors p-1 disabled:opacity-40"
                          title="Delete category"
                          disabled={!cat?.id || deletingCategoryId === cat?.id}
                        >
                          {deletingCategoryId === cat?.id
                            ? <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                            : <Icon name="Trash2" size={15} />
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
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

export default AdditionalScope;