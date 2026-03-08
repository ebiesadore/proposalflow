import React, { useState } from 'react';

import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const SearchFilters = ({ onSearch, onFilter, onBulkAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const industryOptions = [
    { value: '', label: 'All Industries' },
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const regionOptions = [
    { value: '', label: 'All Regions' },
    { value: 'north', label: 'North America' },
    { value: 'south', label: 'South America' },
    { value: 'europe', label: 'Europe' },
    { value: 'asia', label: 'Asia Pacific' },
  ];

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleApplyFilters = () => {
    onFilter({
      industry: selectedIndustry,
      status: selectedStatus,
      region: selectedRegion,
    });
  };

  const handleClearFilters = () => {
    setSelectedIndustry('');
    setSelectedStatus('');
    setSelectedRegion('');
    onFilter({
      industry: '',
      status: '',
      region: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search clients by name, contact, or industry..."
            value={searchTerm}
            onChange={(e) => handleSearch(e?.target?.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            iconName="Filter"
            iconPosition="left"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <Button
            variant="outline"
            iconName="Download"
            iconPosition="left"
            onClick={() => onBulkAction('export')}
          >
            Export
          </Button>
        </div>
      </div>
      {showFilters && (
        <div className="p-4 bg-muted rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Industry"
              options={industryOptions}
              value={selectedIndustry}
              onChange={setSelectedIndustry}
            />
            <Select
              label="Status"
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
            />
            <Select
              label="Region"
              options={regionOptions}
              value={selectedRegion}
              onChange={setSelectedRegion}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;