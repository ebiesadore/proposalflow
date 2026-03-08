import React from 'react';
import Icon from '../AppIcon';

const FieldLockIndicator = ({ locker, inline = false }) => {
  if (!locker) return null;

  if (inline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-warning">
        <Icon name="Lock" size={12} />
        <span>{locker?.user_name} is editing</span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-warning/5 border-2 border-warning rounded-lg pointer-events-none z-10">
      <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-warning text-warning-foreground rounded-md text-xs font-medium shadow-sm">
        <Icon name="Lock" size={12} />
        <span>{locker?.user_name} is editing</span>
      </div>
    </div>
  );
};

export default FieldLockIndicator;