import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';


const ExportAnalytics = ({ analytics }) => {
  const stats = [
    {
      label: 'Total Generated',
      value: analytics?.totalGenerated,
      icon: 'FileText',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Total Downloads',
      value: analytics?.totalDownloads,
      icon: 'Download',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'Avg. File Size',
      value: analytics?.avgFileSize,
      icon: 'HardDrive',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'Processing Time',
      value: analytics?.avgProcessingTime,
      icon: 'Clock',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Export Analytics
        </h2>
        <Button variant="ghost" size="sm" iconName="RefreshCw">
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {stats?.map((stat) => (
          <div key={stat?.label} className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg ${stat?.bgColor} flex items-center justify-center`}>
                <Icon name={stat?.icon} size={20} className={stat?.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{stat?.label}</p>
                <p className="text-lg md:text-xl font-heading font-semibold text-foreground">
                  {stat?.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Client Presentation</span>
            <span className="font-caption font-medium text-foreground">45%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '45%' }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Internal Review</span>
            <span className="font-caption font-medium text-foreground">30%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-success" style={{ width: '30%' }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Archive Version</span>
            <span className="font-caption font-medium text-foreground">25%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-warning" style={{ width: '25%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportAnalytics;