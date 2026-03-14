import React, { useState, useEffect, useMemo, useRef } from 'react';
import { formatNumber } from '../../../../utils/cn';


const USE_MEMO_CALCULATIONS = import.meta.env?.VITE_USE_MEMO_CALCULATIONS === 'true';

const RevenueCentersTab = ({ formData, onChange, errors, isProposalLoaded }) => {
  // Derive revenueType directly from formData — no local state, no sync effect, no race condition
  const revenueType = formData?.revenueCenters?.revenueType ?? 'chargeable';

  // Auto-generate Manufacturing data from multiple sources
  const generateManufacturingData = useMemo(() => {
    const items = [];
    let idCounter = 1;

    // 1. Module Configuration > Budget Value - PUSH ARCHITECTURE: read from formData.computedTotals
    const budgetValue = parseFloat(formData?.computedTotals?.budgetValue) || 0;

    if (budgetValue > 0) {
      items?.push({
        id: idCounter++,
        item: 'Module Configuration - Budget Value',
        description: 'Total budget value from all modules',
        amount: budgetValue
      });
    }

    // 2. Internal Value-Added Scope items (each item separately with its Total Cost)
    const internalValueAddedScope = formData?.internalValueAddedScope || [];
    internalValueAddedScope?.forEach((scopeItem) => {
      if (scopeItem?.itemName) {
        items?.push({
          id: idCounter++,
          item: scopeItem?.itemName || 'Internal Value-Added Item',
          description: scopeItem?.description || scopeItem?.scopeOfWork || '',
          amount: scopeItem?.totalCost || 0
        });
      }
    });

    // 3. Site Cost Total - PUSH ARCHITECTURE: read from formData.computedTotals
    const siteCostTotal = parseFloat(formData?.computedTotals?.siteCostsTotal) || 0;

    if (siteCostTotal > 0) {
      items?.push({
        id: idCounter++,
        item: 'Site Cost Total',
        description: 'Total site works costs',
        amount: siteCostTotal
      });
    }

    // CRITICAL FIX: Only include Materials Total and Labour Total in Cost + Margin mode
    if (revenueType === 'cost-margin') {
      // 4. Materials Total - PUSH ARCHITECTURE: read from formData.computedTotals
      const materialsTotal = parseFloat(formData?.computedTotals?.materialsTotal) || 0;

      if (materialsTotal > 0) {
        items?.push({
          id: idCounter++,
          item: 'Materials Total',
          description: 'Total materials cost (Project Mod Total formula)',
          amount: materialsTotal
        });
      }

      // 5. Labour Total - PUSH ARCHITECTURE: read from formData.computedTotals
      const labourTotal = parseFloat(formData?.computedTotals?.labourTotal) || 0;

      if (labourTotal > 0) {
        items?.push({
          id: idCounter++,
          item: 'Labour Total',
          description: 'Total labour costs (Project Mod Total)',
          amount: labourTotal
        });
      }
    }

    // If no items, return default empty item
    if (items?.length === 0) {
      return [{ id: 1, item: '', description: '', amount: 0 }];
    }

    return items;
  }, [formData?.computedTotals, formData?.internalValueAddedScope, revenueType]);

  // Auto-generate Sub Contracted data from Margined Sub-Contractors
  const generateSubContractedData = useMemo(() => {
    const items = [];
    let idCounter = 1;

    // Additional Scope > Margined Sub-Contractors > Total Cost (each item separately)
    const marginedSubContractors = formData?.marginedSubContractors || [];
    marginedSubContractors?.forEach((subContractorItem) => {
      if (subContractorItem?.itemName) {
        items?.push({
          id: idCounter++,
          item: subContractorItem?.itemName || 'Sub-Contractor Item',
          description: subContractorItem?.description || subContractorItem?.scopeOfWork || '',
          amount: subContractorItem?.totalCost || 0
        });
      }
    });

    // If no items, return default empty item
    if (items?.length === 0) {
      return [{ id: 1, item: '', description: '', amount: 0 }];
    }

    return items;
  }, [formData?.marginedSubContractors]);

  // Auto-generate Zero Rate data from Zero Margined Supply and Total Logistics
  const generateZeroRateData = useMemo(() => {
    const items = [];
    let idCounter = 1;

    // 1. Additional Scope > Zero Margined Supply > Total Cost (each item separately)
    const zeroMarginedSupply = formData?.zeroMarginedSupply || [];
    zeroMarginedSupply?.forEach((supplyItem) => {
      if (supplyItem?.itemName) {
        items?.push({
          id: idCounter++,
          item: supplyItem?.itemName || 'Zero Margined Supply Item',
          description: supplyItem?.description || supplyItem?.scopeOfWork || '',
          amount: supplyItem?.totalCost || 0
        });
      }
    });

    // 2. Logistics > Total Logistics $
    const logistics = formData?.logistics || [];
    const totalLogistics = logistics?.length > 0 ? (logistics?.[0]?.totalLogistics || 0) : 0;
    
    if (totalLogistics > 0) {
      items?.push({
        id: idCounter++,
        item: 'Total Logistics $',
        description: 'Total logistics costs from all logistics categories',
        amount: totalLogistics
      });
    }

    // If no items, return default empty item
    if (items?.length === 0) {
      return [{ id: 1, item: '', description: '', amount: 0 }];
    }

    return items;
  }, [formData?.zeroMarginedSupply, formData?.logistics]);

  // Sample data structure for tables
  const [chargeableData, setChargeableData] = useState(() => {
    // Initialize from formData.revenueCenters.chargeableData object (not array)
    const rc = formData?.revenueCenters;
    if (rc && typeof rc === 'object' && !Array.isArray(rc)) {
      return rc?.chargeableData || {
        manufacturing: [{ id: 1, item: '', description: '', amount: 0 }],
        subContracted: [
          { id: 1, item: '', description: '', amount: 0 }
        ],
        zeroRate: [
          { id: 1, item: '', description: '', amount: 0 }
        ]
      };
    }
    return {
      manufacturing: [{ id: 1, item: '', description: '', amount: 0 }],
      subContracted: [
        { id: 1, item: '', description: '', amount: 0 }
      ],
      zeroRate: [
        { id: 1, item: '', description: '', amount: 0 }
      ]
    };
  });

  // Auto-update manufacturing data when source data changes
  useEffect(() => {
    setChargeableData(prev => ({
      ...prev,
      manufacturing: generateManufacturingData,
      subContracted: generateSubContractedData,
      zeroRate: generateZeroRateData
    }));
  }, [generateManufacturingData, generateSubContractedData, generateZeroRateData]);

  // chargeableDataRef: holds the latest chargeableData so Effect B can read it without
  // listing chargeableData as a reactive dep. This prevents extra onChange fires in
  // Cost+Margin mode when generateManufacturingData recomputes (because it depends on
  // revenueType) and triggers setChargeableData → Effect B → onChange cascade.
  const chargeableDataRef = useRef(chargeableData);
  useEffect(() => {
    chargeableDataRef.current = chargeableData;
  }, [chargeableData]);

  // Calculate totals from Materials + Labour
  const calculateMaterialsTotal = useMemo(() => {
    // PUSH ARCHITECTURE: Read from formData.computedTotals pushed by MaterialsLabourTab
    return parseFloat(formData?.computedTotals?.materialsTotal) || 0;
  }, [formData?.computedTotals?.materialsTotal]);

  const calculateLabourTotal = useMemo(() => {
    // PUSH ARCHITECTURE: Read from formData.computedTotals pushed by MaterialsLabourTab
    return parseFloat(formData?.computedTotals?.labourTotal) || 0;
  }, [formData?.computedTotals?.labourTotal]);

  // Calculate total from Over Heads
  const calculateOverheadsTotal = useMemo(() => {
    // PUSH ARCHITECTURE: Read from formData.computedTotals pushed by OverHeadsTab
    return parseFloat(formData?.computedTotals?.overheadsTotal) || 0;
  }, [formData?.computedTotals?.overheadsTotal]);

  // Calculate Site Works Costs total - PUSH ARCHITECTURE: read from formData.computedTotals
  const calculateSiteWorksTotal = useMemo(() => {
    return parseFloat(formData?.computedTotals?.siteCostsTotal) || 0;
  }, [formData?.computedTotals?.siteCostsTotal]);

  // Calculate Logistics totals - read from stored logistics sub-totals (already pushed by LogisticsTab)
  const calculateLaydownTotal = useMemo(() => {
    const logistics = formData?.logistics || [];
    if (logistics?.length > 0) {
      return parseFloat(logistics?.[0]?.laydown?.total) || 0;
    }
    return 0;
  }, [formData?.logistics]);

  const calculateLocalTotal = useMemo(() => {
    const logistics = formData?.logistics || [];
    if (logistics?.length > 0) {
      return parseFloat(logistics?.[0]?.local?.total) || 0;
    }
    return 0;
  }, [formData?.logistics]);

  const calculateDestinationTotal = useMemo(() => {
    const logistics = formData?.logistics || [];
    if (logistics?.length > 0) {
      return parseFloat(logistics?.[0]?.destination1?.total) || 0;
    }
    return 0;
  }, [formData?.logistics]);

  const calculateSeaShippingTotal = useMemo(() => {
    const logistics = formData?.logistics || [];
    if (logistics?.length > 0) {
      return parseFloat(logistics?.[0]?.destination2?.total) || 0;
    }
    return 0;
  }, [formData?.logistics]);

  // Calculate Commission total - PUSH ARCHITECTURE: read from formData.computedTotals
  const calculateCommissionTotal = useMemo(() => {
    return parseFloat(formData?.computedTotals?.commissionTotal) || 0;
  }, [formData?.computedTotals?.commissionTotal]);

  // Calculate Financing cost - PUSH ARCHITECTURE: read from formData.computedTotals
  const calculateFinancingCost = useMemo(() => {
    return parseFloat(formData?.computedTotals?.financingTotal) || 0;
  }, [formData?.computedTotals?.financingTotal]);

  // Calculate Additional Scope totals - PUSH ARCHITECTURE: read from formData.computedTotals
  const calculateInternalValueAddedTotal = useMemo(() => {
    return parseFloat(formData?.computedTotals?.internalValueAddedTotal) || 0;
  }, [formData?.computedTotals?.internalValueAddedTotal]);

  const calculateMarginedSubContractorsTotal = useMemo(() => {
    return parseFloat(formData?.computedTotals?.marginedSubContractorsTotal) || 0;
  }, [formData?.computedTotals?.marginedSubContractorsTotal]);

  const calculateZeroMarginedSupplyTotal = useMemo(() => {
    return parseFloat(formData?.computedTotals?.zeroMarginedSupplyTotal) || 0;
  }, [formData?.computedTotals?.zeroMarginedSupplyTotal]);

  // Auto-generate Cost + Margin data from all sources
  const costMarginData = useMemo(() => {
    const items = [];

    // Additional Scope - Internal Value-Added Scope > Production $
    items?.push({
      id: 'Internal Value-Added Scope - Production $',
      item: 'Internal Value-Added Scope - Production $',
      amount: calculateInternalValueAddedTotal,
      marginPercent: 0
    });

    // Additional Scope - Margined Sub-Contractors > Contracted $
    items?.push({
      id: 'Margined Sub-Contractors - Contracted $',
      item: 'Margined Sub-Contractors - Contracted $',
      amount: calculateMarginedSubContractorsTotal,
      marginPercent: 0
    });

    // Additional Scope - Zero Margined Supply > Production $
    items?.push({
      id: 'Zero Margined Supply - Production $',
      item: 'Zero Margined Supply - Production $',
      amount: calculateZeroMarginedSupplyTotal,
      marginPercent: 0
    });

    // Materials + Labour > Materials > Material Total
    items?.push({
      id: 'Materials Total',
      item: 'Materials Total',
      amount: calculateMaterialsTotal,
      marginPercent: 0
    });

    // Materials + Labour > Labour > Labour Total
    items?.push({
      id: 'Labour Total',
      item: 'Labour Total',
      amount: calculateLabourTotal,
      marginPercent: 0
    });

    // Over Heads > Overhead Calculations > Total Over Head
    items?.push({
      id: 'Total Over Head',
      item: 'Total Over Head',
      amount: calculateOverheadsTotal,
      marginPercent: 0
    });

    // Site Works Costs > Site Cost Total
    items?.push({
      id: 'Site Cost Total',
      item: 'Site Cost Total',
      amount: calculateSiteWorksTotal,
      marginPercent: 0
    });

    // Logistics > Laydown > Total $
    items?.push({
      id: 'Laydown Total $',
      item: 'Laydown Total $',
      amount: calculateLaydownTotal,
      marginPercent: 0
    });

    // Logistics > Local > Total $
    items?.push({
      id: 'Local Total $',
      item: 'Local Total $',
      amount: calculateLocalTotal,
      marginPercent: 0
    });

    // Logistics > Destination > Total $
    items?.push({
      id: 'Destination Total $',
      item: 'Destination Total $',
      amount: calculateDestinationTotal,
      marginPercent: 0
    });

    // Logistics > Sea Shipping > Total $
    items?.push({
      id: 'Sea Shipping Total $',
      item: 'Sea Shipping Total $',
      amount: calculateSeaShippingTotal,
      marginPercent: 0
    });

    // REMOVED: Commission Total $ - now displayed separately between Subtotal and Grand Total

    // Financing > Financing Cost
    items?.push({
      id: 'Financing Cost',
      item: 'Financing Cost',
      amount: calculateFinancingCost,
      marginPercent: 0
    });

    return items;
  }, [
    calculateInternalValueAddedTotal,
    calculateMarginedSubContractorsTotal,
    calculateZeroMarginedSupplyTotal,
    calculateMaterialsTotal,
    calculateLabourTotal,
    calculateOverheadsTotal,
    calculateSiteWorksTotal,
    calculateLaydownTotal,
    calculateLocalTotal,
    calculateDestinationTotal,
    calculateSeaShippingTotal,
    calculateFinancingCost
  ]);

  // Calculate sum of all amounts (before risk)
  const sumOfAllAmounts = useMemo(() => {
    return costMarginData?.reduce((sum, item) => sum + (parseFloat(item?.amount) || 0), 0);
  }, [costMarginData]);

  // Calculate Risk Allocation (from Risk tab)
  const calculateRiskAllocation = useMemo(() => {
    const riskData = formData?.risks || {};
    
    // Helper function to calculate average for a sub-heading
    const calculateAverage = (subHeadingData) => {
      if (!subHeadingData) return 0;
      
      const fields = Object.keys(subHeadingData)?.filter(key => key !== 'factor');
      if (fields?.length === 0) return 0;
      
      const sum = fields?.reduce((acc, field) => {
        return acc + (parseFloat(subHeadingData?.[field]) || 0);
      }, 0);
      
      const average = sum / fields?.length;
      const factorValue = parseFloat(subHeadingData?.factor) || 0;
      const result = average * (factorValue / 100);
      
      return result;
    };
    
    const allAverages = [
      // Client Assessment
      calculateAverage(riskData?.clientAssessment?.stakeholder),
      calculateAverage(riskData?.clientAssessment?.financialRisk),
      calculateAverage(riskData?.clientAssessment?.costOverRuns),
      0, // Finance row
      // Operational Risk
      calculateAverage(riskData?.operationalRisk?.projectDetails),
      calculateAverage(riskData?.operationalRisk?.constructionRisk),
      // Market Risk
      calculateAverage(riskData?.marketRisk?.demandVariability),
      // Environmental Risk
      calculateAverage(riskData?.environmentalRisk?.siteConditions),
      calculateAverage(riskData?.environmentalRisk?.sustainabilityAndCompliance),
      calculateAverage(riskData?.environmentalRisk?.compliance)
    ];
    
    const sum = allAverages?.reduce((acc, val) => acc + val, 0);
    const riskAllocationPercent = sum / allAverages?.length;
    
    return riskAllocationPercent;
  }, [formData?.risks]);

  // Calculate Risk amount based on sum of all amounts
  const riskAmount = useMemo(() => {
    return sumOfAllAmounts * (calculateRiskAllocation / 100);
  }, [sumOfAllAmounts, calculateRiskAllocation]);

  // Add Risk to the cost margin data
  const costMarginDataWithRisk = useMemo(() => {
    const dataWithRisk = [...costMarginData];
    
    if (riskAmount > 0) {
      dataWithRisk?.push({
        id: 'Risk Allocation',
        item: `Risk Allocation (${calculateRiskAllocation?.toFixed(2)}%)`,
        amount: riskAmount,
        marginPercent: 0
      });
    }
    
    return dataWithRisk;
  }, [costMarginData, riskAmount, calculateRiskAllocation]);

  // State to track user-entered margin percentages - initialize from formData
  const [marginPercentages, setMarginPercentages] = useState(() => {
    return formData?.revenueCenters?.marginPercentages || {};
  });
  const [totalMarginPercent, setTotalMarginPercent] = useState(() => {
    return formData?.revenueCenters?.totalMarginPercent || 0;
  });

  // CRITICAL FIX: Sync margin percentages with formData when it changes (after loading from database)
  useEffect(() => {
    const rc = formData?.revenueCenters;
    if (rc && typeof rc === 'object' && !Array.isArray(rc)) {
      if (rc?.marginPercentages && Object.keys(rc?.marginPercentages)?.length > 0) {
        setMarginPercentages(prev => {
          // Only update if the incoming value is actually different
          if (JSON.stringify(prev) !== JSON.stringify(rc?.marginPercentages)) {
            console.log('[RevenueCentersTab] Loading marginPercentages from formData:', rc?.marginPercentages);
            return rc?.marginPercentages;
          }
          return prev;
        });
      }
      if (rc?.totalMarginPercent !== undefined && rc?.totalMarginPercent !== null) {
        setTotalMarginPercent(prev => {
          if (prev !== rc?.totalMarginPercent) {
            console.log('[RevenueCentersTab] Loading totalMarginPercent from formData:', rc?.totalMarginPercent);
            return rc?.totalMarginPercent;
          }
          return prev;
        });
      }
    }
  }, [formData?.revenueCenters?.marginPercentages, formData?.revenueCenters?.totalMarginPercent]);

  // Use ref to track previous values and prevent infinite loops
  const prevValuesRef = useRef({
    revenueType: formData?.revenueCenters?.revenueType ?? 'chargeable',
    marginPercentages: formData?.revenueCenters?.marginPercentages || {},
    totalMarginPercent: formData?.revenueCenters?.totalMarginPercent || 0
  });

  // Mount guard: skip Effect B on initial render so prevValuesRef never overwrites the DB-loaded revenueType
  const isMountedRef = useRef(false);

  // isLoadedRef: becomes true only after the first real DB data arrives in formData.revenueCenters.
  // Both Effect B and Effect C check this before calling onChange — staying silent during the initial load.
  const isLoadedRef = useRef(false);

  // costMarginDataWithRiskRef: holds the latest costMarginDataWithRisk so Effect B can read it
  // without listing it as a reactive dep. This breaks the cascade where every upstream formData
  // field change (materials, labour, overheads, etc.) recomputes costMarginDataWithRisk →
  // triggers Effect B → calls onChange → setFormData → flicker in Cost+Margin mode.
  const costMarginDataWithRiskRef = useRef(costMarginDataWithRisk);
  useEffect(() => {
    costMarginDataWithRiskRef.current = costMarginDataWithRisk;
  }, [costMarginDataWithRisk]);

  // CRITICAL FIX: Keep a ref to the latest formData.revenueCenters so Effect B always
  // spreads the current value — not a stale closure snapshot from when Effect B was last
  // scheduled. Without this, auto-save triggers a re-render that causes Effect B to fire
  // with the old formData.revenueCenters, overwriting user edits with stale data.
  const formDataRevenueCentersRef = useRef(formData?.revenueCenters);
  useEffect(() => {
    formDataRevenueCentersRef.current = formData?.revenueCenters;
  }, [formData?.revenueCenters]);

  // Bug 4 FIX: Use isProposalLoaded prop (set by index.jsx after async load completes) instead of
  // unreliable non-default value detection. This works for ALL proposals including new chargeable
  // ones where grandTotal is 0 and revenueType is still 'chargeable'.
  // Bug 3 FIX: Delay setting isLoadedRef by one render tick via setTimeout(0) so Effect B never
  // fires with partially-stale data on re-entry (chargeableData / costMarginDataWithRisk may still
  // be mid-update on the same render that DB data arrives).
  useEffect(() => {
    if (!isLoadedRef?.current && isProposalLoaded) {
      setTimeout(() => {
        isLoadedRef.current = true;
      }, 0);
    }
  }, [isProposalLoaded]);

  // Persist states to formData whenever they change — MERGED with grandTotal calculation
  // so there is only ever ONE onChange call per change cycle instead of two.
  useEffect(() => {
    // Skip the very first render — formData is still at its default state before the async DB load completes.
    if (!isMountedRef?.current) {
      isMountedRef.current = true;
      return;
    }

    // Stay silent during the initial load — wait until real DB data has arrived.
    if (!isLoadedRef?.current) {
      return;
    }

    // Check if any value has actually changed from previous
    const hasRevenueTypeChanged = prevValuesRef?.current?.revenueType !== revenueType;
    const hasMarginPercentagesChanged = JSON.stringify(prevValuesRef?.current?.marginPercentages) !== JSON.stringify(marginPercentages);
    const hasTotalMarginChanged = prevValuesRef?.current?.totalMarginPercent !== totalMarginPercent;
    
    const hasChanged = hasRevenueTypeChanged || hasMarginPercentagesChanged || hasTotalMarginChanged;

    // Read chargeableData from ref (not reactive dep) to avoid extra fires when
    // generateManufacturingData recomputes on revenueType change.
    const currentChargeableData = chargeableDataRef?.current;

    // Read costMarginDataWithRisk from ref (not reactive dep) to avoid extra fires when
    // any upstream formData field (materials, labour, overheads, etc.) changes and causes
    // costMarginDataWithRisk to recompute — which was the primary Cost+Margin flicker source.
    const currentCostMarginDataWithRisk = costMarginDataWithRiskRef?.current;

    // Compute grandTotal inline so we can include it in the same single onChange call
    let grandTotal = 0;
    if (revenueType === 'chargeable') {
      // Read from chargeableData state directly (same source as UI display) to avoid
      // the one-render lag that chargeableDataRef.current has vs the displayed value.
      grandTotal =
        calculateTotal(chargeableData?.manufacturing) +
        calculateTotal(chargeableData?.subContracted) +
        calculateTotal(chargeableData?.zeroRate);
    } else if (revenueType === 'cost-margin') {
      grandTotal = calculateFinalTotal(currentCostMarginDataWithRisk);
    }

    const currentGrandTotal = formData?.revenueCenters?.grandTotal;
    const hasGrandTotalChanged = currentGrandTotal !== grandTotal;
    
    if ((hasChanged || hasGrandTotalChanged) && onChange) {
      console.log('RevenueCentersTab: Persisting changes:', {
        revenueType: { old: prevValuesRef?.current?.revenueType, new: revenueType },
        marginPercentages: { changed: hasMarginPercentagesChanged },
        totalMarginPercent: { old: prevValuesRef?.current?.totalMarginPercent, new: totalMarginPercent },
        grandTotal: { old: currentGrandTotal, new: grandTotal }
      });
      
      // Update ref with new values
      prevValuesRef.current = {
        revenueType,
        marginPercentages,
        totalMarginPercent
      };
      
      // FIX 1: Single onChange call — only persist revenueType, marginPercentages,
      // totalMarginPercent, and grandTotal. chargeableData is intentionally excluded
      // because it is a computed view of source columns (modules, materials, labour, etc.)
      // and is recomputed on every render. Storing it in the DB doubles the payload size.
      onChange('revenueCenters', {
        ...formDataRevenueCentersRef?.current,
        // Explicitly omit chargeableData — strip it if it was previously stored
        chargeableData: undefined,
        marginPercentages,
        totalMarginPercent,
        revenueType,
        grandTotal,
      });
    }
  // CRITICAL: formData?.revenueCenters and costMarginDataWithRisk intentionally
  // excluded from deps. costMarginDataWithRisk is read via costMarginDataWithRiskRef
  // to avoid the flicker cascade in Cost+Margin mode. chargeableData is included
  // so the Chargeable mode grandTotal always matches the UI display value.
  // formDataRevenueCentersRef is used instead of formData?.revenueCenters to prevent
  // stale closure data reboot after auto-save triggers a re-render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marginPercentages, totalMarginPercent, revenueType, onChange, chargeableData]);

  // Update margin percentage for a specific item
  const updateMarginPercent = (id, value) => {
    setMarginPercentages(prev => ({
      ...prev,
      [id]: parseFloat(value) || 0
    }));
  };

  // Update total margin percentage
  const handleTotalMarginChange = (value) => {
    setTotalMarginPercent(parseFloat(value) || 0);
  };

  // Reset all margin percentages to zero
  const handleResetMargins = () => {
    setMarginPercentages({});
    setTotalMarginPercent(0);
  };

  // Calculate totals
  const calculateTotal = (data) => {
    return data?.reduce((sum, item) => sum + (parseFloat(item?.amount) || 0), 0);
  };

  const calculateMarginTotal = (data) => {
    return data?.reduce((sum, item) => {
      const amount = parseFloat(item?.amount) || 0;
      const margin = marginPercentages?.[item?.id] || 0;
      return sum + (amount * (1 + margin / 100));
    }, 0);
  };

  // NEW: Modified to calculate Grand Total = Subtotal × (1 + totalMarginPercent/100)
  // Bug 5 FIX: Commission total is intentionally NOT included here. RevenueCenters calculates
  // only its own subtotal. The combined total (RC + Commission) is assembled once in index.jsx
  // for Proposal Summary only. This breaks the circular loop:
  //   RevenueCenters grandTotal (included commission) → onChange → setFormData →
  //   CommissionTab recalculates → onChange → setFormData → RevenueCenters fires again.
  const calculateFinalTotal = (data) => {
    const baseTotal = calculateTotal(data);
    const marginedTotal = calculateMarginTotal(data);
    const totalWithLineMargins = marginedTotal;
    // Apply total margin percentage only — no Commission added here
    const subtotalWithMargin = totalWithLineMargins * (1 + totalMarginPercent / 100);
    return subtotalWithMargin;
  };

  const renderTable = (title, data, category = null, isCostMargin = false) => {
    const total = calculateTotal(data);
    const marginTotal = isCostMargin ? calculateMarginTotal(data) : 0;
    const finalTotal = isCostMargin ? calculateFinalTotal(data) : 0;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col transition-colors">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
          {isCostMargin && (
            <button
              onClick={handleResetMargins}
              className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
            >
              Reset Data
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">Item</th>
                <th className="text-right py-2 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                {isCostMargin && (
                  <>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Margin %</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Total</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data?.map((row, index) => {
                const margin = marginPercentages?.[row?.id] || 0;
                const rowTotal = isCostMargin 
                  ? (parseFloat(row?.amount) || 0) * (1 + margin / 100)
                  : 0;
                
                return (
                  <tr key={row?.id} className="border-b border-gray-100 dark:border-gray-700 h-[42px] hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="py-2 px-2">
                      <div className="w-full px-2 py-1 text-sm text-gray-700 dark:text-gray-200">
                        {row?.item}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="w-full px-2 py-1 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        ${formatNumber(row?.amount, 2)}
                      </div>
                    </td>
                    {isCostMargin && (
                      <>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={marginPercentages?.[row?.id] || 0}
                            onChange={(e) => updateMarginPercent(row?.id, e?.target?.value)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                            placeholder="0"
                            step="0.1"
                            maxLength="4"
                            onInput={(e) => {
                              if (e?.target?.value?.length > 4) {
                                e.target.value = e?.target?.value?.slice(0, 4);
                              }
                            }}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="w-full px-2 py-1 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                            ${formatNumber(rowTotal, 2)}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-750 font-semibold border-t-2 border-gray-300 dark:border-gray-600">
                <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">Subtotal</td>
                <td className="py-3 px-2 text-sm text-right text-gray-900 dark:text-gray-100">${formatNumber(total, 2)}</td>
                {isCostMargin && (
                  <>
                    <td className="py-3 px-3 text-sm text-right">
                      <input
                        type="number"
                        value={totalMarginPercent}
                        onChange={(e) => handleTotalMarginChange(e?.target?.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                        placeholder="0"
                        step="0.1"
                        maxLength="4"
                        onInput={(e) => {
                          if (e?.target?.value?.length > 4) {
                            e.target.value = e?.target?.value?.slice(0, 4);
                          }
                        }}
                      />
                    </td>
                    <td className="py-3 px-3 text-sm text-right text-gray-900 dark:text-gray-100">${formatNumber(marginTotal, 2)}</td>
                  </>
                )}
              </tr>
              {/* NEW: Commission row between Subtotal and Grand Total */}
              {isCostMargin && (
                <tr className="bg-amber-50 dark:bg-amber-900/20 font-semibold border-t border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">Commission Total $</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-900 dark:text-gray-100" colSpan="3">${formatNumber(calculateCommissionTotal, 2)}</td>
                </tr>
              )}
              {isCostMargin && totalMarginPercent > 0 && (
                <tr className="bg-blue-50 dark:bg-blue-900/30 font-bold border-t border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-2 text-sm text-gray-900 dark:text-gray-100">Grand Total (with {totalMarginPercent}% margin)</td>
                  <td className="py-3 px-2 text-sm text-right text-blue-700 dark:text-blue-300" colSpan="3">${formatNumber(finalTotal, 2)}</td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Revenue Centers</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Manage revenue streams and cost centers
        </p>
      </div>
      {/* Revenue Type Dropdown */}
      <div className="max-w-xs">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Revenue Type
        </label>
        <select
          value={revenueType}
          onChange={(e) => {
            if (onChange) {
              onChange('revenueCenters', {
                ...formData?.revenueCenters,
                revenueType: e?.target?.value,
              });
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
        >
          <option value="chargeable">Chargeable</option>
          <option value="cost-margin">Cost + Margin</option>
        </select>
      </div>
      {/* Conditional Content Based on Revenue Type */}
      {revenueType === 'chargeable' && (
        <>
          <div className="grid grid-cols-3 gap-6">
            {renderTable('Manufacturing', chargeableData?.manufacturing, 'manufacturing')}
            {renderTable('Sub Contracted', chargeableData?.subContracted, 'subContracted')}
            {renderTable('Zero Rate', chargeableData?.zeroRate, 'zeroRate')}
          </div>
          
          {/* Grand Total */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg border-2 border-blue-300 dark:border-blue-700 p-6 shadow-md transition-colors">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">Grand Total (All Revenue Centers)</h4>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                ${formatNumber(
                  calculateTotal(chargeableData?.manufacturing) +
                  calculateTotal(chargeableData?.subContracted) +
                  calculateTotal(chargeableData?.zeroRate),
                  2
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {revenueType === 'cost-margin' && (
        <div>
          {costMarginDataWithRisk?.length > 0 ? (
            renderTable('Cost + Margin', costMarginDataWithRisk, null, true)
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center transition-colors">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No data available. Please fill in the relevant tabs (Additional Scope, Materials + Labour, Over Heads, Site Costs, Logistics, Commission, Financing, Risk) to see items here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RevenueCentersTab;