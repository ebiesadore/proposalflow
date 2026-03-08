import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';


const QuickActionsPanel = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: 'FilePlus',
      label: 'New Proposal',
      description: 'Create from template',
      color: 'bg-primary text-primary-foreground',
      onClick: () => navigate('/proposal-template-management-studio')
    },
    {
      icon: 'Mail',
      label: 'Email Client',
      description: 'Send communication',
      color: 'bg-accent text-accent-foreground',
      onClick: () => navigate('/integrated-email-communication-center')
    },
    {
      icon: 'Download',
      label: 'Export PDF',
      description: 'Generate documents',
      color: 'bg-secondary text-secondary-foreground',
      onClick: () => navigate('/pdf-generation-and-document-export-hub')
    },
    {
      icon: 'Users',
      label: 'View Clients',
      description: 'Manage relationships',
      color: 'bg-success text-success-foreground',
      onClick: () => navigate('/client-management-dashboard')
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {quickActions?.map((action, index) => (
        <button
          key={index}
          onClick={action?.onClick}
          className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-brand-lg transition-smooth text-left group"
        >
          <div className={`w-12 h-12 md:w-14 md:h-14 ${action?.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
            <Icon name={action?.icon} size={24} color="currentColor" />
          </div>
          <h4 className="text-base md:text-lg font-heading font-semibold text-foreground mb-1">
            {action?.label}
          </h4>
          <p className="text-sm text-muted-foreground font-caption">
            {action?.description}
          </p>
        </button>
      ))}
    </div>
  );
};

export default QuickActionsPanel;