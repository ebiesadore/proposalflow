import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const ExportReportModal = ({ isOpen, onClose, onExport }) => {
  const [exportConfig, setExportConfig] = useState({
    format: 'pdf',
    reportType: 'sox',
    dateRange: 'last_30_days',
    includeDetails: true,
    includeCharts: true,
    includeRawData: false
  });

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'excel', label: 'Excel Spreadsheet' },
    { value: 'csv', label: 'CSV File' },
    { value: 'json', label: 'JSON Data' }
  ];

  const reportTypeOptions = [
    { value: 'sox', label: 'SOX Compliance Report' },
    { value: 'gdpr', label: 'GDPR Compliance Report' },
    { value: 'internal', label: 'Internal Audit Report' },
    { value: 'security', label: 'Security Audit Report' },
    { value: 'custom', label: 'Custom Report' }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleExport = () => {
    onExport(exportConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-xl border border-border shadow-brand-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Download" size={20} className="text-primary" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground">
              Export Audit Report
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-smooth"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <Select
            label="Report Type"
            description="Select the compliance framework for the report"
            options={reportTypeOptions}
            value={exportConfig?.reportType}
            onChange={(value) => setExportConfig({ ...exportConfig, reportType: value })}
          />

          <Select
            label="Export Format"
            description="Choose the file format for the exported report"
            options={formatOptions}
            value={exportConfig?.format}
            onChange={(value) => setExportConfig({ ...exportConfig, format: value })}
          />

          <Select
            label="Date Range"
            description="Select the time period for the audit data"
            options={dateRangeOptions}
            value={exportConfig?.dateRange}
            onChange={(value) => setExportConfig({ ...exportConfig, dateRange: value })}
          />

          {exportConfig?.dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Start Date"
              />
              <Input
                type="date"
                label="End Date"
              />
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="font-caption font-semibold text-sm text-foreground mb-3">
              Report Options
            </h4>
            <Checkbox
              label="Include Detailed Logs"
              description="Add full audit log entries to the report"
              checked={exportConfig?.includeDetails}
              onChange={(e) => setExportConfig({ ...exportConfig, includeDetails: e?.target?.checked })}
            />
            <Checkbox
              label="Include Charts & Visualizations"
              description="Add compliance charts and trend graphs"
              checked={exportConfig?.includeCharts}
              onChange={(e) => setExportConfig({ ...exportConfig, includeCharts: e?.target?.checked })}
            />
            <Checkbox
              label="Include Raw Data"
              description="Append raw data tables for further analysis"
              checked={exportConfig?.includeRawData}
              onChange={(e) => setExportConfig({ ...exportConfig, includeRawData: e?.target?.checked })}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-caption font-medium text-sm text-foreground mb-1">
                  Report Generation
                </p>
                <p className="text-xs text-muted-foreground">
                  Large reports may take several minutes to generate. You'll receive a notification when your report is ready for download.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            iconName="Download"
            iconPosition="left"
            onClick={handleExport}
          >
            Generate Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal;