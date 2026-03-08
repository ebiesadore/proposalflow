import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const FilterPanel = ({ onFilterChange, onSavePreset, savedPresets }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    user: '',
    action: '',
    module: '',
    severity: '',
    searchQuery: ''
  });

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'export', label: 'Export' },
    { value: 'import', label: 'Import' }
  ];

  const moduleOptions = [
    { value: '', label: 'All Modules' },
    { value: 'user_management', label: 'User Management' },
    { value: 'proposals', label: 'Proposals' },
    { value: 'clients', label: 'Clients' },
    { value: 'templates', label: 'Templates' },
    { value: 'system_settings', label: 'System Settings' },
    { value: 'email', label: 'Email' }
  ];

  const severityOptions = [
    { value: '', label: 'All Severities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      dateFrom: '',
      dateTo: '',
      user: '',
      action: '',
      module: '',
      severity: '',
      searchQuery: ''
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const handleLoadPreset = (preset) => {
    setFilters(preset?.filters);
    onFilterChange(preset?.filters);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-brand">
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Icon name="Filter" size={20} className="text-primary" />
          <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
            Advanced Filters
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>
      {isExpanded && (
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Input
              type="date"
              label="Date From"
              value={filters?.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e?.target?.value)}
            />
            <Input
              type="date"
              label="Date To"
              value={filters?.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e?.target?.value)}
            />
            <Input
              type="text"
              label="User"
              placeholder="Search by username"
              value={filters?.user}
              onChange={(e) => handleFilterChange('user', e?.target?.value)}
            />
            <Select
              label="Action Type"
              options={actionOptions}
              value={filters?.action}
              onChange={(value) => handleFilterChange('action', value)}
            />
            <Select
              label="Module"
              options={moduleOptions}
              value={filters?.module}
              onChange={(value) => handleFilterChange('module', value)}
            />
            <Select
              label="Severity"
              options={severityOptions}
              value={filters?.severity}
              onChange={(value) => handleFilterChange('severity', value)}
            />
          </div>

          <div className="mb-6">
            <Input
              type="search"
              label="Advanced Search"
              placeholder="Search logs (supports regex patterns)"
              value={filters?.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e?.target?.value)}
              description="Use regex patterns for complex queries"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              iconName="X"
              iconPosition="left"
              onClick={handleClearFilters}
              className="flex-1 sm:flex-initial"
            >
              Clear Filters
            </Button>
            <Button
              variant="secondary"
              iconName="Save"
              iconPosition="left"
              onClick={() => onSavePreset(filters)}
              className="flex-1 sm:flex-initial"
            >
              Save Preset
            </Button>
            <div className="flex-1" />
            {savedPresets?.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {savedPresets?.map((preset) => (
                    <Button
                      key={preset?.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      {preset?.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;