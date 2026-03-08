import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';



const ProposalSidebar = ({ collapsed, onToggle, formData, onChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('templates');

  const templates = [
    { id: 1, name: 'Standard Project Proposal', category: 'General', lastUsed: '2 days ago' },
    { id: 2, name: 'Enterprise Solution', category: 'Enterprise', lastUsed: '1 week ago' },
    { id: 3, name: 'Consulting Services', category: 'Services', lastUsed: '3 days ago' },
    { id: 4, name: 'Software Development', category: 'Technology', lastUsed: '5 days ago' }
  ];

  const recentDrafts = [
    { id: 1, title: 'Acme Corp - Q1 Initiative', lastModified: '2 hours ago', progress: 65 },
    { id: 2, title: 'Tech Solutions - Cloud Migration', lastModified: '1 day ago', progress: 40 },
    { id: 3, title: 'Global Industries - Security Audit', lastModified: '3 days ago', progress: 25 }
  ];

  const clients = [
    { id: 1, name: 'Acme Corporation', projects: 12 },
    { id: 2, name: 'Tech Solutions Inc', projects: 8 },
    { id: 3, name: 'Global Industries Ltd', projects: 15 },
    { id: 4, name: 'Innovate Systems', projects: 6 }
  ];

  const filteredTemplates = templates?.filter(t =>
    t?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  const filteredClients = clients?.filter(c =>
    c?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  if (collapsed) {
    return (
      <div className="w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-4">
        <button
          onClick={onToggle}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-smooth"
        >
          <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => { onToggle(); setActiveSection('templates'); }}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-smooth"
          title="Templates"
        >
          <Icon name="FileText" size={20} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => { onToggle(); setActiveSection('drafts'); }}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-smooth"
          title="Recent Drafts"
        >
          <Icon name="Clock" size={20} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => { onToggle(); setActiveSection('clients'); }}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-smooth"
          title="Clients"
        >
          <Icon name="Users" size={20} className="text-muted-foreground" />
        </button>
      </div>
    );
  }

  return null;
};

export default ProposalSidebar;