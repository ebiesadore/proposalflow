import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const ChangeNotification = ({ changes }) => {
  const [visible, setVisible] = useState(false);
  const [currentChange, setCurrentChange] = useState(null);

  useEffect(() => {
    if (changes?.length > 0) {
      const latestChange = changes?.[0];
      setCurrentChange(latestChange);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [changes]);

  if (!visible || !currentChange) return null;

  const formatFieldName = (field) => {
    return field?.replace(/([A-Z])/g, ' $1')?.replace(/^./, str => str?.toUpperCase())?.trim();
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'empty';
    if (typeof value === 'object') return JSON?.stringify(value)?.slice(0, 50) + '...';
    if (typeof value === 'string' && value?.length > 50) return value?.slice(0, 50) + '...';
    return String(value);
  };

  return (
    <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-5 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon name="Bell" size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-medium text-foreground">
                {currentChange?.user_name} made a change
              </p>
              <button
                onClick={() => setVisible(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Updated <span className="font-medium">{formatFieldName(currentChange?.field)}</span>
            </p>
            {currentChange?.old_value !== undefined && (
              <div className="text-xs space-y-1">
                <div className="flex items-start gap-1.5">
                  <Icon name="Minus" size={12} className="text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground line-through break-all">
                    {formatValue(currentChange?.old_value)}
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Icon name="Plus" size={12} className="text-success mt-0.5 flex-shrink-0" />
                  <span className="text-foreground font-medium break-all">
                    {formatValue(currentChange?.new_value)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeNotification;