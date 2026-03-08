import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumb from '../../components/ui/Breadcrumb';
import SystemsConfigTabs from '../../components/ui/SystemsConfigTabs';
import RoleBasedAccess from '../../components/ui/RoleBasedAccess';
import IntegrationStatus from '../../components/ui/IntegrationStatus';
import GeneralSettingsTab from './components/GeneralSettingsTab';
import SecurityComplianceTab from './components/SecurityComplianceTab';
import NotificationsTab from './components/NotificationsTab';
import BackupRecoveryTab from './components/BackupRecoveryTab';
import SystemHealthMonitor from './components/SystemHealthMonitor';
import Icon from '../../components/AppIcon';
import { useLocation } from 'react-router-dom';

const SystemSettingsAndConfigurationHub = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed !== null) {
      setIsSidebarCollapsed(savedCollapsed === 'true');
    }
  }, []);

  const handleSidebarToggle = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  return (
    <RoleBasedAccess requiredPermission="admin">
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsed={isSidebarCollapsed} onToggleCollapse={handleSidebarToggle} />

        <main className="flex-1 ml-[68px] transition-smooth">
          <div className="sticky top-0 z-40 bg-card border-b border-border">
            <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                    System Settings
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Configure system-wide settings and operational parameters
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <IntegrationStatus compact />
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <Icon name="User" size={20} color="#FFFFFF" />
                  </div>
                </div>
              </div>
            </div>

            <SystemsConfigTabs />
          </div>

          <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <Breadcrumb />
            
            <div className="max-w-[1600px] mx-auto space-y-6">
              <GeneralSettingsTab />
              <SecurityComplianceTab />
              <NotificationsTab />
              <BackupRecoveryTab />
            </div>
          </div>
        </main>

        <SystemHealthMonitor />
      </div>
    </RoleBasedAccess>
  );
};

export default SystemSettingsAndConfigurationHub;