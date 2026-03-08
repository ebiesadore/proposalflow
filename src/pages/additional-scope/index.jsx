import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumb from '../../components/ui/Breadcrumb';
import SystemsConfigTabs from '../../components/ui/SystemsConfigTabs';
import RoleBasedAccess from '../../components/ui/RoleBasedAccess';
import IntegrationStatus from '../../components/ui/IntegrationStatus';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { additionalScopeService } from '../../services/additionalScopeService';

const AdditionalScope = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAddScopeModalOpen, setIsAddScopeModalOpen] = useState(false);
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    scopeCategory: '',
    scopeOfWork: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  const scopeCategoryOptions = [
    { value: 'site_preparation', label: 'Site Preparation' },
    { value: 'landscaping', label: 'Landscaping' },
    { value: 'security_systems', label: 'Security Systems' },
    { value: 'signage', label: 'Signage' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'technology', label: 'Technology' },
    { value: 'permits', label: 'Permits & Fees' },
    { value: 'consulting', label: 'Consulting Services' },
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

  useEffect(() => {
    fetchScopes();
  }, []);

  const fetchScopes = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const data = await additionalScopeService?.getAllScopes();
      setScopes(data);
    } catch (error) {
      console.error('Error fetching scopes:', error);
      
      // Retry once if it's a schema cache error
      if (retryCount === 0 && error?.message?.toLowerCase()?.includes('schema cache')) {
        setTimeout(() => fetchScopes(1), 1000);
        return;
      }
      
      setError(error?.message || 'Failed to load scopes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddScopeModal = () => {
    setFormData({
      scopeCategory: '',
      scopeOfWork: '',
      description: ''
    });
    setErrors({});
    setIsAddScopeModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.scopeCategory) {
      newErrors.scopeCategory = 'Scope Category is required';
    }
    if (!formData?.scopeOfWork?.trim()) {
      newErrors.scopeOfWork = 'Scope of Work is required';
    }
    if (!formData?.description?.trim()) {
      newErrors.description = 'Description is required';
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
      await additionalScopeService?.createScope(formData);
      
      setIsAddScopeModalOpen(false);
      setFormData({
        scopeCategory: '',
        scopeOfWork: '',
        description: ''
      });
      
      await fetchScopes();
    } catch (error) {
      console.error('Error adding scope:', error);
      setErrors({ submit: error?.message || 'Failed to add scope' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteScope = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scope?')) {
      return;
    }

    try {
      await additionalScopeService?.deleteScope(id);
      await fetchScopes();
    } catch (error) {
      console.error('Error deleting scope:', error);
    }
  };

  const getCategoryLabel = (value) => {
    return scopeCategoryOptions?.find(opt => opt?.value === value)?.label || value;
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
              <div className="mb-6 flex justify-end">
                <Button
                  onClick={handleOpenAddScopeModal}
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
                              <button
                                onClick={() => handleDeleteScope(scope?.id)}
                                className="text-destructive hover:text-destructive/80 transition-colors"
                                title="Delete scope"
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

      {/* Add Scope Modal */}
      {isAddScopeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-gray-100">Add New Scope</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Scope code will be auto-generated</p>
              </div>
              <button
                onClick={() => setIsAddScopeModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                disabled={submitting}
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Scope Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Scope Category <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData?.scopeCategory}
                    onChange={(value) => handleInputChange('scopeCategory', value)}
                    options={scopeCategoryOptions}
                    placeholder="Select scope category"
                  />
                  {errors?.scopeCategory && (
                    <p className="text-sm text-destructive mt-1">{errors?.scopeCategory}</p>
                  )}
                </div>

                {/* Scope of Work */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Scope of Work <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={formData?.scopeOfWork}
                    onChange={(e) => handleInputChange('scopeOfWork', e?.target?.value)}
                    placeholder="Enter scope of work"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-colors"
                    disabled={submitting}
                  />
                  {errors?.scopeOfWork && (
                    <p className="text-sm text-destructive mt-1">{errors?.scopeOfWork}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={formData?.description}
                    onChange={(e) => handleInputChange('description', e?.target?.value)}
                    placeholder="Enter description"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-colors"
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

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={() => setIsAddScopeModalOpen(false)}
                variant="outline"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Scope'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </RoleBasedAccess>
  );
};

export default AdditionalScope;