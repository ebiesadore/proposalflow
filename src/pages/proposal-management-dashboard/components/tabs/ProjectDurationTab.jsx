import React, { useMemo, useEffect, useState } from 'react';
import DecimalMath from '../../../../utils/decimalMath';

const USE_MEMO_CALCULATIONS = import.meta.env?.VITE_USE_MEMO_CALCULATIONS === 'true';

const ProjectDurationTab = ({ formData, onChange, errors }) => {
  // Calculate total m² from modules
  const totalAreaM2 = useMemo(() => {
    return formData?.modules?.reduce((sum, m) => {
      const quantity = parseFloat(m?.quantity) || 0;
      const areaM2 = parseFloat(m?.areaMm) || parseFloat(m?.areaFeet) * 0.092903 || 0;
      return sum + quantity * areaM2;
    }, 0) || 0;
  }, [formData?.modules]);

  // Calculate total number of modules (quantity)
  const totalModules = useMemo(() => {
    return formData?.modules?.reduce((sum, m) => sum + (parseFloat(m?.quantity) || 0), 0) || 0;
  }, [formData?.modules]);

  // Calculate Budget Value total from Module Configuration tab (sum of all Mod Total Price)
  const budgetValueTotal = useMemo(() => {
    return formData?.modules?.reduce((sum, m) => {
      const quantity = parseFloat(m?.quantity) || 0;
      const costPerUnit = parseFloat(m?.costPerUnit) || 0;
      const areaFt2 = parseFloat(m?.areaFeet) || 0;
      const modUnitRate = costPerUnit * areaFt2;
      const modTotalPrice = modUnitRate * quantity;
      return sum + modTotalPrice;
    }, 0) || 0;
  }, [formData?.modules]);

  // Auto-calculate Units per Day m2: (Total m² ÷ Total Module Qty) × No. Mods per Day
  const autoUnitsPerDay = useMemo(() => {
    const modsPerDay = parseFloat(formData?.production?.modsPerDay) || 0;
    if (totalModules === 0 || modsPerDay === 0) return 0;
    return (totalAreaM2 / totalModules) * modsPerDay;
  }, [totalAreaM2, totalModules, formData?.production?.modsPerDay]);

  // Auto-update Units per Day m2 when dependencies change
  useEffect(() => {
    if (autoUnitsPerDay !== parseFloat(formData?.production?.unitsPerDay || 0)) {
      handleProductionChange('unitsPerDay', autoUnitsPerDay?.toString());
    }
  }, [autoUnitsPerDay]);

  // Auto-calculate Production Week: Math.ceil(Total m² ÷ Production Per Week Sqf)
  const autoProductionWeek = useMemo(() => {
    const productionPerWeekSqf = parseFloat(formData?.production?.unitsPerDay || 0) * 6;
    if (productionPerWeekSqf === 0 || totalAreaM2 === 0) return 0;
    return Math.ceil(totalAreaM2 / productionPerWeekSqf);
  }, [totalAreaM2, formData?.production?.unitsPerDay]);

  // Auto-update Production Week when dependencies change
  useEffect(() => {
    if (autoProductionWeek !== parseFloat(formData?.production?.productionWeek || 0)) {
      handleProductionChange('productionWeek', autoProductionWeek?.toString());
    }
  }, [autoProductionWeek]);

  // Design calculations
  const designTotal = useMemo(() => {
    const concept = parseFloat(formData?.design?.concept || 0);
    const schematic = parseFloat(formData?.design?.schematic || 0);
    const detailedDesign = parseFloat(formData?.design?.detailedDesign || 0);
    const productionIFC = parseFloat(formData?.design?.productionIFC || 0);
    return concept + schematic + detailedDesign + productionIFC;
  }, [formData?.design]);

  // Procurement calculations
  const procurementTotal = useMemo(() => {
    const local = parseFloat(formData?.procurement?.local || 0);
    const shortLead = parseFloat(formData?.procurement?.shortLead || 0);
    const longLead = parseFloat(formData?.procurement?.longLead || 0);
    return Math.max(local, shortLead, longLead);
  }, [formData?.procurement]);

  // Production calculations
  const productionPerWeek = useMemo(() => {
    const unitsPerDay = parseFloat(formData?.production?.unitsPerDay || 0);
    return unitsPerDay * 6;
  }, [formData?.production?.unitsPerDay]);

  const productionTotal = useMemo(() => {
    const productionWeek = parseFloat(formData?.production?.productionWeek || 0);
    return productionWeek;
  }, [formData?.production?.productionWeek]);

  // Total Production Duration
  const totalProductionDuration = useMemo(() => {
    return designTotal + procurementTotal + productionTotal;
  }, [designTotal, procurementTotal, productionTotal]);

  const handleDesignChange = (field, value) => {
    onChange('design', {
      ...formData?.design,
      [field]: value
    });
  };

  const handleProcurementChange = (field, value) => {
    onChange('procurement', {
      ...formData?.procurement,
      [field]: value
    });
  };

  const handleProductionChange = (field, value) => {
    onChange('production', {
      ...formData?.production,
      [field]: value
    });
  };

  // Schedule state management
  const handleScheduleChange = (field, value) => {
    onChange('schedule', {
      ...formData?.schedule,
      [field]: value
    });
  };

  const handleWorkingDayToggle = (day) => {
    const currentDays = formData?.schedule?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const newDays = currentDays?.includes(day)
      ? currentDays?.filter(d => d !== day)
      : [...currentDays, day];
    handleScheduleChange('workingDays', newDays);
  };

  // Generate time options for 24-hour clock
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour?.toString()?.padStart(2, '0')}:${minute?.toString()?.padStart(2, '0')}`;
        options?.push(timeString);
      }
    }
    return options;
  }, []);

  // Calculate working days per week
  const workingDaysPerWeek = useMemo(() => {
    return (formData?.schedule?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])?.length;
  }, [formData?.schedule?.workingDays]);

  // Calculate Gantt chart data
  const ganttData = useMemo(() => {
    const startDate = formData?.schedule?.startDate ? new Date(formData.schedule.startDate) : new Date();
    
    // Helper function to add working days
    const addWorkingDays = (date, days) => {
      const workingDays = formData?.schedule?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const workingDayNumbers = workingDays?.map(d => dayMap?.[d]);
      
      let currentDate = new Date(date);
      let daysAdded = 0;
      
      while (daysAdded < days) {
        currentDate?.setDate(currentDate?.getDate() + 1);
        if (workingDayNumbers?.includes(currentDate?.getDay())) {
          daysAdded++;
        }
      }
      
      return currentDate;
    };

    // Get individual design phase durations
    const conceptWeeks = formData?.design?.concept || 0;
    const schematicWeeks = formData?.design?.schematic || 0;
    const detailedDesignWeeks = formData?.design?.detailedDesign || 0;
    const productionIFCWeeks = formData?.design?.productionIFC || 0;
    
    // Get individual procurement phase durations
    const localWeeks = formData?.procurement?.local || 0;
    const shortLeadWeeks = formData?.procurement?.shortLead || 0;
    const longLeadWeeks = formData?.procurement?.longLead || 0;
    const procurementWeeks = Math.max(localWeeks, shortLeadWeeks, longLeadWeeks);
    
    const productionWeeks = productionTotal;

    // Convert weeks to calendar days based on working days per week
    // User input assumes 1 week = 5 working days (baseline)
    // Formula: (inputWeeks × 5 working days) ÷ selectedWorkingDaysPerWeek × 7 calendar days
    const conceptDays = DecimalMath?.ceil(DecimalMath?.divide(DecimalMath?.multiply(conceptWeeks, 5), workingDaysPerWeek) * 7);
    const schematicDays = DecimalMath?.ceil(DecimalMath?.divide(DecimalMath?.multiply(schematicWeeks, 5), workingDaysPerWeek) * 7);
    const detailedDesignDays = DecimalMath?.ceil(DecimalMath?.divide(DecimalMath?.multiply(detailedDesignWeeks, 5), workingDaysPerWeek) * 7);
    const productionIFCDays = DecimalMath?.ceil(DecimalMath?.divide(DecimalMath?.multiply(productionIFCWeeks, 5), workingDaysPerWeek) * 7);
    
    // Convert individual procurement phases to calendar days
    const localDays = DecimalMath?.ceil(DecimalMath?.divide(DecimalMath?.multiply(localWeeks, 5), workingDaysPerWeek) * 7);
    const shortLeadDays = DecimalMath?.ceil(DecimalMath?.divide(DecimalMath?.multiply(shortLeadWeeks, 5), workingDaysPerWeek) * 7);
    const longLeadDays = DecimalMath?.ceil(DecimalMath?.divide(DecimalMath?.multiply(longLeadWeeks, 5), workingDaysPerWeek) * 7);
    const procurementDays = Math.ceil((procurementWeeks * 5 / workingDaysPerWeek) * 7);
    
    const productionDays = DecimalMath?.ceil(DecimalMath?.divide(DecimalMath?.multiply(productionWeeks, 5), workingDaysPerWeek) * 7);

    const phases = [];
    let currentStart = new Date(startDate);

    // Phase 1: Concept
    if (conceptWeeks > 0) {
      const conceptEnd = addWorkingDays(currentStart, conceptDays);
      phases?.push({
        phase: 'Concept',
        start: new Date(currentStart),
        end: conceptEnd,
        duration: conceptWeeks,
        color: 'bg-blue-400',
        isProcurement: false
      });
      currentStart = new Date(conceptEnd);
    }

    // Phase 2: Schematic
    if (schematicWeeks > 0) {
      const schematicEnd = addWorkingDays(currentStart, schematicDays);
      phases?.push({
        phase: 'Schematic',
        start: new Date(currentStart),
        end: schematicEnd,
        duration: schematicWeeks,
        color: 'bg-blue-500',
        isProcurement: false
      });
      currentStart = new Date(schematicEnd);
    }

    // Phase 3: Detailed Design
    if (detailedDesignWeeks > 0) {
      const detailedDesignEnd = addWorkingDays(currentStart, detailedDesignDays);
      phases?.push({
        phase: 'Detailed Design',
        start: new Date(currentStart),
        end: detailedDesignEnd,
        duration: detailedDesignWeeks,
        color: 'bg-blue-600',
        isProcurement: false
      });
      currentStart = new Date(detailedDesignEnd);
    }

    // Phase 4: Production / IFC
    if (productionIFCWeeks > 0) {
      const productionIFCEnd = addWorkingDays(currentStart, productionIFCDays);
      phases?.push({
        phase: 'Production / IFC',
        start: new Date(currentStart),
        end: productionIFCEnd,
        duration: productionIFCWeeks,
        color: 'bg-blue-700',
        isProcurement: false
      });
      currentStart = new Date(productionIFCEnd);
    }

    // Phase 5: Procurement (3 parallel phases)
    const procurementStart = new Date(currentStart);
    
    // Add Local Procurement
    if (localWeeks > 0) {
      const localEnd = addWorkingDays(procurementStart, localDays);
      phases?.push({
        phase: 'Procurement - Local',
        start: new Date(procurementStart),
        end: localEnd,
        duration: localWeeks,
        color: 'bg-orange-400',
        isProcurement: true,
        procurementType: 'local'
      });
    }
    
    // Add Short Lead Procurement
    if (shortLeadWeeks > 0) {
      const shortLeadEnd = addWorkingDays(procurementStart, shortLeadDays);
      phases?.push({
        phase: 'Procurement - Short Lead',
        start: new Date(procurementStart),
        end: shortLeadEnd,
        duration: shortLeadWeeks,
        color: 'bg-orange-500',
        isProcurement: true,
        procurementType: 'shortLead'
      });
    }
    
    // Add Long Lead Procurement
    if (longLeadWeeks > 0) {
      const longLeadEnd = addWorkingDays(procurementStart, longLeadDays);
      phases?.push({
        phase: 'Procurement - Long Lead',
        start: new Date(procurementStart),
        end: longLeadEnd,
        duration: longLeadWeeks,
        color: 'bg-orange-600',
        isProcurement: true,
        procurementType: 'longLead'
      });
    }
    
    // Move currentStart forward by the longest procurement duration
    if (procurementWeeks > 0) {
      currentStart = addWorkingDays(procurementStart, procurementDays);
    }

    // Phase 6: Production
    if (productionWeeks > 0) {
      const productionEnd = addWorkingDays(currentStart, productionDays);
      phases?.push({
        phase: 'Production',
        start: new Date(currentStart),
        end: productionEnd,
        duration: productionWeeks,
        color: 'bg-green-500',
        isProcurement: false
      });
    }

    return phases;
  }, [formData?.schedule?.startDate, formData?.schedule?.workingDays, formData?.design, formData?.procurement, productionTotal, workingDaysPerWeek]);

  // Calculate total project duration in calendar days
  const totalCalendarDays = useMemo(() => {
    if (ganttData?.length === 0) return 0;
    const start = ganttData?.[0]?.start;
    const end = ganttData?.[ganttData?.length - 1]?.end;
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [ganttData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Project Duration</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Configure project timeline and scheduling</p>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
      {/* Left side - Existing containers */}
      <div className="w-1/2 space-y-6">
        {/* Design Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Design</h4>
          <div className="grid grid-cols-4 gap-4 mb-4 mr-[121px]">
            <div className="mr-[131px] pr-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Concept</label>
              <input
                type="number"
                placeholder="0"
                value={formData?.design?.concept || ''}
                onChange={(e) => handleDesignChange('concept', e?.target?.value)}
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schematic</label>
              <input
                type="number"
                placeholder="0"
                value={formData?.design?.schematic || ''}
                onChange={(e) => handleDesignChange('schematic', e?.target?.value)}
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detailed Design</label>
              <input
                type="number"
                placeholder="0"
                value={formData?.design?.detailedDesign || ''}
                onChange={(e) => handleDesignChange('detailedDesign', e?.target?.value)}
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Production / IFC</label>
              <input
                type="number"
                placeholder="0"
                value={formData?.design?.productionIFC || ''}
                onChange={(e) => handleDesignChange('productionIFC', e?.target?.value)}
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" />

            </div>
          </div>
          <div className="flex justify-end">
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Design Total</label>
              <input
                type="text"
                value={designTotal?.toFixed(2)}
                readOnly
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold text-right transition-colors" />

            </div>
          </div>
        </div>

        {/* Procurement Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Procurement</h4>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Local</label>
              <input
                type="number"
                placeholder="0"
                value={formData?.procurement?.local || ''}
                onChange={(e) => handleProcurementChange('local', e?.target?.value)}
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Lead</label>
              <input
                type="number"
                placeholder="0"
                value={formData?.procurement?.shortLead || ''}
                onChange={(e) => handleProcurementChange('shortLead', e?.target?.value)}
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Long Lead</label>
              <input
                type="number"
                placeholder="0"
                value={formData?.procurement?.longLead || ''}
                onChange={(e) => handleProcurementChange('longLead', e?.target?.value)}
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" />

            </div>
          </div>
          <div className="flex justify-end">
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Procurement Total</label>
              <input
                type="text"
                value={procurementTotal?.toFixed(2)}
                readOnly
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold text-right transition-colors" />

            </div>
          </div>
        </div>

        {/* Production Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Production</h4>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Units per Day m2</label>
              <input
                type="text"
                value={autoUnitsPerDay?.toFixed(2)}
                readOnly
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                title="Auto-calculated: (Total m² ÷ Total Module Qty) × No. Mods per Day" />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Mods per Day</label>
              <input
                type="number"
                placeholder="0"
                value={formData?.production?.modsPerDay || ''}
                onChange={(e) => handleProductionChange('modsPerDay', e?.target?.value)}
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Production Per Week Sqf</label>
              <input
                type="text"
                value={productionPerWeek?.toFixed(2)}
                readOnly
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" />

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Production Week</label>
              <input
                type="text"
                value={autoProductionWeek}
                readOnly
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                title="Auto-calculated: Math.ceil(Total m² ÷ Production Per Week Sqf)" />

            </div>
          </div>
          <div className="flex justify-end">
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Production Total</label>
              <input
                type="text"
                value={productionTotal?.toFixed(2)}
                readOnly
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold text-right transition-colors" />

            </div>
          </div>
        </div>

        {/* Total Production Duration Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Total Production Duration</h4>
          <div className="flex justify-end">
            <div className="w-64">
              <input
                type="text"
                value={totalProductionDuration?.toFixed(2)}
                readOnly
                className="max-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-bold text-lg text-right transition-colors" />

            </div>
          </div>
        </div>
      </div>
      {/* Right side - Schedule and Gantt Chart */}
      <div className="w-1/2 space-y-6">
        {/* Schedule Configuration */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Project Schedule</h4>
          
          {/* Start Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={formData?.schedule?.startDate || ''}
              onChange={(e) => handleScheduleChange('startDate', e?.target?.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            />
          </div>

          {/* Working Days */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Working Days</label>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']?.map((day) => {
                const isSelected = (formData?.schedule?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])?.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleWorkingDayToggle(day)}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isSelected
                        ? 'bg-blue-500 dark:bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Working Hours */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Working Hours</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Start Time</label>
                <select
                  value={formData?.schedule?.startTime || '08:00'}
                  onChange={(e) => handleScheduleChange('startTime', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  {timeOptions?.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Finish Time</label>
                <select
                  value={formData?.schedule?.finishTime || '17:00'}
                  onChange={(e) => handleScheduleChange('finishTime', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  {timeOptions?.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Project Timeline</h4>
          
          {ganttData?.length > 0 && ganttData?.[0]?.duration > 0 ? (
            <div className="space-y-4">
              {/* Timeline Header */}
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                <div className="flex justify-between">
                  <span>Start: {ganttData?.[0]?.start?.toLocaleDateString()}</span>
                  <span>End: {ganttData?.[ganttData?.length - 1]?.end?.toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Total Duration: {totalCalendarDays} calendar days
                </div>
              </div>

              {/* Gantt Bars */}
              <div className="space-y-3">
                {ganttData?.map((item, index) => {
                  // Calculate total duration excluding procurement duplicates
                  const nonProcurementPhases = ganttData?.filter(d => !d?.isProcurement);
                  const procurementPhases = ganttData?.filter(d => d?.isProcurement);
                  const longestProcurement = procurementPhases?.length > 0 
                    ? DecimalMath?.max(...procurementPhases?.map(p => DecimalMath?.parse(p?.duration, 0)))
                    : 0;
                  const totalDuration = DecimalMath?.add(
                    ...nonProcurementPhases?.map(d => DecimalMath?.parse(d?.duration, 0)),
                    longestProcurement
                  );
                  
                  const widthPercent = totalDuration > 0 
                    ? DecimalMath?.divide(DecimalMath?.multiply(DecimalMath?.parse(item?.duration, 0), 100), totalDuration)
                    : 0;
                  
                  // Calculate cumulative offset
                  let offsetPercent = 0;
                  
                  if (item?.isProcurement) {
                    // All procurement phases start at the same position (after design phases)
                    const designPhases = ganttData?.filter((d, i) => i < index && !d?.isProcurement);
                    offsetPercent = designPhases?.reduce((sum, d) => {
                      const phasePercent = totalDuration > 0 
                        ? DecimalMath?.divide(DecimalMath?.multiply(DecimalMath?.parse(d?.duration, 0), 100), totalDuration)
                        : 0;
                      return DecimalMath?.add(sum, phasePercent);
                    }, 0);
                  } else {
                    // Non-procurement phases: calculate normal cumulative offset
                    const previousPhases = ganttData?.slice(0, index)?.filter(d => !d?.isProcurement);
                    offsetPercent = previousPhases?.reduce((sum, d) => {
                      const phasePercent = totalDuration > 0 
                        ? DecimalMath?.divide(DecimalMath?.multiply(DecimalMath?.parse(d?.duration, 0), 100), totalDuration)
                        : 0;
                      return DecimalMath?.add(sum, phasePercent);
                    }, 0);
                    
                    // If this phase comes after procurement, add the longest procurement duration
                    const hasProcurementBefore = ganttData?.slice(0, index)?.some(d => d?.isProcurement);
                    if (hasProcurementBefore) {
                      const procurementPercent = totalDuration > 0 
                        ? DecimalMath?.divide(DecimalMath?.multiply(longestProcurement, 100), totalDuration)
                        : 0;
                      offsetPercent = DecimalMath?.add(offsetPercent, procurementPercent);
                    }
                  }
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-200">{item?.phase}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{DecimalMath?.parse(item?.duration, 0)?.toFixed(1)} weeks</span>
                      </div>
                      <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-md overflow-visible">
                        <div
                          className={`absolute h-full ${item?.color} dark:brightness-110 flex items-center justify-center text-white text-xs font-medium transition-all duration-300 rounded-md shadow-sm`}
                          style={{ 
                            width: `${DecimalMath?.parse(widthPercent, 0)}%`,
                            left: `${DecimalMath?.parse(offsetPercent, 0)}%`
                          }}
                        >
                          {widthPercent > 15 && `${DecimalMath?.parse(widthPercent, 0)?.toFixed(0)}%`}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{item?.start?.toLocaleDateString()}</span>
                        <span>{item?.end?.toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-400 dark:bg-blue-500 rounded shadow-sm"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Concept</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600 rounded shadow-sm"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Schematic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 dark:bg-blue-700 rounded shadow-sm"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Detailed Design</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-700 dark:bg-blue-800 rounded shadow-sm"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Production / IFC</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-400 dark:bg-orange-500 rounded shadow-sm"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Procurement - Local</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 dark:bg-orange-600 rounded shadow-sm"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Procurement - Short Lead</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-600 dark:bg-orange-700 rounded shadow-sm"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Procurement - Long Lead</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 dark:bg-green-600 rounded shadow-sm"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Production</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">Enter phase durations to generate timeline</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProjectDurationTab;