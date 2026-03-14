import React, { useState, useMemo, useEffect, useRef } from 'react';

import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import Icon from '../../../../components/AppIcon';
import { formatNumber } from '../../../../utils/cn';

const SiteCostsTab = ({ formData, onChange, onComputedTotalChange, errors }) => {
  const [typeOptions] = useState([
    { value: 'site_manager', label: 'Site Manager' },
    { value: 'site_engineer', label: 'Site Engineer' },
    { value: 'site_supervisor', label: 'Site Supervisor' },
    { value: 'safety_officer', label: 'Safety Officer' },
    { value: 'foreman', label: 'Foreman' },
    { value: 'crane', label: 'Crane' },
    { value: 'excavator', label: 'Excavator' },
    { value: 'loader', label: 'Loader' },
    { value: 'generator', label: 'Generator' },
    { value: 'scaffolding', label: 'Scaffolding' },
    { value: 'other', label: 'Other' }
  ]);

  const handleAddSiteItem = () => {
    const newItem = {
      id: Date.now(),
      type: '',
      qty: '',
      noDays: '',
      boardPMonth: '',
      pd: '',
      noFlights: '',
      flightCost: '',
      salary: '',
      total: 0
    };
    onChange('siteCosts', [...(formData?.siteCosts || []), newItem]);
  };

  const handleRemoveItem = (id) => {
    onChange('siteCosts', formData?.siteCosts?.filter(item => item?.id !== id));
  };

  const calculateItemTotal = (item) => {
    const qty = parseFloat(item?.qty) || 0;
    const salary = parseFloat(item?.salary) || 0;
    const boardPMonth = parseFloat(item?.boardPMonth) || 0;
    const noDays = parseFloat(item?.noDays) || 0;
    const pd = parseFloat(item?.pd) || 0;
    const noFlights = parseFloat(item?.noFlights) || 0;
    const flightCost = parseFloat(item?.flightCost) || 0;

    // Formula: (QTY *(((Salary +Board P Month)*(No. Days/30))+( P.D. *No. Days)+(No. Flights *Flight Cost))
    const total = qty * (
      ((salary + boardPMonth) * (noDays / 30)) +
      (pd * noDays) +
      (noFlights * flightCost)
    );

    return isNaN(total) ? 0 : total;
  };

  const handleItemChange = (id, field, value) => {
    const updatedItems = formData?.siteCosts?.map(item => {
      if (item?.id === id) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.total = calculateItemTotal(updatedItem);
        return updatedItem;
      }
      return item;
    });
    onChange('siteCosts', updatedItems);
  };

  const calculateGrandTotal = () => {
    return formData?.siteCosts?.reduce((sum, item) => sum + (parseFloat(item?.total) || 0), 0);
  };

  // PUSH ARCHITECTURE: Compute siteCostsTotal and push to formData.computedTotals
  const siteCostsTotal = useMemo(() => {
    return (formData?.siteCosts || [])?.reduce((sum, item) => sum + (parseFloat(item?.total) || 0), 0);
  }, [formData?.siteCosts]);

  const lastPushedSiteCostsTotalRef = useRef(null);
  useEffect(() => {
    if (lastPushedSiteCostsTotalRef?.current === siteCostsTotal) return;
    lastPushedSiteCostsTotalRef.current = siteCostsTotal;
    if (onComputedTotalChange) {
      onComputedTotalChange('siteCostsTotal', siteCostsTotal);
    } else if (onChange) {
      onChange('computedTotals', {
        ...(formData?.computedTotals || {}),
        siteCostsTotal,
      });
    }
  }, [siteCostsTotal]);

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Site Works Costs</h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Manage site-related costs and expenses</p>
        </div>
        <Button
          onClick={handleAddSiteItem}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Icon name="Send" size={16} />
          Add Site Items
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg bg-white dark:bg-gray-800 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-750 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">No.</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[180px]">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">QTY</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">No. Days</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Board P Month</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">P.D.</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">No. Flights</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Flights cost</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Salary/USD</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Total</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300"></th>
              </tr>
            </thead>
            <tbody>
              {formData?.siteCosts?.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No site cost items added yet. Click "Add Site Items" to get started.
                  </td>
                </tr>
              ) : (
                formData?.siteCosts?.map((item, index) => (
                  <tr key={item?.id} className="border-b border-border hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{index + 1}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={item?.type || ''}
                        onChange={(value) => handleItemChange(item?.id, 'type', value)}
                        options={typeOptions}
                        className="w-full"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item?.qty || ''}
                        onChange={(e) => handleItemChange(item?.id, 'qty', e?.target?.value)}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item?.noDays || ''}
                        onChange={(e) => handleItemChange(item?.id, 'noDays', e?.target?.value)}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          value={item?.boardPMonth || ''}
                          onChange={(e) => handleItemChange(item?.id, 'boardPMonth', e?.target?.value)}
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          value={item?.pd || ''}
                          onChange={(e) => handleItemChange(item?.id, 'pd', e?.target?.value)}
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item?.noFlights || ''}
                        onChange={(e) => handleItemChange(item?.id, 'noFlights', e?.target?.value)}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          value={item?.flightCost || ''}
                          onChange={(e) => handleItemChange(item?.id, 'flightCost', e?.target?.value)}
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          value={item?.salary || ''}
                          onChange={(e) => handleItemChange(item?.id, 'salary', e?.target?.value)}
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      ${formatNumber(item?.total || 0, 2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(item?.id)}
                        className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        <Icon name="Trash2" size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grand Total */}
      <div className="flex justify-end">
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Site Cost Total</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ${formatNumber(calculateGrandTotal(), 2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteCostsTab;