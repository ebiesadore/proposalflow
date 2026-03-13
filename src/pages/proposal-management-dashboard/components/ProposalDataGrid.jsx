import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/AppIcon';
import { storageService } from '../../../services/storageService';
import { proposalService } from '../../../services/proposalService';

import { Checkbox } from '../../../components/ui/Checkbox';

const StatusDropdown = ({ currentStatus, onStatusChange, onClose, position }) => {
  const statusOptions = [
    { value: 'Draft', label: 'Draft', bgColor: 'bg-gray-500', hoverColor: '#B0AAA7' },
    { value: 'Pending', label: 'Pending', bgColor: 'bg-yellow-500', hoverColor: '#D4A017' },
    { value: 'Approved', label: 'Approved', bgColor: 'bg-orange-500', hoverColor: '#D67715' },
    { value: 'Won', label: 'Won', bgColor: 'bg-green-600', hoverColor: '#277510' }
  ];

  const handleStatusClick = (status) => {
    onStatusChange(status);
    onClose();
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div 
        className="fixed z-50 rounded-lg shadow-brand-lg py-1 min-w-[140px]"
        style={{ top: position?.y, left: position?.x, backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
      >
        {statusOptions?.map((option) => (
          <button
            key={option?.value}
            onClick={() => handleStatusClick(option?.value)}
            className="w-full px-3 py-2 text-left text-sm font-caption transition-colors flex items-center gap-2"
            style={{
              backgroundColor: currentStatus === option?.value ? '#f3f4f6' : '#ffffff',
              color: '#1f2937'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = option?.hoverColor;
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = currentStatus === option?.value ? '#f3f4f6' : '#ffffff';
              e.currentTarget.style.color = '#1f2937';
            }}
          >
            <div className={`w-2 h-2 rounded-full ${option?.bgColor}`} />
            {option?.label}
          </button>
        ))}
      </div>
    </>,
    document.body
  );
};

const ProposalDataGrid = ({ 
  proposals, 
  selectedProposals, 
  onSelectionChange, 
  onSort, 
  sortConfig, 
  onEdit, 
  onDelete,
  onOpenDeleteModal,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  onStatusChange,
  getActionStatus
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [statusDropdown, setStatusDropdown] = useState(null);
  const [logoUrls, setLogoUrls] = useState({});
  const [versionNumbers, setVersionNumbers] = useState({});

  // FEATURE FLAG: Enhanced loading states
  const LOADING_STATES_ENABLED = import.meta.env?.VITE_ENABLE_LOADING_STATES === 'true';

  // Fetch logo URLs for all clients
  useEffect(() => {
    let isMounted = true;

    const fetchLogoUrls = async () => {
      if (!proposals?.length) return;

      try {
        // Fetch all logos in parallel
        const logoPromises = proposals?.filter(proposal => proposal?.client?.logo)?.map(async (proposal) => {
            try {
              const url = await storageService?.getClientLogoUrl(proposal?.client?.logo);
              return { clientId: proposal?.client?.id, url };
            } catch (error) {
              // Ignore abort errors (component unmounted)
              if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
                return null;
              }
              console.error('Failed to fetch logo for client:', proposal?.client?.id, error);
              return null;
            }
          });

        const results = await Promise.all(logoPromises);
        
        // Only update state if component is still mounted
        if (isMounted) {
          const urls = {};
          results?.forEach(result => {
            if (result?.url) {
              urls[result.clientId] = result?.url;
            }
          });
          setLogoUrls(urls);
        }
      } catch (error) {
        // Ignore abort errors
        if (error?.name !== 'AbortError' && !error?.message?.includes('aborted')) {
          console.error('Failed to fetch logo URLs:', error);
        }
      }
    };

    fetchLogoUrls();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [proposals]);

  // Fetch latest version numbers for all proposals
  useEffect(() => {
    let isMounted = true;

    const fetchVersionNumbers = async () => {
      if (!proposals?.length) return;
      try {
        const versionPromises = proposals?.map(async (proposal) => {
          try {
            const { data } = await proposalService?.getLatestVersionNumber(proposal?.id);
            return { proposalId: proposal?.id, versionNumber: data || 0 };
          } catch {
            return { proposalId: proposal?.id, versionNumber: 0 };
          }
        });
        const results = await Promise.all(versionPromises);
        if (isMounted) {
          const nums = {};
          results?.forEach(r => { nums[r?.proposalId] = r?.versionNumber; });
          setVersionNumbers(nums);
        }
      } catch (err) {
        // Silently fail — version badges are non-critical
      }
    };

    fetchVersionNumbers();
    return () => { isMounted = false; };
  }, [proposals]);

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-500 text-white',
      'Pending': 'bg-warning/10 text-warning',
      'Approved': 'bg-orange-500 text-white',
      'Won': 'bg-green-600 text-white'
    };
    return colors?.[status] || colors?.Draft;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'Draft': 'Draft',
      'Pending': 'Pending',
      'Approved': 'Approved',
      'Won': 'Won'
    };
    return labels?.[status] || status;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(value);
  };

  const formatCurrencyRate = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })?.format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange(proposals?.map(p => p?.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectProposal = (proposalId, checked) => {
    if (checked) {
      onSelectionChange([...selectedProposals, proposalId]);
    } else {
      onSelectionChange(selectedProposals?.filter(id => id !== proposalId));
    }
  };

  const handleContextMenu = (e, proposal) => {
    e?.preventDefault();
    setContextMenu({
      x: e?.clientX,
      y: e?.clientY,
      proposal
    });
  };

  const handleSort = (column) => {
    onSort(column);
  };

  const getSortIcon = (column) => {
    if (sortConfig?.column !== column) return 'ChevronsUpDown';
    return sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown';
  };

  const handleStatusClick = (e, proposal) => {
    e?.stopPropagation();
    const rect = e?.currentTarget?.getBoundingClientRect();
    setStatusDropdown({
      proposal,
      x: rect?.left,
      y: rect?.bottom + 4
    });
  };

  const handleStatusChange = async (proposalId, newStatus) => {
    if (onStatusChange) {
      await onStatusChange(proposalId, newStatus);
    }
    setStatusDropdown(null);
  };

  const columns = [
    { key: 'id', label: 'Project No.', sortable: true, width: 'w-20' },
    { key: 'client', label: 'Client', sortable: true, width: 'w-40' },
    { key: 'title', label: 'Project Name', sortable: true, width: 'w-64' },
    { key: 'status', label: 'Status', sortable: true, width: 'w-32' },
    { key: 'projectType', label: 'Project Type', sortable: true, width: 'w-32' },
    { key: 'program', label: 'Program', sortable: true, width: 'w-28' },
    { key: 'assignedTo', label: 'Client Contact', sortable: true, width: 'w-40' },
    { key: 'createdDate', label: 'Created', sortable: true, width: 'w-32' },
    { key: 'totalAreaFt2', label: 'Area (Ft²)', sortable: true, width: 'w-32' },
    { key: 'value', label: 'Value', sortable: true, width: 'w-32' },
    { key: 'ft2RateBUA', label: 'Ft² Rate BUA', sortable: true, width: 'w-32' },
    { key: 'actions', label: 'Actions', sortable: false, width: 'w-24' }
  ];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <Checkbox
                  checked={selectedProposals?.length === proposals?.length && proposals?.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              {columns?.map((column) => (
                <th
                  key={column?.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${column?.width}`}
                >
                  {column?.sortable ? (
                    <button
                      onClick={() => handleSort(column?.key)}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      {column?.label}
                      <Icon name={getSortIcon(column?.key)} className="w-4 h-4" />
                    </button>
                  ) : (
                    column?.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {proposals?.map((proposal) => (
              <tr
                key={proposal?.id}
                className="hover:bg-muted/30 transition-colors"
                onContextMenu={(e) => handleContextMenu(e, proposal)}
              >
                <td className="px-4 py-4">
                  <Checkbox
                    checked={selectedProposals?.includes(proposal?.id)}
                    onCheckedChange={(checked) => handleSelectProposal(proposal?.id, checked)}
                  />
                </td>
                <td className="px-4 py-4">
                  <span className="font-caption text-sm text-foreground font-medium whitespace-nowrap">
                    {proposal?.project_number || proposal?.id}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {logoUrls?.[proposal?.client?.id] ? (
                      <img 
                        src={logoUrls?.[proposal?.client?.id]} 
                        alt={proposal?.client?.company_name || 'Client logo'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Icon name="Building2" size={16} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-body text-sm font-medium text-foreground">
                        {proposal?.client?.company_name || 'No Client'}
                      </span>
                      
                      {/* Phase 1: Action Status Indicator */}
                      {LOADING_STATES_ENABLED && getActionStatus && (() => {
                        const status = getActionStatus(proposal?.id);
                        if (!status) return null;
                        
                        return (
                          <div className="flex items-center gap-1 mt-1">
                            {status === 'deleting' && (
                              <>
                                <Icon name="Loader2" size={10} className="animate-spin text-destructive" />
                                <span className="text-xs text-destructive">Deleting...</span>
                              </>
                            )}
                            {status === 'saving' && (
                              <>
                                <Icon name="Loader2" size={10} className="animate-spin text-blue-600" />
                                <span className="text-xs text-blue-600">Saving...</span>
                              </>
                            )}
                            {status === 'saved' && (
                              <>
                                <Icon name="CheckCircle2" size={10} className="text-success" />
                                <span className="text-xs text-success">Saved</span>
                              </>
                            )}
                            {status === 'error' && (
                              <>
                                <Icon name="AlertCircle" size={10} className="text-destructive" />
                                <span className="text-xs text-destructive">Error</span>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit(proposal)}
                      className="font-caption text-sm text-foreground line-clamp-2 hover:text-primary hover:underline transition-colors text-left"
                    >
                      {proposal?.projectName || proposal?.title}
                    </button>
                    {versionNumbers?.[proposal?.id] > 0 && (
                      <span className="inline-flex items-center gap-0.5 flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-medium bg-[#436958]/10 text-[#436958]">
                        <Icon name="GitBranch" size={10} />
                        V{versionNumbers?.[proposal?.id]}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 relative">
                  <button
                    onClick={(e) => handleStatusClick(e, proposal)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-caption font-medium transition-colors cursor-pointer hover:opacity-80 ${getStatusColor(proposal?.status)}`}
                  >
                    {getStatusLabel(proposal?.status)}
                    <Icon name="ChevronDown" className="w-3 h-3" />
                  </button>
                  {statusDropdown?.proposal?.id === proposal?.id && (
                    <StatusDropdown
                      currentStatus={proposal?.status}
                      onStatusChange={(newStatus) => handleStatusChange(proposal?.id, newStatus)}
                      onClose={() => setStatusDropdown(null)}
                      position={{ x: statusDropdown?.x, y: statusDropdown?.y }}
                    />
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className="font-caption text-sm text-foreground">
                    {proposal?.projectType || 'Standard'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-caption text-sm text-foreground">
                    {proposal?.program ? `${proposal?.program?.toFixed(0)} weeks` : 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => onEdit(proposal)}
                    className="font-caption text-sm text-foreground hover:text-primary hover:underline transition-colors"
                  >
                    {proposal?.assignedTo}
                  </button>
                </td>
                <td className="px-4 py-4">
                  <span className="font-caption text-sm text-muted-foreground">
                    {formatDate(proposal?.createdDate)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-caption font-medium text-sm text-foreground whitespace-nowrap">
                    {proposal?.totalAreaFt2?.toFixed(2)?.replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0.00'} Ft²
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-caption font-medium text-sm text-foreground whitespace-nowrap">
                    {formatCurrency(proposal?.value)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-caption font-medium text-sm text-foreground whitespace-nowrap">
                    {formatCurrencyRate(parseFloat(proposal?.ft2RateBUA) || 0)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button 
                    onClick={(e) => handleContextMenu(e, proposal)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-smooth"
                  >
                    <Icon name="MoreVertical" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-popover border border-border rounded-lg shadow-brand-lg py-2 min-w-[180px]"
            style={{ top: contextMenu?.y, left: contextMenu?.x }}
          >
            <button 
              onClick={() => {
                onEdit(contextMenu?.proposal);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm font-caption hover:bg-muted transition-smooth flex items-center gap-2"
            >
              <Icon name="Edit" size={16} />
              Edit Proposal
            </button>
            <button className="w-full px-4 py-2 text-left text-sm font-caption hover:bg-muted transition-smooth flex items-center gap-2">
              <Icon name="Download" size={16} />
              Export PDF
            </button>
            <div className="my-1 border-t border-border" />
            <button 
              onClick={() => {
                onOpenDeleteModal(contextMenu?.proposal);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm font-caption text-destructive hover:bg-muted transition-smooth flex items-center gap-2"
            >
              <Icon name="Trash2" size={16} />
              Delete
            </button>
          </div>
        </>
      )}
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-4 border-t border-border">
        {/* Left: Rows per page selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-caption text-muted-foreground">Rows per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e?.target?.value))}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-caption text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm font-caption text-muted-foreground">
            {totalItems > 0 ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}` : '0 of 0'}
          </span>
        </div>

        {/* Right: Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
            title="First page"
          >
            <Icon name="ChevronsLeft" size={16} />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
            title="Previous page"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          
          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              ?.filter(page => {
                // Show first page, last page, current page, and pages around current
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              ?.map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array?.[index - 1] !== page - 1 && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <button
                    onClick={() => onPageChange(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-caption transition-smooth ${
                      currentPage === page
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border hover:bg-muted'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
            title="Next page"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
            title="Last page"
          >
            <Icon name="ChevronsRight" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProposalDataGrid;