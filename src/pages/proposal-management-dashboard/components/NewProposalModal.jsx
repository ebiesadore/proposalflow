import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ProjectDurationTab from './tabs/ProjectDurationTab';
import ModularBuildUpTab from './tabs/ModularBuildUpTab';
import CostMarginTab from './tabs/CostMarginTab';
import MaterialsLabourTab from './tabs/MaterialsLabourTab';
import OverHeadsTab from './tabs/OverHeadsTab';
import SiteCostsTab from './tabs/SiteCostsTab';
import LogisticsTab from './tabs/LogisticsTab';
import CommissionTab from './tabs/CommissionTab';
import RevenueCentersTab from './tabs/RevenueCentersTab';
import FinancingTab from './tabs/FinancingTab';
import RiskTab from './tabs/RiskTab';
import PaymentTermsTab from './tabs/PaymentTermsTab';

const NewProposalModal = ({ isOpen, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState('project-duration');
  const [formData, setFormData] = useState({
    // Project Duration
    projectName: '',
    startDate: '',
    endDate: '',
    duration: '',
    milestones: [],
    
    // Modular Build Up
    modules: [],
    totalModules: 0,
    
    // Cost + Margin
    baseCost: '',
    marginPercentage: '',
    totalCost: '',
    
    // Materials + Labour
    materials: [],
    labour: [],
    
    // Over Heads
    overheads: [],
    totalOverheads: '',
    
    // Site Costs
    siteCosts: [],
    totalSiteCosts: '',
    
    // Logistics
    logistics: [],
    totalLogistics: '',
    
    // Commission
    commissionRate: '',
    commissionAmount: '',
    
    // Revenue Centers
    revenueCenters: [],
    
    // Financing
    financingOptions: [],
    selectedFinancing: '',
    
    // Risk
    risks: [],
    riskMitigation: '',
    
    // Payment Terms
    paymentSchedule: [],
    paymentMethod: '',
    terms: ''
  });

  const [errors, setErrors] = useState({});

  const tabs = [
    { id: 'project-duration', label: 'Project Duration', icon: 'Calendar' },
    { id: 'modular-build-up', label: 'Modular Build Up', icon: 'Box' },
    { id: 'cost-margin', label: 'Cost + Margin', icon: 'DollarSign' },
    { id: 'materials-labour', label: 'Materials + Labour', icon: 'Package' },
    { id: 'overheads', label: 'Over Heads', icon: 'TrendingUp' },
    { id: 'site-costs', label: 'Site Costs', icon: 'MapPin' },
    { id: 'logistics', label: 'Logistics', icon: 'Truck' },
    { id: 'commission', label: 'Commission', icon: 'Percent' },
    { id: 'revenue-centers', label: 'Revenue Centers', icon: 'PieChart' },
    { id: 'financing', label: 'Financing', icon: 'CreditCard' },
    { id: 'risk', label: 'Risk', icon: 'AlertTriangle' },
    { id: 'payment-terms', label: 'Payment Terms', icon: 'FileText' }
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.projectName?.trim()) newErrors.projectName = 'Project name is required';
    if (!formData?.startDate) newErrors.startDate = 'Start date is required';
    if (!formData?.endDate) newErrors.endDate = 'End date is required';

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  const renderTabContent = () => {
    return (
      <>
        {/* Project Duration Tab */}
        <div style={{ display: activeTab === 'project-duration' ? 'block' : 'none' }}>
          <ProjectDurationTab formData={formData} onChange={handleChange} errors={errors} />
        </div>

        {/* Modular Build Up Tab */}
        <div style={{ display: activeTab === 'modular-build-up' ? 'block' : 'none' }}>
          <ModularBuildUpTab formData={formData} onChange={handleChange} errors={errors} />
        </div>

        {/* Cost + Margin Tab */}
        <div style={{ display: activeTab === 'cost-margin' ? 'block' : 'none' }}>
          <CostMarginTab formData={formData} onChange={handleChange} errors={errors} />
        </div>

        {/* Materials + Labour Tab */}
        <div style={{ display: activeTab === 'materials-labour' ? 'block' : 'none' }}>
          <MaterialsLabourTab formData={formData} onChange={handleChange} errors={errors} />
        </div>

        {/* Over Heads Tab */}
        <div style={{ display: activeTab === 'overheads' ? 'block' : 'none' }}>
          <OverHeadsTab formData={formData} onChange={handleChange} errors={errors} />
        </div>

        {/* Site Costs Tab */}
        <div style={{ display: activeTab === 'site-costs' ? 'block' : 'none' }}>
          <SiteCostsTab formData={formData} onChange={handleChange} errors={errors} />
        </div>

        {/* Logistics Tab */}
        <div style={{ display: activeTab === 'logistics' ? 'block' : 'none' }}>
          <LogisticsTab formData={formData} onChange={handleChange} errors={errors} />
        </div>

        {/* Commission Tab */}
        <div style={{ display: activeTab === 'commission' ? 'block' : 'none' }}>
          <CommissionTab formData={formData} onChange={handleChange} errors={errors} />
        </div>

        {/* Revenue Centers Tab */}
        <div style={{ display: activeTab === 'revenue-centers' ? 'block' : 'none' }}>
          <RevenueCentersTab formData={formData} onChange={handleChange} errors={errors} />
        </div>

        {/* Financing Tab */}
        <div style={{ display: activeTab === 'financing' ? 'block' : 'none' }}>
          <FinancingTab formData={formData} onChange={handleChange} errors={errors} />
        </div>

        {/* Risk Tab */}
        <div style={{ display: activeTab === 'risk' ? 'block' : 'none' }}>
          <RiskTab formData={formData} onChange={handleChange} errors={errors} />
        </div>

        {/* Payment Terms Tab */}
        <div style={{ display: activeTab === 'payment-terms' ? 'block' : 'none' }}>
          <PaymentTermsTab formData={formData} onChange={handleChange} errors={errors} />
        </div>
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-6xl bg-card rounded-lg border border-border shadow-brand-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="FilePlus" size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-foreground">
              New Proposal
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border bg-muted/30">
          <div className="flex overflow-x-auto px-6">
            {tabs?.map((tab) => (
              <button
                key={tab?.id}
                onClick={() => setActiveTab(tab?.id)}
                className={`flex items-center gap-2 px-4 py-3 font-caption font-medium text-sm border-b-2 transition-smooth whitespace-nowrap ${
                  activeTab === tab?.id
                    ? 'border-primary text-primary bg-primary/5' :'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon name={tab?.icon} size={16} />
                <span className="hidden sm:inline">{tab?.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Tab {tabs?.findIndex(t => t?.id === activeTab) + 1} of {tabs?.length}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSubmit}
              iconName="Check"
              iconPosition="left"
              iconSize={16}
            >
              Create Proposal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProposalModal;