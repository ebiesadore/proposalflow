import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const NotificationsTab = () => {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const notificationTypes = [
    {
      category: 'Proposal Events',
      items: [
        { id: 'proposal_created', label: 'New proposal created', email: true, inApp: true },
        { id: 'proposal_submitted', label: 'Proposal submitted for review', email: true, inApp: true },
        { id: 'proposal_approved', label: 'Proposal approved', email: true, inApp: true },
        { id: 'proposal_rejected', label: 'Proposal rejected', email: true, inApp: true },
        { id: 'proposal_expiring', label: 'Proposal expiring soon', email: true, inApp: false },
      ],
    },
    {
      category: 'Client Activity',
      items: [
        { id: 'client_added', label: 'New client added', email: false, inApp: true },
        { id: 'client_message', label: 'Client message received', email: true, inApp: true },
        { id: 'client_document', label: 'Client uploaded document', email: true, inApp: true },
      ],
    },
    {
      category: 'System Alerts',
      items: [
        { id: 'system_maintenance', label: 'Scheduled maintenance', email: true, inApp: true },
        { id: 'security_alert', label: 'Security alerts', email: true, inApp: true },
        { id: 'backup_complete', label: 'Backup completed', email: false, inApp: true },
        { id: 'integration_error', label: 'Integration errors', email: true, inApp: true },
      ],
    },
  ];

  const emailTemplates = [
    { value: 'proposal_created', label: 'Proposal Created' },
    { value: 'proposal_approved', label: 'Proposal Approved' },
    { value: 'client_message', label: 'Client Message' },
    { value: 'system_alert', label: 'System Alert' },
  ];

  const escalationOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '120', label: '2 hours' },
    { value: '240', label: '4 hours' },
  ];

  const handleTestNotification = () => {
    if (!testEmail) {
      alert('Please enter an email address');
      return;
    }
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      alert(`Test notification sent to ${testEmail}`);
    }, 2000);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Notification settings saved successfully');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-2">
          Notifications
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Configure notification channels, preferences, and delivery settings
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
          Notification Channels
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="Mail" size={20} className="text-primary" />
                <span className="font-caption font-medium text-sm text-foreground">Email</span>
              </div>
              <Checkbox
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e?.target?.checked)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Send notifications via email to users
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="MessageSquare" size={20} className="text-primary" />
                <span className="font-caption font-medium text-sm text-foreground">SMS</span>
              </div>
              <Checkbox
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e?.target?.checked)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Send urgent alerts via text message
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="Bell" size={20} className="text-primary" />
                <span className="font-caption font-medium text-sm text-foreground">In-App</span>
              </div>
              <Checkbox
                checked={inAppEnabled}
                onChange={(e) => setInAppEnabled(e?.target?.checked)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Display notifications within the application
            </p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
          Notification Preferences
        </h3>

        <div className="space-y-6">
          {notificationTypes?.map((category) => (
            <div key={category?.category}>
              <h4 className="text-base font-heading font-semibold text-foreground mb-4">
                {category?.category}
              </h4>
              <div className="space-y-3">
                {category?.items?.map((item) => (
                  <div
                    key={item?.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted rounded-lg gap-3"
                  >
                    <span className="font-caption text-sm text-foreground">{item?.label}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Icon name="Mail" size={16} className="text-muted-foreground" />
                        <Checkbox checked={item?.email} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Bell" size={16} className="text-muted-foreground" />
                        <Checkbox checked={item?.inApp} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
          Email Templates
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Select
            label="Template to Edit"
            options={emailTemplates}
            placeholder="Select a template"
            searchable
          />

          <div className="flex items-end">
            <Button variant="outline" size="default" iconName="Edit" fullWidth>
              Edit Template
            </Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-primary mt-0.5" />
            <div>
              <p className="text-sm font-caption font-medium text-foreground mb-1">
                Template Variables
              </p>
              <p className="text-xs text-muted-foreground">
                Use {'{'}user_name{'}'}, {'{'}proposal_id{'}'}, {'{'}client_name{'}'}, {'{'}date{'}'} in your templates
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
          Escalation Workflow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Select
            label="Escalation Delay"
            description="Time before escalating unread notifications"
            options={escalationOptions}
            placeholder="Select delay"
          />

          <Input
            label="Escalation Recipients"
            type="email"
            placeholder="admin@nexsyscore.com"
            description="Email addresses for escalated notifications"
          />
        </div>

        <div className="mt-4">
          <Checkbox
            label="Enable automatic escalation for critical alerts"
            description="Immediately notify administrators of security and system issues"
          />
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-6">
          Test Notifications
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e?.target?.value)}
              placeholder="Enter email address"
            />
          </div>
          <Button
            variant="outline"
            size="default"
            iconName="Send"
            loading={isTesting}
            onClick={handleTestNotification}
          >
            Send Test
          </Button>
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

export default NotificationsTab;