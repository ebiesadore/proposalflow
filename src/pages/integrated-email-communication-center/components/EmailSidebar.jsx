import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmailSidebar = ({ 
  selectedFolder, 
  onFolderChange, 
  onCompose, 
  folders 
}) => {
  const folderIcons = {
    inbox: 'Inbox',
    sent: 'Send',
    drafts: 'FileEdit',
    archive: 'Archive',
    trash: 'Trash2',
    all: 'Mail'
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-4 md:p-6 border-b border-border">
        <Button
          variant="default"
          fullWidth
          iconName="Plus"
          iconPosition="left"
          onClick={onCompose}
        >
          Compose
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {folders?.map((folder) => (
            <button
              key={folder?.id}
              onClick={() => onFolderChange(folder?.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-smooth hover:bg-muted ${
                selectedFolder === folder?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon 
                  name={folderIcons?.[folder?.id] || 'Folder'} 
                  size={20} 
                />
                <span className="font-caption font-medium text-sm">
                  {folder?.label}
                </span>
              </div>
              {folder?.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-caption font-medium ${
                  selectedFolder === folder?.id
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {folder?.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="px-4 text-xs font-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Filters
          </h3>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-smooth hover:bg-muted text-foreground">
              <Icon name="Star" size={18} />
              <span className="font-caption text-sm">Starred</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-smooth hover:bg-muted text-foreground">
              <Icon name="AlertCircle" size={18} />
              <span className="font-caption text-sm">High Priority</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-smooth hover:bg-muted text-foreground">
              <Icon name="Paperclip" size={18} />
              <span className="font-caption text-sm">With Attachments</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-smooth hover:bg-muted text-foreground">
              <Icon name="FileText" size={18} />
              <span className="font-caption text-sm">Proposal Related</span>
            </button>
          </div>
        </div>
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
            <Icon name="CheckCircle" size={20} className="text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-caption font-medium text-foreground">
              Email Server
            </div>
            <div className="text-xs text-success">
              Connected
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSidebar;