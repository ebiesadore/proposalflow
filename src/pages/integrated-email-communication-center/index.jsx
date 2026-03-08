import React, { useState } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumb from '../../components/ui/Breadcrumb';
import RoleBasedAccess from '../../components/ui/RoleBasedAccess';
import IntegrationStatus from '../../components/ui/IntegrationStatus';
import Icon from '../../components/AppIcon';
import EmailSidebar from './components/EmailSidebar';
import EmailInbox from './components/EmailInbox';
import EmailReader from './components/EmailReader';
import EmailComposer from './components/EmailComposer';
import EmailFilters from './components/EmailFilters';

const IntegratedEmailCommunicationCenter = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardEmail, setForwardEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const folders = [
  { id: 'all', label: 'All Mail', count: 0 },
  { id: 'inbox', label: 'Inbox', count: 12 },
  { id: 'sent', label: 'Sent', count: 45 },
  { id: 'drafts', label: 'Drafts', count: 3 },
  { id: 'archive', label: 'Archive', count: 128 },
  { id: 'trash', label: 'Trash', count: 8 }];


  const clients = [
  { id: 'c1', name: 'Acme Corporation' },
  { id: 'c2', name: 'TechStart Solutions' },
  { id: 'c3', name: 'Global Industries' },
  { id: 'c4', name: 'Innovation Labs' }];


  const emailTemplates = [
  {
    id: 't1',
    name: 'Proposal Follow-up',
    subject: 'Following up on your proposal request',
    body: `Dear [Client Name],\n\nI hope this message finds you well. I wanted to follow up on the proposal we submitted on [Date].\n\nWe're excited about the opportunity to work with [Company Name] and would be happy to discuss any questions you may have.\n\nPlease let me know if you need any additional information.\n\nBest regards,\n[Your Name]`
  },
  {
    id: 't2', name: 'Meeting Request', subject: 'Meeting Request - Proposal Discussion',
    body: `Dear [Client Name],\n\nThank you for your interest in our proposal. I would like to schedule a meeting to discuss the details and answer any questions you may have.\n\nWould you be available for a call next week? Please let me know your preferred time.\n\nLooking forward to speaking with you.\n\nBest regards,\n[Your Name]`
  },
  {
    id: 't3', name: 'Status Update', subject: 'Proposal Status Update',
    body: `Dear [Client Name],\n\nI wanted to provide you with an update on your proposal status.\n\n[Status Details]\n\nIf you have any questions or need clarification, please don't hesitate to reach out.\n\nBest regards,\n[Your Name]`
  }];


  const mockEmails = [
  {
    id: 1,
    sender: 'Sarah Johnson',
    senderEmail: 'sarah.johnson@acmecorp.com',
    senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_14da91c34-1763294780479.png",
    senderAvatarAlt: 'Professional headshot of woman with shoulder-length brown hair in navy blazer smiling at camera',
    recipient: 'proposals@nexsyscore.com',
    subject: 'Re: Enterprise Software Proposal - Q1 2026',
    preview: 'Thank you for the detailed proposal. We have reviewed it with our team and would like to schedule a meeting to discuss the implementation timeline...',
    body: `Thank you for the detailed proposal. We have reviewed it with our team and would like to schedule a meeting to discuss the implementation timeline and pricing structure.\n\nOur technical team has some questions regarding the integration capabilities with our existing CRM system. Could you provide more details on this aspect?\n\nWe're particularly interested in the custom reporting features mentioned in section 3.2 of your proposal.\n\nLooking forward to your response.`,
    date: '2026-01-27T10:30:00', status: 'unread', priority: 'high', folder: 'inbox', proposalRef: 'PROP-2026-001',
    hasAttachment: false,
    tags: ['urgent', 'follow-up'],
    clientInfo: {
      company: 'Acme Corporation', industry: 'Technology', lastContact: '01/25/2026', status: 'Active'
    }
  },
  {
    id: 2,
    sender: 'Michael Chen', senderEmail: 'mchen@techstart.io', senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1bd15b436-1763300581767.png", senderAvatarAlt: 'Professional headshot of Asian man with short black hair wearing gray suit and glasses', recipient: 'proposals@nexsyscore.com', subject: 'Cloud Migration Proposal - Additional Questions', preview: 'Hi team, we received your cloud migration proposal and have a few questions about the security protocols and data backup procedures...',
    body: `Hi team,\n\nWe received your cloud migration proposal and have a few questions about the security protocols and data backup procedures.\n\n1. What encryption standards do you use for data at rest and in transit?\n2. How frequently are backups performed?\n3. What is your disaster recovery plan?\n\nWe need these answers before we can proceed with the approval process.\n\nThanks,\nMichael`,
    date: '2026-01-27T09:15:00', status: 'unread', priority: 'medium', folder: 'inbox', proposalRef: 'PROP-2026-002',
    hasAttachment: true,
    attachments: [
    { name: 'security_requirements.pdf', size: '245 KB' },
    { name: 'compliance_checklist.xlsx', size: '89 KB' }],

    tags: ['technical'],
    clientInfo: {
      company: 'TechStart Solutions', industry: 'Software Development', lastContact: '01/26/2026', status: 'Active'
    }
  },
  {
    id: 3,
    sender: 'Emily Rodriguez', senderEmail: 'emily.r@globalind.com', senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1ce752c64-1763293622586.png", senderAvatarAlt: 'Professional headshot of Hispanic woman with long dark hair in burgundy blouse smiling warmly', recipient: 'proposals@nexsyscore.com', subject: 'Meeting Confirmation - January 30th', preview: 'This email confirms our meeting scheduled for January 30th at 2:00 PM EST to discuss the digital transformation proposal...',
    body: `This email confirms our meeting scheduled for January 30th at 2:00 PM EST to discuss the digital transformation proposal.\n\nAttendees from our side:\n- Emily Rodriguez (CTO)\n- David Park (IT Director)\n- Lisa Chen (Project Manager)\n\nPlease send the meeting link and agenda at your earliest convenience.\n\nBest regards,\nEmily`,
    date: '2026-01-26T16:45:00', status: 'read', priority: 'normal', folder: 'inbox', proposalRef: 'PROP-2026-003',
    hasAttachment: false,
    tags: ['meeting'],
    clientInfo: {
      company: 'Global Industries', industry: 'Manufacturing', lastContact: '01/24/2026', status: 'Active'
    }
  },
  {
    id: 4,
    sender: 'David Park', senderEmail: 'd.park@innovationlabs.net', senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1ac2aa6fd-1763292105333.png", senderAvatarAlt: 'Professional headshot of Korean man with short black hair in charcoal suit with confident expression', recipient: 'proposals@nexsyscore.com', subject: 'Budget Approval Update', preview: 'Good news! Our finance team has approved the budget for the AI implementation project. We can now move forward with the next steps...',
    body: `Good news! Our finance team has approved the budget for the AI implementation project. We can now move forward with the next steps.\n\nPlease send us the contract documents and the project kickoff schedule.\n\nWe're excited to get started!\n\nRegards,\nDavid`,
    date: '2026-01-26T14:20:00',
    status: 'read',
    priority: 'high',
    folder: 'inbox',
    proposalRef: 'PROP-2026-004',
    hasAttachment: false,
    tags: ['approved'],
    clientInfo: {
      company: 'Innovation Labs',
      industry: 'Research & Development',
      lastContact: '01/23/2026',
      status: 'Active'
    }
  },
  {
    id: 5,
    sender: 'Jennifer Martinez',
    senderEmail: 'jmartinez@acmecorp.com',
    senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11176ce80-1763296378826.png",
    senderAvatarAlt: 'Professional headshot of woman with curly brown hair in teal blazer with friendly smile',
    recipient: 'proposals@nexsyscore.com',
    subject: 'Proposal Revision Request',
    preview: 'After reviewing the proposal with our executive team, we would like to request some revisions to the pricing structure and timeline...',
    body: `After reviewing the proposal with our executive team, we would like to request some revisions to the pricing structure and timeline.\n\nSpecifically:\n1. Can we extend the implementation timeline by 2 months?\n2. Is there flexibility in the payment schedule?\n3. Can you include additional training sessions?\n\nPlease let us know if these modifications are possible.\n\nThank you,\nJennifer`,
    date: '2026-01-25T11:30:00',
    status: 'replied',
    priority: 'medium',
    folder: 'inbox',
    proposalRef: 'PROP-2026-001',
    hasAttachment: false,
    tags: ['revision'],
    clientInfo: {
      company: 'Acme Corporation',
      industry: 'Technology',
      lastContact: '01/25/2026',
      status: 'Active'
    }
  },
  {
    id: 6,
    sender: 'Robert Taylor',
    senderEmail: 'rtaylor@techstart.io',
    senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_17fe3dbed-1763292261619.png",
    senderAvatarAlt: 'Professional headshot of Caucasian man with salt and pepper hair in navy suit with serious expression',
    recipient: 'proposals@nexsyscore.com',
    subject: 'Reference Check Request',
    preview: 'As part of our vendor evaluation process, we would like to speak with some of your previous clients who have implemented similar solutions...',
    body: `As part of our vendor evaluation process, we would like to speak with some of your previous clients who have implemented similar solutions.\n\nCould you provide 3-4 references from companies in the technology sector?\n\nWe're particularly interested in hearing about:\n- Implementation experience\n- Post-launch support\n- ROI achieved\n\nThank you for your cooperation.\n\nBest,\nRobert`,
    date: '2026-01-25T09:00:00', status: 'read', priority: 'normal', folder: 'inbox', proposalRef: 'PROP-2026-002',
    hasAttachment: false,
    tags: ['reference'],
    clientInfo: {
      company: 'TechStart Solutions', industry: 'Software Development', lastContact: '01/24/2026', status: 'Active'
    }
  },
  {
    id: 7,
    sender: 'Amanda Foster', senderEmail: 'afoster@globalind.com', senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_190dab1ae-1763294726669.png", senderAvatarAlt: 'Professional headshot of blonde woman in white blouse with pearl necklace and warm smile', recipient: 'proposals@nexsyscore.com', subject: 'Contract Terms Discussion', preview: 'Our legal team has reviewed the proposal and contract terms. We have a few questions regarding the service level agreements and liability clauses...', body: `Our legal team has reviewed the proposal and contract terms. We have a few questions regarding the service level agreements and liability clauses.\n\nCould we schedule a call with your legal team to discuss these items?\n\nWe're aiming to finalize everything by the end of this week.\n\nRegards,\nAmanda`,
    date: '2026-01-24T15:45:00',
    status: 'read',
    priority: 'high',
    folder: 'inbox',
    proposalRef: 'PROP-2026-003',
    hasAttachment: true,
    attachments: [
    { name: 'legal_questions.docx', size: '156 KB' }],

    tags: ['legal'],
    clientInfo: {
      company: 'Global Industries',
      industry: 'Manufacturing',
      lastContact: '01/24/2026',
      status: 'Active'
    }
  },
  {
    id: 8,
    sender: 'Kevin Wu',
    senderEmail: 'kwu@innovationlabs.net',
    senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_165afbdf1-1763293866263.png",
    senderAvatarAlt: 'Professional headshot of Asian man with short black hair wearing black turtleneck with confident smile',
    recipient: 'proposals@nexsyscore.com',
    subject: 'Technical Specifications Clarification',
    preview: 'We need some clarification on the technical specifications mentioned in section 4 of the proposal, particularly regarding the API integration capabilities...',
    body: `We need some clarification on the technical specifications mentioned in section 4 of the proposal, particularly regarding the API integration capabilities.\n\nQuestions:\n1. What API rate limits are in place?\n2. Do you support webhooks for real-time updates?\n3. What authentication methods are supported?\n4. Is there a sandbox environment for testing?\n\nPlease provide detailed answers as this will impact our decision.\n\nThanks,\nKevin`,
    date: '2026-01-24T10:15:00',
    status: 'read',
    priority: 'medium',
    folder: 'inbox',
    proposalRef: 'PROP-2026-004',
    hasAttachment: false,
    tags: ['technical'],
    clientInfo: {
      company: 'Innovation Labs',
      industry: 'Research & Development',
      lastContact: '01/23/2026',
      status: 'Active'
    }
  }];


  const [emails, setEmails] = useState(mockEmails);

  const handleCompose = () => {
    setReplyTo(null);
    setForwardEmail(null);
    setIsComposerOpen(true);
  };

  const handleReply = (email) => {
    setReplyTo(email);
    setForwardEmail(null);
    setIsComposerOpen(true);
  };

  const handleForward = (email) => {
    setForwardEmail(email);
    setReplyTo(null);
    setIsComposerOpen(true);
  };

  const handleArchive = (email) => {
    setEmails(emails?.map((e) =>
    e?.id === email?.id ? { ...e, folder: 'archive' } : e
    ));
    setSelectedEmail(null);
  };

  const handleDelete = (email) => {
    setEmails(emails?.map((e) =>
    e?.id === email?.id ? { ...e, folder: 'trash' } : e
    ));
    setSelectedEmail(null);
  };

  const handleSend = (emailData) => {
    const newEmail = {
      id: emails?.length + 1,
      sender: 'You',
      senderEmail: 'proposals@nexsyscore.com',
      senderAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1c96c4732-1763297065148.png",
      senderAvatarAlt: 'Professional headshot of proposal manager in business attire',
      recipient: emailData?.to,
      subject: emailData?.subject,
      preview: emailData?.body?.substring(0, 100) + '...',
      body: emailData?.body,
      date: emailData?.timestamp,
      status: 'read',
      priority: emailData?.priority,
      folder: 'sent',
      hasAttachment: emailData?.attachments?.length > 0,
      attachments: emailData?.attachments,
      tags: []
    };
    setEmails([newEmail, ...emails]);
  };

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
    if (email?.status === 'unread') {
      setEmails(emails?.map((e) =>
      e?.id === email?.id ? { ...e, status: 'read' } : e
      ));
    }
  };

  const handleRefresh = () => {
    console.log('Refreshing emails...');
  };

  return (
    <RoleBasedAccess requiredPermission="user">
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          collapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed} />


        <div className="flex-1 flex flex-col ml-[68px] transition-smooth">

          <header className="bg-card border-b border-border px-4 md:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">
                  Email Communication Center
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Manage client communications and proposal correspondence
                </p>
              </div>
              <div className="flex items-center gap-3">
                <IntegrationStatus compact />
                <button className="w-10 h-10 flex items-center justify-center bg-muted hover:bg-muted/80 rounded-lg transition-smooth">
                  <Icon name="Settings" size={20} />
                </button>
              </div>
            </div>
          </header>

          <Breadcrumb />

          <EmailFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedClient={selectedClient}
            onClientChange={setSelectedClient}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            clients={clients}
            onRefresh={handleRefresh} />


          <div className="flex-1 flex overflow-hidden">
            <div className="hidden lg:block w-60 flex-shrink-0">
              <EmailSidebar
                selectedFolder={selectedFolder}
                onFolderChange={setSelectedFolder}
                onCompose={handleCompose}
                folders={folders} />

            </div>

            <div className="w-full lg:w-96 flex-shrink-0 border-r border-border overflow-hidden">
              <EmailInbox
                emails={emails}
                selectedEmail={selectedEmail}
                onSelectEmail={handleSelectEmail}
                selectedFolder={selectedFolder}
                searchQuery={searchQuery} />

            </div>

            <div className="hidden md:block flex-1 overflow-hidden">
              <EmailReader
                email={selectedEmail}
                onReply={handleReply}
                onForward={handleForward}
                onArchive={handleArchive}
                onDelete={handleDelete} />

            </div>
          </div>

          {selectedEmail &&
          <div className="md:hidden fixed inset-0 bg-background z-40">
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
                  <button
                  onClick={() => setSelectedEmail(null)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-lg transition-smooth">

                    <Icon name="ArrowLeft" size={20} />
                  </button>
                  <h2 className="text-lg font-heading font-semibold text-foreground">
                    Message
                  </h2>
                </div>
                <div className="flex-1 overflow-hidden">
                  <EmailReader
                  email={selectedEmail}
                  onReply={handleReply}
                  onForward={handleForward}
                  onArchive={handleArchive}
                  onDelete={handleDelete} />

                </div>
              </div>
            </div>
          }

          <EmailComposer
            isOpen={isComposerOpen}
            onClose={() => setIsComposerOpen(false)}
            onSend={handleSend}
            replyTo={replyTo}
            forwardEmail={forwardEmail}
            templates={emailTemplates} />

        </div>
      </div>
    </RoleBasedAccess>);

};

export default IntegratedEmailCommunicationCenter;