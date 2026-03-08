import React, { useState, useEffect, useMemo } from 'react';
import Input from '../../../../components/ui/Input';
import Icon from '../../../../components/AppIcon';
import Button from '../../../../components/ui/Button';

import TradeSearchModal from './TradeSearchModal';
import ScopeSearchModal from './ScopeSearchModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import DecimalMath from '../../../../utils/decimalMath';
import { formatNumber } from '../../../../utils/decimalMath';

const USE_MEMO_CALCULATIONS = import.meta.env?.VITE_USE_MEMO_CALCULATIONS === 'true';

const CostMarginTab = ({ formData, onChange, errors }) => {
  const [lineItems, setLineItems] = useState([]);
  const [isScopeSearchOpen, setIsScopeSearchOpen] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Margined Sub-Contractors state
  const [subContractorItems, setSubContractorItems] = useState([]);
  const [isSubContractorSearchOpen, setIsSubContractorSearchOpen] = useState(false);
  const [selectedSubContractorIndex, setSelectedSubContractorIndex] = useState(null);
  const [deleteSubContractorModalOpen, setDeleteSubContractorModalOpen] = useState(false);
  const [subContractorToDelete, setSubContractorToDelete] = useState(null);

  // Zero Margined Supply state
  const [zeroMarginItems, setZeroMarginItems] = useState([]);
  const [isZeroMarginSearchOpen, setIsZeroMarginSearchOpen] = useState(false);
  const [selectedZeroMarginIndex, setSelectedZeroMarginIndex] = useState(null);
  const [deleteZeroMarginModalOpen, setDeleteZeroMarginModalOpen] = useState(false);
  const [zeroMarginToDelete, setZeroMarginToDelete] = useState(null);

  // Initialize state from formData on mount and when formData changes
  useEffect(() => {
    if (formData?.internalValueAddedScope) {
      setLineItems(formData?.internalValueAddedScope);
    }
    if (formData?.marginedSubContractors) {
      setSubContractorItems(formData?.marginedSubContractors);
    }
    if (formData?.zeroMarginedSupply) {
      setZeroMarginItems(formData?.zeroMarginedSupply);
    }
  }, [formData?.internalValueAddedScope, formData?.marginedSubContractors, formData?.zeroMarginedSupply]);

  // NEW: Calculate totals for Internal Value-Added Scope with useMemo
  const internalValueTotals = useMemo(() => {
    if (!USE_MEMO_CALCULATIONS) {
      // Fallback to inline calculations
      const productionTotal = lineItems?.reduce((sum, item) => sum + (item?.productionCost || 0), 0);
      const sellTotal = lineItems?.reduce((sum, item) => sum + (item?.totalCost || 0), 0);
      const productionPercentage = sellTotal > 0 ? DecimalMath?.multiply(DecimalMath?.divide(productionTotal, sellTotal), 100) : 0;
      const sellPercentage = DecimalMath?.subtract(100, productionPercentage);
      return { productionTotal, sellTotal, productionPercentage, sellPercentage };
    }

    const productionTotal = lineItems?.reduce((sum, item) => sum + (item?.productionCost || 0), 0);
    const sellTotal = lineItems?.reduce((sum, item) => sum + (item?.totalCost || 0), 0);
    const productionPercentage = sellTotal > 0 ? DecimalMath?.multiply(DecimalMath?.divide(productionTotal, sellTotal), 100) : 0;
    const sellPercentage = DecimalMath?.subtract(100, productionPercentage);
    return { productionTotal, sellTotal, productionPercentage, sellPercentage };
  }, [lineItems]);

  // NEW: Calculate totals for Margined Sub-Contractors with useMemo
  const subContractorTotals = useMemo(() => {
    if (!USE_MEMO_CALCULATIONS) {
      const contractedTotal = subContractorItems?.reduce((sum, item) => sum + (item?.contractedCost || 0), 0);
      const subContractorSellTotal = subContractorItems?.reduce((sum, item) => sum + (item?.totalCost || 0), 0);
      const contractedPercentage = subContractorSellTotal > 0 ? DecimalMath?.multiply(DecimalMath?.divide(contractedTotal, subContractorSellTotal), 100) : 0;
      const subContractorSellPercentage = DecimalMath?.subtract(100, contractedPercentage);
      return { contractedTotal, subContractorSellTotal, contractedPercentage, subContractorSellPercentage };
    }

    const contractedTotal = subContractorItems?.reduce((sum, item) => sum + (item?.contractedCost || 0), 0);
    const subContractorSellTotal = subContractorItems?.reduce((sum, item) => sum + (item?.totalCost || 0), 0);
    const contractedPercentage = subContractorSellTotal > 0 ? DecimalMath?.multiply(DecimalMath?.divide(contractedTotal, subContractorSellTotal), 100) : 0;
    const subContractorSellPercentage = DecimalMath?.subtract(100, contractedPercentage);
    return { contractedTotal, subContractorSellTotal, contractedPercentage, subContractorSellPercentage };
  }, [subContractorItems]);

  // NEW: Calculate totals for Zero Margined Supply with useMemo
  const zeroMarginTotals = useMemo(() => {
    if (!USE_MEMO_CALCULATIONS) {
      const zeroMarginProductionTotal = zeroMarginItems?.reduce((sum, item) => sum + (item?.productionCost || 0), 0);
      const zeroMarginSellTotal = zeroMarginItems?.reduce((sum, item) => sum + (item?.totalCost || 0), 0);
      const zeroMarginProductionPercentage = zeroMarginSellTotal > 0 ? DecimalMath?.multiply(DecimalMath?.divide(zeroMarginProductionTotal, zeroMarginSellTotal), 100) : 0;
      const zeroMarginSellPercentage = DecimalMath?.subtract(100, zeroMarginProductionPercentage);
      return { zeroMarginProductionTotal, zeroMarginSellTotal, zeroMarginProductionPercentage, zeroMarginSellPercentage };
    }

    const zeroMarginProductionTotal = zeroMarginItems?.reduce((sum, item) => sum + (item?.productionCost || 0), 0);
    const zeroMarginSellTotal = zeroMarginItems?.reduce((sum, item) => sum + (item?.totalCost || 0), 0);
    const zeroMarginProductionPercentage = zeroMarginSellTotal > 0 ? DecimalMath?.multiply(DecimalMath?.divide(zeroMarginProductionTotal, zeroMarginSellTotal), 100) : 0;
    const zeroMarginSellPercentage = DecimalMath?.subtract(100, zeroMarginProductionPercentage);
    return { zeroMarginProductionTotal, zeroMarginSellTotal, zeroMarginProductionPercentage, zeroMarginSellPercentage };
  }, [zeroMarginItems]);

  // Destructure for backward compatibility
  const { productionTotal, sellTotal, productionPercentage, sellPercentage } = internalValueTotals;
  const { contractedTotal, subContractorSellTotal, contractedPercentage, subContractorSellPercentage } = subContractorTotals;
  const { zeroMarginProductionTotal, zeroMarginSellTotal, zeroMarginProductionPercentage, zeroMarginSellPercentage } = zeroMarginTotals;

  const handleAddScope = () => {
    const newLineItem = {
      id: Date.now(),
      no: lineItems?.length + 1,
      item: null,
      itemName: '',
      scopeOfWork: '',
      description: '',
      qty: 0,
      unitCost: 0,
      productionCost: 0,
      marginPercent: 0,
      totalCost: 0
    };
    const updatedItems = [...lineItems, newLineItem];
    setLineItems(updatedItems);
    onChange('internalValueAddedScope', updatedItems);
  };

  // Margined Sub-Contractors handlers
  const handleAddSubContractorScope = () => {
    const newLineItem = {
      id: Date.now(),
      no: subContractorItems?.length + 1,
      item: null,
      itemName: '',
      qty: 0,
      unitCost: 0,
      productionCost: 0,
      marginPercent: 0,
      totalCost: 0
    };
    const updatedItems = [...subContractorItems, newLineItem];
    setSubContractorItems(updatedItems);
    onChange('marginedSubContractors', updatedItems);
  };

  // Zero Margined Supply handlers
  const handleAddZeroMarginScope = () => {
    const newLineItem = {
      id: Date.now(),
      no: zeroMarginItems?.length + 1,
      item: null,
      itemName: '',
      qty: 0,
      unitCost: 0,
      productionCost: 0,
      marginPercent: 0,
      totalCost: 0
    };
    const updatedItems = [...zeroMarginItems, newLineItem];
    setZeroMarginItems(updatedItems);
    onChange('zeroMarginedSupply', updatedItems);
  };

  const handleItemClick = (index) => {
    setSelectedLineIndex(index);
    setIsScopeSearchOpen(true);
  };

  const handleSubContractorItemClick = (index) => {
    setSelectedSubContractorIndex(index);
    setIsSubContractorSearchOpen(true);
  };

  const handleZeroMarginItemClick = (index) => {
    setSelectedZeroMarginIndex(index);
    setIsZeroMarginSearchOpen(true);
  };

  const handleSelectItem = (scope) => {
    if (selectedLineIndex !== null) {
      const updatedItems = [...lineItems];
      updatedItems[selectedLineIndex] = {
        ...updatedItems?.[selectedLineIndex],
        item: scope?.id,
        itemName: scope?.scopeOfWork,
        scopeOfWork: scope?.scopeOfWork,
        description: scope?.description,
        unitCost: 0
      };
      calculateLineItem(updatedItems, selectedLineIndex);
      setLineItems(updatedItems);
      onChange('internalValueAddedScope', updatedItems);
    }
  };

  const handleSelectSubContractorItem = (trade) => {
    if (selectedSubContractorIndex !== null) {
      const updatedItems = [...subContractorItems];
      updatedItems[selectedSubContractorIndex] = {
        ...updatedItems?.[selectedSubContractorIndex],
        item: trade,
        itemName: `${trade?.tradeCode} - ${trade?.tradeCategory}${trade?.scopeOfWork ? ' - ' + trade?.scopeOfWork : ''}`,
        scopeOfWork: trade?.scopeOfWork,
        description: trade?.description,
        unitCost: 0
      };
      calculateSubContractorLineItem(updatedItems, selectedSubContractorIndex);
      setSubContractorItems(updatedItems);
      onChange('marginedSubContractors', updatedItems);
    }
  };

  const handleSelectZeroMarginItem = (trade) => {
    if (selectedZeroMarginIndex !== null) {
      const updatedItems = [...zeroMarginItems];
      updatedItems[selectedZeroMarginIndex] = {
        ...updatedItems?.[selectedZeroMarginIndex],
        item: trade,
        itemName: `${trade?.tradeCode} - ${trade?.tradeCategory}${trade?.scopeOfWork ? ' - ' + trade?.scopeOfWork : ''}`,
        scopeOfWork: trade?.scopeOfWork,
        description: trade?.description,
        unitCost: 0
      };
      calculateZeroMarginLineItem(updatedItems, selectedZeroMarginIndex);
      setZeroMarginItems(updatedItems);
      onChange('zeroMarginedSupply', updatedItems);
    }
  };

  const handleQtyChange = (index, value) => {
    const updatedItems = [...lineItems];
    updatedItems[index].qty = DecimalMath?.parse(value, 0);
    calculateLineItem(updatedItems, index);
    setLineItems(updatedItems);
    onChange('internalValueAddedScope', updatedItems);
  };

  const handleSubContractorQtyChange = (index, value) => {
    const updatedItems = [...subContractorItems];
    updatedItems[index].qty = DecimalMath?.parse(value, 0);
    calculateSubContractorLineItem(updatedItems, index);
    setSubContractorItems(updatedItems);
    onChange('marginedSubContractors', updatedItems);
  };

  const handleZeroMarginQtyChange = (index, value) => {
    const updatedItems = [...zeroMarginItems];
    updatedItems[index].qty = DecimalMath?.parse(value, 0);
    calculateZeroMarginLineItem(updatedItems, index);
    setZeroMarginItems(updatedItems);
    onChange('zeroMarginedSupply', updatedItems);
  };

  const handleUnitCostChange = (index, value) => {
    const updatedItems = [...lineItems];
    updatedItems[index].unitCost = DecimalMath?.parse(value, 0);
    calculateLineItem(updatedItems, index);
    setLineItems(updatedItems);
    onChange('internalValueAddedScope', updatedItems);
  };

  const handleSubContractorUnitCostChange = (index, value) => {
    const updatedItems = [...subContractorItems];
    updatedItems[index].unitCost = DecimalMath?.parse(value, 0);
    calculateSubContractorLineItem(updatedItems, index);
    setSubContractorItems(updatedItems);
    onChange('marginedSubContractors', updatedItems);
  };

  const handleZeroMarginUnitCostChange = (index, value) => {
    const updatedItems = [...zeroMarginItems];
    updatedItems[index].unitCost = DecimalMath?.parse(value, 0);
    calculateZeroMarginLineItem(updatedItems, index);
    setZeroMarginItems(updatedItems);
    onChange('zeroMarginedSupply', updatedItems);
  };

  const handleMarginChange = (index, value) => {
    const marginValue = DecimalMath?.parse(value, 0);
    if (marginValue >= 0 && marginValue <= 800) {
      const updatedItems = [...lineItems];
      updatedItems[index].marginPercent = marginValue;
      calculateLineItem(updatedItems, index);
      setLineItems(updatedItems);
      onChange('internalValueAddedScope', updatedItems);
    }
  };

  const handleSubContractorMarginChange = (index, value) => {
    const marginValue = DecimalMath?.parse(value, 0);
    if (marginValue >= 0 && marginValue <= 800) {
      const updatedItems = [...subContractorItems];
      updatedItems[index].marginPercent = marginValue;
      calculateSubContractorLineItem(updatedItems, index);
      setSubContractorItems(updatedItems);
      onChange('marginedSubContractors', updatedItems);
    }
  };

  const handleZeroMarginMarginChange = (index, value) => {
    const marginValue = DecimalMath?.parse(value, 0);
    if (marginValue >= 0 && marginValue <= 800) {
      const updatedItems = [...zeroMarginItems];
      updatedItems[index].marginPercent = marginValue;
      calculateZeroMarginLineItem(updatedItems, index);
      setZeroMarginItems(updatedItems);
      onChange('zeroMarginedSupply', updatedItems);
    }
  };

  const calculateLineItem = (items, index) => {
    const item = items?.[index];
    const qty = item?.qty || 0;
    const unitCost = item?.unitCost || 0;
    const marginPercent = item?.marginPercent || 0;

    item.productionCost = DecimalMath?.multiply(qty, unitCost);
    item.totalCost = DecimalMath?.multiply(qty, unitCost, DecimalMath?.add(1, DecimalMath?.divide(marginPercent, 100)));
  };

  const calculateSubContractorLineItem = (items, index) => {
    const item = items?.[index];
    const qty = item?.qty || 0;
    const unitCost = item?.unitCost || 0;
    const marginPercent = item?.marginPercent || 0;

    // Auto-calculate Contracted $ as QTY × Unit Cost
    item.contractedCost = DecimalMath?.multiply(qty, unitCost);
    item.totalCost = DecimalMath?.multiply(item?.contractedCost, DecimalMath?.add(1, DecimalMath?.divide(marginPercent, 100)));
  };

  const calculateZeroMarginLineItem = (items, index) => {
    const item = items?.[index];
    const qty = item?.qty || 0;
    const unitCost = item?.unitCost || 0;
    const marginPercent = item?.marginPercent || 0;

    item.productionCost = DecimalMath?.multiply(qty, unitCost);
    item.totalCost = DecimalMath?.multiply(qty, unitCost, DecimalMath?.add(1, DecimalMath?.divide(marginPercent, 100)));
  };

  const handleDeleteClick = (index) => {
    setItemToDelete(index);
    setDeleteModalOpen(true);
  };

  const handleSubContractorDeleteClick = (index) => {
    setSubContractorToDelete(index);
    setDeleteSubContractorModalOpen(true);
  };

  const handleZeroMarginDeleteClick = (index) => {
    setZeroMarginToDelete(index);
    setDeleteZeroMarginModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete !== null) {
      const updatedItems = lineItems?.filter((_, index) => index !== itemToDelete);
      // Renumber items
      updatedItems?.forEach((item, index) => {
        item.no = index + 1;
      });
      setLineItems(updatedItems);
      onChange('internalValueAddedScope', updatedItems);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleConfirmSubContractorDelete = () => {
    if (subContractorToDelete !== null) {
      const updatedItems = subContractorItems?.filter((_, index) => index !== subContractorToDelete);
      // Renumber items
      updatedItems?.forEach((item, index) => {
        item.no = index + 1;
      });
      setSubContractorItems(updatedItems);
      onChange('marginedSubContractors', updatedItems);
      setDeleteSubContractorModalOpen(false);
      setSubContractorToDelete(null);
    }
  };

  const handleConfirmZeroMarginDelete = () => {
    if (zeroMarginToDelete !== null) {
      const updatedItems = zeroMarginItems?.filter((_, index) => index !== zeroMarginToDelete);
      // Renumber items
      updatedItems?.forEach((item, index) => {
        item.no = index + 1;
      });
      setZeroMarginItems(updatedItems);
      onChange('zeroMarginedSupply', updatedItems);
      setDeleteZeroMarginModalOpen(false);
      setZeroMarginToDelete(null);
    }
  };

  useEffect(() => {
    const baseCost = DecimalMath?.parse(formData?.baseCost, 0);
    const marginPercentage = DecimalMath?.parse(formData?.marginPercentage, 0);
    const marginAmount = DecimalMath?.percentage(baseCost, marginPercentage);
    const totalCost = DecimalMath?.add(baseCost, marginAmount);
    onChange('totalCost', DecimalMath?.round(totalCost, 2));
  }, [formData?.baseCost, formData?.marginPercentage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Additional Scope</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Configure base costs and profit margins
        </p>
      </div>

      {/* Cost Configuration */}
      <div className="border border-border rounded-lg p-6">
        <div className="space-y-4">
          {/* Internal Value-Added Scope */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-base font-heading font-semibold text-foreground">
                Internal Value-Added Scope
              </h4>
              <Button
                onClick={handleAddScope}
                className="flex items-center gap-2"
              >
                <Icon name="Send" size={18} />
                Add Scope
              </Button>
            </div>

            {/* Table Header */}
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-[40px_minmax(120px,1fr)_70px_85px_100px_55px_110px_40px] gap-2 mb-4 pb-3 border-b border-border">
                  <div className="text-xs font-medium text-muted-foreground">No.</div>
                  <div className="text-xs font-medium text-muted-foreground">Item</div>
                  <div className="text-xs font-medium text-muted-foreground">QTY</div>
                  <div className="text-xs font-medium text-muted-foreground">Unit Cost</div>
                  <div className="text-xs font-medium text-muted-foreground">Production Cost</div>
                  <div className="text-xs font-medium text-muted-foreground">M%</div>
                  <div className="text-xs font-medium text-muted-foreground">Total Cost</div>
                  <div></div>
                </div>

                {/* Line Items */}
                <div className="space-y-3">
                  {lineItems?.map((lineItem, index) => (
                    <div key={lineItem?.id}>
                      <div className="grid grid-cols-[40px_minmax(120px,1fr)_70px_85px_100px_55px_110px_40px] gap-2 items-center">
                        {/* No. */}
                        <div className="text-xs font-medium text-foreground">
                          {lineItem?.no}
                        </div>

                        {/* Item */}
                        <button
                          onClick={() => handleItemClick(index)}
                          className="flex items-center gap-1 px-2 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                          <Icon name="Search" size={14} className="text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-foreground truncate">
                            {lineItem?.itemName 
                              ? `${lineItem?.itemName}${lineItem?.description ? ` - ${lineItem?.description}` : ''}` 
                              : 'Select scope'}
                          </span>
                        </button>

                        {/* QTY */}
                        <Input
                          type="number"
                          placeholder="0"
                          value={lineItem?.qty || ''}
                          onChange={(e) => handleQtyChange(index, e?.target?.value)}
                          className="text-xs h-9 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        {/* Unit Cost */}
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={lineItem?.unitCost || ''}
                          onChange={(e) => handleUnitCostChange(index, e?.target?.value)}
                          className="text-xs h-9 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        {/* Production Cost */}
                        <div className="px-2 py-2 bg-muted/30 dark:bg-gray-700/50 rounded-lg border border-border">
                          <span className="text-xs font-medium text-foreground">
                            ${formatNumber(lineItem?.productionCost || 0)}
                          </span>
                        </div>

                        {/* M% */}
                        <Input
                          type="number"
                          placeholder="0"
                          value={lineItem?.marginPercent || ''}
                          onChange={(e) => handleMarginChange(index, e?.target?.value)}
                          className="text-xs h-9 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="0"
                          max="800"
                        />

                        {/* Total Cost */}
                        <div className="px-2 py-2 bg-primary/5 dark:bg-blue-900/30 rounded-lg border border-primary/20 dark:border-blue-700/50">
                          <span className="text-xs font-semibold text-primary dark:text-blue-300">
                            ${formatNumber(lineItem?.totalCost || 0)}
                          </span>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteClick(index)}
                          className="flex items-center justify-center w-9 h-9 text-destructive hover:bg-destructive/10 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {lineItems?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="Package" size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No line items added yet</p>
                    <p className="text-xs mt-1">Click "Add Scope" to add your first item</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Section */}
            {lineItems?.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="grid grid-cols-2 gap-8 max-w-2xl ml-auto">
                  {/* Production */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Production $</span>
                      <div className="px-4 py-2 bg-muted/30 dark:bg-gray-700/50 rounded-lg border border-border min-w-[140px] text-right">
                        <span className="text-base font-semibold text-foreground">
                          ${formatNumber(productionTotal)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">%</span>
                      <div className="px-4 py-2 bg-muted/30 dark:bg-gray-700/50 rounded-lg border border-border min-w-[140px] text-right">
                        <span className="text-base font-semibold text-foreground">
                          {formatNumber(productionPercentage, 1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sell */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Sell $</span>
                      <div className="px-4 py-2 bg-primary/5 dark:bg-blue-900/30 rounded-lg border border-primary/20 dark:border-blue-700/50 min-w-[140px] text-right">
                        <span className="text-base font-semibold text-primary">
                          ${formatNumber(sellTotal)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">%</span>
                      <div className="px-4 py-2 bg-primary/5 dark:bg-blue-900/30 rounded-lg border border-primary/20 dark:border-blue-700/50 min-w-[140px] text-right">
                        <span className="text-base font-semibold text-primary">
                          {formatNumber(sellPercentage, 1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Margined Sub-Contractors + Zero Margined Supply (Stacked) */}
          <div className="space-y-6">
            {/* Margined Sub-Contractors Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-base font-heading font-semibold text-foreground">
                  Margined Sub-Contractors
                </h4>
                <Button
                  onClick={handleAddSubContractorScope}
                  className="flex items-center gap-2"
                >
                  <Icon name="Send" size={18} />
                  Add Scope
                </Button>
              </div>

              {/* Table Header */}
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-[40px_minmax(120px,1fr)_70px_85px_100px_55px_110px_40px] gap-2 mb-4 pb-3 border-b border-border">
                    <div className="text-xs font-medium text-muted-foreground">No.</div>
                    <div className="text-xs font-medium text-muted-foreground">Item</div>
                    <div className="text-xs font-medium text-muted-foreground">QTY</div>
                    <div className="text-xs font-medium text-muted-foreground">Unit Cost</div>
                    <div className="text-xs font-medium text-muted-foreground">Contracted $</div>
                    <div className="text-xs font-medium text-muted-foreground">M%</div>
                    <div className="text-xs font-medium text-muted-foreground">Total Cost</div>
                    <div></div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3">
                    {subContractorItems?.map((lineItem, index) => (
                      <div key={lineItem?.id}>
                        <div className="grid grid-cols-[40px_minmax(120px,1fr)_70px_85px_100px_55px_110px_40px] gap-2 items-center">
                          {/* No. */}
                          <div className="text-xs font-medium text-foreground">
                            {lineItem?.no}
                          </div>

                          {/* Item */}
                          <button
                            onClick={() => handleSubContractorItemClick(index)}
                            className="flex items-center gap-1 px-2 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                          >
                            <Icon name="Search" size={14} className="text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-foreground truncate">
                              {lineItem?.itemName 
                                ? `${lineItem?.itemName}${lineItem?.scopeOfWork ? ` - ${lineItem?.scopeOfWork}` : ''}` 
                                : 'Select trade'}
                            </span>
                          </button>

                          {/* QTY */}
                          <Input
                            type="number"
                            placeholder="0"
                            value={lineItem?.qty || ''}
                            onChange={(e) => handleSubContractorQtyChange(index, e?.target?.value)}
                            className="text-xs h-9 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />

                          {/* Unit Cost */}
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={lineItem?.unitCost || ''}
                            onChange={(e) => handleSubContractorUnitCostChange(index, e?.target?.value)}
                            className="text-xs h-9 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />

                          {/* Contracted Cost - Auto-calculated */}
                          <div className="px-2 py-2 bg-muted/30 rounded-lg border border-border">
                            <span className="text-xs font-semibold text-foreground">
                              ${formatNumber(lineItem?.contractedCost || 0)}
                            </span>
                          </div>

                          {/* M% */}
                          <Input
                            type="number"
                            placeholder="0"
                            value={lineItem?.marginPercent || ''}
                            onChange={(e) => handleSubContractorMarginChange(index, e?.target?.value)}
                            className="text-xs h-9 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min="0"
                            max="800"
                          />

                          {/* Total Cost */}
                          <div className="px-2 py-2 bg-primary/5 rounded-lg border border-primary/20">
                            <span className="text-xs font-semibold text-primary">
                              ${formatNumber(lineItem?.totalCost || 0)}
                            </span>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => handleSubContractorDeleteClick(index)}
                            className="flex items-center justify-center w-9 h-9 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {subContractorItems?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Icon name="Package" size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No line items added yet</p>
                      <p className="text-xs mt-1">Click "Add Scope" to add your first item</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Section */}
              {subContractorItems?.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="grid grid-cols-2 gap-8 max-w-2xl ml-auto">
                    {/* Contracted */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Contracted $</span>
                        <div className="px-4 py-2 bg-muted/30 rounded-lg border border-border min-w-[140px] text-right">
                          <span className="text-base font-semibold text-foreground">
                            ${formatNumber(contractedTotal)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">%</span>
                        <div className="px-4 py-2 bg-muted/30 rounded-lg border border-border min-w-[140px] text-right">
                          <span className="text-base font-semibold text-foreground">
                            {formatNumber(contractedPercentage, 1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sell */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Sell $</span>
                        <div className="px-4 py-2 bg-primary/5 rounded-lg border border-primary/20 min-w-[140px] text-right">
                          <span className="text-base font-semibold text-primary">
                            ${formatNumber(subContractorSellTotal)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">%</span>
                        <div className="px-4 py-2 bg-primary/5 rounded-lg border border-primary/20 min-w-[140px] text-right">
                          <span className="text-base font-semibold text-primary">
                            {formatNumber(subContractorSellPercentage, 1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_120px_120px] gap-4 pt-4 border-t border-border">
                    <div className="text-sm font-semibold">Total</div>
                    <div className="text-sm font-semibold text-right">${formatNumber(contractedTotal, 2)}</div>
                    <div className="text-sm font-semibold text-right">${formatNumber(subContractorSellTotal, 2)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Zero Margined Supply Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-base font-heading font-semibold text-foreground">
                  Zero Margined Supply
                </h4>
                <Button
                  onClick={handleAddZeroMarginScope}
                  className="flex items-center gap-2"
                >
                  <Icon name="Send" size={18} />
                  Add Scope
                </Button>
              </div>

              {/* Table Header */}
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-[40px_minmax(120px,1fr)_70px_85px_100px_55px_110px_40px] gap-2 mb-4 pb-3 border-b border-border">
                    <div className="text-xs font-medium text-muted-foreground">No.</div>
                    <div className="text-xs font-medium text-muted-foreground">Item</div>
                    <div className="text-xs font-medium text-muted-foreground">QTY</div>
                    <div className="text-xs font-medium text-muted-foreground">Unit Cost</div>
                    <div className="text-xs font-medium text-muted-foreground">Production Cost</div>
                    <div className="text-xs font-medium text-muted-foreground">M%</div>
                    <div className="text-xs font-medium text-muted-foreground">Total Cost</div>
                    <div></div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3">
                    {zeroMarginItems?.map((lineItem, index) => (
                      <div key={lineItem?.id}>
                        <div className="grid grid-cols-[40px_minmax(120px,1fr)_70px_85px_100px_55px_110px_40px] gap-2 items-center">
                          {/* No. */}
                          <div className="text-xs font-medium text-foreground">
                            {lineItem?.no}
                          </div>

                          {/* Item */}
                          <button
                            onClick={() => handleZeroMarginItemClick(index)}
                            className="flex items-center gap-1 px-2 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                          >
                            <Icon name="Search" size={14} className="text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-foreground truncate">
                              {lineItem?.itemName 
                                ? `${lineItem?.itemName}${lineItem?.scopeOfWork ? ` - ${lineItem?.scopeOfWork}` : ''}` 
                                : 'Select trade'}
                            </span>
                          </button>

                          {/* QTY */}
                          <Input
                            type="number"
                            placeholder="0"
                            value={lineItem?.qty || ''}
                            onChange={(e) => handleZeroMarginQtyChange(index, e?.target?.value)}
                            className="text-xs h-9 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />

                          {/* Unit Cost */}
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={lineItem?.unitCost || ''}
                            onChange={(e) => handleZeroMarginUnitCostChange(index, e?.target?.value)}
                            className="text-xs h-9 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />

                          {/* Production Cost */}
                          <div className="px-2 py-2 bg-muted/30 rounded-lg border border-border">
                            <span className="text-xs font-medium text-foreground">
                              ${formatNumber(lineItem?.productionCost || 0)}
                            </span>
                          </div>

                          {/* M% */}
                          <Input
                            type="number"
                            placeholder="0"
                            value={lineItem?.marginPercent || ''}
                            onChange={(e) => handleZeroMarginMarginChange(index, e?.target?.value)}
                            className="text-xs h-9 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min="0"
                            max="800"
                          />

                          {/* Total Cost */}
                          <div className="px-2 py-2 bg-primary/5 rounded-lg border border-primary/20">
                            <span className="text-xs font-semibold text-primary">
                              ${formatNumber(lineItem?.totalCost || 0)}
                            </span>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => handleZeroMarginDeleteClick(index)}
                            className="flex items-center justify-center w-9 h-9 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {zeroMarginItems?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Icon name="Package" size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No line items added yet</p>
                      <p className="text-xs mt-1">Click "Add Scope" to add your first item</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Section */}
              {zeroMarginItems?.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="grid grid-cols-2 gap-8 max-w-2xl ml-auto">
                    {/* Production */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Production $</span>
                        <div className="px-4 py-2 bg-muted/30 rounded-lg border border-border min-w-[140px] text-right">
                          <span className="text-base font-semibold text-foreground">
                            ${formatNumber(zeroMarginProductionTotal)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">%</span>
                        <div className="px-4 py-2 bg-muted/30 rounded-lg border border-border min-w-[140px] text-right">
                          <span className="text-base font-semibold text-foreground">
                            {formatNumber(zeroMarginProductionPercentage, 1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sell */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Sell $</span>
                        <div className="px-4 py-2 bg-primary/5 rounded-lg border border-primary/20 min-w-[140px] text-right">
                          <span className="text-base font-semibold text-primary">
                            ${formatNumber(zeroMarginSellTotal)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">%</span>
                        <div className="px-4 py-2 bg-primary/5 rounded-lg border border-primary/20 min-w-[140px] text-right">
                          <span className="text-base font-semibold text-primary">
                            {formatNumber(zeroMarginSellPercentage, 1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ScopeSearchModal
        isOpen={isScopeSearchOpen}
        onClose={() => {
          setIsScopeSearchOpen(false);
          setSelectedLineIndex(null);
        }}
        onSelectScope={handleSelectItem}
      />
      <TradeSearchModal
        isOpen={isSubContractorSearchOpen}
        onClose={() => setIsSubContractorSearchOpen(false)}
        onSelectTrade={handleSelectSubContractorItem}
      />
      <TradeSearchModal
        isOpen={isZeroMarginSearchOpen}
        onClose={() => setIsZeroMarginSearchOpen(false)}
        onSelectTrade={handleSelectZeroMarginItem}
      />
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemNumber={itemToDelete !== null ? lineItems?.[itemToDelete]?.no : null}
      />
      <DeleteConfirmModal
        isOpen={deleteSubContractorModalOpen}
        onClose={() => setDeleteSubContractorModalOpen(false)}
        onConfirm={handleConfirmSubContractorDelete}
        itemNumber={subContractorToDelete !== null ? subContractorItems?.[subContractorToDelete]?.no : null}
      />
      <DeleteConfirmModal
        isOpen={deleteZeroMarginModalOpen}
        onClose={() => setDeleteZeroMarginModalOpen(false)}
        onConfirm={handleConfirmZeroMarginDelete}
        itemNumber={zeroMarginToDelete !== null ? zeroMarginItems?.[zeroMarginToDelete]?.no : null}
      />
    </div>
  );
};

export default CostMarginTab;