import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AuditLogTable = ({ logs, onRowExpand, expandedRows }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig?.key === key && sortConfig?.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedLogs = [...logs]?.sort((a, b) => {
    if (sortConfig?.direction === 'asc') {
      return a?.[sortConfig?.key] > b?.[sortConfig?.key] ? 1 : -1;
    }
    return a?.[sortConfig?.key] < b?.[sortConfig?.key] ? 1 : -1;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-error bg-error/10';
      case 'high':
        return 'text-warning bg-warning/10';
      case 'medium':
        return 'text-accent bg-accent/10';
      default:
        return 'text-success bg-success/10';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date?.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px]">
        <thead className="bg-muted border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => handleSort('timestamp')}
                className="flex items-center gap-2 font-caption font-medium text-sm text-foreground hover:text-primary transition-smooth"
              >
                Timestamp
                <Icon
                  name={sortConfig?.key === 'timestamp' && sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                  size={16}
                />
              </button>
            </th>
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => handleSort('user')}
                className="flex items-center gap-2 font-caption font-medium text-sm text-foreground hover:text-primary transition-smooth"
              >
                User
                <Icon
                  name={sortConfig?.key === 'user' && sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                  size={16}
                />
              </button>
            </th>
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => handleSort('action')}
                className="flex items-center gap-2 font-caption font-medium text-sm text-foreground hover:text-primary transition-smooth"
              >
                Action
                <Icon
                  name={sortConfig?.key === 'action' && sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown'}
                  size={16}
                />
              </button>
            </th>
            <th className="px-4 py-3 text-left font-caption font-medium text-sm text-foreground">
              Affected Records
            </th>
            <th className="px-4 py-3 text-left font-caption font-medium text-sm text-foreground">
              IP Address
            </th>
            <th className="px-4 py-3 text-left font-caption font-medium text-sm text-foreground">
              Severity
            </th>
            <th className="px-4 py-3 text-left font-caption font-medium text-sm text-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedLogs?.map((log) => (
            <React.Fragment key={log?.id}>
              <tr className="hover:bg-muted/50 transition-smooth">
                <td className="px-4 py-4">
                  <div className="font-mono text-xs text-foreground whitespace-nowrap">
                    {formatTimestamp(log?.timestamp)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="User" size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-caption font-medium text-sm text-foreground truncate">
                        {log?.user}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {log?.role}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-caption text-sm text-foreground">
                    {log?.action}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {log?.module}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-caption text-sm text-foreground">
                    {log?.affectedRecords}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {log?.ipAddress}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-caption font-medium text-xs ${getSeverityColor(log?.severity)}`}>
                    <Icon name="AlertCircle" size={12} />
                    {log?.severity}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName={expandedRows?.includes(log?.id) ? 'ChevronUp' : 'ChevronDown'}
                    iconPosition="right"
                    onClick={() => onRowExpand(log?.id)}
                  >
                    Details
                  </Button>
                </td>
              </tr>
              {expandedRows?.includes(log?.id) && (
                <tr className="bg-muted/30">
                  <td colSpan="7" className="px-4 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-caption font-semibold text-sm text-foreground mb-3">
                          Change Details
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Icon name="FileText" size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">Description</div>
                              <div className="font-caption text-sm text-foreground mt-1">
                                {log?.description}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Icon name="Database" size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">Data Changes</div>
                              <div className="font-mono text-xs text-foreground mt-1 bg-background p-3 rounded-lg overflow-x-auto">
                                {log?.dataChanges}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-caption font-semibold text-sm text-foreground mb-3">
                          Session Information
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon name="Monitor" size={16} className="text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">Device</div>
                              <div className="font-caption text-sm text-foreground truncate">
                                {log?.device}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="MapPin" size={16} className="text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">Location</div>
                              <div className="font-caption text-sm text-foreground truncate">
                                {log?.location}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="Hash" size={16} className="text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">Session ID</div>
                              <div className="font-mono text-xs text-foreground truncate">
                                {log?.sessionId}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLogTable;