import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const GenerationControlPanel = ({ 
  selectedCount, 
  onGenerate, 
  onClearSelection 
}) => {
  const [generationOptions, setGenerationOptions] = useState({
    format: 'client-presentation',
    includeWatermark: false,
    passwordProtect: false,
    digitalSignature: false,
    customBranding: true,
    password: '',
    priority: 'normal'
  });

  const formatOptions = [
    { value: 'client-presentation', label: 'Client Presentation' },
    { value: 'internal-review', label: 'Internal Review' },
    { value: 'archive-version', label: 'Archive Version' },
    { value: 'executive-summary', label: 'Executive Summary' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'normal', label: 'Normal Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const handleOptionChange = (key, value) => {
    setGenerationOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGenerate = () => {
    onGenerate(generationOptions);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-5 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Generation Controls
        </h2>
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedCount} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={onClearSelection}
            >
              Clear
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-4 md:space-y-5">
        <Select
          label="Document Format"
          description="Choose the output format for PDF generation"
          options={formatOptions}
          value={generationOptions?.format}
          onChange={(value) => handleOptionChange('format', value)}
        />

        <Select
          label="Processing Priority"
          description="Set queue priority for batch processing"
          options={priorityOptions}
          value={generationOptions?.priority}
          onChange={(value) => handleOptionChange('priority', value)}
        />

        <div className="space-y-3">
          <label className="text-sm font-caption font-medium text-foreground">
            Advanced Options
          </label>
          
          <Checkbox
            label="Include Watermark"
            description="Add company watermark to all pages"
            checked={generationOptions?.includeWatermark}
            onChange={(e) => handleOptionChange('includeWatermark', e?.target?.checked)}
          />

          <Checkbox
            label="Password Protection"
            description="Secure PDF with password encryption"
            checked={generationOptions?.passwordProtect}
            onChange={(e) => handleOptionChange('passwordProtect', e?.target?.checked)}
          />

          {generationOptions?.passwordProtect && (
            <Input
              type="password"
              label="Document Password"
              placeholder="Enter secure password"
              value={generationOptions?.password}
              onChange={(e) => handleOptionChange('password', e?.target?.value)}
              className="ml-6"
            />
          )}

          <Checkbox
            label="Digital Signature"
            description="Apply digital signature for authenticity"
            checked={generationOptions?.digitalSignature}
            onChange={(e) => handleOptionChange('digitalSignature', e?.target?.checked)}
          />

          <Checkbox
            label="Custom Branding"
            description="Include company logo and branding elements"
            checked={generationOptions?.customBranding}
            onChange={(e) => handleOptionChange('customBranding', e?.target?.checked)}
          />
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          <Button
            variant="default"
            fullWidth
            iconName="FileDown"
            iconPosition="left"
            onClick={handleGenerate}
            disabled={selectedCount === 0}
          >
            Generate {selectedCount > 0 ? `${selectedCount} PDF${selectedCount > 1 ? 's' : ''}` : 'PDFs'}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Mail"
              iconPosition="left"
            >
              Email After
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Archive"
              iconPosition="left"
            >
              Archive
            </Button>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-caption font-medium text-foreground">
            <Icon name="Info" size={16} />
            <span>Processing Information</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 ml-6">
            <li>• Maximum 100 documents per batch</li>
            <li>• Average processing time: 30-45 seconds per document</li>
            <li>• High priority items process first</li>
            <li>• Email notifications sent upon completion</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GenerationControlPanel;