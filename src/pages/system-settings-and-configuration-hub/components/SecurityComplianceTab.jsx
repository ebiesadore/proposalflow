import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const SecurityComplianceTab = () => {
  const [passwordMinLength, setPasswordMinLength] = useState('12');
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [require2FA, setRequire2FA] = useState(true);
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [requireSpecialChars, setRequireSpecialChars] = useState(true);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [lockoutDuration, setLockoutDuration] = useState('15');
  const [apiAccessEnabled, setApiAccessEnabled] = useState(true);
  const [ipWhitelisting, setIpWhitelisting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const complianceStandards = [
    { name: 'SOX Compliance', status: 'active', icon: 'Shield', color: 'text-success' },
    { name: 'GDPR Compliance', status: 'active', icon: 'Lock', color: 'text-success' },
    { name: 'ISO 27001', status: 'pending', icon: 'AlertTriangle', color: 'text-warning' },
    { name: 'HIPAA', status: 'inactive', icon: 'XCircle', color: 'text-muted-foreground' },
  ];

  const sessionTimeoutOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '120', label: '2 hours' },
    { value: '240', label: '4 hours' },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Security settings saved successfully');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-2">
          Security & Compliance
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage password policies, authentication settings, and compliance standards
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
              Password Policy
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure password requirements and complexity rules
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Shield" size={20} className="text-success" />
            <span className="text-sm font-caption font-medium text-success">Strong</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Input
            label="Minimum Password Length"
            type="number"
            value={passwordMinLength}
            onChange={(e) => setPasswordMinLength(e?.target?.value)}
            min="8"
            max="32"
            required
          />

          <Input
            label="Password Expiration"
            type="number"
            placeholder="90"
            description="Days until password must be changed"
            min="30"
            max="365"
          />

          <div className="md:col-span-2 space-y-3">
            <Checkbox
              label="Require uppercase letters"
              checked={requireUppercase}
              onChange={(e) => setRequireUppercase(e?.target?.checked)}
            />
            <Checkbox
              label="Require numbers"
              checked={requireNumbers}
              onChange={(e) => setRequireNumbers(e?.target?.checked)}
            />
            <Checkbox
              label="Require special characters"
              checked={requireSpecialChars}
              onChange={(e) => setRequireSpecialChars(e?.target?.checked)}
            />
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
          Authentication & Access Control
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Select
            label="Session Timeout"
            description="Automatic logout after inactivity"
            options={sessionTimeoutOptions}
            value={sessionTimeout}
            onChange={setSessionTimeout}
            required
          />

          <Input
            label="Maximum Login Attempts"
            type="number"
            value={maxLoginAttempts}
            onChange={(e) => setMaxLoginAttempts(e?.target?.value)}
            min="3"
            max="10"
            required
          />

          <Input
            label="Account Lockout Duration"
            type="number"
            value={lockoutDuration}
            onChange={(e) => setLockoutDuration(e?.target?.value)}
            description="Minutes until account is unlocked"
            min="5"
            max="60"
            required
          />

          <div className="flex flex-col gap-3">
            <Checkbox
              label="Require Two-Factor Authentication (2FA)"
              description="Mandatory for all users"
              checked={require2FA}
              onChange={(e) => setRequire2FA(e?.target?.checked)}
            />
            <Checkbox
              label="Enable Single Sign-On (SSO)"
              description="LDAP/Active Directory integration"
            />
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            API Security
          </h3>
          <Button
            variant="ghost"
            size="sm"
            iconName={showAdvanced ? 'ChevronUp' : 'ChevronDown'}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            Advanced
          </Button>
        </div>

        <div className="space-y-4">
          <Checkbox
            label="Enable API Access"
            description="Allow external systems to integrate via API"
            checked={apiAccessEnabled}
            onChange={(e) => setApiAccessEnabled(e?.target?.checked)}
          />

          {apiAccessEnabled && (
            <>
              <Checkbox
                label="Require API Key Authentication"
                checked
              />
              <Checkbox
                label="Enable IP Whitelisting"
                description="Restrict API access to specific IP addresses"
                checked={ipWhitelisting}
                onChange={(e) => setIpWhitelisting(e?.target?.checked)}
              />

              {showAdvanced && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                  <Input
                    label="API Rate Limit"
                    type="number"
                    placeholder="1000"
                    description="Requests per hour per API key"
                  />
                  <Input
                    label="API Key Expiration"
                    type="number"
                    placeholder="365"
                    description="Days until API keys expire"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
          Compliance Standards
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complianceStandards?.map((standard) => (
            <div
              key={standard?.name}
              className="flex items-center justify-between p-4 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Icon name={standard?.icon} size={20} className={standard?.color} />
                <div>
                  <div className="font-caption font-medium text-sm text-foreground">
                    {standard?.name}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {standard?.status}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" iconName="Settings">
                Configure
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="Info" size={16} />
          <span>Changes require administrator approval</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="default">
            Reset to Defaults
          </Button>
          <Button
            variant="default"
            size="default"
            iconName="Save"
            loading={isSaving}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SecurityComplianceTab;