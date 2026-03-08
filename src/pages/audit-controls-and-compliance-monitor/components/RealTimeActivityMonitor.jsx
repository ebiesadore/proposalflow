import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const RealTimeActivityMonitor = ({ activities }) => {
  const [liveActivities, setLiveActivities] = useState(activities);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setLiveActivities((prev) => {
          const newActivity = {
            id: Date.now(),
            user: 'System User',
            action: 'Automated backup completed',
            timestamp: new Date()?.toISOString(),
            status: 'success'
          };
          return [newActivity, ...prev]?.slice(0, 10);
        });
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isLive]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-success bg-success/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      case 'error':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return 'CheckCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'error':
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffSeconds = Math.floor((now - time) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return time?.toLocaleDateString('en-US');
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-brand">
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon name="Activity" size={20} className="text-primary" />
            {isLive && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
            )}
          </div>
          <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
            Real-Time Activity
          </h3>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-caption font-medium text-xs transition-smooth ${
            isLive
              ? 'bg-success/10 text-success' :'bg-muted text-muted-foreground'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-success' : 'bg-muted-foreground'}`} />
          {isLive ? 'Live' : 'Paused'}
        </button>
      </div>
      <div className="p-4 md:p-6">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {liveActivities?.map((activity) => (
            <div
              key={activity?.id}
              className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg transition-smooth hover:bg-muted"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(activity?.status)}`}>
                <Icon name={getStatusIcon(activity?.status)} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-caption font-medium text-sm text-foreground">
                    {activity?.user}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(activity?.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity?.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealTimeActivityMonitor;