import React from 'react';
import Icon from '../../../components/AppIcon';

import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const EmailFilters = ({ 
  searchQuery, 
  onSearchChange, 
  selectedClient, 
  onClientChange,
  selectedType,
  onTypeChange,
  clients,
  onRefresh 
}) => {
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'proposal', label: 'Proposal Related' },
    { value: 'meeting', label: 'Meeting Requests' },
    { value: 'followup', label: 'Follow-ups' },
    { value: 'general', label: 'General Communication' }
  ];

  const clientOptions = [
    { value: 'all', label: 'All Clients' },
    ...clients?.map(client => ({
      value: client?.id,
      label: client?.name
    }))
  ];

  return (
    <div className="bg-card border-b border-border p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5">
          <div className="relative">
            <Icon 
              name="Search" 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
            />
            <input
              type="text"
              placeholder="Search messages, clients, proposals..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e?.target?.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
            />
          </div>
        </div>

        <div className="md:col-span-3">
          <Select
            placeholder="Filter by client"
            options={clientOptions}
            value={selectedClient}
            onChange={onClientChange}
          />
        </div>

        <div className="md:col-span-3">
          <Select
            placeholder="Filter by type"
            options={typeOptions}
            value={selectedType}
            onChange={onTypeChange}
          />
        </div>

        <div className="md:col-span-1 flex items-center justify-end">
          <Button
            variant="outline"
            size="default"
            iconName="RefreshCw"
            onClick={onRefresh}
            className="w-full md:w-auto"
          >
            <span className="md:hidden">Refresh</span>
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span className="text-xs text-muted-foreground">Quick filters:</span>
        <button className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-full text-xs font-caption transition-smooth">
          Unread
        </button>
        <button className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-full text-xs font-caption transition-smooth">
          High Priority
        </button>
        <button className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-full text-xs font-caption transition-smooth">
          This Week
        </button>
        <button className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-full text-xs font-caption transition-smooth">
          Has Attachments
        </button>
      </div>
    </div>
  );
};

export default EmailFilters;