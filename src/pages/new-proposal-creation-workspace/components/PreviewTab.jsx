import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PreviewTab = ({ formData, onChange }) => {
  const [previewFormat, setPreviewFormat] = useState('online');
  const [zoom, setZoom] = useState(100);

  return (
    <div className="h-full flex flex-col">
      {/* Preview Controls */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          {/* Format Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewFormat('online')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-smooth flex items-center gap-2 ${
                previewFormat === 'online' ?'bg-primary text-white' :'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Icon name="Monitor" size={16} />
              <span>Online View</span>
            </button>
            <button
              onClick={() => setPreviewFormat('pdf')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-smooth flex items-center gap-2 ${
                previewFormat === 'pdf' ?'bg-primary text-white' :'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Icon name="FileText" size={16} />
              <span>PDF View</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              iconName="ZoomOut"
              iconSize={16}
            />
            <span className="text-sm font-medium text-foreground w-16 text-center">{zoom}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              iconName="ZoomIn"
              iconSize={16}
            />
            <div className="w-px h-6 bg-border mx-2" />
            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              iconPosition="left"
              iconSize={16}
            >
              Export PDF
            </Button>
          </div>
        </div>
      </div>
      {/* Preview Content */}
      <div className="flex-1 bg-muted rounded-lg p-8 overflow-auto">
        <div
          className="bg-white shadow-brand-2xl mx-auto transition-smooth"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            width: previewFormat === 'pdf' ? '8.5in' : '100%',
            maxWidth: previewFormat === 'pdf' ? '8.5in' : '1200px',
            minHeight: previewFormat === 'pdf' ? '11in' : 'auto'
          }}
        >
          {/* Proposal Header */}
          <div className="border-b-4 border-primary p-12">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
                  {formData?.proposalTitle || 'Untitled Proposal'}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Prepared for {formData?.clientName || 'Client Name'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Date</div>
                <div className="text-lg font-semibold text-foreground">
                  {new Date()?.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Proposal Body */}
          <div className="p-12 space-y-8">
            {/* Executive Summary */}
            <section>
              <h2 className="text-2xl font-heading font-bold text-foreground mb-4 pb-2 border-b-2 border-primary/20">
                Executive Summary
              </h2>
              <p className="text-foreground leading-relaxed">
                {formData?.content || 'Your proposal content will appear here. Use the Content Builder tab to add sections and details to your proposal.'}
              </p>
            </section>

            {/* Pricing Summary */}
            <section>
              <h2 className="text-2xl font-heading font-bold text-foreground mb-4 pb-2 border-b-2 border-primary/20">
                Investment Summary
              </h2>
              <div className="bg-muted/30 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">
                      ${formData?.totalAmount?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium text-foreground">$0</span>
                  </div>
                  <div className="pt-3 border-t-2 border-border flex items-center justify-between">
                    <span className="text-xl font-bold text-foreground">Total Investment</span>
                    <span className="text-2xl font-bold text-primary">
                      ${formData?.totalAmount?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Next Steps */}
            <section>
              <h2 className="text-2xl font-heading font-bold text-foreground mb-4 pb-2 border-b-2 border-primary/20">
                Next Steps
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-foreground">
                <li>Review proposal details and pricing</li>
                <li>Schedule kickoff meeting with project team</li>
                <li>Sign agreement and provide initial payment</li>
                <li>Begin project execution as outlined</li>
              </ol>
            </section>
          </div>

          {/* Proposal Footer */}
          <div className="border-t-2 border-border p-12 bg-muted/10">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                This proposal is valid for 30 days from the date of issue
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                For questions or clarifications, please contact your project manager
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Preview Info */}
      <div className="mt-6 p-4 bg-card border border-border rounded-lg">
        <div className="flex items-start gap-2">
          <Icon name="Info" size={16} className="text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-foreground">
              This is a live preview of your proposal. Changes made in other tabs will be reflected here in real-time.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Use the Export PDF button to generate a downloadable version of this proposal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewTab;