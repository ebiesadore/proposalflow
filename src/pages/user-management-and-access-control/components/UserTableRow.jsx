import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const UserTableRow = ({ user, onEdit, onToggleStatus, onDelete, isSelected, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-success/10 text-success';
      case 'Inactive':
        return 'bg-muted text-muted-foreground';
      case 'Suspended':
        return 'bg-error/10 text-error';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPermissionColor = (level) => {
    switch (level) {
      case 'Full Access':
        return 'bg-primary/10 text-primary';
      case 'Limited Access':
        return 'bg-warning/10 text-warning';
      case 'View Only':
        return 'bg-accent/10 text-accent';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatLastLogin = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <tr className="border-b border-border hover:bg-muted/50 transition-smooth">
        <td className="px-4 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(user?.id, e?.target?.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
          />
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Image
              src={user?.avatar}
              alt={user?.avatarAlt}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="font-caption font-medium text-sm text-foreground">
                {user?.name}
              </div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <span className="text-sm font-caption text-foreground">{user?.role}</span>
        </td>
        <td className="px-4 py-4">
          <span className="text-sm font-caption text-foreground">{user?.department}</span>
        </td>
        <td className="px-4 py-4">
          <span className="text-sm font-caption text-muted-foreground">
            {formatLastLogin(user?.lastLogin)}
          </span>
        </td>
        <td className="px-4 py-4">
          <button
            onClick={() => onToggleStatus(user?.id)}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-caption font-medium transition-smooth ${getStatusColor(user?.status)}`}
          >
            <Icon name="Circle" size={8} className="fill-current" />
            {user?.status}
          </button>
        </td>
        <td className="px-4 py-4">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-caption font-medium ${getPermissionColor(user?.permissionLevel)}`}>
            {user?.permissionLevel}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
              iconSize={16}
              className="lg:hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(user)}
              iconName="Trash2"
              iconSize={16}
              className="text-error hover:text-error hover:bg-error/10"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(user)}
              iconName="Edit"
              iconSize={16}
            />
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="lg:hidden border-b border-border bg-muted/30">
          <td colSpan="8" className="px-4 py-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Role:</span>
                <span className="text-sm font-caption font-medium text-foreground">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Department:</span>
                <span className="text-sm font-caption font-medium text-foreground">{user?.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Login:</span>
                <span className="text-sm font-caption text-muted-foreground">
                  {formatLastLogin(user?.lastLogin)}
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default UserTableRow;