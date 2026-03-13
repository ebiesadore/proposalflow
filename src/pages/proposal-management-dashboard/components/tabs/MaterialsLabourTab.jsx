import React, { useState, useEffect, useRef, useMemo } from 'react';

import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import Icon from '../../../../components/AppIcon';
import ModuleSelectionModal from './ModuleSelectionModal';
import ItemSearchModal from './ItemSearchModal';
import TemplateLoadModal from './TemplateLoadModal';
import DecimalMath from '../../../../utils/decimalMath';
import { formatNumber } from '../../../../utils/decimalMath';

const USE_MEMO_CALCULATIONS = import.meta.env?.VITE_USE_MEMO_CALCULATIONS === 'true';

const MaterialsLabourTab = ({ formData, onChange, errors }) => {
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isItemSearchModalOpen, setIsItemSearchModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [currentEditingEntry, setCurrentEditingEntry] = useState(null);
  const [estimationModel, setEstimationModel] = useState('single-module');
  const [materialsLabourEntries, setMaterialsLabourEntries] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingEstimationModel, setPendingEstimationModel] = useState(null);
  
  // Store onChange in a ref to avoid dependency issues
  const onChangeRef = useRef(onChange);
  
  // Update ref when onChange changes
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Helper function to get smallest PPVC module area in ft²
  const getSmallestPPVCModuleAreaFt2 = () => {
    const modules = formData?.modules || [];
    if (modules?.length === 0) return 0;

    // Category priority order for fallback
    const categoryPriority = [
      'ppvc-module',
      'floor-cassettes',
      'roof-cassettes',
      'roof-modules-flat',
      'roof-module-pitched',
      'roof-module-hybrid',
      'panelized-module',
      'kit-of-parts'
    ];

    // Try to find smallest module in each category (priority order)
    for (const category of categoryPriority) {
      const categoryModules = modules?.filter(m => m?.category === category);
      if (categoryModules?.length > 0) {
        // Find smallest module in this category
        const smallestModule = categoryModules?.reduce((min, module) => {
          const currentAreaFt2 = DecimalMath?.parse(module?.areaFeet, 0);
          const minAreaFt2 = DecimalMath?.parse(min?.areaFeet, 0);
          return currentAreaFt2 < minAreaFt2 ? module : min;
        }, categoryModules?.[0]);

        return DecimalMath?.parse(smallestModule?.areaFeet, 0);
      }
    }

    // If no modules found in any category, return 0
    return 0;
  };

  // Helper function to calculate total area from Modular Build Up (in Ft²)
  const getTotalAreaFromModularBuildUp = () => {
    const modules = formData?.modules || [];
    if (modules?.length === 0) return 0;

    const totalFt2 = modules?.reduce((sum, m) => {
      const quantity = DecimalMath?.parse(m?.quantity, 0);
      const areaFt2 = DecimalMath?.parse(m?.areaFeet, 0) || DecimalMath?.divide(DecimalMath?.parse(m?.areaMM, 0), 0.092903);
      return sum + DecimalMath?.multiply(quantity, areaFt2);
    }, 0);

    return totalFt2;
  };

  // CRITICAL FIX: Initialize from formData when it changes (on load)
  useEffect(() => {
    const savedMaterials = formData?.materials || [];
    const savedLabour = formData?.labour || [];
    
    console.log('=== MATERIALS + LABOUR SYNC EFFECT ===');
    console.log('savedMaterials:', savedMaterials);
    console.log('savedLabour:', savedLabour);
    console.log('current materialsLabourEntries:', materialsLabourEntries);
    
    // If we already have entries in state, don't overwrite them (user is editing)
    if (materialsLabourEntries?.length > 0) {
      console.log('Already have entries, skipping initialization');
      return;
    }
    
    // If no saved data, nothing to initialize
    if (savedMaterials?.length === 0 && savedLabour?.length === 0) {
      console.log('No saved data to initialize');
      return;
    }
    
    console.log('=== INITIALIZING FROM SAVED DATA ===');
    
    // Restore estimation model if saved
    if (formData?.estimationModel) {
      setEstimationModel(formData?.estimationModel);
      console.log('Restored estimation model:', formData?.estimationModel);
    }
    
    // Reconstruct entries from saved data
    const entriesMap = new Map();
    
    savedMaterials?.forEach(material => {
      const key = material?.entryId || 'default';
      if (!entriesMap?.has(key)) {
        entriesMap?.set(key, {
          id: material?.entryId || Date.now(),
          moduleId: material?.moduleId,
          moduleName: material?.moduleName || 'Module',
          moduleAreaM2: material?.moduleAreaM2 || 0,
          moduleAreaFT2: material?.moduleAreaFT2 || 0,
          wastePercent: material?.wastePercent || 5,
          materials: [],
          labour: []
        });
      }
      entriesMap?.get(key)?.materials?.push(material);
    });
    
    savedLabour?.forEach(labour => {
      const key = labour?.entryId || 'default';
      if (!entriesMap?.has(key)) {
        entriesMap?.set(key, {
          id: labour?.entryId || Date.now(),
          moduleId: labour?.moduleId,
          moduleName: labour?.moduleName || 'Module',
          moduleAreaM2: labour?.moduleAreaM2 || 0,
          moduleAreaFT2: labour?.moduleAreaFT2 || 0,
          wastePercent: 5,
          materials: [],
          labour: []
        });
      }
      // Ensure materialId defaults to null for existing proposals (safe backward compat)
      entriesMap?.get(key)?.labour?.push({ materialId: null, ...labour });
    });
    
    const restoredEntries = Array.from(entriesMap?.values());
    console.log('Restored entries:', restoredEntries);
    
    if (restoredEntries?.length > 0) {
      setMaterialsLabourEntries(restoredEntries);
      console.log('=== INITIALIZATION COMPLETE ===');
    }
  }, [formData?.materials, formData?.labour, formData?.estimationModel]); // Re-run when saved data changes

  // NEW: Calculate flattened materials and labour arrays with useMemo
  const flattenedData = useMemo(() => {
    if (!USE_MEMO_CALCULATIONS) return null;

    const allMaterials = [];
    const allLabour = [];
    
    materialsLabourEntries?.forEach(entry => {
      // Add materials with entry context
      entry?.materials?.forEach(material => {
        allMaterials?.push({
          ...material,
          entryId: entry?.id,
          moduleId: entry?.moduleId,
          moduleName: entry?.moduleName,
          moduleAreaM2: entry?.moduleAreaM2,
          moduleAreaFT2: entry?.moduleAreaFT2,
          wastePercent: entry?.wastePercent,
          estimationModel: estimationModel
        });
      });
      
      // Add labour with entry context
      entry?.labour?.forEach(labour => {
        allLabour?.push({
          ...labour,
          entryId: entry?.id,
          moduleId: entry?.moduleId,
          moduleName: entry?.moduleName,
          moduleAreaM2: entry?.moduleAreaM2,
          moduleAreaFT2: entry?.moduleAreaFT2,
          estimationModel: estimationModel
        });
      });
    });

    return { allMaterials, allLabour };
  }, [materialsLabourEntries, estimationModel]);

  // NEW: Sync calculated values to parent when they change (useMemo mode)
  useEffect(() => {
    if (!USE_MEMO_CALCULATIONS || !flattenedData) return;

    console.log('=== SYNCING TO PARENT (useMemo mode) ===');
    console.log('Syncing materials:', flattenedData?.allMaterials);
    console.log('Syncing labour:', flattenedData?.allLabour);
    console.log('Syncing estimationModel:', estimationModel);
    
    // Update parent formData
    onChangeRef?.current('materials', flattenedData?.allMaterials);
    onChangeRef?.current('labour', flattenedData?.allLabour);
    onChangeRef?.current('estimationModel', estimationModel);
  }, [flattenedData, estimationModel]);

  // NEW: Recalculate Per Module Price when modules change (dynamic recalculation)
  useEffect(() => {
    // Only recalculate if we have entries and modules
    if (materialsLabourEntries?.length === 0 || !formData?.modules || formData?.modules?.length === 0) {
      return;
    }

    // Get the current smallest PPVC module area
    const smallestModuleAreaFt2 = getSmallestPPVCModuleAreaFt2();

    // Recalculate all materials in all entries
    const updatedEntries = materialsLabourEntries?.map((entry) => {
      const moduleAreaFt2 = estimationModel === 'per-module-price'
        ? DecimalMath?.parse(entry?.moduleAreaFT2, 0)
        : smallestModuleAreaFt2;

      const updatedMaterials = entry?.materials?.map((material) => {
        const costWastePSQF = DecimalMath?.parse(material?.costWastePSQF, 0);
        const perModulePrice = DecimalMath?.multiply(costWastePSQF, moduleAreaFt2);

        return {
          ...material,
          perModulePrice
        };
      });

      return { ...entry, materials: updatedMaterials };
    });

    // Only update if there are actual changes
    const hasChanges = updatedEntries?.some((entry, index) => {
      const originalEntry = materialsLabourEntries?.[index];
      return entry?.materials?.some((material, matIndex) => {
        const originalMaterial = originalEntry?.materials?.[matIndex];
        return material?.perModulePrice !== originalMaterial?.perModulePrice;
      });
    });

    if (hasChanges) {
      console.log('=== DYNAMIC RECALCULATION: Modules changed, updating Per Module Price ===');
      setMaterialsLabourEntries(updatedEntries);
    }
  }, [formData?.modules, estimationModel]); // Re-run when modules or estimation model changes

  // LEGACY: Sync materialsLabourEntries to parent formData whenever it changes (fallback mode)
  useEffect(() => {
    if (USE_MEMO_CALCULATIONS) return;

    // Transform entries into flat arrays for database storage
    const allMaterials = [];
    const allLabour = [];
    
    materialsLabourEntries?.forEach(entry => {
      // Add materials with entry context
      entry?.materials?.forEach(material => {
        allMaterials?.push({
          ...material,
          entryId: entry?.id,
          moduleId: entry?.moduleId,
          moduleName: entry?.moduleName,
          moduleAreaM2: entry?.moduleAreaM2,
          moduleAreaFT2: entry?.moduleAreaFT2,
          wastePercent: entry?.wastePercent,
          estimationModel: estimationModel
        });
      });
      
      // Add labour with entry context
      entry?.labour?.forEach(labour => {
        allLabour?.push({
          ...labour,
          entryId: entry?.id,
          moduleId: entry?.moduleId,
          moduleName: entry?.moduleName,
          moduleAreaM2: entry?.moduleAreaM2,
          moduleAreaFT2: entry?.moduleAreaFT2,
          estimationModel: estimationModel
        });
      });
    });
    
    console.log('=== SYNCING TO PARENT (legacy mode) ===');
    console.log('Syncing materials:', allMaterials);
    console.log('Syncing labour:', allLabour);
    console.log('Syncing estimationModel:', estimationModel);
    
    // Update parent formData
    onChangeRef?.current('materials', allMaterials);
    onChangeRef?.current('labour', allLabour);
    onChangeRef?.current('estimationModel', estimationModel);
  }, [materialsLabourEntries, estimationModel]);

  const estimationOptions = [
  { value: 'single-module', label: 'Single Module Template' },
  { value: 'per-module-price', label: 'Individual Modules' }];


  const handleEstimationModelChange = (newValue) => {
    // Check if there are existing entries
    if (materialsLabourEntries?.length > 0 && newValue !== estimationModel) {
      // Show warning modal
      setPendingEstimationModel(newValue);
      setShowWarningModal(true);
    } else {
      // No entries, allow change
      setEstimationModel(newValue);
    }
  };

  const handleCloseWarningModal = () => {
    setShowWarningModal(false);
    setPendingEstimationModel(null);
  };

  const handleConfirmEstimationChange = () => {
    // Clear all existing entries
    setMaterialsLabourEntries([]);
    
    // Apply the new estimation model
    setEstimationModel(pendingEstimationModel);
    
    // Close modal
    setShowWarningModal(false);
    setPendingEstimationModel(null);
  };

  const handleAddModel = () => {
    if (estimationModel === 'single-module') {
      // Single Module Estimation: Only allow one module entry
      if (materialsLabourEntries?.length > 0) {
        alert('Single Module Template only allows one module entry. Please remove the existing entry first or switch to Individual Modules.');
        return;
      }

      // Use largest module area
      const modules = formData?.modules || [];
      if (modules?.length === 0) {
        alert('Please add modules in Modular Build Up tab first');
        return;
      }

      // Find largest module by area
      const largestModule = modules?.reduce((max, module) => {
        const currentArea = DecimalMath?.parse(module?.areaMm, 0);
        const maxArea = DecimalMath?.parse(max?.areaMm, 0);
        return currentArea > maxArea ? module : max;
      }, modules?.[0]);

      // Create new entry with largest module (for display purposes)
      // But calculations will use smallest PPVC module
      const moduleAreaM2 = DecimalMath?.parse(largestModule?.areaMm, 0);
      const moduleAreaFT2 = DecimalMath?.parse(largestModule?.areaFeet, 0) || DecimalMath?.multiply(moduleAreaM2, 10.764);

      const newEntry = {
        id: Date.now(),
        moduleId: largestModule?.id,
        moduleName: largestModule?.moduleName,
        moduleAreaM2,
        moduleAreaFT2,
        wastePercent: 5,
        materials: [
        {
          id: Date.now(),
          no: 1,
          item: '',
          costPSQF: 0,
          costWastePSQF: 0,
          costWastePSQM: 0,
          perModulePrice: 0
        }],

        labour: [
        {
          id: Date.now() + 1,
          role: '',
          hours: 0,
          rate: 0,
          total: 0,
          materialId: null,
        }]

      };

      setMaterialsLabourEntries([...materialsLabourEntries, newEntry]);
    } else {
      // Per Module Price Estimation: Show module selection modal
      setIsModuleModalOpen(true);
    }
  };

  const handleSelectModules = (selectedCategories) => {
    // Create entries for each selected category (not individual modules)
    const newEntries = selectedCategories?.map((category) => {
      // Use total category area for calculations
      const categoryTotalAreaFt2 = category?.totalAreaFt2 || 0;
      const categoryTotalAreaM2 = categoryTotalAreaFt2 * 0.092903; // Convert FT² to M²

      return {
        id: Date.now() + Math.random(), // Unique ID for each entry
        moduleId: null, // No specific module, this is a category-level entry
        moduleName: category?.categoryName, // Use category name as the heading
        categoryKey: category?.categoryKey,
        moduleAreaM2: categoryTotalAreaM2,
        moduleAreaFT2: categoryTotalAreaFt2,
        wastePercent: 5,
        materials: [
          {
            id: Date.now(),
            no: 1,
            item: '',
            costPSQF: 0,
            costWastePSQF: 0,
            costWastePSQM: 0,
            perModulePrice: 0
          }
        ],
        labour: [
          {
            id: Date.now() + 1,
            no: 1,
            item: '',
            hours: 0,
            rate: 0,
            total: 0,
            materialId: null,
          }
        ]
      };
    });

    setMaterialsLabourEntries([...materialsLabourEntries, ...newEntries]);
  };

  const handleAddMaterial = (entryId) => {
    setCurrentEditingEntry({ entryId, type: 'material' });
    setIsItemSearchModalOpen(true);
  };

  const handleSelectItem = (item) => {
    const entry = materialsLabourEntries?.find((e) => e?.id === currentEditingEntry?.entryId);
    if (!entry) return;

    // Integrate CSI code into material name
    const materialNameWithCode = item?.csiCode ? `${item?.csiCode} - ${item?.name}` : item?.name;

    // Get unit cost from library material (defaults to 0 if not provided)
    const unitCost = DecimalMath?.parse(item?.unitCost, 0);
    const wastePercent = DecimalMath?.parse(entry?.wastePercent, 5);

    // Calculate initial values based on unit cost
    // $ / Ft2 / W = M Ft2 $ + Waste %
    const costWastePSQF = DecimalMath?.multiply(unitCost, DecimalMath?.add(1, DecimalMath?.divide(wastePercent, 100)));
    
    // $ / M2 / W = M Ft2 $ (converted from ft2 to m2) + Waste %
    const costPSQM = DecimalMath?.multiply(unitCost, 10.764);
    const costWastePSQM = DecimalMath?.multiply(costPSQM, DecimalMath?.add(1, DecimalMath?.divide(wastePercent, 100)));
    
    // Calculate module area based on estimation model
    const moduleAreaFt2 = estimationModel === 'per-module-price'
      ? DecimalMath?.parse(entry?.moduleAreaFT2, 0)
      : getSmallestPPVCModuleAreaFt2();
    const perModulePrice = DecimalMath?.multiply(costWastePSQF, moduleAreaFt2);

    // If materialId is provided, update existing material
    if (currentEditingEntry?.materialId) {
      const updatedEntries = materialsLabourEntries?.map((e) => {
        if (e?.id === currentEditingEntry?.entryId) {
          const updatedMaterials = e?.materials?.map((material) => {
            if (material?.id === currentEditingEntry?.materialId) {
              return { 
                ...material, 
                item: materialNameWithCode,
                libraryItemId: item?.id,
                costPSQF: unitCost,
                costWastePSQF,
                costWastePSQM,
                perModulePrice
              };
            }
            return material;
          });
          return { ...e, materials: updatedMaterials };
        }
        return e;
      });
      setMaterialsLabourEntries(updatedEntries);
    } else {
      // Add new material
      const newMaterial = {
        id: Date.now(),
        no: entry?.materials?.length + 1,
        item: materialNameWithCode,
        libraryItemId: item?.id,
        costPSQF: unitCost,
        costWastePSQF,
        costWastePSQM,
        perModulePrice
      };

      const updatedEntries = materialsLabourEntries?.map((e) => {
        if (e?.id === currentEditingEntry?.entryId) {
          return { ...e, materials: [...e?.materials, newMaterial] };
        }
        return e;
      });

      setMaterialsLabourEntries(updatedEntries);
    }
    
    setIsItemSearchModalOpen(false);
    setCurrentEditingEntry(null);
  };

  const handleMaterialChange = (entryId, materialId, field, value) => {
    const updatedEntries = materialsLabourEntries?.map((entry) => {
      if (entry?.id === entryId) {
        const updatedMaterials = entry?.materials?.map((material) => {
          if (material?.id === materialId) {
            const updated = { ...material, [field]: value };

            // Recalculate based on changes
            if (field === 'costPSQF' || field === 'wastePercent') {
              const costPSQF = DecimalMath?.parse(field === 'costPSQF' ? value : updated?.costPSQF, 0);
              const wastePercent = DecimalMath?.parse(entry?.wastePercent, 5);

              // $ / Ft2 / W = M Ft2 $ + Waste %
              updated.costWastePSQF = DecimalMath?.multiply(costPSQF, DecimalMath?.add(1, DecimalMath?.divide(wastePercent, 100)));
              
              // $ / M2 / W = M Ft2 $ (converted from ft2 to m2) + Waste %
              const costPSQM = DecimalMath?.multiply(costPSQF, 10.764);
              updated.costWastePSQM = DecimalMath?.multiply(costPSQM, DecimalMath?.add(1, DecimalMath?.divide(wastePercent, 100)));

              // Per Module Price calculation:
              // - For Individual Modules: use this entry's specific module area
              // - For Single Module Template: use smallest PPVC module area
              const moduleAreaFt2 = estimationModel === 'per-module-price'
                ? DecimalMath?.parse(entry?.moduleAreaFT2, 0)
                : getSmallestPPVCModuleAreaFt2();
              updated.perModulePrice = DecimalMath?.multiply(updated?.costWastePSQF, moduleAreaFt2);
            }

            return updated;
          }
          return material;
        });
        return { ...entry, materials: updatedMaterials };
      }
      return entry;
    });

    setMaterialsLabourEntries(updatedEntries);
  };

  const handleWastePercentChange = (entryId, value) => {
    const updatedEntries = materialsLabourEntries?.map((entry) => {
      if (entry?.id === entryId) {
        const wastePercent = DecimalMath?.min(DecimalMath?.max(DecimalMath?.parse(value, 5), 5), 20);

        // Get module area for calculation:
        // - For Individual Modules: use this entry's specific module area
        // - For Single Module Template: use smallest PPVC module area
        const moduleAreaFt2 = estimationModel === 'per-module-price'
          ? DecimalMath?.parse(entry?.moduleAreaFT2, 0)
          : getSmallestPPVCModuleAreaFt2();

        // Recalculate all materials with new waste percent
        const updatedMaterials = entry?.materials?.map((material) => {
          const costPSQF = DecimalMath?.parse(material?.costPSQF, 0);
          
          // $ / Ft2 / W = M Ft2 $ + Waste %
          const costWastePSQF = DecimalMath?.multiply(costPSQF, DecimalMath?.add(1, DecimalMath?.divide(wastePercent, 100)));
          
          // $ / M2 / W = M Ft2 $ (converted from ft2 to m2) + Waste %
          const costPSQM = DecimalMath?.multiply(costPSQF, 10.764);
          const costWastePSQM = DecimalMath?.multiply(costPSQM, DecimalMath?.add(1, DecimalMath?.divide(wastePercent, 100)));
          
          // Per Module Price = ($ / Ft2 / W) × smallest PPVC module area in ft²
          const perModulePrice = DecimalMath?.multiply(costWastePSQF, moduleAreaFt2);

          return {
            ...material,
            costWastePSQF,
            costWastePSQM,
            perModulePrice
          };
        });

        return { ...entry, wastePercent, materials: updatedMaterials };
      }
      return entry;
    });

    setMaterialsLabourEntries(updatedEntries);
  };

  const handleAddMaterialAndLabour = (entryId) => {
    const entry = materialsLabourEntries?.find((e) => e?.id === entryId);
    if (!entry) return;

    const newMatId = Date.now();
    // Add new material
    const newMaterial = {
      id: newMatId,
      no: entry?.materials?.length + 1,
      item: '',
      costPSQF: 0,
      costWastePSQF: 0,
      costWastePSQM: 0,
      perModulePrice: 0
    };

    // Add new labour — linked to this material via materialId
    const newLabour = {
      id: Date.now() + 1,
      role: '',
      hours: 0,
      rate: 0,
      total: 0,
      materialId: newMatId,
    };

    const updatedEntries = materialsLabourEntries?.map((e) => {
      if (e?.id === entryId) {
        return { 
          ...e, 
          materials: [...e?.materials, newMaterial],
          labour: [...e?.labour, newLabour]
        };
      }
      return e;
    });

    setMaterialsLabourEntries(updatedEntries);
  };

  const handleAddLabour = (entryId) => {
    const entry = materialsLabourEntries?.find((e) => e?.id === entryId);
    if (!entry) return;

    const newLabour = {
      id: Date.now(),
      role: '',
      hours: 0,
      rate: 0,
      total: 0,
      materialId: null,
    };

    const updatedEntries = materialsLabourEntries?.map((e) => {
      if (e?.id === entryId) {
        return { ...e, labour: [...e?.labour, newLabour] };
      }
      return e;
    });

    setMaterialsLabourEntries(updatedEntries);
  };

  const handleLabourChange = (entryId, labourId, field, value) => {
    const updatedEntries = materialsLabourEntries?.map((entry) => {
      if (entry?.id === entryId) {
        const updatedLabour = entry?.labour?.map((labour) => {
          if (labour?.id === labourId) {
            const updated = { ...labour, [field]: value };

            if (field === 'hours' || field === 'rate') {
              const hours = DecimalMath?.parse(field === 'hours' ? value : updated?.hours, 0);
              const rate = DecimalMath?.parse(field === 'rate' ? value : updated?.rate, 0);
              updated.total = DecimalMath?.multiply(hours, rate);

              // Calculate labourCostPSQF = total ÷ moduleAreaFT2
              const moduleAreaFt2 = estimationModel === 'per-module-price'
                ? DecimalMath?.parse(entry?.moduleAreaFT2, 0)
                : getSmallestPPVCModuleAreaFt2();
              updated.labourCostPSQF = moduleAreaFt2 > 0
                ? DecimalMath?.divide(updated?.total, moduleAreaFt2)
                : 0;
            }

            return updated;
          }
          return labour;
        });
        return { ...entry, labour: updatedLabour };
      }
      return entry;
    });

    setMaterialsLabourEntries(updatedEntries);
  };

  const handleRemoveMaterial = (entryId, materialId) => {
    const updatedEntries = materialsLabourEntries?.map((entry) => {
      if (entry?.id === entryId) {
        const updatedMaterials = entry?.materials?.filter((m) => m?.id !== materialId);
        // Renumber materials
        const renumberedMaterials = updatedMaterials?.map((m, index) => ({ ...m, no: index + 1 }));
        // Auto-delete linked labour rows
        const updatedLabour = entry?.labour?.filter((l) => (l?.materialId ?? null) !== materialId);
        return { ...entry, materials: renumberedMaterials, labour: updatedLabour };
      }
      return entry;
    });

    setMaterialsLabourEntries(updatedEntries);
  };

  const handleRemoveLabour = (entryId, labourId) => {
    const updatedEntries = materialsLabourEntries?.map((entry) => {
      if (entry?.id === entryId) {
        return { ...entry, labour: entry?.labour?.filter((l) => l?.id !== labourId) };
      }
      return entry;
    });

    setMaterialsLabourEntries(updatedEntries);
  };

  const handleRemoveMaterialAndLabour = (entryId, labourItem) => {
    const updatedEntries = materialsLabourEntries?.map((entry) => {
      if (entry?.id === entryId) {
        // Use the labour item's materialId to find the linked material
        const linkedMatId = labourItem?.materialId ?? null;

        // Remove the linked material (by materialId) if it exists
        const updatedMaterials = linkedMatId != null
          ? entry?.materials?.filter((m) => String(m?.id) !== String(linkedMatId))
          : entry?.materials; // no linked material — leave materials untouched

        // Renumber remaining materials
        const renumberedMaterials = updatedMaterials?.map((material, idx) => ({
          ...material,
          no: idx + 1
        }));

        // Remove this labour row (by its own id) AND any other labour rows linked to the same material
        const updatedLabour = linkedMatId != null
          ? entry?.labour?.filter((l) => String(l?.materialId ?? '') !== String(linkedMatId))
          : entry?.labour?.filter((l) => l?.id !== labourItem?.id);

        return { ...entry, materials: renumberedMaterials, labour: updatedLabour };
      }
      return entry;
    });

    setMaterialsLabourEntries(updatedEntries);
  };

  const handleRemoveEntry = (entryId) => {
    const updatedEntries = materialsLabourEntries?.filter((e) => e?.id !== entryId);
    setMaterialsLabourEntries(updatedEntries);
    // The sync useEffect handles writing to formData after state updates
  };

  const handleLoadFromTemplate = ({ applyOption, materialItems, labourItems, templateName }) => {
    // Resolve the module area to use for calculations
    // For single-module: use smallest PPVC module area (same as handleAddModel)
    // For per-module-price: use largest module area
    const resolvedModuleAreaFt2 = estimationModel === 'per-module-price'
      ? (() => {
          const modules = formData?.modules || [];
          if (modules?.length === 0) return 0;
          const largest = modules?.reduce((max, m) => {
            const a = DecimalMath?.parse(m?.areaFeet, 0);
            const b = DecimalMath?.parse(max?.areaFeet, 0);
            return a > b ? m : max;
          }, modules?.[0]);
          return DecimalMath?.parse(largest?.areaFeet, 0) || 0;
        })()
      : getSmallestPPVCModuleAreaFt2();

    // Build a map from old materialId → new materialId so labour links survive ID regeneration
    // Capture a single timestamp so both arrays use the exact same base — prevents ID mismatch
    const baseTime = Date.now();
    const oldToNewMatId = {};
    const recalcedMaterials = (applyOption === 'labour' ? [] : materialItems)?.map((m, idx) => {
      const newId = baseTime + idx + 1;
      // Record mapping: old template material id → new local id
      if (m?.id != null) oldToNewMatId[m.id] = newId;
      const costPSQF = DecimalMath?.parse(m?.costPSQF, 0);
      const wastePercent = DecimalMath?.parse(m?.wastePercent, 5);
      const costWastePSQF = DecimalMath?.multiply(costPSQF, 1 + wastePercent / 100);
      const perModulePrice = resolvedModuleAreaFt2 > 0
        ? DecimalMath?.multiply(costWastePSQF, resolvedModuleAreaFt2)
        : DecimalMath?.parse(m?.perModulePrice, 0);
      return { ...m, id: newId, no: idx + 1, costWastePSQF, perModulePrice };
    });

    // Recalculate labourCostPSQF for each labour item using resolved area
    // Also remap materialId to the newly generated material IDs (by index position)
    const recalcedLabour = (applyOption === 'materials' ? [] : labourItems)?.map((l, idx) => {
      const total = DecimalMath?.parse(l?.total, 0);
      const labourCostPSQF = resolvedModuleAreaFt2 > 0
        ? DecimalMath?.divide(total, resolvedModuleAreaFt2)
        : DecimalMath?.parse(l?.labourCostPSQF, 0);
      // Remap materialId: if the old materialId has a new counterpart, use it; otherwise keep as-is
      const remappedMaterialId = l?.materialId != null && oldToNewMatId?.[l?.materialId] != null
        ? oldToNewMatId?.[l?.materialId]
        : (l?.materialId ?? null);
      return { ...l, id: baseTime + (materialItems?.length || 0) + idx + 1, labourCostPSQF, materialId: remappedMaterialId };
    });

    // If no entries exist yet, create a default entry to hold the template items
    if (materialsLabourEntries?.length === 0) {
      // Resolve module identity for the entry header
      const modules = formData?.modules || [];
      const refModule = modules?.length > 0
        ? modules?.reduce((max, m) => {
            const a = DecimalMath?.parse(m?.areaFeet, 0);
            const b = DecimalMath?.parse(max?.areaFeet, 0);
            return a > b ? m : max;
          }, modules?.[0])
        : null;

      const newEntry = {
        id: Date.now(),
        moduleId: refModule?.id || null,
        moduleName: refModule?.moduleName || templateName || 'Template Entry',
        moduleAreaM2: refModule ? DecimalMath?.parse(refModule?.areaMm, 0) : 0,
        moduleAreaFT2: resolvedModuleAreaFt2,
        wastePercent: 5,
        materials: recalcedMaterials,
        labour: recalcedLabour,
      };
      setMaterialsLabourEntries([newEntry]);
      return;
    }

    // Append to the first existing entry — additive, non-destructive
    const targetEntry = materialsLabourEntries?.[0];
    const existingMaterialCount = targetEntry?.materials?.length || 0;

    const appendBaseTime = Date.now();
    const appendOldToNewMatId = {};
    const appendMaterials = recalcedMaterials?.map((m, idx) => {
      const appendNewId = appendBaseTime + idx + 1;
      appendOldToNewMatId[m.id] = appendNewId;
      return { ...m, id: appendNewId, no: existingMaterialCount + idx + 1 };
    });

    // Remap materialId for appended labour to the newly generated material IDs (by index position)
    const appendLabour = recalcedLabour?.map((l, idx) => {
      const remappedMaterialId = l?.materialId != null && appendOldToNewMatId?.[l?.materialId] != null
        ? appendOldToNewMatId?.[l?.materialId]
        : (l?.materialId ?? null);
      return {
        ...l,
        id: appendBaseTime + (materialItems?.length || 0) + idx + 1,
        materialId: remappedMaterialId,
      };
    });

    const updatedEntries = materialsLabourEntries?.map((entry, index) => {
      if (index === 0) {
        // Also update moduleAreaFT2 on the entry if it was 0 (e.g. entry was created before modules were added)
        const updatedAreaFT2 = entry?.moduleAreaFT2 > 0 ? entry?.moduleAreaFT2 : resolvedModuleAreaFt2;
        return {
          ...entry,
          moduleAreaFT2: updatedAreaFT2,
          materials: [...entry?.materials, ...appendMaterials],
          labour: [...entry?.labour, ...appendLabour],
        };
      }
      return entry;
    });

    setMaterialsLabourEntries(updatedEntries);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Materials + Labour</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Configure materials and labour costs
        </p>
      </div>
      {/* Estimation Model Selection */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Estimation Model:</label>
        <div className="w-80">
          <Select
            options={estimationOptions}
            value={estimationModel}
            onChange={handleEstimationModelChange}
            placeholder="Select estimation model"
          />
        </div>
      </div>
      {/* Add Model Button */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => setIsTemplateModalOpen(true)}
          iconName="FileDown"
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          Load from Template
        </Button>
        <Button
          onClick={handleAddModel}
          iconName="Plus"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Add Model
        </Button>
      </div>
      {/* Materials + Labour Entries */}
      {materialsLabourEntries?.length > 0 ? (
        <div className="space-y-8">
          {materialsLabourEntries?.map((entry, entryIndex) => (
            <div key={entry?.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
              {/* Entry Header */}
              <div className="bg-gray-50 dark:bg-gray-750 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors">
                <div className="flex items-center gap-4">
                  {estimationModel === 'per-module-price' && (
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{entry?.moduleName}</h4>
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {estimationModel === 'single-module' ? 'Typical Module Material list' : 'Materials'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveEntry(entry?.id)}
                  iconName="Trash2"
                  iconSize={16}
                  className="text-destructive hover:text-destructive"
                />
              </div>

              {/* Side-by-Side Layout */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* Materials Section - Left Side (2 parts) */}
                  <div className="col-span-2 border-r border-gray-200 dark:border-gray-700 pr-6">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                        Materials
                      </h5>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Waste %</label>
                        <input
                          type="number"
                          min="5"
                          max="20"
                          value={entry?.wastePercent || 5}
                          onChange={(e) => handleWastePercentChange(entry?.id, e?.target?.value)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Materials Table */}
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="grid grid-cols-[50px_1fr_100px_100px_100px_100px] gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <div>No.</div>
                        <div>Item</div>
                        <div className="text-right">M Ft2 $</div>
                        <div className="text-right">$ / Ft2 / W</div>
                        <div className="text-right">$ / M2 / W</div>
                        <div className="text-right">Per Module Price</div>
                      </div>

                      {/* Material Rows */}
                      {entry?.materials?.map((material, materialIndex) => (
                        <div key={material?.id} className="grid grid-cols-[50px_1fr_100px_100px_100px_100px] gap-2 items-center py-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{material?.no}</div>
                          <div className="relative">
                            <input
                              type="text"
                              value={material?.item || ''}
                              onChange={(e) => handleMaterialChange(entry?.id, material?.id, 'item', e?.target?.value)}
                              onClick={() => {
                                setCurrentEditingEntry({ entryId: entry?.id, materialId: material?.id, type: 'material' });
                                setIsItemSearchModalOpen(true);
                              }}
                              placeholder="Click to search library..."
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                              readOnly
                            />
                          </div>
                          <input
                            type="number"
                            value={material?.costPSQF || ''}
                            onChange={(e) => handleMaterialChange(entry?.id, material?.id, 'costPSQF', e?.target?.value)}
                            placeholder="0.00"
                            className="px-2 py-1.5 text-sm text-right border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                          />
                          <div className="px-2 py-1.5 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md transition-colors">
                            {formatNumber(material?.costWastePSQF, 2) || '0.00'}
                          </div>
                          <div className="px-2 py-1.5 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md transition-colors">
                            {formatNumber(material?.costWastePSQM, 2) || '0.00'}
                          </div>
                          <div className="px-2 py-1.5 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md transition-colors">
                            ${formatNumber(material?.perModulePrice, 2) || '0.00'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Labour Section - Right Side (1 part) */}
                  <div className="col-span-1 pl-6">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-base text-gray-900 dark:text-gray-100">Labour</h5>
                    </div>

                    {/* Labour Table */}
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="grid grid-cols-[1fr_80px_80px_100px_50px] gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <div>Role</div>
                        <div className="text-right">Hrs.</div>
                        <div className="text-right">Rate</div>
                        <div className="text-right">Total $ USD</div>
                        <div></div>
                      </div>

                      {/* Labour Rows */}
                      {entry?.labour?.map((labour, labourIndex) => {
                        // Find linked material name for visual indicator
                        const linkedMaterial = labour?.materialId
                          ? entry?.materials?.find((m) => m?.id === labour?.materialId)
                          : null;
                        return (
                          <div key={labour?.id} className="grid grid-cols-[1fr_80px_80px_100px_50px] gap-2 items-center py-2">
                            <div className="relative">
                              <input
                                type="text"
                                value={labour?.role || ''}
                                onChange={(e) => handleLabourChange(entry?.id, labour?.id, 'role', e?.target?.value)}
                                placeholder="Role"
                                className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors w-full"
                              />
                              {linkedMaterial && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                  <span className="text-xs text-primary/80 truncate" title={`Linked to: ${linkedMaterial?.item || 'material'}`}>
                                    {linkedMaterial?.item ? linkedMaterial?.item?.split(' - ')?.pop()?.substring(0, 20) : 'Linked material'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <input
                              type="number"
                              value={labour?.hours || ''}
                              onChange={(e) => handleLabourChange(entry?.id, labour?.id, 'hours', e?.target?.value)}
                              placeholder="0"
                              maxLength="4"
                              onInput={(e) => {
                                if (e?.target?.value?.length > 4) {
                                  e.target.value = e?.target?.value?.slice(0, 4);
                                }
                              }}
                              className="px-2 py-1.5 text-sm text-right border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                            />
                            <input
                              type="number"
                              value={labour?.rate || ''}
                              onChange={(e) => handleLabourChange(entry?.id, labour?.id, 'rate', e?.target?.value)}
                              placeholder="0.00"
                              maxLength="4"
                              onInput={(e) => {
                                if (e?.target?.value?.length > 4) {
                                  e.target.value = e?.target?.value?.slice(0, 4);
                                }
                              }}
                              className="px-2 py-1.5 text-sm text-right border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                            />
                            <div className="px-2 py-1.5 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md transition-colors">
                              ${formatNumber(labour?.total, 2) || '0.00'}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMaterialAndLabour(entry?.id, labour)}
                              iconName="Trash2"
                              iconSize={14}
                              className="text-destructive hover:text-destructive p-1"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Add M+L Button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleAddMaterialAndLabour(entry?.id)}
                    iconName="Plus"
                    variant="outline"
                    size="sm"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    Add M+L
                  </Button>
                </div>

                {/* Totals Section */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-6">
                    {/* Material Total - Left Side (2 parts) */}
                    <div className="col-span-2 pr-6">
                      <div className="flex justify-end items-center gap-4">
                        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">$ / Ft² / W Total</span>
                        <div className="px-4 py-2 text-base font-bold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md min-w-[120px] text-right transition-colors">
                          ${formatNumber(entry?.materials?.reduce((sum, material) => sum + DecimalMath?.parse(material?.costWastePSQF, 0), 0), 2)}
                        </div>
                      </div>

                      {/* Per Module Price Total */}
                      <div className="flex justify-end items-center gap-4 mt-4">
                        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Per Module Price Total</span>
                        <div className="px-4 py-2 text-base font-bold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md min-w-[120px] text-right transition-colors">
                          ${formatNumber(entry?.materials?.reduce((sum, material) => sum + DecimalMath?.parse(material?.perModulePrice, 0), 0), 2)}
                        </div>
                      </div>

                      {/* Project Mod Total - Only show in Single Module Template */}
                      {estimationModel === 'single-module' && (
                        <div className="flex justify-end items-center gap-4 mt-4">
                          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Project Mod Total</span>
                          <div className="px-4 py-2 text-base font-bold bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary rounded-md min-w-[120px] text-right transition-colors border-2 border-primary/30">
                            ${formatNumber(
                              DecimalMath?.multiply(
                                entry?.materials?.reduce((sum, material) => sum + DecimalMath?.parse(material?.costWastePSQF, 0), 0),
                                getTotalAreaFromModularBuildUp()
                              ),
                              2
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Labor Total - Right Side (1 part) */}
                    <div className="col-span-1 pl-6">
                      <div className="flex justify-end items-center gap-4">
                        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total Labour Hrs</span>
                        <div className="px-4 py-2 text-base font-bold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md min-w-[100px] text-right transition-colors">
                          {formatNumber(entry?.labour?.reduce((sum, l) => sum + DecimalMath?.parse(l?.hours, 0), 0), 0)}
                        </div>
                      </div>
                      <div className="flex justify-end items-center gap-4 mt-2">
                        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">$ / Ft² / W Total</span>
                        <div className="px-4 py-2 text-base font-bold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md min-w-[120px] text-right transition-colors">
                          ${formatNumber(
                            (() => {
                              const labourTotal = entry?.labour?.reduce((sum, l) => sum + DecimalMath?.parse(l?.total, 0), 0);
                              const moduleAreaFt2 = estimationModel === 'per-module-price'
                                ? DecimalMath?.parse(entry?.moduleAreaFT2, 0)
                                : getSmallestPPVCModuleAreaFt2();
                              return moduleAreaFt2 > 0 ? DecimalMath?.divide(labourTotal, moduleAreaFt2) : 0;
                            })(),
                            2
                          )}
                        </div>
                        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Labor Total</span>
                        <div className="px-4 py-2 text-base font-bold bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md min-w-[120px] text-right transition-colors">
                          ${formatNumber(entry?.labour?.reduce((sum, labour) => sum + DecimalMath?.parse(labour?.total, 0), 0), 2)}
                        </div>
                      </div>

                      {/* Labour Project Mod Total - Only show in Single Module Template */}
                      {estimationModel === 'single-module' && (
                        <div className="flex justify-end items-center gap-4 mt-4">
                          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Labour Project Mod Total</span>
                          <div className="px-4 py-2 text-base font-bold bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary rounded-md min-w-[120px] text-right transition-colors border-2 border-primary/30">
                            ${formatNumber(
                              DecimalMath?.multiply(
                                (() => {
                                  const labourTotal = entry?.labour?.reduce((sum, l) => sum + DecimalMath?.parse(l?.total, 0), 0);
                                  const moduleAreaFt2 = getSmallestPPVCModuleAreaFt2();
                                  return moduleAreaFt2 > 0 ? DecimalMath?.divide(labourTotal, moduleAreaFt2) : 0;
                                })(),
                                getTotalAreaFromModularBuildUp()
                              ),
                              2
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Grand Total - Only show in Individual Modules mode */}
          {estimationModel === 'per-module-price' && materialsLabourEntries?.length > 0 && (
            <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
              <div className="flex justify-end items-center gap-6">
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Grand Total (All Selected Modules)</span>
                <div className="px-6 py-3 text-2xl font-bold bg-primary text-primary-foreground rounded-lg min-w-[180px] text-right shadow-lg">
                  ${formatNumber(
                    materialsLabourEntries?.reduce((sum, entry) => {
                      const entrySingleModTotal = entry?.materials?.reduce((matSum, material) => 
                        matSum + DecimalMath?.parse(material?.perModulePrice, 0), 0
                      );
                      return sum + entrySingleModTotal;
                    }, 0),
                    2
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-right mt-2">
                Sum of all Single Mod Total values from selected modules
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center transition-colors">
          <Icon name="Package" size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">No materials and labour entries yet</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Click "Add Model" to get started</p>
        </div>
      )}
      {/* Template Load Modal */}
      <TemplateLoadModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onApply={handleLoadFromTemplate}
      />
      {/* Module Selection Modal */}
      <ModuleSelectionModal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        modules={formData?.modules || []}
        onSelectModule={handleSelectModules}
        existingModules={materialsLabourEntries}
      />
      {/* Item Search Modal */}
      <ItemSearchModal
        isOpen={isItemSearchModalOpen}
        onClose={() => {
          setIsItemSearchModalOpen(false);
          setCurrentEditingEntry(null);
        }}
        onSelectItem={handleSelectItem}
      />
      {/* Warning Modal for Estimation Model Change */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <Icon name="AlertTriangle" size={24} className="text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Change Estimation Model?</h3>
                <p className="text-sm text-muted-foreground">
                  Changing the estimation model will clear all existing materials and labour entries. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCloseWarningModal}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmEstimationChange}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear and Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

 };

export default MaterialsLabourTab;