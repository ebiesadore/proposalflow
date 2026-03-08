import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const BackupRecoveryTab = () => {
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [retentionPeriod, setRetentionPeriod] = useState('30');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const backupHistory = [
    {
      id: 'BKP-2026-001',
      date: '2026-01-27T06:00:00',
      type: 'Automatic',
      size: '2.4 GB',
      status: 'completed',
      duration: '12 minutes',
    },
    {
      id: 'BKP-2026-002',
      date: '2026-01-26T06:00:00',
      type: 'Automatic',
      size: '2.3 GB',
      status: 'completed',
      duration: '11 minutes',
    },
    {
      id: 'BKP-2026-003',
      date: '2026-01-25T14:30:00',
      type: 'Manual',
      size: '2.3 GB',
      status: 'completed',
      duration: '10 minutes',
    },
    {
      id: 'BKP-2026-004',
      date: '2026-01-25T06:00:00',
      type: 'Automatic',
      size: '2.2 GB',
      status: 'completed',
      duration: '11 minutes',
    },
    {
      id: 'BKP-2026-005',
      date: '2026-01-24T06:00:00',
      type: 'Automatic',
      size: '2.2 GB',
      status: 'failed',
      duration: '2 minutes',
    },
  ];

  const frequencyOptions = [
    { value: 'hourly', label: 'Every hour' },
    { value: 'daily', label: 'Daily at 6:00 AM' },
    { value: 'weekly', label: 'Weekly on Sunday' },
    { value: 'monthly', label: 'Monthly on 1st' },
  ];

  const retentionOptions = [
    { value: '7', label: '7 days' },
    { value: '14', label: '14 days' },
    { value: '30', label: '30 days' },
    { value: '60', label: '60 days' },
    { value: '90', label: '90 days' },
  ];

  const storageOptions = [
    { value: 'local', label: 'Local Server Storage' },
    { value: 's3', label: 'Amazon S3' },
    { value: 'azure', label: 'Azure Blob Storage' },
    { value: 'gcp', label: 'Google Cloud Storage' },
  ];

  const handleManualBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      alert('Manual backup completed successfully');
    }, 3000);
  };

  const handleRestore = (backupId) => {
    if (window.confirm(`Are you sure you want to restore backup ${backupId}? This will overwrite current data.`)) {
      alert(`Restoring backup ${backupId}...`);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Backup settings saved successfully');
    }, 1500);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'failed':
        return 'text-error';
      case 'in_progress':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'CheckCircle';
      case 'failed':
        return 'XCircle';
      case 'in_progress':
        return 'Loader';
      default:
        return 'Circle';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-2">
          Backup & Recovery
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Configure automatic backups, retention policies, and disaster recovery options
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
              Backup Configuration
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure automatic backup schedule and retention policies
            </p>
          </div>
          <Button
            variant="default"
            size="default"
            iconName="Database"
            loading={isBackingUp}
            onClick={handleManualBackup}
          >
            Backup Now
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-4">
            <Checkbox
              label="Enable Automatic Backups"
              description="Perform scheduled backups automatically"
              checked={autoBackupEnabled}
              onChange={(e) => setAutoBackupEnabled(e?.target?.checked)}
            />

            {autoBackupEnabled && (
              <>
                <Select
                  label="Backup Frequency"
                  options={frequencyOptions}
                  value={backupFrequency}
                  onChange={setBackupFrequency}
                  required
                />

                <Select
                  label="Retention Period"
                  description="How long to keep backup files"
                  options={retentionOptions}
                  value={retentionPeriod}
                  onChange={setRetentionPeriod}
                  required
                />
              </>
            )}
          </div>

          <div className="space-y-4">
            <Select
              label="Storage Location"
              description="Where to store backup files"
              options={storageOptions}
              placeholder="Select storage"
            />

            <Input
              label="Maximum Backup Size"
              type="number"
              placeholder="10"
              description="GB per backup file"
              min="1"
              max="100"
            />

            <Checkbox
              label="Compress backup files"
              description="Reduce storage space usage"
              checked
            />
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
          Disaster Recovery
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Input
            label="Recovery Time Objective (RTO)"
            type="number"
            placeholder="4"
            description="Maximum acceptable downtime in hours"
            min="1"
            max="72"
          />

          <Input
            label="Recovery Point Objective (RPO)"
            type="number"
            placeholder="1"
            description="Maximum acceptable data loss in hours"
            min="1"
            max="24"
          />

          <div className="md:col-span-2">
            <Checkbox
              label="Enable point-in-time recovery"
              description="Restore data to any point within retention period"
            />
          </div>

          <div className="md:col-span-2">
            <Checkbox
              label="Test recovery procedures monthly"
              description="Automatically verify backup integrity"
            />
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Backup History
          </h3>
          <Button variant="outline" size="sm" iconName="Download">
            Export Log
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-caption font-medium text-sm text-muted-foreground">
                  Backup ID
                </th>
                <th className="text-left py-3 px-4 font-caption font-medium text-sm text-muted-foreground">
                  Date & Time
                </th>
                <th className="text-left py-3 px-4 font-caption font-medium text-sm text-muted-foreground">
                  Type
                </th>
                <th className="text-left py-3 px-4 font-caption font-medium text-sm text-muted-foreground">
                  Size
                </th>
                <th className="text-left py-3 px-4 font-caption font-medium text-sm text-muted-foreground">
                  Duration
                </th>
                <th className="text-left py-3 px-4 font-caption font-medium text-sm text-muted-foreground">
                  Status
                </th>
                <th className="text-right py-3 px-4 font-caption font-medium text-sm text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {backupHistory?.map((backup) => (
                <tr key={backup?.id} className="border-b border-border hover:bg-muted transition-smooth">
                  <td className="py-3 px-4">
                    <span className="font-caption font-medium text-sm text-foreground">
                      {backup?.id}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{formatDate(backup?.date)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{backup?.type}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{backup?.size}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{backup?.duration}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Icon
                        name={getStatusIcon(backup?.status)}
                        size={16}
                        className={getStatusColor(backup?.status)}
                      />
                      <span className={`text-sm font-caption font-medium capitalize ${getStatusColor(backup?.status)}`}>
                        {backup?.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {backup?.status === 'completed' && (
                        <>
                          <button
                            onClick={() => handleRestore(backup?.id)}
                            className="p-2 hover:bg-muted rounded-lg transition-smooth"
                            title="Restore backup"
                          >
                            <Icon name="RotateCcw" size={16} className="text-primary" />
                          </button>
                          <button
                            className="p-2 hover:bg-muted rounded-lg transition-smooth"
                            title="Download backup"
                          >
                            <Icon name="Download" size={16} className="text-foreground" />
                          </button>
                        </>
                      )}
                      <button
                        className="p-2 hover:bg-muted rounded-lg transition-smooth"
                        title="Delete backup"
                      >
                        <Icon name="Trash2" size={16} className="text-error" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-4">
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
  );
};

export default BackupRecoveryTab;