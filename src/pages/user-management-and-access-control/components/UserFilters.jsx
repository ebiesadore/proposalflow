import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const UserFilters = ({ filters, onFilterChange, onReset }) => {
  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operations', label: 'Operations' },
    { value: 'it', label: 'IT' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' },
  ];

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'specialist', label: 'Specialist' },
    { value: 'analyst', label: 'Analyst' },
    { value: 'coordinator', label: 'Coordinator' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
  ];

  const permissionOptions = [
    { value: 'all', label: 'All Permissions' },
    { value: 'full', label: 'Full Access' },
    { value: 'limited', label: 'Limited Access' },
    { value: 'view', label: 'View Only' },
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Filter Users
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          iconName="RotateCcw"
          iconPosition="left"
          iconSize={16}
        >
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          type="search"
          placeholder="Search by name or email..."
          value={filters?.search}
          onChange={(e) => onFilterChange('search', e?.target?.value)}
          className="col-span-1 md:col-span-2 lg:col-span-4"
        />

        <Select
          label="Department"
          options={departmentOptions}
          value={filters?.department}
          onChange={(value) => onFilterChange('department', value)}
        />

        <Select
          label="Role"
          options={roleOptions}
          value={filters?.role}
          onChange={(value) => onFilterChange('role', value)}
        />

        <Select
          label="Status"
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
        />

        <Select
          label="Permission Level"
          options={permissionOptions}
          value={filters?.permission}
          onChange={(value) => onFilterChange('permission', value)}
        />
      </div>
    </div>
  );
};

export default UserFilters;