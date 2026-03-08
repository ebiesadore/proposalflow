import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReviewSettingsTab = ({ formData, onChange }) => {
  const validationChecks = [
    {
      id: 'basic-info',
      category: 'Basic Information',
      checks: [
        { field: 'proposalTitle', label: 'Proposal Title', status: formData?.proposalTitle ? 'complete' : 'missing' },
        { field: 'clientId', label: 'Client Selection', status: formData?.clientId ? 'complete' : 'missing' },
        { field: 'deadline', label: 'Deadline', status: formData?.deadline ? 'complete' : 'missing' },
        { field: 'projectCategory', label: 'Project Category', status: formData?.projectCategory ? 'complete' : 'missing' },
        { field: 'assignedTeam', label: 'Team Members', status: formData?.assignedTeam?.length > 0 ? 'complete' : 'warning' }
      ]
    },
    {
      id: 'content',
      category: 'Content',
      checks: [
        { field: 'content', label: 'Proposal Content', status: formData?.content ? 'complete' : 'missing' },
        { field: 'sections', label: 'Content Sections', status: formData?.sections?.length > 0 ? 'complete' : 'warning' }
      ]
    },
    {
      id: 'pricing',
      category: 'Pricing & Terms',
      checks: [
        { field: 'lineItems', label: 'Line Items', status: formData?.lineItems?.length > 0 ? 'complete' : 'missing' },
        { field: 'totalAmount', label: 'Total Amount', status: formData?.totalAmount > 0 ? 'complete' : 'missing' },
        { field: 'approvalWorkflow', label: 'Approval Workflow', status: formData?.approvalWorkflow ? 'complete' : 'warning' }
      ]
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return { icon: 'CheckCircle', color: 'text-green-500' };
      case 'warning':
        return { icon: 'AlertCircle', color: 'text-yellow-500' };
      case 'missing':
        return { icon: 'XCircle', color: 'text-red-500' };
      default:
        return { icon: 'Circle', color: 'text-muted-foreground' };
    }
  };

  const allChecks = validationChecks?.flatMap(cat => cat?.checks);
  const completeCount = allChecks?.filter(c => c?.status === 'complete')?.length;
  const missingCount = allChecks?.filter(c => c?.status === 'missing')?.length;
  const warningCount = allChecks?.filter(c => c?.status === 'warning')?.length;
  const completionPercentage = Math.round((completeCount / allChecks?.length) * 100);
  const isReadyToSubmit = missingCount === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-heading font-semibold text-foreground">Review & Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review your proposal and check for any missing information
        </p>
      </div>
      {/* Submission Readiness */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground">Submission Readiness</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isReadyToSubmit 
                ? 'Your proposal is ready to submit!' 
                : `${missingCount} required field(s) missing`
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{completionPercentage}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-smooth"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Icon name="CheckCircle" size={16} className="text-green-500" />
              <span className="text-sm font-medium text-foreground">Complete</span>
            </div>
            <div className="text-2xl font-bold text-green-500 mt-1">{completeCount}</div>
          </div>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Icon name="AlertCircle" size={16} className="text-yellow-500" />
              <span className="text-sm font-medium text-foreground">Optional</span>
            </div>
            <div className="text-2xl font-bold text-yellow-500 mt-1">{warningCount}</div>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Icon name="XCircle" size={16} className="text-red-500" />
              <span className="text-sm font-medium text-foreground">Missing</span>
            </div>
            <div className="text-2xl font-bold text-red-500 mt-1">{missingCount}</div>
          </div>
        </div>
      </div>
      {/* Validation Checks */}
      {validationChecks?.map((category) => (
        <div key={category?.id} className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h3 className="text-lg font-heading font-semibold text-foreground">{category?.category}</h3>
          </div>
          <div className="p-6 space-y-3">
            {category?.checks?.map((check) => {
              const statusInfo = getStatusIcon(check?.status);
              return (
                <div
                  key={check?.field}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-smooth"
                >
                  <div className="flex items-center gap-3">
                    <Icon name={statusInfo?.icon} size={20} className={statusInfo?.color} />
                    <span className="text-sm font-medium text-foreground">{check?.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {check?.status === 'complete' && (
                      <span className="text-xs text-green-600 font-medium">Complete</span>
                    )}
                    {check?.status === 'warning' && (
                      <span className="text-xs text-yellow-600 font-medium">Optional</span>
                    )}
                    {check?.status === 'missing' && (
                      <Button variant="outline" size="sm">
                        Add Now
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {/* Additional Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Additional Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-foreground">Enable Notifications</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Receive updates when proposal status changes
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-foreground">Auto-save Drafts</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Automatically save changes every 2 minutes
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-foreground">Collaborative Editing</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Allow team members to edit simultaneously
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex items-center justify-between p-6 bg-card border border-border rounded-lg">
        <Button variant="outline" iconName="Save" iconPosition="left" iconSize={16}>
          Save as Draft
        </Button>
        <Button
          variant="default"
          disabled={!isReadyToSubmit}
          iconName="Send"
          iconPosition="left"
          iconSize={16}
        >
          {isReadyToSubmit ? 'Submit Proposal' : 'Complete Required Fields'}
        </Button>
      </div>
    </div>
  );
};

export default ReviewSettingsTab;