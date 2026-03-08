import React, { useState, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const SystemsConfigTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      label: 'User Management',
      path: '/user-management-and-access-control',
      icon: 'UserCog',
    },
    {
      label: 'System Settings',
      path: '/system-settings-and-configuration-hub',
      icon: 'Sliders',
    },
    {
      label: 'Materials',
      path: '/material-library-management',
      icon: 'Package',
    },
    {
      label: 'Additional Scope',
      path: '/additional-scope',
      icon: 'FileText',
    },
    {
      label: 'External Trade',
      path: '/external-trade',
      icon: 'Building2',
    },
    {
      label: 'Template Management',
      path: '/proposal-template-management-studio',
      icon: 'Layout',
    },
    {
      label: 'Audit Controls',
      path: '/audit-controls-and-compliance-monitor',
      icon: 'Shield',
    },
  ];

  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);

  const activeTab = tabs?.find(tab => tab?.path === location?.pathname);

  const handleTabClick = (path) => {
    navigate(path);
    setIsMobileDropdownOpen(false);
  };

  const handleMobileDropdownToggle = () => {
    setIsMobileDropdownOpen(!isMobileDropdownOpen);
  };

  return (
    <div className="bg-card border-b border-border">
      <div className="hidden md:flex items-center gap-2 px-6 overflow-x-auto">
        {tabs?.map((tab) => (
          <button
            key={tab?.path}
            onClick={() => handleTabClick(tab?.path)}
            className={`flex items-center gap-2 px-6 py-4 font-caption font-medium text-sm border-b-2 transition-smooth whitespace-nowrap ${
              location?.pathname === tab?.path
                ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            }`}
          >
            <Icon name={tab?.icon} size={18} />
            <span>{tab?.label}</span>
          </button>
        ))}
      </div>
      <div className="md:hidden px-4 py-3">
        <button
          onClick={handleMobileDropdownToggle}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted rounded-lg transition-smooth hover:bg-muted/80"
        >
          <div className="flex items-center gap-2">
            <Icon name={activeTab?.icon || 'Settings'} size={18} />
            <span className="font-caption font-medium text-sm">
              {activeTab?.label || 'Select Configuration'}
            </span>
          </div>
          <Icon
            name="ChevronDown"
            size={16}
            className={`transition-smooth ${isMobileDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isMobileDropdownOpen && (
          <div className="mt-2 bg-card border border-border rounded-lg shadow-brand-lg overflow-hidden">
            {tabs?.map((tab) => (
              <button
                key={tab?.path}
                onClick={() => handleTabClick(tab?.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-smooth hover:bg-muted ${
                  location?.pathname === tab?.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground'
                }`}
              >
                <Icon name={tab?.icon} size={18} />
                <span className="font-caption font-medium text-sm">{tab?.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemsConfigTabs;