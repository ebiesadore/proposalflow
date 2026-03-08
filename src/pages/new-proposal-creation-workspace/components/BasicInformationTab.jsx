import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { clientService } from '../../../services/clientService';

const BasicInformationTab = ({ formData, onChange }) => {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientError, setClientError] = useState(null);

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        setClientError(null);
        const fetchedClients = await clientService?.getAllClients();
        setClients(fetchedClients || []);
      } catch (error) {
        console.error('Failed to load clients:', error);
        setClientError('Failed to load clients. Please try again.');
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  const categories = [
    'Software Development',
    'Consulting Services',
    'Enterprise Solutions',
    'Cloud Infrastructure',
    'Cybersecurity',
    'Data Analytics',
    'Business Process Automation'
  ];

  const teamMembers = [
    { id: 1, name: 'Sarah Johnson', role: 'Project Manager', avatar: 'SJ' },
    { id: 2, name: 'Michael Chen', role: 'Technical Lead', avatar: 'MC' },
    { id: 3, name: 'Emily Rodriguez', role: 'Business Analyst', avatar: 'ER' },
    { id: 4, name: 'David Kim', role: 'Solutions Architect', avatar: 'DK' }
  ];

  const toggleTeamMember = (memberId) => {
    const currentTeam = formData?.assignedTeam || [];
    const isSelected = currentTeam?.includes(memberId);
    
    if (isSelected) {
      onChange('assignedTeam', currentTeam?.filter(id => id !== memberId));
    } else {
      onChange('assignedTeam', [...currentTeam, memberId]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-heading font-semibold text-foreground">Basic Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Provide essential details about your proposal
        </p>
      </div>
      {/* Proposal Title */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Proposal Title <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="Enter a descriptive title for your proposal"
            value={formData?.proposalTitle || ''}
            onChange={(e) => onChange('proposalTitle', e?.target?.value)}
            className="w-full"
          />
        </div>

        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Client <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center gap-2">
            <Select
              value={formData?.clientId || ''}
              onChange={(e) => onChange('clientId', e?.target?.value)}
              className="flex-1"
              disabled={loadingClients}
            >
              <option value="">
                {loadingClients ? 'Loading clients...' : 'Select a client'}
              </option>
              {clients?.map((client) => (
                <option key={client?.id} value={client?.id}>
                  {client?.company_name}
                </option>
              ))}
            </Select>
            <Button variant="outline" iconName="Plus" iconSize={16}>
              New Client
            </Button>
          </div>
          {clientError && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
              <Icon name="AlertCircle" size={16} className="text-destructive" />
              <span className="text-sm text-destructive">{clientError}</span>
            </div>
          )}
          {formData?.clientId && (
            <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2">
              <Icon name="Check" size={16} className="text-primary" />
              <span className="text-sm text-foreground">Selected: {clients?.find(c => c?.id === formData?.clientId)?.company_name || formData?.clientId}</span>
            </div>
          )}
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Deadline <span className="text-destructive">*</span>
          </label>
          <Input
            type="date"
            value={formData?.deadline || ''}
            onChange={(e) => onChange('deadline', e?.target?.value)}
            leftIcon="Calendar"
            className="w-full"
          />
        </div>

        {/* Project Category */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Project Category <span className="text-destructive">*</span>
          </label>
          <Select
            value={formData?.projectCategory || ''}
            onChange={(e) => onChange('projectCategory', e?.target?.value)}
            className="w-full"
          >
            <option value="">Select a category</option>
            {categories?.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {/* Assigned Team Members */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-heading font-semibold text-foreground">Assigned Team Members</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select team members who will work on this proposal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {teamMembers?.map((member) => {
            const isSelected = formData?.assignedTeam?.includes(member?.id);
            return (
              <button
                key={member?.id}
                onClick={() => toggleTeamMember(member?.id)}
                className={`p-4 rounded-lg border transition-smooth text-left ${
                  isSelected
                    ? 'border-primary bg-primary/10' :'border-border hover:border-primary hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                    {member?.avatar}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-foreground">{member?.name}</h4>
                    <p className="text-xs text-muted-foreground">{member?.role}</p>
                  </div>
                  {isSelected && (
                    <Icon name="CheckCircle" size={20} className="text-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {formData?.assignedTeam?.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Icon name="Users" size={16} className="text-muted-foreground" />
              <span>{formData?.assignedTeam?.length} team member(s) assigned</span>
            </div>
          </div>
        )}
      </div>
      {/* Additional Notes */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-heading font-semibold text-foreground">Additional Notes</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add any relevant notes or context for this proposal
          </p>
        </div>
        <textarea
          placeholder="Enter additional notes, requirements, or context..."
          value={formData?.additionalNotes || ''}
          onChange={(e) => onChange('additionalNotes', e?.target?.value)}
          rows={4}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth resize-none"
        />
      </div>
    </div>
  );
};

export default BasicInformationTab;