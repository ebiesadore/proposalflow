import React, { useMemo } from 'react';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import { Checkbox } from '../../../../components/ui/Checkbox';


const FinancingTab = ({ formData, onChange, errors }) => {
  const bondingTypeOptions = [
    { value: 'performance', label: 'Performance' },
    { value: 'payment-performance', label: 'Payment and Performance' }
  ];

  const financeTypeOptions = [
    { value: 'bank-financing', label: 'Bank Financing' },
    { value: 'hnw-invs', label: 'HNW Invs' },
    { value: 'hard-money', label: 'Hard Money' }
  ];

  // Calculate Grand Total from Revenue Centers (matching RevenueCentersTab logic)
  const calculateGrandTotal = useMemo(() => {
    // Read from formData.revenueCenters.chargeableData (object, not array)
    const chargeableData = formData?.revenueCenters?.chargeableData || {};
    const manufacturing = chargeableData?.manufacturing || [];
    const subContracted = chargeableData?.subContracted || [];
    const zeroRate = chargeableData?.zeroRate || [];

    // Use simple calculation matching RevenueCentersTab
    const calculateTotal = (data) => {
      return data?.reduce((sum, item) => sum + (parseFloat(item?.amount) || 0), 0);
    };

    const manufacturingTotal = calculateTotal(manufacturing);
    const subContractedTotal = calculateTotal(subContracted);
    const zeroRateTotal = calculateTotal(zeroRate);

    return manufacturingTotal + subContractedTotal + zeroRateTotal;
  }, [
    formData?.revenueCenters?.chargeableData?.manufacturing,
    formData?.revenueCenters?.chargeableData?.subContracted,
    formData?.revenueCenters?.chargeableData?.zeroRate
  ]);

  // Calculate Total Logistics
  const calculateTotalLogistics = useMemo(() => {
    const logistics = formData?.logistics || [];
    if (logistics?.length === 0) return 0;
    return parseFloat(logistics?.[0]?.totalLogistics || 0);
  }, [formData?.logistics]);

  // Auto-calculate Bond Value (ONLY Grand Total, NOT including Total Logistics)
  const bondValue = useMemo(() => {
    return calculateGrandTotal;
  }, [calculateGrandTotal]);

  // Auto-calculate Cost of Bond
  const costOfBond = useMemo(() => {
    const feePercent = parseFloat(formData?.financing?.bonding?.feePercent || 0);
    if (feePercent === 0) return 0;
    return bondValue * (feePercent / 100);
  }, [bondValue, formData?.financing?.bonding?.feePercent]);

  // Get Loan Value (can be manually overridden)
  const loanValue = useMemo(() => {
    const manualValue = formData?.financing?.financeCost?.loanValue;
    if (manualValue !== undefined && manualValue !== null && manualValue !== '') {
      return parseFloat(manualValue);
    }
    return calculateGrandTotal + calculateTotalLogistics;
  }, [formData?.financing?.financeCost?.loanValue, calculateGrandTotal, calculateTotalLogistics]);

  // Auto-calculate Cost of Finance
  const costOfFinance = useMemo(() => {
    const feePercent = parseFloat(formData?.financing?.financeCost?.feePercent || 0);
    if (feePercent === 0) return 0;
    return loanValue * (feePercent / 100);
  }, [loanValue, formData?.financing?.financeCost?.feePercent]);

  const formatNumber = (value, decimals = 2) => {
    const num = parseFloat(value) || 0;
    return num?.toFixed(decimals)?.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleBondingChange = (field, value) => {
    const currentFinancing = formData?.financing || {};
    const currentBonding = currentFinancing?.bonding || {};
    onChange('financing', {
      ...currentFinancing,
      bonding: {
        ...currentBonding,
        [field]: value
      }
    });
  };

  const handleFinanceCostChange = (field, value) => {
    const currentFinancing = formData?.financing || {};
    const currentFinanceCost = currentFinancing?.financeCost || {};
    onChange('financing', {
      ...currentFinancing,
      financeCost: {
        ...currentFinanceCost,
        [field]: value
      }
    });
  };

  const bonding = formData?.financing?.bonding || {};
  const financeCost = formData?.financing?.financeCost || {};

  // Calculate Total Finance Costs (conditional based on checkboxes)
  const totalFinanceCosts = useMemo(() => {
    let total = 0;
    
    // Only include Cost of Bond if Bonding is enabled (checkbox ticked)
    if (bonding?.enabled) {
      total += costOfBond;
    }
    
    // Only include Cost of Finance if Finance Cost is enabled (checkbox ticked)
    if (financeCost?.enabled) {
      total += costOfFinance;
    }
    
    return total;
  }, [bonding?.enabled, financeCost?.enabled, costOfBond, costOfFinance]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Financing</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Configure financing options and bonding requirements
        </p>
      </div>

      {/* Bonding Container */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Bonding</h4>
          <Checkbox
            checked={bonding?.enabled || false}
            onCheckedChange={(checked) => handleBondingChange('enabled', checked)}
          />
        </div>

        {bonding?.enabled && (
          <div className="space-y-4">
            <Select
              label="Bonding Type"
              options={bondingTypeOptions}
              value={bonding?.type || ''}
              onChange={(value) => handleBondingChange('type', value)}
              placeholder="Select bonding type"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bond Value (Auto Generated)
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-base font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                  ${formatNumber(bondValue, 2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Grand Total (All Revenue Centers)
                </p>
              </div>

              <Input
                label="Fee %"
                type="number"
                placeholder="0.00"
                value={bonding?.feePercent || ''}
                onChange={(e) => handleBondingChange('feePercent', e?.target?.value)}
                prefix="%"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cost of Bond (Auto Generated)
              </label>
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700 text-lg font-bold text-blue-700 dark:text-blue-300 transition-colors">
                ${formatNumber(costOfBond, 2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {bonding?.feePercent || 0}% of Bond Value
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Finance Cost Container */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Finance Cost</h4>
          <Checkbox
            checked={financeCost?.enabled || false}
            onCheckedChange={(checked) => handleFinanceCostChange('enabled', checked)}
          />
        </div>

        {financeCost?.enabled && (
          <div className="space-y-4">
            <Select
              label="Finance Type"
              options={financeTypeOptions}
              value={financeCost?.type || ''}
              onChange={(value) => handleFinanceCostChange('type', value)}
              placeholder="Select finance type"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Loan Value (Auto Generated - Editable)"
                type="number"
                placeholder="0.00"
                value={financeCost?.loanValue !== undefined && financeCost?.loanValue !== null && financeCost?.loanValue !== '' 
                  ? financeCost?.loanValue 
                  : loanValue}
                onChange={(e) => handleFinanceCostChange('loanValue', e?.target?.value)}
                helperText="Grand Total + Total Logistics (can be changed manually)"
              />

              <Input
                label="Fee %"
                type="number"
                placeholder="0.00"
                value={financeCost?.feePercent || ''}
                onChange={(e) => handleFinanceCostChange('feePercent', e?.target?.value)}
                prefix="%"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cost of Finance (Auto Generated)
              </label>
              <div className="px-4 py-3 bg-green-50 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-700 text-lg font-bold text-green-700 dark:text-green-300 transition-colors">
                ${formatNumber(costOfFinance, 2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {financeCost?.feePercent || 0}% of Loan Value
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Total Finance Costs Container */}
      <div className="bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg p-6 bg-purple-50 dark:bg-purple-900/20 transition-colors">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Total Finance Costs</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total (Auto Generated)
          </label>
          <div className="px-4 py-3 bg-purple-100 dark:bg-purple-900/40 rounded border-2 border-purple-300 dark:border-purple-600 text-xl font-bold text-purple-700 dark:text-purple-300 transition-colors">
            ${formatNumber(totalFinanceCosts, 2)}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {bonding?.enabled && financeCost?.enabled && 'Cost of Bond + Cost of Finance'}
            {bonding?.enabled && !financeCost?.enabled && 'Cost of Bond only'}
            {!bonding?.enabled && financeCost?.enabled && 'Cost of Finance only'}
            {!bonding?.enabled && !financeCost?.enabled && 'No financing options selected'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancingTab;