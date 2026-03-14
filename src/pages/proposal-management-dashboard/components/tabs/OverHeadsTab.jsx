import React, { useEffect, useMemo, useRef } from 'react';
import DecimalMath from '../../../../utils/decimalMath';
import { formatNumber } from '../../../../utils/decimalMath';

const USE_MEMO_CALCULATIONS = import.meta.env?.VITE_USE_MEMO_CALCULATIONS === 'true';

const OverHeadsTab = ({ formData, onChange, onComputedTotalChange, errors }) => {
  // Legacy ref for fallback mode only
  const isUpdatingRef = useRef(false);
  // FIX: Store onChange in a ref so the sync useEffect doesn't re-fire when the
  // parent re-renders and recreates the onChange callback reference.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  // FIX: Track the last value we synced to parent so we don't trigger an update
  // when formData already reflects what we just wrote (breaks the infinite loop).
  const lastSyncedOverheadsRef = useRef(null);

  // Calculate totals from Project Duration tab
  const designTotal = useMemo(() => {
    const concept = DecimalMath?.parse(formData?.design?.concept, 0);
    const schematic = DecimalMath?.parse(formData?.design?.schematic, 0);
    const detailedDesign = DecimalMath?.parse(formData?.design?.detailedDesign, 0);
    const productionIFC = DecimalMath?.parse(formData?.design?.productionIFC, 0);
    return DecimalMath?.add(concept, schematic, detailedDesign, productionIFC);
  }, [formData?.design]);

  const procurementTotal = useMemo(() => {
    const local = DecimalMath?.parse(formData?.procurement?.local, 0);
    const shortLead = DecimalMath?.parse(formData?.procurement?.shortLead, 0);
    const longLead = DecimalMath?.parse(formData?.procurement?.longLead, 0);
    return DecimalMath?.max(local, shortLead, longLead);
  }, [formData?.procurement]);

  const productionTotal = useMemo(() => {
    const productionWeek = DecimalMath?.parse(formData?.production?.productionWeek, 0);
    return productionWeek;
  }, [formData?.production?.productionWeek]);

  // Calculate total m² from all modules (area * quantity for each module)
  const totalModuleM2 = useMemo(() => {
    if (!formData?.modules || formData?.modules?.length === 0) return 0;

    return formData?.modules?.reduce((sum, module) => {
      const quantity = DecimalMath?.parse(module?.quantity, 0);
      // Use areaMm if available, otherwise convert from areaFeet
      const areaM2 = DecimalMath?.parse(module?.areaMm) || DecimalMath?.multiply(DecimalMath?.parse(module?.areaFeet), 0.092903) || 0;
      return DecimalMath?.add(sum, DecimalMath?.multiply(quantity, areaM2));
    }, 0);
  }, [formData?.modules]);

  // Calculate total Ft² from all modules (area * quantity for each module)
  const totalModuleFt2 = useMemo(() => {
    if (!formData?.modules || formData?.modules?.length === 0) return 0;

    return formData?.modules?.reduce((sum, module) => {
      const quantity = DecimalMath?.parse(module?.quantity, 0);
      const areaFeet = DecimalMath?.parse(module?.areaFeet, 0);
      return DecimalMath?.add(sum, DecimalMath?.multiply(quantity, areaFeet));
    }, 0);
  }, [formData?.modules]);

  // NEW: Calculate all overhead values with useMemo
  const calculatedOverheads = useMemo(() => {
    if (!USE_MEMO_CALCULATIONS) return null;

    const overheadCalc = formData?.overheadCalculations || {};
    const sections = ['design', 'procurement', 'general', 'production', 'project'];
    const defaultAllocations = {
      design: '50',
      procurement: '20',
      general: '20',
      production: '50',
      project: '100'
    };
    const updates = {};

    sections?.forEach((section) => {
      const data = overheadCalc?.[section] || {};
      const duration = DecimalMath?.parse(data?.duration, 0);
      const overHeadPerWeek = DecimalMath?.parse(data?.overHeadPerWeek, 0);
      const allocation = DecimalMath?.parse(data?.allocation || defaultAllocations?.[section], 0);
      const contingency = DecimalMath?.parse(data?.contingency !== undefined && data?.contingency !== null && data?.contingency !== '' ? data?.contingency : '15', 0);

      // Formula: Duration * Over Head Per Week * (% of Allocation / 100) * (1 + Contingency / 100)
      const calculatedTotalOH = DecimalMath?.multiply(
        DecimalMath?.multiply(duration, overHeadPerWeek),
        DecimalMath?.divide(allocation, 100)
      );
      const addedContingency = DecimalMath?.add(1, DecimalMath?.divide(contingency, 100));
      const finalTotalOH = DecimalMath?.multiply(calculatedTotalOH, addedContingency);

      // Calculate OH per m² and OH per Ft²
      const ohPerM2 = totalModuleM2 > 0 ? DecimalMath?.divide(finalTotalOH, totalModuleM2) : 0;
      const ohPerFt2 = totalModuleFt2 > 0 ? DecimalMath?.divide(finalTotalOH, totalModuleFt2) : 0;

      updates[section] = {
        ...data,
        contingency: contingency?.toString(),
        allocation: allocation?.toString(),
        totalOH: finalTotalOH?.toFixed(2),
        ohPerM2: ohPerM2?.toFixed(4),
        ohPerFt2: ohPerFt2?.toFixed(4)
      };
    });

    return updates;
  }, [formData?.overheadCalculations, totalModuleM2, totalModuleFt2]);

  // NEW: Sync calculated values to parent when they change
  useEffect(() => {
    if (!USE_MEMO_CALCULATIONS || !calculatedOverheads) return;

    const overheadCalc = formData?.overheadCalculations || {};

    // FIX: Compare against the last value WE synced, not the current formData.
    // This prevents the loop: onChange → setFormData → calculatedOverheads recomputes
    // → useEffect fires → onChange again (because JSON.stringify of toFixed strings
    // may differ from the stored number on each cycle).
    const nextValue = { ...overheadCalc, ...calculatedOverheads };
    const nextStr = JSON.stringify(nextValue);

    if (lastSyncedOverheadsRef?.current === nextStr) return;

    let hasChanges = Object.keys(calculatedOverheads)?.some(section => {
      const current = overheadCalc?.[section] || {};
      const calculated = calculatedOverheads?.[section];
      return JSON.stringify(current) !== JSON.stringify(calculated);
    });

    if (hasChanges) {
      lastSyncedOverheadsRef.current = nextStr;
      onChangeRef?.current('overheadCalculations', nextValue);
    }
  }, [calculatedOverheads, formData?.overheadCalculations]);

  // PUSH ARCHITECTURE: Compute overheadsTotal (grand total across all 5 sections)
  // and push it into formData.computedTotals so downstream tabs can read without recalculating.
  const computedOverheadsTotal = useMemo(() => {
    const sections = ['design', 'procurement', 'general', 'production', 'project'];

    if (USE_MEMO_CALCULATIONS && calculatedOverheads) {
      // Use live memo values when available
      return sections?.reduce((sum, section) => {
        const totalOH = DecimalMath?.parse(calculatedOverheads?.[section]?.totalOH, 0);
        return DecimalMath?.add(sum, totalOH);
      }, 0);
    }

    // Fallback: read from stored formData
    const overheadCalc = formData?.overheadCalculations || {};
    return sections?.reduce((sum, section) => {
      const totalOH = DecimalMath?.parse(overheadCalc?.[section]?.totalOH, 0);
      return DecimalMath?.add(sum, totalOH);
    }, 0);
  }, [calculatedOverheads, formData?.overheadCalculations]);

  // Track last pushed overheadsTotal to avoid infinite loops
  const lastPushedOverheadsTotalRef = useRef(null);

  useEffect(() => {
    const next = String(computedOverheadsTotal);
    if (lastPushedOverheadsTotalRef?.current === next) return;
    lastPushedOverheadsTotalRef.current = next;

    if (onComputedTotalChange) {
      onComputedTotalChange('overheadsTotal', computedOverheadsTotal);
    } else {
      const existing = formData?.computedTotals || {};
      onChangeRef?.current('computedTotals', {
        ...existing,
        overheadsTotal: computedOverheadsTotal
      });
    }
  }, [computedOverheadsTotal]);

  // LEGACY: Initialize Contingency fields with default 15% value (fallback mode)
  useEffect(() => {
    if (USE_MEMO_CALCULATIONS || isUpdatingRef?.current) return;

    const overheadCalc = formData?.overheadCalculations || {};
    const sections = ['design', 'procurement', 'general', 'production', 'project'];
    const updates = {};
    let hasChanges = false;

    sections?.forEach((section) => {
      const data = overheadCalc?.[section] || {};
      const contingency = data?.contingency;

      // Set default 15% if contingency is undefined, null, or empty string
      if (contingency === undefined || contingency === null || contingency === '') {
        updates[section] = { ...data, contingency: '15' };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      isUpdatingRef.current = true;
      onChange('overheadCalculations', {
        ...overheadCalc,
        ...updates
      });
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [formData?.overheadCalculations, onChange]);

  // LEGACY: Initialize % of Allocation fields with default values (fallback mode)
  useEffect(() => {
    if (USE_MEMO_CALCULATIONS || isUpdatingRef?.current) return;

    const overheadCalc = formData?.overheadCalculations || {};
    const defaultAllocations = {
      design: '50',
      procurement: '20',
      general: '20',
      production: '50',
      project: '100'
    };
    const updates = {};
    let hasChanges = false;

    Object.keys(defaultAllocations)?.forEach((section) => {
      const data = overheadCalc?.[section] || {};
      const allocation = data?.allocation;

      // Set default allocation if undefined, null, or empty string
      if (allocation === undefined || allocation === null || allocation === '') {
        updates[section] = { ...data, allocation: defaultAllocations?.[section] };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      isUpdatingRef.current = true;
      onChange('overheadCalculations', {
        ...overheadCalc,
        ...updates
      });
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [formData?.overheadCalculations, onChange]);

  // LEGACY: Auto-calculate Total OH for each section (fallback mode)
  useEffect(() => {
    if (USE_MEMO_CALCULATIONS || isUpdatingRef?.current) return;

    const overheadCalc = formData?.overheadCalculations || {};
    const sections = ['design', 'procurement', 'general', 'production', 'project'];
    const updates = {};
    let hasChanges = false;

    sections?.forEach((section) => {
      const data = overheadCalc?.[section] || {};
      const duration = DecimalMath?.parse(data?.duration, 0);
      const overHeadPerWeek = DecimalMath?.parse(data?.overHeadPerWeek, 0);
      const allocation = DecimalMath?.parse(data?.allocation, 0);
      const contingency = DecimalMath?.parse(data?.contingency, 0);

      // Formula: Duration * Over Head Per Week * (% of Allocation / 100) * (1 + Contingency / 100)
      const calculatedTotalOH = DecimalMath?.multiply(
        DecimalMath?.multiply(duration, overHeadPerWeek),
        DecimalMath?.divide(allocation, 100)
      );
      const addedContingency = DecimalMath?.add(1, DecimalMath?.divide(contingency, 100));
      const finalTotalOH = DecimalMath?.multiply(calculatedTotalOH, addedContingency);
      const currentTotalOH = DecimalMath?.parse(data?.totalOH, 0);

      if (DecimalMath?.abs(DecimalMath?.subtract(finalTotalOH, currentTotalOH)) > 0.001) {
        updates[section] = { ...data, totalOH: finalTotalOH?.toFixed(2) };
        hasChanges = true;
      }
    });

    // Calculate OH per m² and OH per Ft² in the same update cycle
    if (totalModuleM2 > 0 || totalModuleFt2 > 0) {
      sections?.forEach((section) => {
        const data = overheadCalc?.[section] || {};
        // Use the updated totalOH if it exists in updates, otherwise use the existing value
        const totalOH = DecimalMath?.parse(updates?.[section]?.totalOH || data?.totalOH || 0);

        // Ensure we have the base data in updates
        if (!updates?.[section]) {
          updates[section] = { ...data };
        }

        // Formula: Total OH / Total Module m²
        if (totalModuleM2 > 0) {
          const calculatedOHPerM2 = DecimalMath?.divide(totalOH, totalModuleM2);
          const currentOHPerM2 = DecimalMath?.parse(data?.ohPerM2, 0);

          if (DecimalMath?.abs(calculatedOHPerM2, currentOHPerM2) > 0.0001) {
            updates[section] = { ...updates?.[section], ohPerM2: calculatedOHPerM2?.toFixed(4) };
            hasChanges = true;
          }
        }

        // Formula: Total OH / Total Module Ft²
        if (totalModuleFt2 > 0) {
          const calculatedOHPerFt2 = DecimalMath?.divide(totalOH, totalModuleFt2);
          const currentOHPerFt2 = DecimalMath?.parse(data?.ohPerFt2, 0);

          if (DecimalMath?.abs(calculatedOHPerFt2, currentOHPerFt2) > 0.0001) {
            updates[section] = { ...updates?.[section], ohPerFt2: calculatedOHPerFt2?.toFixed(4) };
            hasChanges = true;
          }
        }
      });
    }

    if (hasChanges) {
      isUpdatingRef.current = true;
      onChange('overheadCalculations', {
        ...overheadCalc,
        ...updates
      });
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [formData?.overheadCalculations, totalModuleM2, totalModuleFt2, onChange]);

  // Format currency for display
  const formatCurrency = (value) => {
    if (!value || value === '') return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return `$${formatNumber(numValue, 2)}`;
  };

  // Format percentage for display
  const formatPercentage = (value) => {
    if (!value || value === '') return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return `${numValue}%`;
  };

  // Parse percentage input (remove % and parse)
  const parsePercentage = (value) => {
    if (!value) return '';
    const cleaned = value?.replace(/%/g, '');
    return cleaned;
  };

  // Parse currency input (remove $ and parse)
  const parseCurrency = (value) => {
    if (!value) return '';
    const cleaned = value?.replace(/[^0-9.]/g, '');
    return cleaned;
  };

  // Format currency with $ prefix for display
  const formatCurrencyPrefix = (value) => {
    if (!value || value === '') return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return `$${numValue}`;
  };

  // Format currency input with $ prefix
  const formatCurrencyInput = (value) => {
    if (!value || value === '') return '';
    // Remove any non-numeric characters except decimal point
    const cleaned = value?.toString()?.replace(/[^0-9.]/g, '');
    if (cleaned === '') return '';
    return `$${cleaned}`;
  };

  // Format percentage input with % suffix
  const formatPercentageInput = (value) => {
    if (!value || value === '') return '';
    const cleaned = value?.toString()?.replace(/[^0-9.]/g, '');
    if (cleaned === '') return '';
    return `${cleaned}%`;
  };

  // Auto-fill duration fields from Project Duration tab - OPTIMIZED with batching
  useEffect(() => {
    // Prevent infinite loops
    if (isUpdatingRef?.current) return;

    const overheadCalc = formData?.overheadCalculations || {};
    const updates = {};
    let hasChanges = false;

    // Check Design Duration
    const currentDesignDuration = DecimalMath?.parse(overheadCalc?.design?.duration, 0);
    if (DecimalMath?.abs(designTotal, currentDesignDuration) > 0.001) {
      updates.design = { ...overheadCalc?.design, duration: designTotal?.toString() };
      hasChanges = true;
    }

    // Check Procurement Duration
    const currentProcurementDuration = DecimalMath?.parse(overheadCalc?.procurement?.duration, 0);
    if (DecimalMath?.abs(procurementTotal, currentProcurementDuration) > 0.001) {
      updates.procurement = { ...overheadCalc?.procurement, duration: procurementTotal?.toString() };
      hasChanges = true;
    }

    // Check Production Duration
    const currentProductionDuration = DecimalMath?.parse(overheadCalc?.production?.duration, 0);
    if (DecimalMath?.abs(productionTotal, currentProductionDuration) > 0.001) {
      updates.production = { ...overheadCalc?.production, duration: productionTotal?.toString() };
      hasChanges = true;
    }

    // Check Project Duration with Production Total
    const currentProjectDuration = DecimalMath?.parse(overheadCalc?.project?.duration, 0);
    if (DecimalMath?.abs(productionTotal, currentProjectDuration) > 0.001) {
      updates.project = { ...overheadCalc?.project, duration: productionTotal?.toString() };
      hasChanges = true;
    }

    // Calculate General Duration (Design + Procurement + Production only)
    const generalDuration = DecimalMath?.add(designTotal, procurementTotal, productionTotal);
    const currentGeneralDuration = DecimalMath?.parse(overheadCalc?.general?.duration, 0);
    if (DecimalMath?.abs(generalDuration, currentGeneralDuration) > 0.001) {
      updates.general = { ...overheadCalc?.general, duration: generalDuration?.toString() };
      hasChanges = true;
    }

    // Batch all updates into a single state change
    if (hasChanges) {
      isUpdatingRef.current = true;
      onChange('overheadCalculations', {
        ...overheadCalc,
        ...updates
      });
      // Reset flag after a short delay to allow state to settle
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [designTotal, procurementTotal, productionTotal, formData?.design, formData?.procurement, formData?.production, formData?.overheadCalculations, onChange]);

  // Handler for overhead calculation fields
  const handleOverheadCalcChange = (section, field, value) => {
    const overheadCalc = formData?.overheadCalculations || {};
    onChange('overheadCalculations', {
      ...overheadCalc,
      [section]: {
        ...overheadCalc?.[section],
        [field]: value
      }
    });
  };

  // Calculate totals for overhead calculation section
  const calculateOverheadTotals = () => {
    const sections = ['design', 'procurement', 'general', 'production', 'project'];
    const overheadCalc = formData?.overheadCalculations || {};

    let totalOverHead = 0;
    let totalPerFt2 = 0;

    sections?.forEach((section) => {
      // Use live calculatedOverheads when available (memo mode), fall back to formData
      const source = (USE_MEMO_CALCULATIONS && calculatedOverheads?.[section])
        ? calculatedOverheads?.[section]
        : (overheadCalc?.[section] || {});

      const totalOH = DecimalMath?.parse(source?.totalOH, 0);
      const ohPerFt2 = DecimalMath?.parse(source?.ohPerFt2, 0);

      totalOverHead = DecimalMath?.add(totalOverHead, totalOH);
      totalPerFt2 = DecimalMath?.add(totalPerFt2, ohPerFt2);
    });

    return { totalOverHead, totalPerFt2 };
  };

  const renderOverheadSection = (title, sectionKey) => {
    const data = formData?.overheadCalculations?.[sectionKey] || {};
    const isAutoFilled = sectionKey === 'design' || sectionKey === 'procurement' || sectionKey === 'production' || sectionKey === 'general' || sectionKey === 'project';

    // For display-only fields, prefer live memo values when available
    const displayData = (USE_MEMO_CALCULATIONS && calculatedOverheads?.[sectionKey])
      ? calculatedOverheads?.[sectionKey]
      : data;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors mb-6">
        {/* First Row - 4 Columns */}
        <div className="grid grid-cols-4 gap-6 mb-4">
          {/* Column 1: Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</label>
            <input
              type="number"
              placeholder="0"
              maxLength="8"
              value={data?.duration || ''}
              onChange={(e) => handleOverheadCalcChange(sectionKey, 'duration', e?.target?.value)}
              readOnly={isAutoFilled}
              className={`flex h-10 w-1/2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 transition-colors ${isAutoFilled ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed text-gray-700 dark:text-gray-300' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`} />

          </div>
          
          {/* Column 2: % of Allocation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">% of Allocation</label>
            <input
              type="text"
              placeholder="0%"
              maxLength="6"
              value={data?.allocation ? `${data?.allocation}%` : ''}
              onChange={(e) => {
                const parsed = parsePercentage(e?.target?.value);
                handleOverheadCalcChange(sectionKey, 'allocation', parsed);
              }}
              className="flex h-10 w-1/4 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ring-offset-background placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 transition-colors" />

          </div>
          
          {/* Column 3: Contingency */}
          <div className="-ml-[10%]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contingency</label>
            <input
              type="text"
              placeholder="0%"
              maxLength="6"
              value={data?.contingency ? `${data?.contingency}%` : ''}
              onChange={(e) => {
                const parsed = parsePercentage(e?.target?.value);
                handleOverheadCalcChange(sectionKey, 'contingency', parsed);
              }}
              className="flex h-10 w-1/4 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ring-offset-background placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 transition-colors" />

          </div>
          
          {/* Column 4: OH per m² - AUTO-FILLED */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">OH per m²</label>
            <input
              type="number"
              placeholder="0"
              value={displayData?.ohPerM2 || ''}
              readOnly
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-not-allowed transition-colors" />

          </div>
        </div>
        
        {/* Second Row - 4 Columns */}
        <div className="grid grid-cols-4 gap-6">
          {/* Column 1: Over Head Per Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Over Head Per Week</label>
            <input
              type="text"
              placeholder="$0.00"
              maxLength="15"
              value={data?.overHeadPerWeek ? `$${data?.overHeadPerWeek}` : ''}
              onChange={(e) => {
                const parsed = parseCurrency(e?.target?.value);
                handleOverheadCalcChange(sectionKey, 'overHeadPerWeek', parsed);
              }}
              className="flex h-10 w-1/2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ring-offset-background placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 transition-colors" />

          </div>
          
          {/* Column 2: Total OH - shifted right */}
          <div className="ml-[25%]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total OH</label>
            <input
              type="text"
              placeholder="0"
              value={displayData?.totalOH || '0'}
              readOnly
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-not-allowed transition-colors" />

          </div>
          
          {/* Column 3: Empty */}
          <div></div>
          
          {/* Column 4: OH per Ft² */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">OH per Ft²</label>
            <input
              type="number"
              placeholder="0"
              value={displayData?.ohPerFt2 || ''}
              readOnly
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-not-allowed transition-colors" />

          </div>
        </div>
      </div>);

  };

  const totals = calculateOverheadTotals();

  return (
    <div className="space-y-6 pr-[227px] pb-0">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Over Heads</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Configure overhead costs and calculations
        </p>
      </div>

      {/* Design Section */}
      {renderOverheadSection('Design Duration', 'design')}

      {/* Procurement Section */}
      {renderOverheadSection('Procurement Duration', 'procurement')}

      {/* General Section */}
      {renderOverheadSection('General Duration', 'general')}

      {/* Production Section */}
      {renderOverheadSection('Production Duration', 'production')}

      {/* Project Section */}
      {renderOverheadSection('Project', 'project')}

      {/* Total Summary Row */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
        <div className="grid grid-cols-4 gap-6">
          {/* Empty columns 1 and 2 */}
          <div></div>
          <div></div>
          
          {/* Column 3: Total Over Head */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Over Head</label>
            <input
              type="text"
              value={formatNumber(totals?.totalOverHead, 2) || '0.00'}
              readOnly
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-not-allowed transition-colors" />

          </div>
          
          {/* Column 4: Total Per SQF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Per Ft²</label>
            <input
              type="text"
              value={formatNumber(totals?.totalPerFt2, 2) || '0.00'}
              readOnly
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-not-allowed transition-colors" />

          </div>
        </div>
      </div>
    </div>);

};

export default OverHeadsTab;