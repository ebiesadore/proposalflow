import React, { useState, useEffect, useRef } from 'react';
import Input from '../../../../components/ui/Input';
import { formatNumber } from '../../../../utils/cn';

const LogisticsTab = ({ formData, onChange, onComputedTotalChange, errors }) => {
  const [laydown, setLaydown] = useState({
    noWeeks: '',
    noUnits: '',
    rentFt2: '',
    pM2: '',
    total: 0,
    perFt2: 0
  });

  const [local, setLocal] = useState({
    noTrips: '',
    costPTrip: '',
    total: 0,
    perFt2: 0
  });

  const [destination1, setDestination1] = useState({
    noTrips: '',
    costPTrip: '',
    total: 0,
    perFt2: 0
  });

  const [destination2, setDestination2] = useState({
    testFactor: '',
    costCBM: '',
    totalCBN: 0,
    total: 0,
    perFt2: 0
  });

  const [totalLogistics, setTotalLogistics] = useState(0);
  const [percentage, setPercentage] = useState('');
  
  // Track if we're currently updating parent to prevent circular updates
  const isUpdatingParent = useRef(false);

  // Initialize from formData when it changes
  useEffect(() => {
    if (formData?.logistics && Array.isArray(formData?.logistics) && formData?.logistics?.length > 0) {
      const logisticsData = formData?.logistics?.[0];
      
      if (logisticsData?.laydown) setLaydown(logisticsData?.laydown);
      if (logisticsData?.local) setLocal(logisticsData?.local);
      if (logisticsData?.destination1) setDestination1(logisticsData?.destination1);
      if (logisticsData?.destination2) setDestination2(logisticsData?.destination2);
      if (logisticsData?.percentage !== undefined) setPercentage(logisticsData?.percentage);
    }
  }, [formData?.logistics]);

  // Auto-fill Total CBN from Modular Configuration total M³
  useEffect(() => {
    if (formData?.modules && Array.isArray(formData?.modules)) {
      const totalM3 = formData?.modules?.reduce((sum, module) => {
        const quantity = parseFloat(module?.quantity) || 0;
        const volumeM3 = parseFloat(module?.volumeM3) || 0;
        return sum + (quantity * volumeM3);
      }, 0);

      // Auto-fill totalCBN with calculated total M³
      setDestination2(prev => {
        if (prev?.totalCBN !== totalM3) {
          return { ...prev, totalCBN: totalM3 };
        }
        return prev;
      });
    }
  }, [formData?.modules]);

  // Calculate Laydown totals
  useEffect(() => {
    const weeks = parseFloat(laydown?.noWeeks) || 0;
    const units = parseFloat(laydown?.noUnits) || 0;
    const rent = parseFloat(laydown?.rentFt2) || 0;
    const pm2 = parseFloat(laydown?.pM2) || 0;

    const total = weeks * units * rent * pm2;
    const perFt2 = units > 0 ? total / units : 0;

    setLaydown(prev => {
      if (prev?.total !== total || prev?.perFt2 !== perFt2) {
        return { ...prev, total, perFt2 };
      }
      return prev;
    });
  }, [laydown?.noWeeks, laydown?.noUnits, laydown?.rentFt2, laydown?.pM2]);

  // Calculate Local totals
  useEffect(() => {
    const trips = parseFloat(local?.noTrips) || 0;
    const cost = parseFloat(local?.costPTrip) || 0;

    const total = trips * cost;
    const perFt2 = trips > 0 ? total / trips : 0;

    setLocal(prev => {
      if (prev?.total !== total || prev?.perFt2 !== perFt2) {
        return { ...prev, total, perFt2 };
      }
      return prev;
    });
  }, [local?.noTrips, local?.costPTrip]);

  // Calculate Destination 1 totals
  useEffect(() => {
    const trips = parseFloat(destination1?.noTrips) || 0;
    const cost = parseFloat(destination1?.costPTrip) || 0;

    const total = trips * cost;
    const perFt2 = trips > 0 ? total / trips : 0;

    setDestination1(prev => {
      if (prev?.total !== total || prev?.perFt2 !== perFt2) {
        return { ...prev, total, perFt2 };
      }
      return prev;
    });
  }, [destination1?.noTrips, destination1?.costPTrip]);

  // Calculate Sea Shipping totals
  useEffect(() => {
    const totalCBN = parseFloat(destination2?.totalCBN) || 0;
    const costCBM = parseFloat(destination2?.costCBM) || 0;

    const total = totalCBN * costCBM;
    
    // Calculate total Area (Ft²) from all modules
    const totalAreaFt2 = formData?.modules?.reduce((sum, module) => {
      const quantity = parseFloat(module?.quantity) || 0;
      const areaFt2 = parseFloat(module?.areaFeet) || parseFloat(module?.areaMM) / 0.092903 || 0;
      return sum + (quantity * areaFt2);
    }, 0);

    // Auto-fill $ Per Ft² = Total $ / Total Area (Ft²)
    const perFt2 = totalAreaFt2 > 0 ? total / totalAreaFt2 : 0;

    setDestination2(prev => {
      if (prev?.total !== total || prev?.perFt2 !== perFt2) {
        return { ...prev, total, perFt2 };
      }
      return prev;
    });
  }, [destination2?.totalCBN, destination2?.costCBM, formData?.modules]);

  // Calculate Total Logistics
  useEffect(() => {
    const total = (laydown?.total || 0) + (local?.total || 0) + (destination1?.total || 0) + (destination2?.total || 0);
    setTotalLogistics(prev => prev !== total ? total : prev);
  }, [laydown?.total, local?.total, destination1?.total, destination2?.total]);

  // PUSH ARCHITECTURE: Push logisticsTotal to formData.computedTotals whenever totalLogistics changes
  const lastPushedLogisticsTotalRef = useRef(null);
  useEffect(() => {
    if (lastPushedLogisticsTotalRef?.current === totalLogistics) return;
    lastPushedLogisticsTotalRef.current = totalLogistics;
    if (onComputedTotalChange) {
      onComputedTotalChange('logisticsTotal', totalLogistics);
    } else if (onChange) {
      onChange('computedTotals', {
        ...(formData?.computedTotals || {}),
        logisticsTotal: totalLogistics,
      });
    }
  }, [totalLogistics]);

  // Sync to parent - debounced to prevent excessive updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onChange) {
        const logisticsData = [{
          laydown,
          local,
          destination1,
          destination2,
          totalLogistics,
          percentage
        }];
        onChange('logistics', logisticsData);
      }
    }, 100); // 100ms debounce

    return () => {
      clearTimeout(timeoutId);
    };
  }, [laydown, local, destination1, destination2, totalLogistics, percentage, onChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Logistics</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Configure logistics and transportation costs</p>
      </div>

      {/* Main Container wrapping all content */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
        {/* Laydown Section */}
        <div className="space-y-4 mb-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Laydown</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Input
              label="No. Weeks"
              type="number"
              placeholder="0"
              value={laydown?.noWeeks}
              onChange={(e) => setLaydown(prev => ({ ...prev, noWeeks: e?.target?.value }))}
            />
            <Input
              label="No. Units"
              type="number"
              placeholder="0"
              value={laydown?.noUnits}
              onChange={(e) => setLaydown(prev => ({ ...prev, noUnits: e?.target?.value }))}
            />
            <Input
              label="$ Rent Ft2"
              type="number"
              placeholder="0.00"
              value={laydown?.rentFt2}
              onChange={(e) => setLaydown(prev => ({ ...prev, rentFt2: e?.target?.value }))}
            />
            <Input
              label="$ P M2"
              type="number"
              placeholder="0.00"
              value={laydown?.pM2}
              onChange={(e) => setLaydown(prev => ({ ...prev, pM2: e?.target?.value }))}
            />
            <Input
              label="Total $"
              type="text"
              value={formatNumber(laydown?.total, 2)}
              disabled
              className="bg-gray-50 dark:bg-gray-700"
            />
            <Input
              label="$ Per Ft2"
              type="text"
              value={formatNumber(laydown?.perFt2, 2)}
              disabled
              className="bg-gray-50 dark:bg-gray-700"
            />
          </div>
        </div>
        
        {/* Local Section */}
        <div className="space-y-4 mb-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Local</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="No. Trips"
              type="number"
              placeholder="0"
              value={local?.noTrips}
              onChange={(e) => setLocal(prev => ({ ...prev, noTrips: e?.target?.value }))}
            />
            <Input
              label="Cost P Trip"
              type="number"
              placeholder="0.00"
              value={local?.costPTrip}
              onChange={(e) => setLocal(prev => ({ ...prev, costPTrip: e?.target?.value }))}
            />
            <Input
              label="Total $"
              type="text"
              value={formatNumber(local?.total, 2)}
              disabled
              className="bg-gray-50 dark:bg-gray-700"
            />
            <Input
              label="$ Per Ft2"
              type="text"
              value={formatNumber(local?.perFt2, 2)}
              disabled
              className="bg-gray-50 dark:bg-gray-700"
            />
          </div>
        </div>
        
        {/* Destination Section 1 */}
        <div className="space-y-4 mb-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Destination</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="No. Trips"
              type="number"
              placeholder="0"
              value={destination1?.noTrips}
              onChange={(e) => setDestination1(prev => ({ ...prev, noTrips: e?.target?.value }))}
            />
            <Input
              label="Cost P Trip"
              type="number"
              placeholder="0.00"
              value={destination1?.costPTrip}
              onChange={(e) => setDestination1(prev => ({ ...prev, costPTrip: e?.target?.value }))}
            />
            <Input
              label="Total $"
              type="text"
              value={formatNumber(destination1?.total, 2)}
              disabled
              className="bg-gray-50 dark:bg-gray-700"
            />
            <Input
              label="$ Per Ft2"
              type="text"
              value={formatNumber(destination1?.perFt2, 2)}
              disabled
              className="bg-gray-50 dark:bg-gray-700"
            />
          </div>
        </div>
        
        {/* Sea Shipping Section */}
        <div className="space-y-4 mb-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Sea Shipping</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Input
              label="Test Factor"
              type="number"
              placeholder="0"
              value={destination2?.testFactor}
              onChange={(e) => setDestination2(prev => ({ ...prev, testFactor: e?.target?.value }))}
            />
            <Input
              label="Cost CBM"
              type="number"
              placeholder="0.00"
              value={destination2?.costCBM}
              onChange={(e) => setDestination2(prev => ({ ...prev, costCBM: e?.target?.value }))}
            />
            <Input
              label="Total CBN"
              type="text"
              value={formatNumber(destination2?.totalCBN, 2)}
              disabled
              className="bg-gray-50 dark:bg-gray-700"
            />
            <Input
              label="Total $"
              type="text"
              value={formatNumber(destination2?.total, 2)}
              disabled
              className="bg-gray-50 dark:bg-gray-700"
            />
            <Input
              label="$ Per Ft2"
              type="text"
              value={formatNumber(destination2?.perFt2, 2)}
              disabled
              className="bg-gray-50 dark:bg-gray-700"
            />
          </div>
        </div>
        
        {/* Summary Section */}
        <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl ml-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Logistics $</label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                ${formatNumber(totalLogistics, 2)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">%</label>
              <Input
                type="number"
                placeholder="0.00"
                value={percentage}
                onChange={(e) => setPercentage(e?.target?.value)}
                step="0.01"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsTab;