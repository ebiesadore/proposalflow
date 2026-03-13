import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import { formatNumber } from '../../../../utils/cn';
import DecimalMath from '../../../../utils/decimalMath';

const CommissionTab = ({ formData, onChange, errors }) => {
  const [commissionItems, setCommissionItems] = useState([]);

  // Mount guard: prevents the sync-to-parent effect from firing on the initial render
  // with the empty [] default, which caused a spurious onChange('commissionItems', [])
  // → setFormData → re-render → Commission flicker.
  const commissionMountedRef = useRef(false);

  // Type options for dropdown
  const typeOptions = [
    { value: 'Percentage', label: 'Percentage' },
    { value: 'Fixed Value', label: 'Fixed Value' }
  ];

  // Calculate Total Area (ft²) from Modular Build Up
  const totalAreaFt2 = useMemo(() => {
    if (!formData?.modules || formData?.modules?.length === 0) return 0;

    return formData?.modules?.reduce((sum, module) => {
      const quantity = DecimalMath?.parse(module?.quantity, 0);
      const areaFt2 = DecimalMath?.parse(module?.areaFeet, 0) || DecimalMath?.divide(DecimalMath?.parse(module?.areaMM, 0), 0.092903);
      return sum + DecimalMath?.multiply(quantity, areaFt2);
    }, 0);
  }, [formData?.modules]);

  // Calculate Subtotal (excluding Commission) from Revenue Centers
  const calculateSubtotal = useMemo(() => {
    // Get all cost components from formData
    const materials = formData?.materials || [];
    const labour = formData?.labour || [];
    const overheads = formData?.overheads || {};
    const siteCosts = formData?.siteCosts || [];
    const logistics = formData?.logistics || [];
    const financing = formData?.financing || {};
    const internalValueAdded = formData?.internalValueAdded || [];
    const marginedSubContractors = formData?.marginedSubContractors || [];
    const zeroMarginedSupply = formData?.zeroMarginedSupply || [];

    let subtotal = 0;

    // Materials Total
    const materialTotal = materials?.reduce((sum, item) => {
      const costWastePSQF = parseFloat(item?.costWastePSQF) || 0;
      return sum + costWastePSQF;
    }, 0);
    const totalAreaFt2 = (formData?.modules || [])?.reduce((sum, module) => {
      const quantity = parseFloat(module?.quantity) || 0;
      const areaFt2 = parseFloat(module?.areaFeet) || 0;
      return sum + (quantity * areaFt2);
    }, 0);
    subtotal += materialTotal * totalAreaFt2;

    // Labour Total
    subtotal += labour?.reduce((sum, item) => sum + (parseFloat(item?.total) || 0), 0);

    // Overheads Total
    const overheadSections = ['design', 'procurement', 'general', 'production', 'project'];
    overheadSections?.forEach(section => {
      const sectionData = overheads?.[section] || [];
      subtotal += sectionData?.reduce((sum, item) => sum + (parseFloat(item?.totalOH) || 0), 0);
    });

    // Site Costs Total
    subtotal += siteCosts?.reduce((sum, item) => sum + (parseFloat(item?.total) || 0), 0);

    // Logistics Totals
    if (logistics?.length > 0) {
      const log = logistics?.[0];
      subtotal += parseFloat(log?.laydown?.total) || 0;
      subtotal += parseFloat(log?.local?.total) || 0;
      subtotal += parseFloat(log?.destination1?.total) || 0;
      subtotal += parseFloat(log?.destination2?.total) || 0;
    }

    // Financing Cost
    const financingOptions = financing?.options || [];
    subtotal += financingOptions?.reduce((sum, option) => {
      const amount = parseFloat(option?.amount) || 0;
      const rate = parseFloat(option?.interestRate) || 0;
      const term = parseFloat(option?.term) || 0;
      return sum + (amount * (rate / 100) * term);
    }, 0);

    // Internal Value-Added Production $
    subtotal += internalValueAdded?.reduce((sum, item) => sum + (parseFloat(item?.productionCost) || 0), 0);

    // Margined Sub-Contractors Contracted $
    subtotal += marginedSubContractors?.reduce((sum, item) => sum + (parseFloat(item?.contractedCost) || 0), 0);

    // Zero Margined Supply Production $
    subtotal += zeroMarginedSupply?.reduce((sum, item) => sum + (parseFloat(item?.productionCost) || 0), 0);

    // Risk Allocation (if applicable)
    const riskAmount = parseFloat(formData?.risk?.totalRiskAmount) || 0;
    const riskAllocationPercent = parseFloat(formData?.risk?.riskAllocationPercent) || 0;
    subtotal += riskAmount * (riskAllocationPercent / 100);

    return subtotal;
  }, [
    formData?.materials,
    formData?.labour,
    formData?.overheads,
    formData?.siteCosts,
    formData?.logistics,
    formData?.financing,
    formData?.internalValueAdded,
    formData?.marginedSubContractors,
    formData?.zeroMarginedSupply,
    formData?.risk,
    formData?.modules
  ]);

  // Get Total Margin % from Revenue Centers
  const totalMarginPercent = useMemo(() => {
    return parseFloat(formData?.revenueCenters?.totalMarginPercent) || 0; // Default to 0 (not 45 — avoids flicker between 45% and real saved value)
  }, [formData?.revenueCenters?.totalMarginPercent]);

  // STEP 1: Calculate Commission Total $ = (Commission %) × (Subtotal × 1.45)
  const calculateCommissionTotal = (commissionPercent) => {
    if (!commissionPercent || commissionPercent === 0) return 0;
    const subtotalWithMargin = calculateSubtotal * (1 + totalMarginPercent / 100);
    return (commissionPercent / 100) * subtotalWithMargin;
  };

  // STEP 2: Calculate ft2 $ = Commission Total $ ÷ Total Area (Ft²)
  const calculateFt2Dollar = (commissionTotal) => {
    if (!commissionTotal || commissionTotal === 0 || !totalAreaFt2 || totalAreaFt2 === 0) return 0;
    return commissionTotal / totalAreaFt2;
  };

  // Initialize from formData when component mounts
  useEffect(() => {
    if (formData?.commissionItems && Array.isArray(formData?.commissionItems) && formData?.commissionItems?.length > 0) {
      setCommissionItems(formData?.commissionItems);
    }
  }, [formData?.commissionItems]);

  // Sync commission items to parent whenever they change.
  // CRITICAL: Skip the very first render — commissionItems is still the empty [] default
  // before the async DB load completes. Without this guard, onChange fires with [] on mount,
  // then again with the real saved items after DB load → two setFormData calls → flicker.
  useEffect(() => {
    if (!commissionMountedRef?.current) {
      commissionMountedRef.current = true;
      return;
    }
    if (onChange) {
      onChange('commissionItems', commissionItems);
    }
  }, [commissionItems, onChange]);

  const addCommissionItem = () => {
    const newItem = {
      id: Date.now(),
      no: commissionItems?.length + 1,
      type: 'Percentage',
      payeeDetail: '',
      percentage: '',
      ft2Dollar: '',
      allocatedFt2: '',
      valueDollar: '',
      total: 0
    };
    setCommissionItems([...commissionItems, newItem]);
  };

  const removeCommissionItem = (id) => {
    const updatedItems = commissionItems?.filter(item => item?.id !== id);
    // Renumber items
    const renumberedItems = updatedItems?.map((item, index) => ({
      ...item,
      no: index + 1
    }));
    setCommissionItems(renumberedItems);
  };

  const updateCommissionItem = (id, field, value) => {
    setCommissionItems(items =>
      items?.map(item => {
        if (item?.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Calculate total based on type
          if (updatedItem?.type === 'Percentage') {
            const percentage = parseFloat(updatedItem?.percentage) || 0;
            // STEP 1: Calculate Commission Total $
            const commissionTotal = calculateCommissionTotal(percentage);
            updatedItem.commissionTotal = commissionTotal;
            // STEP 2: Calculate ft2 $ from Commission Total $
            const ft2Dollar = calculateFt2Dollar(commissionTotal);
            updatedItem.ft2Dollar = ft2Dollar;
            // Use Total Area from Modular Build Up
            const allocatedFt2 = totalAreaFt2;
            updatedItem.allocatedFt2 = allocatedFt2;
            // Total $ = ft2 $ × Allocated ft2 - ensure both values are valid numbers
            if (ft2Dollar != null && allocatedFt2 != null) {
              updatedItem.total = ft2Dollar * allocatedFt2;
            } else {
              updatedItem.total = 0;
            }
          } else if (updatedItem?.type === 'Fixed Value') {
            updatedItem.total = parseFloat(updatedItem?.valueDollar) || 0;
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Auto-update Commission Total $, ft2 $, and allocatedFt2 for all Percentage type items when dependencies change.
  // CRITICAL: Skip the very first render — totalMarginPercent starts at 0 (default) and only
  // gets the real saved value after DB load. Without this guard, the auto-update fires with
  // totalMarginPercent=0 on mount → recalculates all items → setCommissionItems → sync effect
  // fires → onChange → setFormData → then fires again with real totalMarginPercent → flicker
  // between 45% and the real saved value (e.g. 85.8%).
  const autoUpdateMountedRef = useRef(false);
  useEffect(() => {
    if (!autoUpdateMountedRef?.current) {
      autoUpdateMountedRef.current = true;
      return;
    }
    setCommissionItems(items =>
      items?.map(item => {
        if (item?.type === 'Percentage') {
          const percentage = parseFloat(item?.percentage) || 0;
          // STEP 1: Calculate Commission Total $
          const commissionTotal = calculateCommissionTotal(percentage);
          // STEP 2: Calculate ft2 $ from Commission Total $
          const ft2Dollar = calculateFt2Dollar(commissionTotal);
          const allocatedFt2 = totalAreaFt2;
          // Total $ = ft2 $ × Allocated ft2 - ensure both values are valid numbers
          let totalDollar = 0;
          if (ft2Dollar != null && allocatedFt2 != null) {
            totalDollar = ft2Dollar * allocatedFt2;
          }
          return {
            ...item,
            commissionTotal: commissionTotal,
            ft2Dollar: ft2Dollar,
            allocatedFt2: allocatedFt2,
            total: totalDollar
          };
        } else if (item?.type === 'Fixed Value') {
          // For Fixed Value: Total $ = Value $
          const valueDollar = parseFloat(item?.valueDollar) || 0;
          return {
            ...item,
            total: valueDollar
          };
        }
        return item;
      })
    );
  }, [totalAreaFt2, calculateSubtotal, totalMarginPercent]);

  // Calculate totals
  const totalPercentage = commissionItems?.filter(item => item?.type === 'Percentage')?.reduce((sum, item) => sum + (parseFloat(item?.percentage) || 0), 0);

  const siteCostTotal = commissionItems?.reduce((sum, item) => sum + (item?.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Add Commission Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Commission</h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Manage commission items and calculations</p>
        </div>
        <Button
          onClick={addCommissionItem}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Commission
        </Button>
      </div>
      {/* Commission Items List */}
      {commissionItems?.length > 0 && (
        <div className="space-y-4">
          {commissionItems?.map((item) => (
            <div key={item?.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors">
              <div className="flex gap-4 items-start">
                {/* No. */}
                <div className="w-16 flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">No.</label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-center text-gray-900 dark:text-gray-100 transition-colors">
                    {item?.no}
                  </div>
                </div>

                {/* Type Dropdown */}
                <div className="w-40 flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <Select
                    value={item?.type}
                    onChange={(value) => updateCommissionItem(item?.id, 'type', value)}
                    options={typeOptions}
                    className="w-full"
                  />
                </div>

                {/* Payee Detail */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payee Detail</label>
                  <Input
                    type="text"
                    value={item?.payeeDetail}
                    onChange={(e) => updateCommissionItem(item?.id, 'payeeDetail', e?.target?.value)}
                    placeholder="Enter payee"
                    className="w-full"
                  />
                </div>

                {/* % - Only show for Percentage type */}
                {item?.type === 'Percentage' && (
                  <div className="w-24 flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">%</label>
                    <Input
                      type="number"
                      value={item?.percentage}
                      onChange={(e) => updateCommissionItem(item?.id, 'percentage', e?.target?.value)}
                      placeholder="0"
                      className="w-full"
                      step="0.01"
                    />
                  </div>
                )}

                {/* Conditional Fields Based on Type */}
                {item?.type === 'Fixed Value' && (
                  <>
                    {/* Value $ */}
                    <div className="w-40 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Value $</label>
                      <Input
                        type="number"
                        value={item?.valueDollar}
                        onChange={(e) => updateCommissionItem(item?.id, 'valueDollar', e?.target?.value)}
                        placeholder="0.00"
                        className="w-full"
                        step="0.01"
                      />
                    </div>
                  </>
                )}

                {item?.type === 'Percentage' && (
                  <>
                    {/* Ft2 $ - READ ONLY, AUTO-CALCULATED */}
                    <div className="w-32 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ft2 $
                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(Auto)</span>
                      </label>
                      <Input
                        type="number"
                        value={item?.ft2Dollar ? formatNumber(item?.ft2Dollar, 2) : '0.00'}
                        readOnly
                        disabled
                        placeholder="0.00"
                        className="w-full bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        step="0.01"
                        title="Auto-calculated: Commission Total $ ÷ Total Area (54,000 Ft²)"
                      />
                    </div>

                    {/* Allocated Ft2 - READ ONLY, AUTO-CALCULATED */}
                    <div className="w-36 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Allocated ft2
                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(Auto)</span>
                      </label>
                      <Input
                        type="number"
                        value={totalAreaFt2}
                        readOnly
                        disabled
                        placeholder="0"
                        className="w-full bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        step="0.01"
                        title="Auto-calculated from Modular Build Up total area"
                      />
                    </div>

                    {/* Total $ - READ ONLY, AUTO-CALCULATED */}
                    <div className="w-40 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Total $
                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(Auto)</span>
                      </label>
                      <Input
                        type="number"
                        value={item?.total != null ? formatNumber(item?.total, 2) : '0.00'}
                        readOnly
                        disabled
                        placeholder="0.00"
                        className="w-full bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        step="0.01"
                        title="Auto-calculated total for this commission item"
                      />
                    </div>
                  </>
                )}

                {item?.type === 'Fixed Value' && (
                  <>
                    {/* Total $ for Fixed Value - READ ONLY, AUTO-CALCULATED */}
                    <div className="w-40 flex-shrink-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Total $
                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(Auto)</span>
                      </label>
                      <Input
                        type="number"
                        value={item?.total != null ? formatNumber(item?.total, 2) : '0.00'}
                        readOnly
                        disabled
                        placeholder="0.00"
                        className="w-full bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        step="0.01"
                        title="Auto-calculated total for this commission item"
                      />
                    </div>
                  </>
                )}

                {/* Delete Button */}
                <div className="flex items-end flex-shrink-0">
                  <button
                    onClick={() => removeCommissionItem(item?.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors mt-6"
                    title="Delete item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Summary Section */}
          <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-6 mt-6">
            <div className="grid grid-cols-2 gap-8 max-w-2xl ml-auto">
              {/* Total % */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total %</label>
                <div className="px-4 py-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                  {formatNumber(totalPercentage, 2)}%
                </div>
              </div>

              {/* Site Cost Total $ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Site Cost Total $</label>
                <div className="px-4 py-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                  ${formatNumber(siteCostTotal, 2)}
                </div>
              </div>
            </div>
          </div>

          {/* Commission Calculation Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6 transition-colors">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Commission Calculation</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Step 1:</strong> Commission Total $ = (% / 100) × (Subtotal × 1.45)
              <br />
              <strong>Step 2:</strong> ft2 $ = Commission Total $ ÷ Total Area (Ft²)
              <br />
              Current Subtotal: <strong>${formatNumber(calculateSubtotal, 2)}</strong> | Total Margin: <strong>{totalMarginPercent}%</strong> | Total Area: <strong>{formatNumber(totalAreaFt2, 2)} Ft²</strong>
            </p>
          </div>
        </div>
      )}
      {/* Empty State */}
      {commissionItems?.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No commission items added yet</p>
          <Button
            onClick={addCommissionItem}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Commission Item
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommissionTab;