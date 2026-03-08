import React, { useState, useEffect } from 'react';


const defaultRiskData = {
  clientAssessment: {
    stakeholder: {
      riskFactor: '', experience: '', team: '', factor: ''
    },
    financialRisk: {
      material: '', labour: '', inflation: '', factor: ''
    },
    costOverRuns: {
      interestRates: '', creditRisk: '', factor: ''
    }
  },
  operationalRisk: {
    projectDetails: {
      weather: '', supplyChain: '', regulatory: '', factor: ''
    },
    constructionRisk: {
      design: '', qaQc: '', factor: ''
    }
  },
  marketRisk: {
    demandVariability: {
      marketDemand: '', economicCondition: '', politictal: '', factor: ''
    }
  },
  environmentalRisk: {
    siteConditions: {
      geotechnicalRisks: '', environmentalHazards: '', shipping: '', factor: ''
    },
    sustainabilityAndCompliance: {
      environmentalRegulation: '', sustainabilityRequirment: '', factor: ''
    },
    compliance: {
      complinaceLevels: '', authorisedCompliance: '', factor: ''
    }
  }
};

// Deep merge loaded data with defaults so every field always has at least ''
const mergeRiskData = (defaults, loaded) => {
  if (!loaded) return defaults;
  const result = {};
  for (const key of Object.keys(defaults)) {
    if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
      result[key] = mergeRiskData(defaults[key], loaded[key]);
    } else {
      result[key] = (loaded[key] !== undefined && loaded[key] !== null) ? loaded[key] : defaults[key];
    }
  }
  return result;
};

const RiskTab = ({ formData, onChange, errors }) => {
  // Initialize risk data structure
  const [riskData, setRiskData] = useState(() => mergeRiskData(defaultRiskData, formData?.risks));

  // Load data from formData on mount - deep merge to prevent undefined values
  useEffect(() => {
    if (formData?.risks) {
      setRiskData(mergeRiskData(defaultRiskData, formData.risks));
    }
  }, [formData?.risks]);

  // Update parent component when risk data changes
  const handleInputChange = (area, subHeading, field, value) => {
    const updatedData = {
      ...riskData,
      [area]: {
        ...riskData?.[area],
        [subHeading]: {
          ...riskData?.[area]?.[subHeading],
          [field]: value
        }
      }
    };
    setRiskData(updatedData);
    onChange('risks', updatedData);
  };

  // Calculate average based on all factor values * factory percentage
  const calculateAverage = (subHeadingData) => {
    if (!subHeadingData) return '0.00%';
    
    // Extract all numeric values except 'factor'
    const values = Object.entries(subHeadingData)?.filter(([key]) => key !== 'factor')?.map(([_, value]) => {
        const numValue = parseFloat(value);
        return isNaN(numValue) ? 0 : numValue;
      })?.filter(val => val !== 0);
    
    // Get factor percentage
    const factorValue = parseFloat(subHeadingData?.factor);
    
    // If no valid values or no factor, return 0.00%
    if (values?.length === 0 || isNaN(factorValue) || factorValue === 0) {
      return '0.00%';
    }
    
    // Calculate average of all values
    const sum = values?.reduce((acc, val) => acc + val, 0);
    const average = sum / values?.length;
    
    // Multiply by factor percentage
    const result = average * (factorValue / 100);
    
    return result?.toFixed(2) + '%';
  };

  // Calculate Risk Allocation - average of all last column percentages
  const calculateRiskAllocation = () => {
    const allAverages = [
      // Client Assessment
      calculateAverage(riskData?.clientAssessment?.stakeholder),
      calculateAverage(riskData?.clientAssessment?.financialRisk),
      calculateAverage(riskData?.clientAssessment?.costOverRuns),
      '0.00%', // Finance row
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

    // Convert all percentages to numbers
    const numericValues = allAverages?.map(val => {
      const numValue = parseFloat(val?.replace('%', ''));
      return isNaN(numValue) ? 0 : numValue;
    })?.filter(val => val !== 0);

    // If no valid values, return 0.00%
    if (numericValues?.length === 0) {
      return '0.00%';
    }

    // Calculate average
    const sum = numericValues?.reduce((acc, val) => acc + val, 0);
    const average = sum / numericValues?.length;

    return average?.toFixed(2) + '%';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 dark:text-foreground">Risk Assessment</h2>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Evaluate and manage project risks across all categories</p>
      </div>
      
      {/* Client Assessment */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden transition-colors">
        <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600 text-base font-semibold text-gray-900 dark:text-gray-100 px-6 py-3">
          Client Assessment
        </div>
        
        {/* Stakeholder */}
        <div className="grid grid-cols-[200px_150px_1fr_150px_1fr_150px_1fr_150px_150px] border-b border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-3 flex items-center">Stakeholder</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Risk Factor</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.clientAssessment?.stakeholder?.riskFactor}
                onChange={(e) => handleInputChange('clientAssessment', 'stakeholder', 'riskFactor', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Experience</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.clientAssessment?.stakeholder?.experience}
                onChange={(e) => handleInputChange('clientAssessment', 'stakeholder', 'experience', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Team</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.clientAssessment?.stakeholder?.team}
                onChange={(e) => handleInputChange('clientAssessment', 'stakeholder', 'team', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.clientAssessment?.stakeholder?.factor}
                onChange={(e) => handleInputChange('clientAssessment', 'stakeholder', 'factor', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center font-semibold bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-3 flex items-center justify-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            {calculateAverage(riskData?.clientAssessment?.stakeholder)}
          </div>
        </div>

        {/* Financial Risk */}
        <div className="grid grid-cols-[200px_150px_1fr_150px_1fr_150px_1fr_150px_150px] border-b border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-3 flex items-center">Financial Risk</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Material</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.clientAssessment?.financialRisk?.material}
                onChange={(e) => handleInputChange('clientAssessment', 'financialRisk', 'material', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Labour</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.clientAssessment?.financialRisk?.labour}
                onChange={(e) => handleInputChange('clientAssessment', 'financialRisk', 'labour', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Inflation</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.clientAssessment?.financialRisk?.inflation}
                onChange={(e) => handleInputChange('clientAssessment', 'financialRisk', 'inflation', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.clientAssessment?.financialRisk?.factor}
                onChange={(e) => handleInputChange('clientAssessment', 'financialRisk', 'factor', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center font-semibold bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-3 flex items-center justify-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            {calculateAverage(riskData?.clientAssessment?.financialRisk)}
          </div>
        </div>

        {/* Cost Over Runs */}
        <div className="grid grid-cols-[200px_150px_1fr_150px_1fr_150px_1fr_150px_150px] border-b border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-3 flex items-center">Cost Over Runs</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Interest Rates</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.clientAssessment?.costOverRuns?.interestRates}
                onChange={(e) => handleInputChange('clientAssessment', 'costOverRuns', 'interestRates', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Credit Risk</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.clientAssessment?.costOverRuns?.creditRisk}
                onChange={(e) => handleInputChange('clientAssessment', 'costOverRuns', 'creditRisk', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center"></div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center"></div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.clientAssessment?.costOverRuns?.factor}
                onChange={(e) => handleInputChange('clientAssessment', 'costOverRuns', 'factor', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center font-semibold bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-3 flex items-center justify-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            {calculateAverage(riskData?.clientAssessment?.costOverRuns)}
          </div>
        </div>

        {/* Finance */}
        <div className="grid grid-cols-[200px_150px_1fr_150px_1fr_150px_1fr_150px_150px]">
          <div className="bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-3 flex items-center">Finance</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Interest Rates</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Credit Risk</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center"></div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center"></div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center font-semibold bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-3 flex items-center justify-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            0.00%
          </div>
        </div>
      </div>

      {/* Operational Risk */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden transition-colors">
        <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600 text-base font-semibold text-gray-900 dark:text-gray-100 px-6 py-3">
          Operational Risk
        </div>
        
        {/* Project Details */}
        <div className="grid grid-cols-[200px_150px_1fr_150px_1fr_150px_1fr_150px_150px] border-b border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-3 flex items-center">Project Details</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Weather</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.operationalRisk?.projectDetails?.weather}
                onChange={(e) => handleInputChange('operationalRisk', 'projectDetails', 'weather', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Supply Chain</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.operationalRisk?.projectDetails?.supplyChain}
                onChange={(e) => handleInputChange('operationalRisk', 'projectDetails', 'supplyChain', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Regulatory</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.operationalRisk?.projectDetails?.regulatory}
                onChange={(e) => handleInputChange('operationalRisk', 'projectDetails', 'regulatory', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.operationalRisk?.projectDetails?.factor}
                onChange={(e) => handleInputChange('operationalRisk', 'projectDetails', 'factor', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center font-semibold bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-3 flex items-center justify-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            {calculateAverage(riskData?.operationalRisk?.projectDetails)}
          </div>
        </div>

        {/* Construction Risk */}
        <div className="grid grid-cols-[200px_150px_1fr_150px_1fr_150px_1fr_150px_150px]">
          <div className="bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-3 flex items-center">Construction Risk</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Design</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.operationalRisk?.constructionRisk?.design}
                onChange={(e) => handleInputChange('operationalRisk', 'constructionRisk', 'design', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">QA/QC</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.operationalRisk?.constructionRisk?.qaQc}
                onChange={(e) => handleInputChange('operationalRisk', 'constructionRisk', 'qaQc', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center"></div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center"></div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.operationalRisk?.constructionRisk?.factor}
                onChange={(e) => handleInputChange('operationalRisk', 'constructionRisk', 'factor', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center font-semibold bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-3 flex items-center justify-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            {calculateAverage(riskData?.operationalRisk?.constructionRisk)}
          </div>
        </div>
      </div>

      {/* Market Risk */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden transition-colors">
        <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600 text-base font-semibold text-gray-900 dark:text-gray-100 px-6 py-3">
          Market Risk
        </div>
        
        {/* Demand Variability */}
        <div className="grid grid-cols-[200px_150px_1fr_150px_1fr_150px_1fr_150px_150px]">
          <div className="bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-3 flex items-center">Demand Variability</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Market Demand</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.marketRisk?.demandVariability?.marketDemand}
                onChange={(e) => handleInputChange('marketRisk', 'demandVariability', 'marketDemand', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Economic Condition</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.marketRisk?.demandVariability?.economicCondition}
                onChange={(e) => handleInputChange('marketRisk', 'demandVariability', 'economicCondition', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Political</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.marketRisk?.demandVariability?.politictal}
                onChange={(e) => handleInputChange('marketRisk', 'demandVariability', 'politictal', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.marketRisk?.demandVariability?.factor}
                onChange={(e) => handleInputChange('marketRisk', 'demandVariability', 'factor', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center font-semibold bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-3 flex items-center justify-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            {calculateAverage(riskData?.marketRisk?.demandVariability)}
          </div>
        </div>
      </div>

      {/* Environmental Risk */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden transition-colors">
        <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600 text-base font-semibold text-gray-900 dark:text-gray-100 px-6 py-3">
          Environmental Risk
        </div>
        
        {/* Site Conditions */}
        <div className="grid grid-cols-[200px_150px_1fr_150px_1fr_150px_1fr_150px_150px] border-b border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-3 flex items-center">Site Conditions</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Geotechnical Risks</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.environmentalRisk?.siteConditions?.geotechnicalRisks}
                onChange={(e) => handleInputChange('environmentalRisk', 'siteConditions', 'geotechnicalRisks', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Environmental Hazards</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.environmentalRisk?.siteConditions?.environmentalHazards}
                onChange={(e) => handleInputChange('environmentalRisk', 'siteConditions', 'environmentalHazards', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Shipping</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.environmentalRisk?.siteConditions?.shipping}
                onChange={(e) => handleInputChange('environmentalRisk', 'siteConditions', 'shipping', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.environmentalRisk?.siteConditions?.factor}
                onChange={(e) => handleInputChange('environmentalRisk', 'siteConditions', 'factor', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center font-semibold bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-3 flex items-center justify-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            {calculateAverage(riskData?.environmentalRisk?.siteConditions)}
          </div>
        </div>

        {/* Sustainability and Compliance */}
        <div className="grid grid-cols-[200px_150px_1fr_150px_1fr_150px_1fr_150px_150px] border-b border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-3 flex items-center">Sustainability and Compliance</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Environmental Regulation</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.environmentalRisk?.sustainabilityAndCompliance?.environmentalRegulation}
                onChange={(e) => handleInputChange('environmentalRisk', 'sustainabilityAndCompliance', 'environmentalRegulation', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Sustainability Requirement</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.environmentalRisk?.sustainabilityAndCompliance?.sustainabilityRequirment}
                onChange={(e) => handleInputChange('environmentalRisk', 'sustainabilityAndCompliance', 'sustainabilityRequirment', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center"></div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center"></div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.environmentalRisk?.sustainabilityAndCompliance?.factor}
                onChange={(e) => handleInputChange('environmentalRisk', 'sustainabilityAndCompliance', 'factor', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center font-semibold bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-3 flex items-center justify-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            {calculateAverage(riskData?.environmentalRisk?.sustainabilityAndCompliance)}
          </div>
        </div>

        {/* Compliance */}
        <div className="grid grid-cols-[200px_150px_1fr_150px_1fr_150px_1fr_150px_150px]">
          <div className="bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-3 flex items-center">Compliance</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Compliance Levels</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.environmentalRisk?.compliance?.complinaceLevels}
                onChange={(e) => handleInputChange('environmentalRisk', 'compliance', 'complinaceLevels', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">Authorised Compliance</div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.environmentalRisk?.compliance?.authorisedCompliance}
                onChange={(e) => handleInputChange('environmentalRisk', 'compliance', 'authorisedCompliance', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center"></div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center"></div>
          <div className="bg-white dark:bg-gray-800 px-3 py-3 flex items-center justify-center">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
              <input
                type="text"
                value={riskData?.environmentalRisk?.compliance?.factor}
                onChange={(e) => handleInputChange('environmentalRisk', 'compliance', 'factor', e?.target?.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center font-semibold bg-white dark:bg-gray-700 dark:text-gray-100 dark:transition-colors"
              />
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-3 flex items-center justify-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            {calculateAverage(riskData?.environmentalRisk?.compliance)}
          </div>
        </div>
      </div>

      {/* Risk Allocation - Outside boxes at bottom */}
      <div className="grid grid-cols-[200px_150px_1fr_150px_1fr_150px_1fr_150px_150px] mt-4">
        <div className="col-span-8"></div>
        <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600 px-4 py-3 rounded-lg transition-colors">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Risk Allocation</div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {calculateRiskAllocation()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskTab;