import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';


const KeyboardShortcutsPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const shortcuts = [
    { key: 'Ctrl + A', description: 'Select all documents' },
    { key: 'Ctrl + D', description: 'Deselect all documents' },
    { key: 'Ctrl + G', description: 'Generate selected PDFs' },
    { key: 'Ctrl + P', description: 'Preview selected document' },
    { key: 'Ctrl + S', description: 'Download selected documents' },
    { key: 'Ctrl + E', description: 'Email selected documents' },
    { key: 'Space', description: 'Toggle document selection' },
    { key: '↑ ↓', description: 'Navigate document list' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Icon name="Keyboard" size={20} className="text-primary" />
          <span className="text-sm font-caption font-medium text-foreground">
            Keyboard Shortcuts
          </span>
        </div>
        <Icon
          name="ChevronDown"
          size={16}
          className={`text-muted-foreground transition-smooth ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      {isExpanded && (
        <div className="mt-4 space-y-2">
          {shortcuts?.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut?.description}
              </span>
              <kbd className="px-2 py-1 text-xs font-caption font-medium bg-muted text-foreground rounded border border-border">
                {shortcut?.key}
              </kbd>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KeyboardShortcutsPanel;