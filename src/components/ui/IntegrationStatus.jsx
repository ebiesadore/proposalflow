import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const IntegrationStatus = ({ compact = false }) => {
  const [integrations, setIntegrations] = useState([
    {
      name: 'CRM Integration',
      status: 'connected',
      lastSync: '2026-01-27T13:30:00',
      icon: 'Database',
    },
    {
      name: 'Email Server',
      status: 'connected',
      lastSync: '2026-01-27T13:32:00',
      icon: 'Mail',
    },
    {
      name: 'LDAP Directory',
      status: 'warning',
      lastSync: '2026-01-27T12:15:00',
      icon: 'Users',
    },
  ]);

  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return 'CheckCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'error':
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  const formatLastSync = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date?.toLocaleDateString();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {integrations?.map((integration) => (
          <div
            key={integration?.name}
            className="relative group"
            title={`${integration?.name}: ${integration?.status}`}
          >
            <Icon
              name={integration?.icon}
              size={16}
              className={`${getStatusColor(integration?.status)} transition-smooth`}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground rounded-lg shadow-brand-lg opacity-0 group-hover:opacity-100 transition-smooth pointer-events-none whitespace-nowrap z-50">
              <div className="text-xs font-caption font-medium">{integration?.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatLastSync(integration?.lastSync)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-brand p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Integration Status
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-caption font-medium text-primary hover:text-primary/80 transition-smooth"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      <div className="space-y-4">
        {integrations?.map((integration) => (
          <div
            key={integration?.name}
            className="flex items-center justify-between p-4 bg-muted rounded-lg transition-smooth hover:bg-muted/80"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center">
                <Icon name={integration?.icon} size={20} className="text-foreground" />
              </div>
              <div>
                <div className="font-caption font-medium text-sm text-foreground">
                  {integration?.name}
                </div>
                {isExpanded && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Last sync: {formatLastSync(integration?.lastSync)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Icon
                name={getStatusIcon(integration?.status)}
                size={20}
                className={getStatusColor(integration?.status)}
              />
              {isExpanded && (
                <span className={`text-xs font-caption font-medium capitalize ${getStatusColor(integration?.status)}`}>
                  {integration?.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-border">
          <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-caption font-medium text-sm transition-smooth hover:opacity-90">
            Refresh All Integrations
          </button>
        </div>
      )}
    </div>
  );
};

export default IntegrationStatus;