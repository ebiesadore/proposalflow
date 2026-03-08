import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const TemplateEditor = ({ template, onSave, onCancel, onPreviewToggle, previewMode }) => {
  const [editorContent, setEditorContent] = useState(template?.content || '');
  const [templateName, setTemplateName] = useState(template?.name || '');
  const [templateCategory, setTemplateCategory] = useState(template?.category || 'Standard');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef(null);

  const categoryOptions = [
    { value: 'Standard', label: 'Standard Proposal' },
    { value: 'Technical', label: 'Technical Proposal' },
    { value: 'Financial', label: 'Financial Proposal' },
    { value: 'Marketing', label: 'Marketing Proposal' },
    { value: 'Legal', label: 'Legal Agreement' },
  ];

  const formatButtons = [
    { icon: 'Bold', command: 'bold', label: 'Bold (Ctrl+B)' },
    { icon: 'Italic', command: 'italic', label: 'Italic (Ctrl+I)' },
    { icon: 'Underline', command: 'underline', label: 'Underline (Ctrl+U)' },
    { icon: 'List', command: 'insertUnorderedList', label: 'Bullet List' },
    { icon: 'ListOrdered', command: 'insertOrderedList', label: 'Numbered List' },
    { icon: 'AlignLeft', command: 'justifyLeft', label: 'Align Left' },
    { icon: 'AlignCenter', command: 'justifyCenter', label: 'Align Center' },
    { icon: 'AlignRight', command: 'justifyRight', label: 'Align Right' },
  ];

  const variables = [
    { label: 'Client Name', value: '{{client_name}}' },
    { label: 'Client Company', value: '{{client_company}}' },
    { label: 'Proposal Date', value: '{{proposal_date}}' },
    { label: 'Project Title', value: '{{project_title}}' },
    { label: 'Total Amount', value: '{{total_amount}}' },
    { label: 'Delivery Date', value: '{{delivery_date}}' },
  ];

  const handleFormat = (command) => {
    document.execCommand(command, false, null);
    editorRef?.current?.focus();
  };

  const insertVariable = (variable) => {
    const selection = window.getSelection();
    if (selection?.rangeCount > 0) {
      const range = selection?.getRangeAt(0);
      range?.deleteContents();
      const textNode = document.createTextNode(variable);
      range?.insertNode(textNode);
      range?.setStartAfter(textNode);
      range?.setEndAfter(textNode);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    editorRef?.current?.focus();
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSave({
      ...template,
      name: templateName,
      category: templateCategory,
      content: editorRef?.current?.innerHTML || editorContent,
      lastModified: new Date()?.toISOString(),
    });
    setIsSaving(false);
  };

  useEffect(() => {
    if (editorRef?.current && template?.content) {
      editorRef.current.innerHTML = template?.content;
    }
  }, [template]);

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="border-b border-border p-4 md:p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground">
            {template ? 'Edit Template' : 'Create New Template'}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              iconName={previewMode === 'online' ? 'FileText' : 'Monitor'}
              iconPosition="left"
              onClick={onPreviewToggle}
            >
              {previewMode === 'online' ? 'PDF View' : 'Online View'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              iconName="Save"
              iconPosition="left"
              loading={isSaving}
              onClick={handleSave}
            >
              Save Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Template Name"
            type="text"
            placeholder="Enter template name"
            value={templateName}
            onChange={(e) => setTemplateName(e?.target?.value)}
            required
          />
          <Select
            label="Category"
            options={categoryOptions}
            value={templateCategory}
            onChange={setTemplateCategory}
            required
          />
        </div>
      </div>
      <div className="border-b border-border p-3 md:p-4 bg-muted/50">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {formatButtons?.map((btn) => (
            <button
              key={btn?.command}
              onClick={() => handleFormat(btn?.command)}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-md bg-background hover:bg-accent hover:text-accent-foreground transition-smooth"
              title={btn?.label}
              aria-label={btn?.label}
            >
              <Icon name={btn?.icon} size={18} />
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-caption font-medium text-foreground">Insert Variable:</span>
          {variables?.map((variable) => (
            <button
              key={variable?.value}
              onClick={() => insertVariable(variable?.value)}
              className="px-3 py-1.5 text-xs font-caption font-medium bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-smooth"
            >
              {variable?.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[500px] p-6 md:p-8 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground font-body"
          style={{ lineHeight: '1.8' }}
          suppressContentEditableWarning
        >
          {!template && (
            <p className="text-muted-foreground">Start typing your template content here...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;