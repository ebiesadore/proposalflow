import React from 'react';
import Icon from '../../../components/AppIcon';

const ComplianceDashboard = ({ complianceData }) => {
  const getComplianceColor = (percentage) => {
    if (percentage >= 95) return 'text-success bg-success/10';
    if (percentage >= 80) return 'text-warning bg-warning/10';
    return 'text-error bg-error/10';
  };

  const getComplianceIcon = (percentage) => {
    if (percentage >= 95) return 'CheckCircle';
    if (percentage >= 80) return 'AlertTriangle';
    return 'XCircle';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {complianceData?.map((item) => (
        <div
          key={item?.id}
          className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6 transition-smooth hover:shadow-brand-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name={item?.icon} size={24} className="text-primary" />
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-caption font-medium text-xs ${getComplianceColor(item?.compliance)}`}>
              <Icon name={getComplianceIcon(item?.compliance)} size={12} />
              {item?.compliance}%
            </span>
          </div>

          <h4 className="font-heading font-semibold text-base text-foreground mb-2">
            {item?.title}
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Compliance Score</span>
                <span className="font-caption font-semibold text-sm text-foreground">
                  {item?.compliance}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-smooth ${
                    item?.compliance >= 95
                      ? 'bg-success'
                      : item?.compliance >= 80
                      ? 'bg-warning' :'bg-error'
                  }`}
                  style={{ width: `${item?.compliance}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Violations</span>
                <span className="font-caption font-semibold text-sm text-error">
                  {item?.violations}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Last Audit</span>
                <span className="font-caption text-xs text-foreground">
                  {new Date(item.lastAudit)?.toLocaleDateString('en-US')}
                </span>
              </div>
            </div>
          </div>

          {item?.violations > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-error/10 text-error rounded-lg font-caption font-medium text-sm transition-smooth hover:bg-error/20">
                <Icon name="AlertCircle" size={16} />
                View Violations
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ComplianceDashboard;