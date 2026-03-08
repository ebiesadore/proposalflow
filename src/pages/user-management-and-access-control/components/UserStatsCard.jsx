import React from 'react';
import Icon from '../../../components/AppIcon';

const UserStatsCard = ({ icon, label, value, trend, trendValue, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    accent: 'bg-accent/10 text-accent',
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6 transition-smooth hover:shadow-brand-lg">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center ${colorClasses?.[color]}`}>
          <Icon name={icon} size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-caption font-medium ${
            trend === 'up' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
          }`}>
            <Icon name={trend === 'up' ? 'TrendingUp' : 'TrendingDown'} size={14} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-1">
          {value}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground font-caption">
          {label}
        </p>
      </div>
    </div>
  );
};

export default UserStatsCard;