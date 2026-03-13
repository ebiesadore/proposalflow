import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';

const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'bg-gray-500', textColor: 'text-gray-500', borderColor: 'border-gray-400', dotColor: 'bg-gray-400' },
    under_review: { label: 'Under Review', color: 'bg-yellow-500', textColor: 'text-yellow-500', borderColor: 'border-yellow-400', dotColor: 'bg-yellow-400' },
    approved: { label: 'Approved', color: 'bg-green-600', textColor: 'text-green-600', borderColor: 'border-green-500', dotColor: 'bg-green-500' },
    superseded: { label: 'Superseded', color: 'bg-slate-500', textColor: 'text-slate-400', borderColor: 'border-slate-400', dotColor: 'bg-slate-400' },
};

const VersionCard = ({ version, isLatest, onPreview, onRestore, onStatusChange, isExpanded, onToggleExpand }) => {
    const status = STATUS_CONFIG?.[version?.version_status] || STATUS_CONFIG?.draft;
    const authorName = version?.author?.full_name || version?.author?.email || 'Unknown';

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr)?.toLocaleDateString('en-US', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatCurrency = (val) => {
        if (!val && val !== 0) return '$0';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })?.format(val);
    };

    return (
        <div className={`relative bg-card border rounded-lg transition-all duration-200 ${isLatest ? 'border-[#436958] shadow-sm' : 'border-border hover:border-muted-foreground/40'}`}>
            {/* Version Header */}
            <div
                className="flex items-start gap-3 p-4 cursor-pointer"
                onClick={onToggleExpand}
            >
                {/* Version Number Badge */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${isLatest ? 'bg-[#436958]' : 'bg-muted-foreground/60'}`}>
                    V{version?.version_number}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate">
                            {version?.version_label || `Version ${version?.version_number}`}
                        </span>
                        {isLatest && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[#436958]/10 text-[#436958] font-medium">Latest</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${status?.color}`}>
                            {status?.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Icon name="Calendar" size={11} />
                            {formatDate(version?.versioned_at)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Icon name="User" size={11} />
                            {authorName}
                        </span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-foreground">
                        {formatCurrency(version?.proposal_value)}
                    </div>
                </div>

                <Icon
                    name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                    size={16}
                    className="flex-shrink-0 text-muted-foreground mt-1"
                />
            </div>
            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                    {version?.change_notes && (
                        <div className="mb-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Change Notes</p>
                            <p className="text-sm text-foreground bg-muted/40 rounded p-2">{version?.change_notes}</p>
                        </div>
                    )}

                    {/* Status Change */}
                    <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Update Status</p>
                        <div className="flex flex-wrap gap-1.5">
                            {Object.entries(STATUS_CONFIG)?.map(([key, cfg]) => (
                                <button
                                    key={key}
                                    onClick={() => onStatusChange(version?.id, key)}
                                    className={`text-xs px-2 py-1 rounded-full border transition-all ${
                                        version?.version_status === key
                                            ? `${cfg?.color} text-white border-transparent`
                                            : `bg-transparent ${cfg?.textColor} ${cfg?.borderColor} hover:opacity-80`
                                    }`}
                                >
                                    {cfg?.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPreview(version)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                            <Icon name="Eye" size={13} />
                            Preview
                        </button>
                        <button
                            onClick={() => onRestore(version)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-[#436958] text-white hover:bg-[#436958]/90 transition-colors"
                        >
                            <Icon name="RotateCcw" size={13} />
                            Restore
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VersionCard;
