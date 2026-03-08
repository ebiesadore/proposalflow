import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const EmailComposer = ({ 
  isOpen, 
  onClose, 
  onSend, 
  replyTo = null, 
  forwardEmail = null,
  templates 
}) => {
  const [to, setTo] = useState(replyTo?.senderEmail || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(
    replyTo ? `Re: ${replyTo?.subject}` : 
    forwardEmail ? `Fwd: ${forwardEmail?.subject}` : ''
  );
  const [body, setBody] = useState(
    replyTo ? `\n\n---\nOn ${new Date(replyTo.date)?.toLocaleString()}, ${replyTo?.sender} wrote:\n${replyTo?.body}` :
    forwardEmail ? `\n\n---\nForwarded message:\n${forwardEmail?.body}` : ''
  );
  const [priority, setPriority] = useState('normal');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'normal', label: 'Normal Priority' },
    { value: 'high', label: 'High Priority' }
  ];

  const templateOptions = templates?.map(t => ({
    value: t?.id,
    label: t?.name
  }));

  const handleTemplateSelect = (templateId) => {
    const template = templates?.find(t => t?.id === templateId);
    if (template) {
      setSubject(template?.subject);
      setBody(template?.body);
      setSelectedTemplate(templateId);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e?.target?.files);
    const newAttachments = files?.map(file => ({
      name: file?.name,
      size: `${(file?.size / 1024)?.toFixed(2)} KB`,
      file: file
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments?.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    const emailData = {
      to,
      cc,
      bcc,
      subject,
      body,
      priority,
      attachments,
      timestamp: new Date()?.toISOString()
    };
    onSend(emailData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-brand-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            {replyTo ? 'Reply to Message' : forwardEmail ? 'Forward Message' : 'New Message'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClose}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {templates?.length > 0 && (
            <Select
              label="Use Template"
              placeholder="Select a template"
              options={templateOptions}
              value={selectedTemplate}
              onChange={handleTemplateSelect}
              clearable
            />
          )}

          <Input
            label="To"
            type="email"
            placeholder="recipient@example.com"
            value={to}
            onChange={(e) => setTo(e?.target?.value)}
            required
          />

          <div className="flex items-center gap-2">
            {!showCc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(true)}
              >
                Add Cc
              </Button>
            )}
            {!showBcc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBcc(true)}
              >
                Add Bcc
              </Button>
            )}
          </div>

          {showCc && (
            <Input
              label="Cc"
              type="email"
              placeholder="cc@example.com"
              value={cc}
              onChange={(e) => setCc(e?.target?.value)}
            />
          )}

          {showBcc && (
            <Input
              label="Bcc"
              type="email"
              placeholder="bcc@example.com"
              value={bcc}
              onChange={(e) => setBcc(e?.target?.value)}
            />
          )}

          <Input
            label="Subject"
            type="text"
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e?.target?.value)}
            required
          />

          <Select
            label="Priority"
            options={priorityOptions}
            value={priority}
            onChange={setPriority}
          />

          <div>
            <label className="block text-sm font-caption font-medium text-foreground mb-2">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e?.target?.value)}
              placeholder="Type your message here..."
              rows={12}
              className="w-full px-4 py-3 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth resize-none"
              required
            />
          </div>

          {attachments?.length > 0 && (
            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-2">
                Attachments ({attachments?.length})
              </label>
              <div className="space-y-2">
                {attachments?.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <Icon name="File" size={20} className="text-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-caption text-foreground truncate">
                        {attachment?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {attachment?.size}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="X"
                      onClick={() => removeAttachment(index)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload">
              <Button
                variant="outline"
                iconName="Paperclip"
                iconPosition="left"
                asChild
              >
                <span>Attach Files</span>
              </Button>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 md:p-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              iconName="Save"
            >
              Save Draft
            </Button>
            <Button
              variant="default"
              iconName="Send"
              iconPosition="left"
              onClick={handleSend}
            >
              Send Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailComposer;