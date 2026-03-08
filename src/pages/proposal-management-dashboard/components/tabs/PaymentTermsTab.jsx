import React, { useState, useEffect } from 'react';
import Input from '../../../../components/ui/Input';

const PaymentTermsTab = ({ formData, onChange, errors }) => {
  // Initialize commission data structure with percentages
  const [commissionData, setCommissionData] = useState({
    percentages: [10, 20, 15, 20, 10, 10, 15],
    contract: Array(7)?.fill(''),
    cashFlow: Array(7)?.fill(''),
    siteItems: Array(7)?.fill('')
  });

  // Load existing data from formData
  useEffect(() => {
    if (formData?.paymentTerms) {
      setCommissionData({
        percentages: formData?.paymentTerms?.percentages || [10, 20, 15, 20, 10, 10, 15],
        contract: formData?.paymentTerms?.contract || Array(7)?.fill(''),
        cashFlow: formData?.paymentTerms?.cashFlow || Array(7)?.fill(''),
        siteItems: formData?.paymentTerms?.siteItems || Array(7)?.fill('')
      });
    }
  }, [formData?.paymentTerms]);

  // Calculate total percentage
  const calculateTotalPercentage = () => {
    return commissionData?.percentages?.reduce((sum, value) => {
      return sum + (parseFloat(value) || 0);
    }, 0);
  };

  // Calculate totals for each column
  const calculateTotal = (column) => {
    return commissionData?.[column]?.reduce((sum, value, index) => {
      const numValue = parseFloat(value) || 0;
      const percentage = parseFloat(commissionData?.percentages?.[index]) || 0;
      return sum + numValue * percentage / 100;
    }, 0);
  };

  // Handle percentage input changes
  const handlePercentageChange = (rowIndex, value) => {
    const updatedData = {
      ...commissionData,
      percentages: commissionData?.percentages?.map((item, idx) =>
      idx === rowIndex ? value : item
      )
    };
    setCommissionData(updatedData);

    // Sync to parent
    if (onChange) {
      onChange('paymentTerms', updatedData);
    }
  };

  // Handle input changes
  const handleInputChange = (column, rowIndex, value) => {
    const updatedData = {
      ...commissionData,
      [column]: commissionData?.[column]?.map((item, idx) =>
      idx === rowIndex ? value : item
      )
    };
    setCommissionData(updatedData);

    // Sync to parent
    if (onChange) {
      onChange('paymentTerms', updatedData);
    }
  };

  const contractTotal = calculateTotal('contract');
  const cashFlowTotal = calculateTotal('cashFlow');
  const siteItemsTotal = calculateTotal('siteItems');
  const totalPercentage = calculateTotalPercentage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Payment Terms</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Configure payment schedule and terms</p>
      </div>
      {/* Three Column Layout */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 transition-colors">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-6">
          {/* Header Row */}
          <div className="text-center">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">%</h4>
          </div>
          <div className="text-center">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Contract</h4>
          </div>
          <div className="text-center">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Cash Flow</h4>
          </div>
          <div className="text-center">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Site Items</h4>
          </div>

          {/* Data Rows */}
          {commissionData?.percentages?.map((percentage, index) =>
          <React.Fragment key={index}>
              {/* Percentage Input */}
              <div>
                <input
                type="number"
                value={percentage}
                onChange={(e) => handlePercentageChange(index, e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center transition-colors"
                placeholder="0"
                min="0"
                max="100" />

              </div>

              {/* Contract Input */}
              <div>
                <input
                type="number"
                value={commissionData?.contract?.[index]}
                onChange={(e) => handleInputChange('contract', index, e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="0" />

              </div>

              {/* Cash Flow Input */}
              <div>
                <input
                type="number"
                value={commissionData?.cashFlow?.[index]}
                onChange={(e) => handleInputChange('cashFlow', index, e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="0" />

              </div>

              {/* Site Items Input */}
              <div>
                <input
                type="number"
                value={commissionData?.siteItems?.[index]}
                onChange={(e) => handleInputChange('siteItems', index, e?.target?.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="0" />

              </div>
            </React.Fragment>
          )}

          {/* Totals Row */}
          <div className="flex items-center justify-center pt-6 border-t border-gray-300 dark:border-gray-600">
            <span className={`text-base font-semibold ${
            totalPercentage === 100 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`
            }>
              {totalPercentage?.toFixed(0)}%
            </span>
          </div>

          <div className="pt-6 border-t border-gray-300 dark:border-gray-600">
            <div className="flex items-center justify-start gap-2">
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">$</span>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {contractTotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-300 dark:border-gray-600">
            <div className="flex items-center justify-start gap-2">
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">$</span>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {cashFlowTotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-300 dark:border-gray-600">
            <div className="flex items-center justify-start gap-2">
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">$</span>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {siteItemsTotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Validation Message */}
        {totalPercentage !== 100 &&
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md transition-colors">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Total percentage should equal 100%. Current total: {totalPercentage?.toFixed(0)}%
            </p>
          </div>
        }
      </div>
    </div>
  );

};

export default PaymentTermsTab;