import React from 'react';
import Icon from '../../../components/AppIcon';

const VersionFilters = ({ filters, onFiltersChange, versions }) => {
    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'draft', label: 'Draft' },
        { value: 'under_review', label: 'Under Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'superseded', label: 'Superseded' },
    ];

    return (
        <div className="space-y-3 p-4 border-b border-border">
            {/* Search */}
            <div className="relative">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    value={filters?.search || ''}
                    onChange={(e) => onFiltersChange({ ...filters, search: e?.target?.value })}
                    placeholder="Search change notes..."
                    className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#436958] focus:border-transparent"
                />
            </div>

            {/* Status Filter */}
            <select
                value={filters?.status || ''}
                onChange={(e) => onFiltersChange({ ...filters, status: e?.target?.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#436958] focus:border-transparent"
            >
                {statusOptions?.map(opt => (
                    <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
                ))}
            </select>

            {/* Version count */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{versions?.length || 0} version{versions?.length !== 1 ? 's' : ''} total</span>
                {(filters?.search || filters?.status) && (
                    <button
                        onClick={() => onFiltersChange({ search: '', status: '' })}
                        className="text-[#436958] hover:underline flex items-center gap-1"
                    >
                        <Icon name="X" size={11} />
                        Clear filters
                    </button>
                )}
            </div>
        </div>
    );
};

export default VersionFilters;
