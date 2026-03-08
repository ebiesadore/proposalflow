import React from 'react';
import Icon from '../../../components/AppIcon';

import Button from '../../../components/ui/Button';

const TemplateCard = ({ template, onEdit, onDuplicate, onArchive, onPreview, isSelected, onSelect }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success';
      case 'draft':
        return 'bg-warning/10 text-warning';
      case 'archived':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className={`bg-card border rounded-lg transition-smooth hover:shadow-brand-lg ${
        isSelected ? 'border-primary shadow-brand' : 'border-border'
      }`}
    >
      <div className="p-4 md:p-5 lg:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(template?.id, e?.target?.checked)}
              className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 transition-smooth"
              aria-label={`Select ${template?.name}`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-heading font-semibold text-foreground mb-2 line-clamp-2">
                {template?.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-2 py-1 rounded-md text-xs font-caption font-medium ${getStatusColor(template?.status)}`}>
                  {template?.status}
                </span>
                <span className="px-2 py-1 bg-muted rounded-md text-xs font-caption text-muted-foreground">
                  v{template?.version}
                </span>
                <span className="px-2 py-1 bg-accent/10 text-accent rounded-md text-xs font-caption font-medium">
                  {template?.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Calendar" size={16} />
            <span className="font-caption">Modified: {formatDate(template?.lastModified)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="FileText" size={16} />
            <span className="font-caption">{template?.usageCount} proposals created</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="User" size={16} />
            <span className="font-caption line-clamp-1">{template?.lastModifiedBy}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Eye"
            iconPosition="left"
            onClick={() => onPreview(template)}
            className="flex-1 min-w-[100px]"
          >
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Edit"
            iconPosition="left"
            onClick={() => onEdit(template)}
            className="flex-1 min-w-[100px]"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconName="Copy"
            onClick={() => onDuplicate(template)}
            aria-label="Duplicate template"
          />
          <Button
            variant="ghost"
            size="sm"
            iconName="Archive"
            onClick={() => onArchive(template)}
            aria-label="Archive template"
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;