import React, { useState } from 'react';

import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const GeneralSettingsTab = () => {
  const [companyName, setCompanyName] = useState('NeXSYS CORE™ Enterprise');
  const [companyLogo, setCompanyLogo] = useState('https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200');
  const [timezone, setTimezone] = useState('America/New_York');
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [defaultTemplate, setDefaultTemplate] = useState('standard');
  const [fiscalYearStart, setFiscalYearStart] = useState('01');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  ];

  const currencyOptions = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
    { value: 'AUD', label: 'Australian Dollar (A$)' },
  ];

  const dateFormatOptions = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (01/27/2026)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (27/01/2026)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-01-27)' },
  ];

  const templateOptions = [
    { value: 'standard', label: 'Standard Business Proposal' },
    { value: 'technical', label: 'Technical Proposal' },
    { value: 'executive', label: 'Executive Summary' },
    { value: 'detailed', label: 'Detailed Proposal' },
  ];

  const monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('General settings saved successfully');
    }, 1500);
  };

  const handleLogoUpload = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader?.result);
      };
      reader?.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-2">
          General Settings
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Configure company branding, regional settings, and default preferences
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
              Company Branding
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your company identity and branding elements
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            iconName="Eye"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Company Name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e?.target?.value)}
              placeholder="Enter company name"
              required
            />

            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-2">
                Company Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <Image
                    src={companyLogo}
                    alt="Company logo showing NeXSYS CORE™ Enterprise branding with blue and white color scheme"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload">
                    <Button variant="outline" size="sm" iconName="Upload" asChild>
                      <span>Upload Logo</span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG up to 2MB. Recommended: 200x200px
                  </p>
                </div>
              </div>
            </div>
          </div>

          {showPreview && (
            <div className="bg-muted rounded-lg p-6 flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-background rounded-lg flex items-center justify-center overflow-hidden shadow-brand">
                  <Image
                    src={companyLogo}
                    alt="Preview of company logo in proposal header showing branding consistency"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-xl font-heading font-semibold text-foreground">
                  {companyName}
                </h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Preview of proposal header
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
          Regional Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Select
            label="Timezone"
            description="Default timezone for all system operations"
            options={timezoneOptions}
            value={timezone}
            onChange={setTimezone}
            searchable
            required
          />

          <Select
            label="Currency"
            description="Default currency for financial data"
            options={currencyOptions}
            value={currency}
            onChange={setCurrency}
            required
          />

          <Select
            label="Date Format"
            description="Display format for dates throughout the system"
            options={dateFormatOptions}
            value={dateFormat}
            onChange={setDateFormat}
            required
          />

          <Select
            label="Fiscal Year Start"
            description="First month of your fiscal year"
            options={monthOptions}
            value={fiscalYearStart}
            onChange={setFiscalYearStart}
            required
          />
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
          Default Proposal Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Select
            label="Default Template"
            description="Template used for new proposals"
            options={templateOptions}
            value={defaultTemplate}
            onChange={setDefaultTemplate}
            required
          />

          <Input
            label="Proposal Validity Period"
            type="number"
            placeholder="30"
            description="Days until proposal expires"
            min="1"
            max="365"
          />

          <Input
            label="Auto-save Interval"
            type="number"
            placeholder="5"
            description="Minutes between automatic saves"
            min="1"
            max="60"
          />

          <Input
            label="Maximum File Size"
            type="number"
            placeholder="10"
            description="MB for proposal attachments"
            min="1"
            max="100"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button variant="outline" size="default">
          Reset to Defaults
        </Button>
        <Button
          variant="default"
          size="default"
          iconName="Save"
          loading={isSaving}
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default GeneralSettingsTab;