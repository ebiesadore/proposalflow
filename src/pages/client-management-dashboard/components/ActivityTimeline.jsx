import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const ActivityTimeline = ({ activities }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'proposal':
        return 'FileText';
      case 'email':
        return 'Mail';
      case 'meeting':
        return 'Calendar';
      case 'call':
        return 'Phone';
      case 'document':
        return 'FolderOpen';
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'proposal':
        return 'bg-primary/10 text-primary';
      case 'email':
        return 'bg-accent/10 text-accent';
      case 'meeting':
        return 'bg-success/10 text-success';
      case 'call':
        return 'bg-warning/10 text-warning';
      case 'document':
        return 'bg-secondary/10 text-secondary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-brand h-full flex flex-col transition-all duration-300">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className={`transition-opacity duration-300 ${
          isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
        }`}>
          <h3 className="text-lg font-heading font-semibold text-foreground whitespace-nowrap">
            Activity Timeline
          </h3>
          <p className="text-sm text-muted-foreground mt-1 whitespace-nowrap">
            Recent client interactions
          </p>
        </div>
        {isCollapsed && (
          <div className="flex-1 flex items-center justify-center">
            <Icon name="Activity" size={24} className="text-muted-foreground" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
          aria-label={isCollapsed ? 'Expand timeline' : 'Collapse timeline'}
        >
          <Icon 
            name={isCollapsed ? 'ChevronLeft' : 'ChevronRight'} 
            size={20} 
            className="text-muted-foreground"
          />
        </button>
      </div>
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {activities?.map((activity, index) => (
              <div key={activity?.id} className="relative">
                {index !== activities?.length - 1 && (
                  <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />
                )}
                <div className="flex gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(
                      activity?.type
                    )}`}
                  >
                    <Icon name={getActivityIcon(activity?.type)} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-caption font-medium text-sm text-foreground">
                        {activity?.title}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {activity?.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {activity?.description}
                    </p>
                    {activity?.user && (
                      <div className="flex items-center gap-2 mt-2">
                        <Icon name="User" size={12} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {activity?.user}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;