import React from 'react';
import Icon from '../../../components/AppIcon';

const EmailInbox = ({ 
  emails, 
  selectedEmail, 
  onSelectEmail, 
  selectedFolder, 
  searchQuery 
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'unread':
        return 'Mail';
      case 'read':
        return 'MailOpen';
      case 'replied':
        return 'Reply';
      case 'forwarded':
        return 'Forward';
      default:
        return 'Mail';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatDate = (date) => {
    const emailDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday?.setDate(yesterday?.getDate() - 1);

    if (emailDate?.toDateString() === today?.toDateString()) {
      return emailDate?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (emailDate?.toDateString() === yesterday?.toDateString()) {
      return 'Yesterday';
    } else {
      return emailDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredEmails = emails?.filter(email => {
    const matchesFolder = selectedFolder === 'all' || email?.folder === selectedFolder;
    const matchesSearch = !searchQuery || 
      email?.sender?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      email?.subject?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      email?.proposalRef?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-4 md:p-6 border-b border-border">
        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          {selectedFolder === 'all' ? 'All Messages' : 
           selectedFolder === 'inbox' ? 'Inbox' :
           selectedFolder === 'sent' ? 'Sent' :
           selectedFolder === 'drafts' ? 'Drafts' : 'Archive'}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          {filteredEmails?.length} message{filteredEmails?.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredEmails?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-12">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Icon name="Inbox" size={32} className="text-muted-foreground" />
            </div>
            <p className="text-sm md:text-base text-muted-foreground text-center">
              No messages found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEmails?.map((email) => (
              <button
                key={email?.id}
                onClick={() => onSelectEmail(email)}
                className={`w-full text-left p-3 md:p-4 transition-smooth hover:bg-muted ${
                  selectedEmail?.id === email?.id ? 'bg-muted' : ''
                } ${email?.status === 'unread' ? 'bg-primary/5' : ''}`}
              >
                <div className="flex items-start gap-2 md:gap-3">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    email?.status === 'unread' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Icon 
                      name={getStatusIcon(email?.status)} 
                      size={16} 
                      className={email?.status === 'unread' ? 'text-primary' : 'text-muted-foreground'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-sm md:text-base font-caption font-medium truncate ${
                        email?.status === 'unread' ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {email?.sender}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(email?.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-xs md:text-sm font-caption line-clamp-1 ${
                        email?.status === 'unread' ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
                      }`}>
                        {email?.subject}
                      </h3>
                      {email?.priority === 'high' && (
                        <Icon name="AlertCircle" size={14} className="text-error flex-shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {email?.preview}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {email?.proposalRef && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent rounded text-xs font-caption">
                          <Icon name="FileText" size={12} />
                          {email?.proposalRef}
                        </span>
                      )}
                      {email?.hasAttachment && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Icon name="Paperclip" size={12} />
                        </span>
                      )}
                      {email?.tags?.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailInbox;