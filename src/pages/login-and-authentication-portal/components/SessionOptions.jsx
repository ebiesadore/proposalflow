import React, { useState } from 'react';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const SessionOptions = () => {
  const [sessionDuration, setSessionDuration] = useState('8h');
  const [trustDevice, setTrustDevice] = useState(false);

  const sessionOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '8h', label: '8 Hours (Recommended)' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Clock" size={20} className="text-primary" />
        <h3 className="text-sm md:text-base font-heading font-semibold text-foreground">
          Session Preferences
        </h3>
      </div>
      <div className="space-y-4">
        <Select
          label="Session Duration"
          description="How long should your session remain active?"
          options={sessionOptions}
          value={sessionDuration}
          onChange={setSessionDuration}
        />

        <div className="p-3 md:p-4 bg-muted rounded-lg">
          <Checkbox
            label="Trust this device"
            description="Skip 2FA on this device for 30 days"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e?.target?.checked)}
          />
        </div>

        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <Icon name="Info" size={16} className="text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-warning font-caption">
            For security, sessions on shared computers will automatically expire after 1 hour of inactivity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionOptions;