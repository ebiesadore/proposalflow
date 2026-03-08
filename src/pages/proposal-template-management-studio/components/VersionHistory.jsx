import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VersionHistory = ({ template, onRestore, onClose }) => {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showDiff, setShowDiff] = useState(false);

  const versionHistory = [
  {
    version: '3.2',
    date: '2026-01-27T10:30:00',
    author: 'Sarah Johnson',
    authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_17784c577-1763297418164.png",
    authorAvatarAlt: 'Professional headshot of Caucasian woman with shoulder-length brown hair wearing navy blazer',
    changes: 'Updated pricing section and added new terms',
    changeCount: 12,
    isCurrent: true
  },
  {
    version: '3.1',
    date: '2026-01-25T14:20:00',
    author: 'Michael Chen',
    authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_13a48293d-1763296098326.png",
    authorAvatarAlt: 'Professional headshot of Asian man with short black hair in gray suit',
    changes: 'Fixed formatting issues in deliverables section',
    changeCount: 5,
    isCurrent: false
  },
  {
    version: '3.0',
    date: '2026-01-20T09:15:00',
    author: 'Sarah Johnson',
    authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_17784c577-1763297418164.png",
    authorAvatarAlt: 'Professional headshot of Caucasian woman with shoulder-length brown hair wearing navy blazer',
    changes: 'Major revision: Restructured entire template layout',
    changeCount: 47,
    isCurrent: false
  },
  {
    version: '2.8',
    date: '2026-01-15T16:45:00',
    author: 'David Martinez',
    authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1813f6135-1763301114988.png",
    authorAvatarAlt: 'Professional headshot of Hispanic man with short dark hair wearing white shirt',
    changes: 'Added compliance section for regulatory requirements',
    changeCount: 23,
    isCurrent: false
  },
  {
    version: '2.7',
    date: '2026-01-10T11:30:00',
    author: 'Emily Rodriguez',
    authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1bce40d3e-1763293517671.png",
    authorAvatarAlt: 'Professional headshot of Hispanic woman with long dark hair wearing blue blouse',
    changes: 'Updated legal disclaimers and contact information',
    changeCount: 8,
    isCurrent: false
  }];


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRestore = (version) => {
    if (window.confirm(`Are you sure you want to restore version ${version?.version}? This will create a new version based on this historical version.`)) {
      onRestore(version);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-brand-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <div>
            <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-1">
              Version History
            </h2>
            <p className="text-sm text-muted-foreground font-caption">
              {template?.name} - Complete revision history
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClose}
            aria-label="Close version history" />

        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-4">
            {versionHistory?.map((version, index) =>
            <div
              key={version?.version}
              className={`relative p-4 md:p-5 rounded-lg border transition-smooth ${
              version?.isCurrent ?
              'bg-primary/5 border-primary' : 'bg-card border-border hover:border-primary/50'} ${
              selectedVersion?.version === version?.version ? 'ring-2 ring-primary' : ''}`}>

                {index < versionHistory?.length - 1 &&
              <div className="absolute left-8 top-full w-0.5 h-4 bg-border" />
              }

                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-border">
                      <img
                      src={version?.authorAvatar}
                      alt={version?.authorAvatarAlt}
                      className="w-full h-full object-cover" />

                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-lg font-heading font-semibold text-foreground">
                          v{version?.version}
                        </span>
                        {version?.isCurrent &&
                      <span className="px-2 py-0.5 bg-success/10 text-success rounded-md text-xs font-caption font-medium">
                            Current
                          </span>
                      }
                      </div>

                      <p className="text-sm text-foreground font-caption mb-2 line-clamp-2">
                        {version?.changes}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-caption">
                        <span className="flex items-center gap-1">
                          <Icon name="User" size={14} />
                          {version?.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Calendar" size={14} />
                          {formatDate(version?.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="FileEdit" size={14} />
                          {version?.changeCount} changes
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                    variant="outline"
                    size="sm"
                    iconName="Eye"
                    iconPosition="left"
                    onClick={() => setSelectedVersion(version)}>

                      Preview
                    </Button>
                    {!version?.isCurrent &&
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="RotateCcw"
                    iconPosition="left"
                    onClick={() => handleRestore(version)}>

                        Restore
                      </Button>
                  }
                    <Button
                    variant="ghost"
                    size="sm"
                    iconName="GitCompare"
                    onClick={() => setShowDiff(!showDiff)}
                    aria-label="Show differences" />

                  </div>
                </div>

                {showDiff && selectedVersion?.version === version?.version &&
              <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-caption font-semibold text-foreground mb-2">
                      Changes in this version:
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground font-caption">
                      <li className="flex items-start gap-2">
                        <Icon name="Plus" size={14} className="text-success mt-0.5" />
                        <span>Added new pricing structure section</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Minus" size={14} className="text-error mt-0.5" />
                        <span>Removed outdated payment terms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Edit" size={14} className="text-warning mt-0.5" />
                        <span>Modified deliverables timeline</span>
                      </li>
                    </ul>
                  </div>
              }
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              fullWidth
              iconName="Download"
              iconPosition="left">

              Export History
            </Button>
            <Button
              variant="default"
              fullWidth
              onClick={onClose}>

              Close
            </Button>
          </div>
        </div>
      </div>
    </div>);

};

export default VersionHistory;