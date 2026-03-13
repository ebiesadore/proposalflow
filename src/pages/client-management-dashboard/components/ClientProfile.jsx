import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { proposalService } from '../../../services/proposalService';
import DocumentsTab from './DocumentsTab';

const ClientProfile = ({ client, onEmailClick, onCreateProposal, onDeleteClick, onEditClick }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  useEffect(() => {
    if (client?.id && activeTab === 'proposals') {
      loadProposals();
    }
  }, [client?.id, activeTab]);

  useEffect(() => {
    if (!client?.id) return;

    const unsubscribe = proposalService?.subscribeToProposalChanges(
      client?.id,
      () => {
        if (activeTab === 'proposals') {
          loadProposals();
        }
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [client?.id, activeTab]);

  const loadProposals = async () => {
    try {
      setLoadingProposals(true);
      const data = await proposalService?.getProposalsByClientId(client?.id);
      setProposals(data || []);
    } catch (error) {
      console.error('Failed to load proposals:', error);
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleProposalClick = (proposalId) => {
    navigate('/new-proposal-creation-workspace', {
      state: { proposalId }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-700 dark:text-blue-400',
          hover: 'hover:bg-blue-100 dark:hover:bg-blue-950/40'
        };
      case 'Approved':
        return {
          bg: 'bg-green-50 dark:bg-green-950/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-400',
          hover: 'hover:bg-green-100 dark:hover:bg-green-950/40'
        };
      case 'Closed':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/20',
          border: 'border-purple-200 dark:border-purple-800',
          text: 'text-purple-700 dark:text-purple-400',
          hover: 'hover:bg-purple-100 dark:hover:bg-purple-950/40'
        };
      case 'Won':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-700 dark:text-amber-400',
          hover: 'hover:bg-amber-100 dark:hover:bg-amber-950/40'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-950/20',
          border: 'border-gray-200 dark:border-gray-800',
          text: 'text-gray-700 dark:text-gray-400',
          hover: 'hover:bg-gray-100 dark:hover:bg-gray-950/40'
        };
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    const numValue = parseFloat(value?.replace(/[^0-9.-]+/g, '') || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(numValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })?.format(date);
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center h-full bg-card rounded-lg border border-border">
        <div className="text-center px-6 py-12">
          <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-caption">
            Select a client to view details
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'Info' },
    { id: 'proposals', label: 'Proposals', icon: 'FileText' },
    { id: 'communications', label: 'Communications', icon: 'MessageSquare' },
    { id: 'documents', label: 'Documents', icon: 'FolderOpen' },
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-brand h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={client?.logo}
              alt={client?.logoAlt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-xl lg:text-2xl font-heading font-semibold text-foreground">
                  {client?.companyName}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {client?.industry}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Mail"
                  iconPosition="left"
                  onClick={onEmailClick}
                >
                  Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Edit"
                  iconPosition="left"
                  onClick={onEditClick}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Trash2"
                  iconPosition="left"
                  onClick={onDeleteClick}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Delete
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Icon name="User" size={16} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{client?.primaryContact}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Mail" size={16} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{client?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Phone" size={16} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{client?.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="MapPin" size={16} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{client?.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="DollarSign" size={16} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{client?.totalValue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Calendar" size={16} className="text-muted-foreground" />
                <span className="text-sm text-foreground">Since {client?.clientSince}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-border overflow-x-auto">
        <div className="flex items-center gap-2 px-6">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`flex items-center gap-2 px-4 py-3 font-caption font-medium text-sm border-b-2 transition-smooth whitespace-nowrap ${
                activeTab === tab?.id
                  ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={tab?.icon} size={16} />
              <span>{tab?.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
                Company Overview
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {client?.description}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
                Proposal Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="font-caption font-medium text-xs text-blue-700 dark:text-blue-400">
                      Draft
                    </span>
                  </div>
                  <p className="text-2xl font-heading font-semibold text-blue-700 dark:text-blue-400">
                    {client?.statusBreakdown?.Draft || 0}
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-caption font-medium text-xs text-green-700 dark:text-green-400">
                      Approved
                    </span>
                  </div>
                  <p className="text-2xl font-heading font-semibold text-green-700 dark:text-green-400">
                    {client?.statusBreakdown?.Approved || 0}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="font-caption font-medium text-xs text-purple-700 dark:text-purple-400">
                      Closed
                    </span>
                  </div>
                  <p className="text-2xl font-heading font-semibold text-purple-700 dark:text-purple-400">
                    {client?.statusBreakdown?.Closed || 0}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="font-caption font-medium text-xs text-amber-700 dark:text-amber-400">
                      Won
                    </span>
                  </div>
                  <p className="text-2xl font-heading font-semibold text-amber-700 dark:text-amber-400">
                    {client?.statusBreakdown?.Won || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="FileText" size={20} className="text-primary" />
                  <span className="font-caption font-medium text-sm text-foreground">
                    Total Proposals
                  </span>
                </div>
                <p className="text-2xl font-heading font-semibold text-foreground">
                  {client?.activeProposals}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="DollarSign" size={20} className="text-success" />
                  <span className="font-caption font-medium text-sm text-foreground">
                    Total Value
                  </span>
                </div>
                <p className="text-2xl font-heading font-semibold text-foreground">
                  {client?.totalValue}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="space-y-4">
            {loadingProposals ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Icon name="Loader" size={32} className="text-primary animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading proposals...</p>
                </div>
              </div>
            ) : proposals?.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Icon name="FileText" size={48} className="text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-caption">No proposals found for this client</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-caption font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Project Number
                      </th>
                      <th className="text-left py-3 px-4 font-caption font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-caption font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Project Type
                      </th>
                      <th className="text-left py-3 px-4 font-caption font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Point of Contact
                      </th>
                      <th className="text-left py-3 px-4 font-caption font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Date Created
                      </th>
                      <th className="text-right py-3 px-4 font-caption font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Value of Proposal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals?.map((proposal) => {
                      const statusColors = getStatusColor(proposal?.status);
                      return (
                        <tr
                          key={proposal?.id}
                          className={`border-b border-border transition-all duration-200 ${
                            statusColors?.hover
                          }`}
                        >
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleProposalClick(proposal?.id)}
                              className="text-sm font-caption font-medium text-primary hover:text-primary/80 hover:underline transition-colors cursor-pointer"
                            >
                              {proposal?.project_number || 'N/A'}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-caption font-medium ${
                                statusColors?.bg
                              } ${statusColors?.border} ${statusColors?.text} border`}
                            >
                              {proposal?.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-foreground">
                              {proposal?.project_type || 'Standard'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-foreground">
                              {proposal?.client?.primary_contact || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(proposal?.created_at)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-caption font-semibold text-foreground">
                              {formatCurrency(proposal?.value)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'communications' && (
          <div className="space-y-4">
            {client?.communications?.map((comm) => (
              <div
                key={comm?.id}
                className="p-4 bg-muted rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={comm?.type === 'email' ? 'Mail' : 'Phone'} size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-caption font-medium text-sm text-foreground">
                        {comm?.subject}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {comm?.date}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {comm?.preview}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'documents' && (
          <DocumentsTab client={client} />
        )}
      </div>
    </div>
  );
};

export default ClientProfile;