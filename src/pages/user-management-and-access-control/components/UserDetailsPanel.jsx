import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const UserDetailsPanel = ({ user, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'User' },
    { id: 'permissions', label: 'Permissions', icon: 'Shield' },
    { id: 'activity', label: 'Activity', icon: 'Activity' },
    { id: 'sessions', label: 'Sessions', icon: 'Monitor' },
  ];

  const permissions = [
    { module: 'Proposal Management', access: 'Full Access', icon: 'FileText' },
    { module: 'Client Data', access: 'Full Access', icon: 'Users' },
    { module: 'System Settings', access: 'Limited Access', icon: 'Settings' },
    { module: 'Audit Functions', access: 'View Only', icon: 'Shield' },
    { module: 'Email Center', access: 'Full Access', icon: 'Mail' },
    { module: 'Document Export', access: 'Full Access', icon: 'Download' },
  ];

  const activityLog = [
    {
      action: 'Updated proposal template',
      timestamp: '2026-01-27T13:15:00',
      details: 'Modified "Standard Proposal" template',
    },
    {
      action: 'Created new client',
      timestamp: '2026-01-27T11:30:00',
      details: 'Added "Acme Corporation" to client database',
    },
    {
      action: 'Changed user permissions',
      timestamp: '2026-01-27T09:45:00',
      details: 'Updated access level for John Smith',
    },
    {
      action: 'Generated PDF report',
      timestamp: '2026-01-26T16:20:00',
      details: 'Exported Q4 proposal summary',
    },
  ];

  const activeSessions = [
    {
      device: 'Windows Desktop',
      location: 'New York, NY',
      ip: '192.168.1.100',
      lastActive: '2026-01-27T13:35:00',
      current: true,
    },
    {
      device: 'iPhone 14 Pro',
      location: 'New York, NY',
      ip: '192.168.1.105',
      lastActive: '2026-01-27T10:15:00',
      current: false,
    },
  ];

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date?.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-card border-l border-border shadow-brand-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-heading font-semibold text-foreground">
            User Details
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 border-b border-border">
            <div className="flex items-start gap-4">
              <Image
                src={user?.avatar}
                alt={user?.avatarAlt}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
                  {user?.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">{user?.email}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-caption font-medium">
                    <Icon name="Briefcase" size={12} />
                    {user?.role}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-caption font-medium">
                    <Icon name="Building" size={12} />
                    {user?.department}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-caption font-medium ${
                    user?.status === 'Active' ?'bg-success/10 text-success' :'bg-muted text-muted-foreground'
                  }`}>
                    <Icon name="Circle" size={8} className="fill-current" />
                    {user?.status}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(user)}
                iconName="Edit"
                iconPosition="left"
                iconSize={16}
              >
                Edit
              </Button>
            </div>
          </div>

          <div className="border-b border-border">
            <div className="flex overflow-x-auto px-6">
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
                  {tab?.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-caption font-medium text-muted-foreground mb-3">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Icon name="Mail" size={18} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Icon name="Phone" size={18} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{user?.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Icon name="MapPin" size={18} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{user?.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-caption font-medium text-muted-foreground mb-3">
                    Integration Status
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon name="Database" size={18} className="text-success" />
                        <span className="text-sm font-caption font-medium text-foreground">
                          Active Directory
                        </span>
                      </div>
                      <span className="text-xs text-success font-caption font-medium">
                        Synced
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon name="Key" size={18} className="text-success" />
                        <span className="text-sm font-caption font-medium text-foreground">
                          SSO Enabled
                        </span>
                      </div>
                      <span className="text-xs text-success font-caption font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-caption font-medium text-muted-foreground mb-3">
                    Account Details
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Employee ID:</span>
                      <span className="text-foreground font-caption font-medium">
                        {user?.employeeId}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Join Date:</span>
                      <span className="text-foreground font-caption font-medium">
                        {new Date(user.joinDate)?.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Login:</span>
                      <span className="text-foreground font-caption font-medium">
                        {formatTimestamp(user?.lastLogin)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-caption font-medium text-muted-foreground">
                    Access Rights
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-caption font-medium ${
                    user?.permissionLevel === 'Full Access' ?'bg-primary/10 text-primary'
                      : user?.permissionLevel === 'Limited Access' ?'bg-warning/10 text-warning' :'bg-accent/10 text-accent'
                  }`}>
                    {user?.permissionLevel}
                  </span>
                </div>

                {permissions?.map((permission, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center">
                        <Icon name={permission?.icon} size={18} className="text-foreground" />
                      </div>
                      <span className="text-sm font-caption font-medium text-foreground">
                        {permission?.module}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-caption font-medium ${
                      permission?.access === 'Full Access' ?'bg-success/10 text-success'
                        : permission?.access === 'Limited Access' ?'bg-warning/10 text-warning' :'bg-accent/10 text-accent'
                    }`}>
                      {permission?.access}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h4 className="text-sm font-caption font-medium text-muted-foreground mb-4">
                  Recent Activity
                </h4>
                {activityLog?.map((activity, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon name="Activity" size={14} className="text-primary" />
                      </div>
                      {index < activityLog?.length - 1 && (
                        <div className="w-px h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-sm font-caption font-medium text-foreground mb-1">
                        {activity?.action}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {activity?.details}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(activity?.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <h4 className="text-sm font-caption font-medium text-muted-foreground mb-4">
                  Active Sessions
                </h4>
                {activeSessions?.map((session, index) => (
                  <div
                    key={index}
                    className="p-4 bg-muted rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center">
                          <Icon name="Monitor" size={18} className="text-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-caption font-medium text-foreground">
                            {session?.device}
                          </p>
                          {session?.current && (
                            <span className="inline-flex items-center gap-1 text-xs text-success font-caption font-medium mt-1">
                              <Icon name="Circle" size={6} className="fill-current" />
                              Current Session
                            </span>
                          )}
                        </div>
                      </div>
                      {!session?.current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="LogOut"
                          iconSize={14}
                        >
                          Logout
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Icon name="MapPin" size={12} />
                        <span>{session?.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Globe" size={12} />
                        <span>{session?.ip}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Clock" size={12} />
                        <span>Last active: {formatTimestamp(session?.lastActive)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPanel;