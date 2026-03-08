import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const SystemHealthStatus = () => {
  const [services, setServices] = useState([
    {
      name: 'Authentication Service',
      status: 'operational',
      responseTime: '45ms',
      icon: 'Key'
    },
    {
      name: 'Active Directory',
      status: 'operational',
      responseTime: '120ms',
      icon: 'Users'
    },
    {
      name: 'Database Connection',
      status: 'operational',
      responseTime: '32ms',
      icon: 'Database'
    },
    {
      name: 'Email Service',
      status: 'degraded',
      responseTime: '450ms',
      icon: 'Mail'
    }
  ]);

  const [lastChecked, setLastChecked] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastChecked(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'text-success';
      case 'degraded':
        return 'text-warning';
      case 'outage':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return 'CheckCircle';
      case 'degraded':
        return 'AlertTriangle';
      case 'outage':
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'operational':
        return 'bg-success/10';
      case 'degraded':
        return 'bg-warning/10';
      case 'outage':
        return 'bg-error/10';
      default:
        return 'bg-muted';
    }
  };

  const formatTime = (date) => {
    return date?.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-5 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="Activity" size={20} className="text-primary" />
          <h3 className="text-sm md:text-base font-heading font-semibold text-foreground">
            System Health
          </h3>
        </div>
        <div className="text-xs text-muted-foreground font-caption">
          Updated: {formatTime(lastChecked)}
        </div>
      </div>
      <div className="space-y-3">
        {services?.map((service, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg transition-smooth ${getStatusBg(service?.status)}`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Icon name={service?.icon} size={18} className="text-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs md:text-sm font-caption font-medium text-foreground truncate">
                  {service?.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Response: {service?.responseTime}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Icon
                name={getStatusIcon(service?.status)}
                size={16}
                className={getStatusColor(service?.status)}
              />
              <span className={`text-xs font-caption font-medium capitalize ${getStatusColor(service?.status)}`}>
                {service?.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-caption">Overall Status:</span>
          <div className="flex items-center gap-2">
            <Icon name="CheckCircle" size={14} className="text-success" />
            <span className="text-xs font-caption font-semibold text-success">All Systems Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthStatus;