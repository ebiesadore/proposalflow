import React, { useState, useMemo } from 'react';
import Button from '../../../../components/ui/Button';
import Icon from '../../../../components/AppIcon';
import { formatNumber } from '../../../../utils/cn';

// Category mapping for display
const categoryLabels = {
  'ppvc-module': 'PPVC Module',
  'floor-cassettes': 'Floor Cassettes',
  'roof-cassettes': 'Roof Cassettes',
  'roof-modules-flat': 'Roof Modules Flat',
  'roof-module-pitched': 'Roof Module Pitched',
};

const ModuleSelectionModal = ({ isOpen, onClose, modules, onSelectModule, existingModules }) => {
  // Early return BEFORE any hooks
  if (!isOpen) return null;

  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState([]);

  // Group modules by category and aggregate data
  const groupedCategories = useMemo(() => {
    const categoryMap = new Map();

    modules?.forEach((module) => {
      const categoryKey = module?.category;
      if (!categoryKey) return;

      if (!categoryMap?.has(categoryKey)) {
        categoryMap?.set(categoryKey, {
          categoryKey,
          categoryName: categoryLabels?.[categoryKey] || categoryKey,
          modules: [],
          totalQuantity: 0,
          totalAreaFt2: 0,
          unitType: module?.moduleFeatures || 'N/A',
        });
      }

      const categoryData = categoryMap?.get(categoryKey);
      const areaInSqft = module?.areaFeet || (module?.areaMm ? parseFloat(module?.areaMm) / 0.092903 : 0);
      const quantity = parseFloat(module?.quantity) || 1;

      categoryData?.modules?.push(module);
      categoryData.totalQuantity += quantity;
      categoryData.totalAreaFt2 += areaInSqft * quantity;
    });

    return Array.from(categoryMap?.values());
  }, [modules]);

  // Check if a category is already added (any module from that category exists)
  const isCategoryAlreadyAdded = (categoryKey) => {
    return groupedCategories
      ?.find(cat => cat?.categoryKey === categoryKey)
      ?.modules?.some(module => existingModules?.some(em => em?.moduleId === module?.id));
  };

  // Filter available categories (not already added)
  const availableCategories = groupedCategories?.filter(
    cat => !isCategoryAlreadyAdded(cat?.categoryKey)
  ) || [];

  const handleSelectCategory = (categoryKey) => {
    setSelectedCategoryKeys(prev => 
      prev?.includes(categoryKey) 
        ? prev?.filter(key => key !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const handleSelectAll = (e) => {
    if (e?.target?.checked) {
      const availableCategoryKeys = availableCategories?.map(cat => cat?.categoryKey) || [];
      setSelectedCategoryKeys(availableCategoryKeys);
    } else {
      setSelectedCategoryKeys([]);
    }
  };

  const handleAccept = () => {
    // Get selected category data with all modules
    const selectedCategories = groupedCategories?.filter(cat => 
      selectedCategoryKeys?.includes(cat?.categoryKey)
    );

    if (selectedCategories?.length > 0) {
      onSelectModule(selectedCategories);
      setSelectedCategoryKeys([]);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedCategoryKeys([]);
    onClose();
  };

  // Calculate totals for selected categories
  const selectedTotals = useMemo(() => {
    const selected = groupedCategories?.filter(cat => 
      selectedCategoryKeys?.includes(cat?.categoryKey)
    );

    return {
      categoryCount: selected?.length || 0,
      totalModules: selected?.reduce((sum, cat) => sum + cat?.totalQuantity, 0) || 0,
      totalAreaFt2: selected?.reduce((sum, cat) => sum + cat?.totalAreaFt2, 0) || 0,
    };
  }, [groupedCategories, selectedCategoryKeys]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-heading font-semibold text-foreground">
              Select Module Categories
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose module categories from Modular Build Up to add to Materials + Labour
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            iconName="X"
            iconSize={20}
            className="h-8 w-8"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {modules?.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
              <Icon name="Box" size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No modules available</p>
              <p className="text-xs text-muted-foreground">Create modules in the Modular Build Up tab first</p>
            </div>
          ) : availableCategories?.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
              <Icon name="CheckCircle" size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">All categories already added</p>
              <p className="text-xs text-muted-foreground">All available module categories have been added to Materials + Labour</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                <input
                  type="checkbox"
                  checked={selectedCategoryKeys?.length === availableCategories?.length && availableCategories?.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-border text-primary focus:ring-primary h-5 w-5"
                />
                <span className="text-sm font-medium text-foreground">Select All Categories</span>
              </div>

              {/* Category Cards */}
              <div className="grid grid-cols-1 gap-4">
                {groupedCategories?.map((category) => {
                  const alreadyAdded = isCategoryAlreadyAdded(category?.categoryKey);
                  const isSelected = selectedCategoryKeys?.includes(category?.categoryKey);

                  return (
                    <div
                      key={category?.categoryKey}
                      className={`border rounded-lg p-5 transition-all ${
                        alreadyAdded
                          ? 'opacity-50 bg-muted/20 border-border cursor-not-allowed'
                          : isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer'
                      }`}
                      onClick={() => !alreadyAdded && handleSelectCategory(category?.categoryKey)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectCategory(category?.categoryKey)}
                            disabled={alreadyAdded}
                            className="rounded border-border text-primary focus:ring-primary h-5 w-5 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => e?.stopPropagation()}
                          />
                        </div>

                        {/* Category Information */}
                        <div className="flex-1 grid grid-cols-5 gap-4">
                          {/* Module Category Name */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Module Category</div>
                            <div className="text-sm font-semibold text-foreground">
                              {category?.categoryName}
                            </div>
                          </div>

                          {/* Quantity Count */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Quantity</div>
                            <div className="text-sm font-medium text-foreground">
                              {formatNumber(category?.totalQuantity, 0)} modules
                            </div>
                          </div>

                          {/* Total Area (FT²) */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Total Area</div>
                            <div className="text-sm font-medium text-foreground">
                              {formatNumber(category?.totalAreaFt2, 2)} FT²
                            </div>
                          </div>

                          {/* Unit Type */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Unit Type</div>
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary capitalize">
                                {category?.unitType}
                              </span>
                            </div>
                          </div>

                          {/* Status */}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Status</div>
                            <div>
                              {alreadyAdded ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-600">
                                  Already Added
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-600">
                                  Available
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Totals */}
        <div className="border-t border-border">
          {/* Totals Section */}
          {selectedCategoryKeys?.length > 0 && (
            <div className="px-6 py-4 bg-muted/30 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Selected Totals:</span>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Categories: </span>
                    <span className="font-semibold text-foreground">{selectedTotals?.categoryCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Modules: </span>
                    <span className="font-semibold text-foreground">{formatNumber(selectedTotals?.totalModules, 0)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Area: </span>
                    <span className="font-semibold text-foreground">{formatNumber(selectedTotals?.totalAreaFt2, 2)} FT²</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between p-6">
            <p className="text-sm text-muted-foreground">
              {selectedCategoryKeys?.length > 0 ? (
                <span>
                  <span className="font-medium text-foreground">{selectedCategoryKeys?.length}</span> categor{selectedCategoryKeys?.length === 1 ? 'y' : 'ies'} selected
                </span>
              ) : (
                'Select categories to add'
              )}
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleAccept}
                disabled={selectedCategoryKeys?.length === 0}
              >
                Add Selected Modules
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleSelectionModal;