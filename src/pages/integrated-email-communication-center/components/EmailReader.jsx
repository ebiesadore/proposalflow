import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const EmailReader = ({ email, onReply, onForward, onArchive, onDelete }) => {
  if (!email) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-card px-4 py-12">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Icon name="Mail" size={48} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-2">
          No Message Selected
        </h3>
        <p className="text-sm md:text-base text-muted-foreground text-center max-w-md">
          Select a message from the inbox to view its contents
        </p>
      </div>
    );
  }

  const formatFullDate = (date) => {
    return new Date(date)?.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-2xl font-heading font-semibold text-foreground mb-2 break-words">
              {email?.subject}
            </h2>
            {email?.proposalRef && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs md:text-sm font-caption">
                <Icon name="FileText" size={16} />
                <span>Proposal: {email?.proposalRef}</span>
              </div>
            )}
          </div>
          {email?.priority === 'high' && (
            <div className="flex-shrink-0">
              <Icon name="AlertCircle" size={20} className="text-error" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Image
            src={email?.senderAvatar}
            alt={email?.senderAvatarAlt}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm md:text-base font-caption font-semibold text-foreground">
                {email?.sender}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground">
                &lt;{email?.senderEmail}&gt;
              </span>
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">
              To: {email?.recipient}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-xs md:text-sm text-muted-foreground">
            {formatFullDate(email?.date)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              iconName="Reply"
              onClick={() => onReply(email)}
            >
              Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="Forward"
              onClick={() => onForward(email)}
            >
              Forward
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="Archive"
              onClick={() => onArchive(email)}
            >
              Archive
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="Trash2"
              onClick={() => onDelete(email)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="prose prose-sm md:prose max-w-none">
          <div 
            className="text-sm md:text-base text-foreground whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: email?.body?.replace(/\n/g, '<br />') }}
          />
        </div>

        {email?.attachments && email?.attachments?.length > 0 && (
          <div className="mt-6 md:mt-8 pt-6 border-t border-border">
            <h3 className="text-sm md:text-base font-caption font-semibold text-foreground mb-4">
              Attachments ({email?.attachments?.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {email?.attachments?.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 md:p-4 bg-muted rounded-lg transition-smooth hover:bg-muted/80"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="File" size={20} className="text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-caption font-medium text-foreground truncate">
                      {attachment?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {attachment?.size}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Download"
                    className="flex-shrink-0"
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {email?.clientInfo && (
          <div className="mt-6 md:mt-8 pt-6 border-t border-border">
            <h3 className="text-sm md:text-base font-caption font-semibold text-foreground mb-4">
              Client Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Company</span>
                <p className="text-sm md:text-base text-foreground font-caption">
                  {email?.clientInfo?.company}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Industry</span>
                <p className="text-sm md:text-base text-foreground font-caption">
                  {email?.clientInfo?.industry}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Last Contact</span>
                <p className="text-sm md:text-base text-foreground font-caption">
                  {email?.clientInfo?.lastContact}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Status</span>
                <p className="text-sm md:text-base text-foreground font-caption">
                  {email?.clientInfo?.status}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailReader;