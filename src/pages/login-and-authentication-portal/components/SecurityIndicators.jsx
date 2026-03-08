import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityIndicators = () => {
  const securityFeatures = [
    {
      icon: 'Lock',
      label: 'SSL Encrypted',
      description: '256-bit encryption',
      status: 'active'
    },
    {
      icon: 'Shield',
      label: 'SOX Compliant',
      description: 'Financial data protection',
      status: 'active'
    },
    {
      icon: 'FileCheck',
      label: 'GDPR Ready',
      description: 'Data privacy standards',
      status: 'active'
    },
    {
      icon: 'CheckCircle',
      label: 'ISO 27001',
      description: 'Information security',
      status: 'active'
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="ShieldCheck" size={20} className="text-success" />
        <h3 className="text-sm md:text-base font-heading font-semibold text-foreground">
          Security & Compliance
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {securityFeatures?.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-muted rounded-lg transition-smooth hover:bg-muted/80"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name={feature?.icon} size={16} className="text-success md:w-5 md:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs md:text-sm font-caption font-semibold text-foreground">
                  {feature?.label}
                </h4>
                <Icon name="CheckCircle" size={14} className="text-success flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {feature?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-caption">Last security audit:</span>
          <span className="font-caption font-medium">01/15/2026</span>
        </div>
      </div>
    </div>
  );
};

export default SecurityIndicators;