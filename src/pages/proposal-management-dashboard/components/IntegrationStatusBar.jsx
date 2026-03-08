import React from 'react';
import Icon from '../../../components/AppIcon';

const IntegrationStatusBar = () => {
  const integrations = [
    {
      name: 'CRM',
      status: 'connected',
      lastSync: '2 min ago',
      icon: 'Database'
    },
    {
      name: 'Financial',
      status: 'connected',
      lastSync: '5 min ago',
      icon: 'DollarSign'
    },
    {
      name: 'Email',
      status: 'syncing',
      lastSync: 'Syncing...',
      icon: 'Mail'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-success';
      case 'syncing':
        return 'text-warning';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return 'CheckCircle';
      case 'syncing':
        return 'RefreshCw';
      case 'error':
        return 'AlertCircle';
      default:
        return 'Circle';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-brand">
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <Icon name="Zap" size={18} className="text-primary" />
          <span className="text-sm font-caption font-medium text-foreground">
            Integrations
          </span>
        </div>
        {integrations?.map((integration, index) => (
          <div key={index} className="flex items-center gap-2">
            <Icon name={integration?.icon} size={16} className="text-muted-foreground" />
            <span className="text-sm font-caption text-foreground">
              {integration?.name}
            </span>
            <Icon
              name={getStatusIcon(integration?.status)}
              size={16}
              className={`${getStatusColor(integration?.status)} ${integration?.status === 'syncing' ? 'animate-spin' : ''}`}
            />
            <span className="text-xs text-muted-foreground hidden md:inline">
              {integration?.lastSync}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationStatusBar;