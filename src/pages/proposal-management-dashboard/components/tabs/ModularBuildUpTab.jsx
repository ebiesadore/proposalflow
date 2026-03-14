import React, { useState, useRef, useMemo, useEffect } from 'react';
import Button from '../../../../components/ui/Button';
import Icon from '../../../../components/AppIcon';
import AddModuleModal from '../AddModuleModal';
import { formatNumber } from '../../../../utils/decimalMath';
import DecimalMath from '../../../../utils/decimalMath';

const USE_MEMO_CALCULATIONS = import.meta.env?.VITE_USE_MEMO_CALCULATIONS === 'true';

const ModularBuildUpTab = ({ formData, onChange, onComputedTotalChange, errors }) => {
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]);
  const [editingModule, setEditingModule] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragIndexRef = React.useRef(null);

  // Category mapping for display
  const categoryLabels = {
    'ppvc-module': 'PPVC Module',
    'floor-cassettes': 'floor Cassettes',
    'roof-cassettes': 'Roof Cassettes',
    'roof-modules-flat': 'Roof Modules Flat',
    'roof-module-pitched': 'Roof Module Pitched',
    'roof-module-hybrid': 'Roof Module Hybrid',
    'panelized-module': 'Panelized Module',
    'kit-of-parts': 'Kit of Parts'
  };

  const handleAddModule = () => {
    setEditingModule(null);
    setIsAddModuleModalOpen(true);
  };

  const handleEditModule = (module) => {
    setEditingModule(module);
    setIsAddModuleModalOpen(true);
  };

  const handleSaveModule = (moduleData) => {
    if (editingModule) {
      // Update existing module
      onChange('modules', formData?.modules?.map((m) =>
      m?.id === editingModule?.id ? { ...moduleData, id: editingModule?.id } : m
      ));
    } else {
      // Add new module
      const newModule = {
        id: Date.now(),
        ...moduleData
      };
      onChange('modules', [...(formData?.modules || []), newModule]);
    }
  };

  const handleRemoveModule = (id) => {
    onChange('modules', formData?.modules?.filter((m) => m?.id !== id));
    setSelectedModules(selectedModules?.filter((selectedId) => selectedId !== id));
  };

  const handleSelectModule = (id) => {
    setSelectedModules((prev) =>
    prev?.includes(id) ?
    prev?.filter((selectedId) => selectedId !== id) :
    [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e?.target?.checked) {
      setSelectedModules(formData?.modules?.map((m) => m?.id) || []);
    } else {
      setSelectedModules([]);
    }
  };

  const calculateTotalQuantity = () => {
    return formData?.modules?.reduce((sum, m) => sum + DecimalMath?.parse(m?.quantity, 0), 0);
  };

  const calculateTotalWeight = () => {
    return formData?.modules?.reduce((sum, m) => sum + DecimalMath?.parse(m?.weightKg, 0), 0);
  };

  const calculateTotalArea = () => {
    const totalM2 = formData?.modules?.reduce((sum, m) => {
      const quantity = DecimalMath?.parse(m?.quantity, 0);
      const areaM2 = DecimalMath?.parse(m?.areaMM, 0) || DecimalMath?.multiply(DecimalMath?.parse(m?.areaFeet, 0), 0.092903);
      return sum + DecimalMath?.multiply(quantity, areaM2);
    }, 0);

    const totalFt2 = formData?.modules?.reduce((sum, m) => {
      const quantity = DecimalMath?.parse(m?.quantity, 0);
      const areaFt2 = DecimalMath?.parse(m?.areaFeet, 0) || DecimalMath?.divide(DecimalMath?.parse(m?.areaMM, 0), 0.092903);
      return sum + DecimalMath?.multiply(quantity, areaFt2);
    }, 0);

    return { m2: totalM2, ft2: totalFt2 };
  };

  const calculateModuleTypes = () => {
    return formData?.modules?.length || 0;
  };

  const calculateBudgetValue = () => {
    return formData?.modules?.reduce((sum, m) => {
      const quantity = DecimalMath?.parse(m?.quantity, 0);
      const costPerUnit = DecimalMath?.parse(m?.costPerUnit, 0);
      const areaFt2 = DecimalMath?.parse(m?.areaFeet, 0);
      const modUnitRate = DecimalMath?.multiply(costPerUnit, areaFt2); // Mod Unit Rate = Cost per Unit $ * module area ft²
      const modTotalPrice = DecimalMath?.multiply(modUnitRate, quantity); // Mod Total Price = Mod Unit Rate * QTY
      return sum + modTotalPrice;
    }, 0);
  };

  // PUSH ARCHITECTURE: Compute budgetValue via useMemo and push to formData.computedTotals
  const budgetValueMemo = useMemo(() => {
    return (formData?.modules || [])?.reduce((sum, m) => {
      const quantity = DecimalMath?.parse(m?.quantity, 0);
      const costPerUnit = DecimalMath?.parse(m?.costPerUnit, 0);
      const areaFt2 = DecimalMath?.parse(m?.areaFeet, 0);
      const modUnitRate = DecimalMath?.multiply(costPerUnit, areaFt2);
      const modTotalPrice = DecimalMath?.multiply(modUnitRate, quantity);
      return sum + modTotalPrice;
    }, 0);
  }, [formData?.modules]);

  const lastPushedBudgetValueRef = useRef(null);
  useEffect(() => {
    if (lastPushedBudgetValueRef?.current === budgetValueMemo) return;
    lastPushedBudgetValueRef.current = budgetValueMemo;
    if (onComputedTotalChange) {
      onComputedTotalChange('budgetValue', budgetValueMemo);
    } else if (onChange) {
      onChange('computedTotals', {
        ...(formData?.computedTotals || {}),
        budgetValue: budgetValueMemo,
      });
    }
  }, [budgetValueMemo]);

  const calculateCategoryTotals = () => {
    const categoryTotals = {};

    formData?.modules?.forEach((module) => {
      const category = module?.category;
      if (!category) return;

      const quantity = DecimalMath?.parse(module?.quantity, 0);
      const areaM2 = DecimalMath?.parse(module?.areaMM, 0) || DecimalMath?.multiply(DecimalMath?.parse(module?.areaFeet, 0), 0.092903);
      const areaFt2 = DecimalMath?.parse(module?.areaFeet, 0) || DecimalMath?.divide(DecimalMath?.parse(module?.areaMM, 0), 0.092903);

      if (!categoryTotals?.[category]) {
        categoryTotals[category] = {
          name: categoryLabels?.[category] || category,
          totalM2: 0,
          totalFt2: 0
        };
      }

      categoryTotals[category].totalM2 += DecimalMath?.multiply(quantity, areaM2);
      categoryTotals[category].totalFt2 += DecimalMath?.multiply(quantity, areaFt2);
    });

    // Convert to array and sort by largest area (ft²) to smallest
    return Object.values(categoryTotals)?.sort((a, b) => b?.totalFt2 - a?.totalFt2);
  };

  const handleDragStart = (index) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e, index) => {
    e?.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index) => {
    const fromIndex = dragIndexRef?.current;
    if (fromIndex === null || fromIndex === index) {
      setDragOverIndex(null);
      dragIndexRef.current = null;
      return;
    }
    const reordered = [...(formData?.modules || [])];
    const [moved] = reordered?.splice(fromIndex, 1);
    reordered?.splice(index, 0, moved);
    onChange('modules', reordered);
    setDragOverIndex(null);
    dragIndexRef.current = null;
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    dragIndexRef.current = null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Modular Build Up</h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Define modular components for the project</p>
        </div>
        <Button
          onClick={handleAddModule}
          className="flex items-center gap-2">

          <Icon name="Plus" size={16} />
          Create Module
        </Button>
      </div>
      {/* Modules Table */}
      {formData?.modules && formData?.modules?.length > 0 ?
      <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-2 py-3 text-center w-12">
                    <Icon name="GripVertical" size={16} className="text-muted-foreground" />
                  </th>
                  <th className="px-2 py-3 text-center w-12">
                    <input
                    type="checkbox"
                    checked={selectedModules?.length === formData?.modules?.length}
                    onChange={handleSelectAll}
                    className="rounded border-border" />

                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Module Name</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Module Category</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">QTY</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Unit Rate $ PSF</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">MOD UNIT $</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Mod Total Price</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">LENGTH </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">WIDTH</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">HEIGHT</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">AREA</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Weight</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Unit Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white dark:bg-gray-800 transition-colors">
                {formData?.modules?.map((module, index) => {
                const quantity = DecimalMath?.parse(module?.quantity, 0);
                const costPerUnit = DecimalMath?.parse(module?.costPerUnit, 0);
                const unitRatePSF = costPerUnit; // Unit Rate $ PSF = Cost per Unit $
                const areaFt2 = DecimalMath?.parse(module?.areaFeet, 0);
                const modUnitRate = DecimalMath?.multiply(costPerUnit, areaFt2); // Mod Unit Rate = Cost per Unit $ * module area ft²
                const modTotalPrice = DecimalMath?.multiply(modUnitRate, quantity); // Mod Total Price = Mod Unit Rate * QTY

                // Determine which unit was used for input and calculate both
                let lengthMM, widthMM, heightMM, lengthFT, widthFT, heightFT;

                // Check if MM values exist
                if (module?.lengthMM || module?.widthMM || module?.heightMM) {
                  lengthMM = DecimalMath?.parse(module?.lengthMM, 0);
                  widthMM = DecimalMath?.parse(module?.widthMM, 0);
                  heightMM = DecimalMath?.parse(module?.heightMM, 0);
                  // Convert MM to FT (1 foot = 304.8 mm)
                  lengthFT = DecimalMath?.divide(lengthMM, 304.8);
                  widthFT = DecimalMath?.divide(widthMM, 304.8);
                  heightFT = DecimalMath?.divide(heightMM, 304.8);
                } else {
                  // Use Feet values and convert to MM
                  lengthFT = DecimalMath?.parse(module?.lengthFeet, 0);
                  widthFT = DecimalMath?.parse(module?.widthFeet, 0);
                  heightFT = DecimalMath?.parse(module?.heightFeet, 0);
                  lengthMM = DecimalMath?.multiply(lengthFT, 304.8);
                  widthMM = DecimalMath?.multiply(widthFT, 304.8);
                  heightMM = DecimalMath?.multiply(heightFT, 304.8);
                }

                // Area and Volume - use saved values or calculate
                const areaM2 = DecimalMath?.parse(module?.areaMM, 0);
                const volumeM3 = DecimalMath?.parse(module?.volumeM3, 0);
                const volumeFT3 = DecimalMath?.parse(module?.volumeFeet, 0) || DecimalMath?.multiply(volumeM3, 35.3147);

                return (
                  <tr
                    key={module?.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={`hover:bg-muted/30 dark:hover:bg-gray-750 transition-colors${dragOverIndex === index ? ' outline outline-2 outline-primary bg-primary/5' : ''}`}
                  >
                    <td className="px-2 py-3 text-center">
                      <Icon name="GripVertical" size={16} className="text-muted-foreground cursor-move" />
                    </td>
                    <td className="px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedModules?.includes(module?.id)}
                        onChange={() => handleSelectModule(module?.id)}
                        className="rounded border-border" />

                    </td>
                    <td className="px-4 py-3 text-sm font-medium dark:text-gray-100">{module?.moduleName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center dark:text-gray-300">{categoryLabels?.[module?.category] || module?.category || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center dark:text-gray-300">{quantity}</td>
                    <td className="px-4 py-3 text-sm text-center dark:text-gray-300">${formatNumber(unitRatePSF)}</td>
                    <td className="px-4 py-3 text-sm text-center dark:text-gray-300">${formatNumber(modUnitRate)}</td>
                    <td className="px-4 py-3 text-sm text-center dark:text-gray-300">${formatNumber(modTotalPrice)}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="text-xs font-medium dark:text-gray-100">{formatNumber(lengthMM)} MM</div>
                      <div className="text-xs text-muted-foreground">{formatNumber(lengthFT, 2)} FT</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="text-xs font-medium dark:text-gray-100">{formatNumber(widthMM)} MM</div>
                      <div className="text-xs text-muted-foreground">{formatNumber(widthFT, 2)} FT</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="text-xs font-medium dark:text-gray-100">{formatNumber(heightMM)} MM</div>
                      <div className="text-xs text-muted-foreground">{formatNumber(heightFT, 2)} FT</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="text-xs font-medium dark:text-gray-100">{formatNumber(areaM2, 2)} M²</div>
                      <div className="text-xs text-muted-foreground">{formatNumber(areaFt2, 2)} FT²</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center mx-0 pl-7 pr-[25px] dark:text-gray-300">{formatNumber(module?.weightKg)} kg</td>
                    <td className="px-4 py-3 text-sm text-center dark:text-gray-300">{module?.unitType || module?.moduleFeatures || 'Dry'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditModule(module)}
                          className="h-7 w-7 text-primary hover:bg-primary/10"
                          title="Edit module">

                          <Icon name="Edit" size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveModule(module?.id)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          title="Delete module">

                          <Icon name="Trash2" size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>);


              })}
              </tbody>
            </table>
          </div>
        </div> :

      <div className="border border-border rounded-lg p-12 text-center">
          <Icon name="Package" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Modules Added</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start by adding modules to your proposal
          </p>
          <Button onClick={handleAddModule} className="flex items-center gap-2 mx-auto">
            <Icon name="Plus" size={16} />
            Add First Module
          </Button>
        </div>
      }
      {/* Large Summary Info Boxes */}
      {formData?.modules && formData?.modules?.length > 0 &&
      <div className="grid grid-cols-5 gap-4 mt-6">
          {/* Total Module Qty */}
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">Total Module Qty</div>
            <div className="text-2xl font-bold">{formatNumber(calculateTotalQuantity())}</div>
          </div>

          {/* Module Types */}
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">Module Types</div>
            <div className="text-2xl font-bold">{calculateModuleTypes()}</div>
          </div>

          {/* Area (m²) */}
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">Area (m²):</div>
            <div className="text-2xl font-bold">{formatNumber(calculateTotalArea()?.m2)} m²</div>
          </div>

          {/* Area (Ft²) */}
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">Area (Ft²):</div>
            <div className="text-2xl font-bold">{formatNumber(calculateTotalArea()?.ft2)} Ft²</div>
          </div>

          {/* Budget Value */}
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">Budget Value</div>
            <div className="text-2xl font-bold">${formatNumber(calculateBudgetValue())}</div>
          </div>
        </div>
      }
      {/* Module Category Totals */}
      {formData?.modules && formData?.modules?.length > 0 && calculateCategoryTotals()?.length > 0 &&
      <div className="mt-6">
          <h4 className="text-md font-semibold mb-4">Module Category Totals</h4>
          <div className="grid grid-cols-3 gap-4">
            {calculateCategoryTotals()?.map((category, index) =>
          <div key={index} className="bg-card border border-border rounded-lg p-6">
                <div className="text-lg font-semibold mb-4">{category?.name}</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Area (ft²):</span>
                    <span className="text-lg font-bold">{formatNumber(category?.totalFt2, 2)} ft²</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Area (M²):</span>
                    <span className="text-lg font-bold">{formatNumber(category?.totalM2, 2)} M²</span>
                  </div>
                </div>
              </div>
          )}
          </div>
        </div>
      }
      <AddModuleModal
        isOpen={isAddModuleModalOpen}
        onClose={() => setIsAddModuleModalOpen(false)}
        onSave={handleSaveModule}
        editingModule={editingModule} />
    </div>
  );


};

export default ModularBuildUpTab;