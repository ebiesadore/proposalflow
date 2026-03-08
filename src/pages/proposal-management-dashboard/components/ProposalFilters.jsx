import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';

const ProposalFilters = ({ onFilterChange, onClearFilters }) => {
  const [filters, setFilters] = useState({
    search: '',
    status: [],
    client: '',
    dateRange: { start: '', end: '' },
    assignedTo: '',
    valueRange: { min: '', max: '' }
  });

  const statusOptions = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Won', label: 'Won' }
  ];

  const clientOptions = [
    { value: '', label: 'Select an option' },
    { value: 'acme-corp', label: 'Acme Corporation' },
    { value: 'tech-solutions', label: 'Tech Solutions Inc' },
    { value: 'global-industries', label: 'Global Industries Ltd' },
    { value: 'innovate-systems', label: 'Innovate Systems' },
    { value: 'enterprise-group', label: 'Enterprise Group' }
  ];

  const handleSearchChange = (e) => {
    const newFilters = { ...filters, search: e?.target?.value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusChange = (status) => {
    const newStatus = filters?.status?.includes(status)
      ? filters?.status?.filter(s => s !== status)
      : [...filters?.status, status];
    const newFilters = { ...filters, status: newStatus };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClientChange = (value) => {
    const newFilters = { ...filters, client: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearAll = () => {
    const clearedFilters = {
      search: '',
      status: [],
      client: '',
      dateRange: { start: '', end: '' },
      assignedTo: '',
      valueRange: { min: '', max: '' }
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const activeFilterCount = 
    filters?.status?.length +
    (filters?.client ? 1 : 0);

  return (
    <div className="bg-card rounded-lg border border-border shadow-brand p-4">
      {/* Single Row: Filters label + all filter items + Clear All button */}
      <div className="flex items-center gap-4">
        {/* Filters Label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Icon name="Filter" size={20} className="text-muted-foreground" />
          <span className="text-base font-heading font-semibold text-foreground">
            Filters
          </span>
        </div>

        {/* Search Proposals */}
        <div className="flex-shrink-0" style={{ width: '240px' }}>
          <Input
            type="search"
            placeholder="Search proposals..."
            value={filters?.search}
            onChange={handleSearchChange}
            className="w-full h-9"
          />
        </div>

        {/* Client Dropdown */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <label className="text-sm font-medium text-foreground whitespace-nowrap">
            Client
          </label>
          <div style={{ width: '200px' }}>
            <Select
              options={clientOptions}
              value={filters?.client}
              onChange={handleClientChange}
              searchable
            />
          </div>
        </div>

        {/* Status Label and Checkboxes */}
        <div className="flex items-center gap-4 flex-1">
          <label className="text-sm font-medium text-foreground whitespace-nowrap">
            Status
          </label>
          <div className="flex items-center gap-4 flex-wrap">
            {statusOptions?.map((status) => (
              <Checkbox
                key={status?.value}
                label={status?.label}
                checked={filters?.status?.includes(status?.value)}
                onChange={() => handleStatusChange(status?.value)}
              />
            ))}
          </div>
        </div>

        {/* Clear All Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          disabled={activeFilterCount === 0}
          className="text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <Icon name="X" size={16} className="mr-1" />
          Clear All
        </Button>
      </div>
    </div>
  );
};

export default ProposalFilters;