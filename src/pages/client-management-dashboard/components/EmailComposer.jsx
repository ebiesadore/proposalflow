import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const EmailComposer = ({ client, onClose, onSend }) => {
  const [emailData, setEmailData] = useState({
    to: client?.email || '',
    subject: '',
    template: '',
    message: '',
    attachments: [],
  });

  const templateOptions = [
    { value: '', label: 'Select Template' },
    { value: 'proposal_followup', label: 'Proposal Follow-up' },
    { value: 'meeting_request', label: 'Meeting Request' },
    { value: 'status_update', label: 'Status Update' },
    { value: 'thank_you', label: 'Thank You Note' },
  ];

  const handleTemplateChange = (value) => {
    setEmailData({ ...emailData, template: value });
    if (value === 'proposal_followup') {
      setEmailData({
        ...emailData,
        template: value,
        subject: 'Follow-up on Recent Proposal',
        message: `Dear ${client?.primaryContact || 'Client'},\n\nI hope this email finds you well. I wanted to follow up on the proposal we recently submitted for your review.\n\nPlease let me know if you have any questions or need additional information.\n\nBest regards,`,
      });
    }
  };

  const handleSend = () => {
    onSend(emailData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg border border-border shadow-brand-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Compose Email
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-smooth"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <Input
            label="To"
            type="email"
            value={emailData?.to}
            onChange={(e) => setEmailData({ ...emailData, to: e?.target?.value })}
            required
          />

          <Select
            label="Email Template"
            options={templateOptions}
            value={emailData?.template}
            onChange={handleTemplateChange}
          />

          <Input
            label="Subject"
            type="text"
            value={emailData?.subject}
            onChange={(e) => setEmailData({ ...emailData, subject: e?.target?.value })}
            required
          />

          <div>
            <label className="block text-sm font-caption font-medium text-foreground mb-2">
              Message
            </label>
            <textarea
              value={emailData?.message}
              onChange={(e) => setEmailData({ ...emailData, message: e?.target?.value })}
              rows={10}
              className="w-full px-4 py-3 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth resize-none"
              placeholder="Type your message here..."
            />
          </div>

          <div>
            <label className="block text-sm font-caption font-medium text-foreground mb-2">
              Attachments
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-smooth cursor-pointer">
              <Icon name="Upload" size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop files here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOC, DOCX up to 10MB
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            iconName="Send"
            iconPosition="left"
            onClick={handleSend}
          >
            Send Email
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailComposer;