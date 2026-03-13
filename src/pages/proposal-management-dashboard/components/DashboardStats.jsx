import React from 'react';
import Icon from '../../../components/AppIcon';
import { formatNumber } from '../../../utils/cn';

const DashboardStats = ({ stats }) => {
  const statCards = [
    {
      label: 'Total Proposals',
      value: stats?.total,
      icon: 'FileText',
      color: 'bg-primary/10 text-primary'
    },
    {
      label: 'Active',
      value: stats?.active,
      icon: 'Activity',
      color: 'bg-success/10 text-success',
      isStatusBreakdown: true,
      statusBreakdown: [
        { label: 'Draft', count: stats?.draft || 0, color: 'text-gray-600' },
        { label: 'Approved', count: stats?.approved || 0, color: 'text-orange-600' },
        { label: 'Closed', count: stats?.closed || 0, color: 'text-red-600' },
        { label: 'Won', count: stats?.won || 0, color: 'text-green-600' }
      ]
    },
    {
      label: 'Total Value',
      value: `$${formatNumber(stats?.totalValue / 1000000, 1)}M`,
      icon: 'DollarSign',
      color: 'bg-accent/10 text-accent'
    },
    {
      label: 'Total Area',
      value: `${(stats?.totalArea)?.toFixed(1)}M²`,
      icon: 'Truck',
      color: 'bg-success/10 text-success'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statCards?.map((stat, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-lg p-4 shadow-brand hover:shadow-brand-lg transition-smooth relative"
        >
          {/* Horizontal layout: Icon on left, content on right */}
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 ${stat?.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Icon name={stat?.icon} size={24} />
            </div>
            
            {/* Numbers and text on right */}
            <div className="flex-1">
              {stat?.isStatusBreakdown ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {stat?.statusBreakdown?.map((status, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className={`text-2xl font-heading font-bold ${status?.color} leading-none`}>
                          {status?.count}
                        </span>
                        <span className={`text-xs font-caption font-bold ${status?.color}`}>
                          {status?.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-2xl md:text-3xl font-heading font-bold text-foreground leading-none mb-1">
                    {stat?.value}
                  </p>
                  <p className="text-xs text-muted-foreground font-caption">
                    {stat?.label}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;