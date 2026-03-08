import React from 'react';
import Icon from '../../../components/AppIcon';

const ChangeImpactAnalysis = ({ impactData }) => {
  return (
    <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon name="GitBranch" size={20} className="text-accent" />
        </div>
        <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
          Change Impact Analysis
        </h3>
      </div>
      <div className="space-y-6">
        {impactData?.map((change) => (
          <div key={change?.id} className="border-l-4 border-primary pl-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-caption font-semibold text-sm text-foreground mb-1">
                  {change?.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {new Date(change.timestamp)?.toLocaleString('en-US')}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-caption font-medium text-xs whitespace-nowrap ${
                change?.impact === 'high' ?'text-error bg-error/10'
                  : change?.impact === 'medium' ?'text-warning bg-warning/10' :'text-success bg-success/10'
              }`}>
                <Icon name="Zap" size={12} />
                {change?.impact} impact
              </span>
            </div>

            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Target" size={16} className="text-primary" />
                  <span className="font-caption font-medium text-xs text-foreground">
                    Affected Systems
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {change?.affectedSystems?.map((system, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-background rounded text-xs text-foreground"
                    >
                      <Icon name="Box" size={12} className="text-muted-foreground" />
                      {system}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Users" size={16} className="text-primary" />
                  <span className="font-caption font-medium text-xs text-foreground">
                    Affected Users
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {change?.affectedUsers} users impacted
                </p>
              </div>

              {change?.cascadingEffects && change?.cascadingEffects?.length > 0 && (
                <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="AlertTriangle" size={16} className="text-warning" />
                    <span className="font-caption font-medium text-xs text-warning">
                      Cascading Effects
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {change?.cascadingEffects?.map((effect, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs text-foreground">
                        <Icon name="ChevronRight" size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span>{effect}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangeImpactAnalysis;