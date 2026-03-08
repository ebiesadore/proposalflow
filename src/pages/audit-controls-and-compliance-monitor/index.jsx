import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumb from '../../components/ui/Breadcrumb';

import SystemsConfigTabs from '../../components/ui/SystemsConfigTabs';
import RoleBasedAccess from '../../components/ui/RoleBasedAccess';
import IntegrationStatus from '../../components/ui/IntegrationStatus';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import AuditLogTable from './components/AuditLogTable';
import FilterPanel from './components/FilterPanel';
import ComplianceDashboard from './components/ComplianceDashboard';
import RealTimeActivityMonitor from './components/RealTimeActivityMonitor';
import ExportReportModal from './components/ExportReportModal';
import ChangeImpactAnalysis from './components/ChangeImpactAnalysis';

const AuditControlsAndComplianceMonitor = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});

  const auditLogs = [
    {
      id: 1,
      timestamp: '2026-01-27T13:35:22',
      user: 'Sarah Johnson',
      role: 'System Administrator',
      action: 'User Role Modified',
      module: 'User Management',
      affectedRecords: 'User ID: 1247',
      ipAddress: '192.168.1.105',
      severity: 'high',
      description: 'Modified user permissions from Standard User to Administrator role',
      dataChanges: '{"role": {"from": "user", "to": "admin"}, "permissions": {"added": ["system_config", "user_management"]}}',
      device: 'Windows 11 Pro - Chrome 120.0',
      location: 'New York, NY, USA',
      sessionId: 'sess_a7f3d9e2b1c4'
    },
    {
      id: 2,
      timestamp: '2026-01-27T13:28:15',
      user: 'Michael Chen',
      role: 'Proposal Manager',
      action: 'Proposal Template Updated',
      module: 'Templates',
      affectedRecords: 'Template ID: 89',
      ipAddress: '192.168.1.142',
      severity: 'medium',
      description: 'Updated pricing section in Enterprise Proposal Template v3.2',
      dataChanges: '{"sections": {"pricing": {"updated": true}}, "version": {"from": "3.1", "to": "3.2"}}',
      device: 'macOS Sonoma - Safari 17.2',
      location: 'San Francisco, CA, USA',
      sessionId: 'sess_b8e4c1f3a2d5'
    },
    {
      id: 3,
      timestamp: '2026-01-27T13:15:48',
      user: 'Emily Rodriguez',
      role: 'Client Manager',
      action: 'Client Data Exported',
      module: 'Clients',
      affectedRecords: '247 client records',
      ipAddress: '192.168.1.89',
      severity: 'critical',
      description: 'Bulk export of client contact information for quarterly review',
      dataChanges: '{"export_type": "csv", "fields": ["name", "email", "phone", "company"], "record_count": 247}',
      device: 'Windows 11 Pro - Edge 120.0',
      location: 'Chicago, IL, USA',
      sessionId: 'sess_c9f5d2e4b3a6'
    },
    {
      id: 4,
      timestamp: '2026-01-27T13:02:33',
      user: 'David Park',
      role: 'IT Administrator',
      action: 'System Settings Changed',
      module: 'System Settings',
      affectedRecords: 'Security Configuration',
      ipAddress: '192.168.1.201',
      severity: 'high',
      description: 'Updated password policy requirements and session timeout settings',
      dataChanges: '{"password_policy": {"min_length": {"from": 8, "to": 12}, "require_special_chars": true}, "session_timeout": {"from": 30, "to": 15}}',
      device: 'Ubuntu 22.04 - Firefox 121.0',
      location: 'Austin, TX, USA',
      sessionId: 'sess_d1a6e3f5c4b7'
    },
    {
      id: 5,
      timestamp: '2026-01-27T12:48:19',
      user: 'Jessica Martinez',
      role: 'Proposal Manager',
      action: 'Proposal Created',
      module: 'Proposals',
      affectedRecords: 'Proposal ID: 3421',
      ipAddress: '192.168.1.156',
      severity: 'low',
      description: 'Created new proposal for TechCorp Enterprise Solutions project',
      dataChanges: '{"proposal_id": 3421, "client": "TechCorp", "value": 125000, "template": "Enterprise_v3.2"}',
      device: 'macOS Sonoma - Chrome 120.0',
      location: 'Seattle, WA, USA',
      sessionId: 'sess_e2b7f4a6d5c8'
    },
    {
      id: 6,
      timestamp: '2026-01-27T12:31:07',
      user: 'Robert Taylor',
      role: 'System Administrator',
      action: 'User Account Deleted',
      module: 'User Management',
      affectedRecords: 'User ID: 892',
      ipAddress: '192.168.1.105',
      severity: 'critical',
      description: 'Permanently deleted inactive user account after 90-day retention period',
      dataChanges: '{"user_id": 892, "username": "jsmith@company.com", "deletion_reason": "retention_policy", "data_archived": true}',
      device: 'Windows 11 Pro - Chrome 120.0',
      location: 'New York, NY, USA',
      sessionId: 'sess_f3c8a5b7e6d9'
    },
    {
      id: 7,
      timestamp: '2026-01-27T12:15:42',
      user: 'Amanda Wilson',
      role: 'Audit Manager',
      action: 'Compliance Report Generated',
      module: 'Audit Controls',
      affectedRecords: 'Report ID: 2026-Q1-SOX',
      ipAddress: '192.168.1.178',
      severity: 'medium',
      description: 'Generated quarterly SOX compliance report for Q1 2026',
      dataChanges: '{"report_type": "SOX", "period": "Q1-2026", "violations": 0, "compliance_score": 98.5}',
      device: 'Windows 11 Pro - Edge 120.0',
      location: 'Boston, MA, USA',
      sessionId: 'sess_g4d9b6c8f7e1'
    },
    {
      id: 8,
      timestamp: '2026-01-27T11:58:26',
      user: 'System Automated',
      role: 'System Process',
      action: 'Automated Backup Completed',
      module: 'System Settings',
      affectedRecords: 'Database Backup',
      ipAddress: '127.0.0.1',
      severity: 'low',
      description: 'Daily automated database backup completed successfully',
      dataChanges: '{"backup_size": "2.4GB", "duration": "8m 32s", "status": "success", "location": "s3://backups/2026-01-27"}',
      device: 'Server - Automated Process',
      location: 'Data Center - Virginia',
      sessionId: 'sess_system_auto_001'
    }
  ];

  const complianceData = [
    {
      id: 1,
      title: 'SOX Compliance',
      icon: 'Shield',
      compliance: 98,
      violations: 2,
      lastAudit: '2026-01-25T00:00:00'
    },
    {
      id: 2,
      title: 'GDPR Compliance',
      icon: 'Lock',
      compliance: 96,
      violations: 3,
      lastAudit: '2026-01-24T00:00:00'
    },
    {
      id: 3,
      title: 'Data Retention',
      icon: 'Database',
      compliance: 100,
      violations: 0,
      lastAudit: '2026-01-27T00:00:00'
    },
    {
      id: 4,
      title: 'Access Control',
      icon: 'Key',
      compliance: 94,
      violations: 5,
      lastAudit: '2026-01-26T00:00:00'
    }
  ];

  const realtimeActivities = [
    {
      id: 1,
      user: 'Sarah Johnson',
      action: 'Modified user permissions for account ID 1247',
      timestamp: '2026-01-27T13:35:22',
      status: 'warning'
    },
    {
      id: 2,
      user: 'Michael Chen',
      action: 'Updated proposal template Enterprise_v3.2',
      timestamp: '2026-01-27T13:28:15',
      status: 'success'
    },
    {
      id: 3,
      user: 'Emily Rodriguez',
      action: 'Exported 247 client records to CSV',
      timestamp: '2026-01-27T13:15:48',
      status: 'warning'
    },
    {
      id: 4,
      user: 'System Automated',
      action: 'Completed daily database backup (2.4GB)',
      timestamp: '2026-01-27T11:58:26',
      status: 'success'
    }
  ];

  const impactAnalysisData = [
    {
      id: 1,
      title: 'Password Policy Update',
      timestamp: '2026-01-27T13:02:33',
      impact: 'high',
      affectedSystems: ['Authentication', 'User Management', 'SSO Integration'],
      affectedUsers: 342,
      cascadingEffects: [
        'All users must reset passwords on next login',
        'Legacy API integrations require credential updates',
        'Mobile app authentication flow modified'
      ]
    },
    {
      id: 2,
      title: 'Template Version Update',
      timestamp: '2026-01-27T13:28:15',
      impact: 'medium',
      affectedSystems: ['Proposal Management', 'PDF Generation'],
      affectedUsers: 28,
      cascadingEffects: [
        'Active proposals using old template require review',
        'Pricing calculations updated across 15 proposals'
      ]
    }
  ];

  const savedPresets = [
    {
      id: 1,
      name: 'SOX Audit',
      filters: {
        dateFrom: '2026-01-01',
        dateTo: '2026-01-27',
        severity: 'high',
        module: 'user_management'
      }
    },
    {
      id: 2,
      name: 'Security Events',
      filters: {
        dateFrom: '2026-01-20',
        dateTo: '2026-01-27',
        severity: 'critical',
        action: 'delete'
      }
    }
  ];

  const handleRowExpand = (id) => {
    setExpandedRows((prev) =>
      prev?.includes(id) ? prev?.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSavePreset = (filters) => {
    console.log('Saving filter preset:', filters);
  };

  const handleExport = (config) => {
    console.log('Exporting report with config:', config);
  };

  const filteredLogs = auditLogs?.filter((log) => {
    if (filters?.user && !log?.user?.toLowerCase()?.includes(filters?.user?.toLowerCase())) {
      return false;
    }
    if (filters?.action && log?.action !== filters?.action) {
      return false;
    }
    if (filters?.module && log?.module !== filters?.module) {
      return false;
    }
    if (filters?.severity && log?.severity !== filters?.severity) {
      return false;
    }
    if (filters?.searchQuery) {
      const searchLower = filters?.searchQuery?.toLowerCase();
      return (log?.user?.toLowerCase()?.includes(searchLower) ||
      log?.action?.toLowerCase()?.includes(searchLower) || log?.description?.toLowerCase()?.includes(searchLower));
    }
    return true;
  });

  const logsPerPage = 10;
  const totalPages = Math.ceil(filteredLogs?.length / logsPerPage);
  const paginatedLogs = filteredLogs?.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  return (
    <RoleBasedAccess requiredPermission="admin">
      <Helmet>
        <title>Audit Controls and Compliance Monitor - NeXSYS CORE™</title>
        <meta
          name="description"
          content="Comprehensive audit trail visualization and compliance monitoring system with tamper-proof activity tracking and regulatory oversight"
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={setSidebarCollapsed} />

        <div className="ml-[68px] transition-smooth">
          <div className="sticky top-0 z-40 bg-card border-b border-border">
            <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                    Audit Controls & Compliance Monitor
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Comprehensive audit trail visualization and regulatory oversight system
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <IntegrationStatus compact />
                  <Button
                    variant="default"
                    iconName="Download"
                    iconPosition="left"
                    onClick={() => setIsExportModalOpen(true)}
                  >
                    Export Report
                  </Button>
                </div>
              </div>
            </div>

            <SystemsConfigTabs />
          </div>

          <main className="p-4 md:p-6 lg:p-8">
            <Breadcrumb
              items={[
                { label: 'Systems Configuration', path: '/user-management-and-access-control' },
                { label: 'Audit Controls', path: '/audit-controls-and-compliance-monitor' },
              ]}
            />

            <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
              <ComplianceDashboard complianceData={complianceData} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <FilterPanel
                    onFilterChange={handleFilterChange}
                    onSavePreset={handleSavePreset}
                    savedPresets={savedPresets}
                  />
                </div>
                <div>
                  <RealTimeActivityMonitor activities={realtimeActivities} />
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border shadow-brand">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 md:px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Icon name="FileText" size={20} className="text-primary" />
                    <h2 className="font-heading font-semibold text-base md:text-lg text-foreground">
                      Audit Log Entries
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full font-caption font-medium text-xs">
                      {filteredLogs?.length} records
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" iconName="RefreshCw">
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" iconName="Search">
                      Advanced Search
                    </Button>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  <AuditLogTable
                    logs={paginatedLogs}
                    onRowExpand={handleRowExpand}
                    expandedRows={expandedRows}
                  />

                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * logsPerPage + 1} to{' '}
                        {Math.min(currentPage * logsPerPage, filteredLogs?.length)} of{' '}
                        {filteredLogs?.length} entries
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          iconName="ChevronLeft"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg font-caption font-medium text-sm transition-smooth ${
                                  currentPage === pageNum
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted text-foreground'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          iconName="ChevronRight"
                          iconPosition="right"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <ChangeImpactAnalysis impactData={impactAnalysisData} />

              <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Icon name="AlertTriangle" size={20} className="text-warning" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
                      Anomaly Detection
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Automated monitoring for suspicious activity patterns
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="CheckCircle" size={16} className="text-success" />
                      <span className="font-caption font-medium text-sm text-success">
                        Normal Activity
                      </span>
                    </div>
                    <p className="text-2xl font-heading font-bold text-foreground">
                      98.5%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last 24 hours
                    </p>
                  </div>
                  <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="AlertTriangle" size={16} className="text-warning" />
                      <span className="font-caption font-medium text-sm text-warning">
                        Flagged Events
                      </span>
                    </div>
                    <p className="text-2xl font-heading font-bold text-foreground">
                      3
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requires review
                    </p>
                  </div>
                  <div className="bg-error/5 border border-error/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="XCircle" size={16} className="text-error" />
                      <span className="font-caption font-medium text-sm text-error">
                        Critical Alerts
                      </span>
                    </div>
                    <p className="text-2xl font-heading font-bold text-foreground">
                      0
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No immediate action needed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <footer className="border-t border-border bg-card mt-12">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  &copy; {new Date()?.getFullYear()} NeXSYS CORE<sup className="text-xs">™</sup>. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    Terms of Service
                  </a>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    Documentation
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />
    </RoleBasedAccess>
  );
};

export default AuditControlsAndComplianceMonitor;