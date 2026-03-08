import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const SystemHealthMonitor = () => {
  const [metrics, setMetrics] = useState({
    cpu: 42,
    memory: 68,
    storage: 55,
    activeUsers: 87,
    apiCalls: 1247,
    responseTime: 145,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        cpu: Math.min(100, Math.max(0, prev?.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.min(100, Math.max(0, prev?.memory + (Math.random() - 0.5) * 5)),
        storage: prev?.storage,
        activeUsers: Math.floor(Math.random() * 20) + 80,
        apiCalls: prev?.apiCalls + Math.floor(Math.random() * 50),
        responseTime: Math.floor(Math.random() * 50) + 120,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (value, thresholds = { warning: 70, critical: 85 }) => {
    if (value >= thresholds?.critical) return 'text-error';
    if (value >= thresholds?.warning) return 'text-warning';
    return 'text-success';
  };

  const getHealthStatus = () => {
    const avgHealth = (metrics?.cpu + metrics?.memory + metrics?.storage) / 3;
    if (avgHealth >= 85) return { status: 'Critical', color: 'text-error', icon: 'AlertTriangle' };
    if (avgHealth >= 70) return { status: 'Warning', color: 'text-warning', icon: 'AlertCircle' };
    return { status: 'Healthy', color: 'text-success', icon: 'CheckCircle' };
  };

  const healthStatus = getHealthStatus();

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-card border border-border rounded-full shadow-brand-lg flex items-center justify-center transition-smooth hover:shadow-brand-xl hover:scale-105"
        title="System Health Monitor"
      >
        <Icon name={healthStatus?.icon} size={24} className={healthStatus?.color} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-card border border-border rounded-lg shadow-brand-xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="Activity" size={20} className="text-primary" />
          <h4 className="font-heading font-semibold text-sm text-foreground">System Health</h4>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 hover:bg-muted rounded transition-smooth"
        >
          <Icon name="X" size={16} className="text-muted-foreground" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-caption font-medium text-foreground">Overall Status</span>
          <div className="flex items-center gap-2">
            <Icon name={healthStatus?.icon} size={16} className={healthStatus?.color} />
            <span className={`text-sm font-caption font-medium ${healthStatus?.color}`}>
              {healthStatus?.status}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-caption text-muted-foreground">CPU Usage</span>
              <span className={`text-xs font-caption font-medium ${getHealthColor(metrics?.cpu)}`}>
                {Math.round(metrics?.cpu)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  metrics?.cpu >= 85
                    ? 'bg-error'
                    : metrics?.cpu >= 70
                    ? 'bg-warning' :'bg-success'
                }`}
                style={{ width: `${metrics?.cpu}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-caption text-muted-foreground">Memory Usage</span>
              <span className={`text-xs font-caption font-medium ${getHealthColor(metrics?.memory)}`}>
                {Math.round(metrics?.memory)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  metrics?.memory >= 85
                    ? 'bg-error'
                    : metrics?.memory >= 70
                    ? 'bg-warning' :'bg-success'
                }`}
                style={{ width: `${metrics?.memory}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-caption text-muted-foreground">Storage Usage</span>
              <span className={`text-xs font-caption font-medium ${getHealthColor(metrics?.storage)}`}>
                {Math.round(metrics?.storage)}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  metrics?.storage >= 85
                    ? 'bg-error'
                    : metrics?.storage >= 70
                    ? 'bg-warning' :'bg-success'
                }`}
                style={{ width: `${metrics?.storage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div className="text-center">
            <div className="text-xs font-caption text-muted-foreground mb-1">Active Users</div>
            <div className="text-lg font-heading font-semibold text-foreground">
              {metrics?.activeUsers}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-caption text-muted-foreground mb-1">API Calls</div>
            <div className="text-lg font-heading font-semibold text-foreground">
              {metrics?.apiCalls?.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-caption text-muted-foreground">Avg Response Time</span>
            <span className="text-xs font-caption font-medium text-foreground">
              {metrics?.responseTime}ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthMonitor;