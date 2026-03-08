import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Input from './Input';

import Button from './Button';
import { Checkbox } from './Checkbox';
import { searchService } from '../../services/searchService';
import { useAuth } from '../../contexts/AuthContext';

const GlobalSearch = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ proposals: [], clients: [], templates: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const searchInputRef = useRef(null);

  // Filters state
  const [filters, setFilters] = useState({
    modules: ['proposals', 'clients', 'templates'],
    status: [],
    clientStatus: [],
    templateStatus: [],
    dateFrom: '',
    dateTo: '',
    valueMin: '',
    valueMax: '',
    industry: '',
    category: ''
  });

  // Saved filters (localStorage)
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterName, setFilterName] = useState('');

  // Search history (localStorage)
  const [searchHistory, setSearchHistory] = useState([]);

  // Quick filters
  const quickFilters = [
    { label: 'All Modules', modules: ['proposals', 'clients', 'templates'] },
    { label: 'Proposals Only', modules: ['proposals'] },
    { label: 'Clients Only', modules: ['clients'] },
    { label: 'Templates Only', modules: ['templates'] },
    { label: 'Active Items', status: ['Active', 'Draft', 'Pending'] },
    { label: 'This Week', dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)?.toISOString()?.split('T')?.[0] }
  ];

  const statusOptions = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Won', label: 'Won' },
    { value: 'Lost', label: 'Lost' },
    { value: 'Archived', label: 'Archived' }
  ];

  const clientStatusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Pending', label: 'Pending' }
  ];

  const templateStatusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Archived', label: 'Archived' }
  ];

  // Load saved filters and history from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`nexsys-saved-filters-${user?.id}`);
      if (saved) {
        setSavedFilters(JSON.parse(saved));
      }

      const history = localStorage.getItem(`nexsys-search-history-${user?.id}`);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    }
  }, [user]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef?.current) {
      searchInputRef?.current?.focus();
    }
  }, [isOpen]);

  // Perform search
  const performSearch = async () => {
    if (!searchQuery?.trim() && !hasActiveFilters()) return;

    setLoading(true);
    try {
      const results = await searchService?.searchAll(searchQuery, filters);
      setSearchResults(results);

      // Add to search history
      if (searchQuery?.trim()) {
        addToSearchHistory(searchQuery, filters);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters?.status?.length > 0 ||
      filters?.clientStatus?.length > 0 ||
      filters?.templateStatus?.length > 0 ||
      filters?.dateFrom ||
      filters?.dateTo ||
      filters?.valueMin ||
      filters?.valueMax ||
      filters?.industry ||
      filters?.category
    );
  };

  // Add to search history
  const addToSearchHistory = (query, appliedFilters) => {
    const historyItem = {
      id: Date.now(),
      query,
      filters: appliedFilters,
      timestamp: new Date()?.toISOString()
    };

    const newHistory = [historyItem, ...searchHistory?.slice(0, 9)]; // Keep last 10
    setSearchHistory(newHistory);
    localStorage.setItem(`nexsys-search-history-${user?.id}`, JSON.stringify(newHistory));
  };

  // Save current filter
  const saveCurrentFilter = () => {
    if (!filterName?.trim()) return;

    const newFilter = {
      id: Date.now(),
      name: filterName,
      filters: { ...filters },
      createdAt: new Date()?.toISOString()
    };

    const newSavedFilters = [...savedFilters, newFilter];
    setSavedFilters(newSavedFilters);
    localStorage.setItem(`nexsys-saved-filters-${user?.id}`, JSON.stringify(newSavedFilters));
    setFilterName('');
  };

  // Load saved filter
  const loadSavedFilter = (savedFilter) => {
    setFilters(savedFilter?.filters);
    setShowSavedFilters(false);
  };

  // Delete saved filter
  const deleteSavedFilter = (filterId) => {
    const newSavedFilters = savedFilters?.filter(f => f?.id !== filterId);
    setSavedFilters(newSavedFilters);
    localStorage.setItem(`nexsys-saved-filters-${user?.id}`, JSON.stringify(newSavedFilters));
  };

  // Load from history
  const loadFromHistory = (historyItem) => {
    setSearchQuery(historyItem?.query);
    setFilters(historyItem?.filters);
    setShowHistory(false);
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(`nexsys-search-history-${user?.id}`);
  };

  // Apply quick filter
  const applyQuickFilter = (quickFilter) => {
    setFilters(prev => ({
      ...prev,
      ...quickFilter
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      modules: ['proposals', 'clients', 'templates'],
      status: [],
      clientStatus: [],
      templateStatus: [],
      dateFrom: '',
      dateTo: '',
      valueMin: '',
      valueMax: '',
      industry: '',
      category: ''
    });
    setSearchQuery('');
    setSearchResults({ proposals: [], clients: [], templates: [], total: 0 });
  };

  // Navigate to result
  const navigateToResult = (result) => {
    if (result?.module === 'proposals') {
      navigate('/proposal-management-dashboard');
    } else if (result?.module === 'clients') {
      navigate('/client-management-dashboard');
    } else if (result?.module === 'templates') {
      navigate('/proposal-template-management-studio');
    }
    onClose();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to open search
      if ((e?.ctrlKey || e?.metaKey) && e?.key === 'k') {
        e?.preventDefault();
        if (!isOpen) {
          // Trigger open from parent
        }
      }
      // Escape to close
      if (e?.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Search Modal */}
      <div className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl z-50 animate-in slide-in-from-top duration-300">
        <div className="bg-card border border-border rounded-lg shadow-brand-xl overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Icon name="Search" size={20} className="text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search proposals, clients, templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value)}
                onKeyDown={(e) => e?.key === 'Enter' && performSearch()}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Quick filters:</span>
              {quickFilters?.map((qf, idx) => (
                <button
                  key={idx}
                  onClick={() => applyQuickFilter(qf)}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-full text-xs font-caption transition-smooth"
                >
                  {qf?.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Icon name="Filter" size={14} className="mr-1" />
                Advanced Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavedFilters(!showSavedFilters)}
              >
                <Icon name="Bookmark" size={14} className="mr-1" />
                Saved Filters ({savedFilters?.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <Icon name="Clock" size={14} className="mr-1" />
                History
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {(searchQuery || hasActiveFilters()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  <Icon name="X" size={14} className="mr-1" />
                  Clear All
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={performSearch}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="p-4 bg-muted/20 border-b border-border space-y-4">
              {/* Module Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Search In</label>
                <div className="flex items-center gap-4">
                  <Checkbox
                    label="Proposals"
                    checked={filters?.modules?.includes('proposals')}
                    onChange={(checked) => {
                      setFilters(prev => ({
                        ...prev,
                        modules: checked 
                          ? [...prev?.modules, 'proposals']
                          : prev?.modules?.filter(m => m !== 'proposals')
                      }));
                    }}
                  />
                  <Checkbox
                    label="Clients"
                    checked={filters?.modules?.includes('clients')}
                    onChange={(checked) => {
                      setFilters(prev => ({
                        ...prev,
                        modules: checked 
                          ? [...prev?.modules, 'clients']
                          : prev?.modules?.filter(m => m !== 'clients')
                      }));
                    }}
                  />
                  <Checkbox
                    label="Templates"
                    checked={filters?.modules?.includes('templates')}
                    onChange={(checked) => {
                      setFilters(prev => ({
                        ...prev,
                        modules: checked 
                          ? [...prev?.modules, 'templates']
                          : prev?.modules?.filter(m => m !== 'templates')
                      }));
                    }}
                  />
                </div>
              </div>

              {/* Status Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Proposal Status */}
                {filters?.modules?.includes('proposals') && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Proposal Status</label>
                    <div className="space-y-2">
                      {statusOptions?.map(opt => (
                        <Checkbox
                          key={opt?.value}
                          label={opt?.label}
                          checked={filters?.status?.includes(opt?.value)}
                          onChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              status: checked
                                ? [...prev?.status, opt?.value]
                                : prev?.status?.filter(s => s !== opt?.value)
                            }));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Client Status */}
                {filters?.modules?.includes('clients') && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Client Status</label>
                    <div className="space-y-2">
                      {clientStatusOptions?.map(opt => (
                        <Checkbox
                          key={opt?.value}
                          label={opt?.label}
                          checked={filters?.clientStatus?.includes(opt?.value)}
                          onChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              clientStatus: checked
                                ? [...prev?.clientStatus, opt?.value]
                                : prev?.clientStatus?.filter(s => s !== opt?.value)
                            }));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Template Status */}
                {filters?.modules?.includes('templates') && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Template Status</label>
                    <div className="space-y-2">
                      {templateStatusOptions?.map(opt => (
                        <Checkbox
                          key={opt?.value}
                          label={opt?.label}
                          checked={filters?.templateStatus?.includes(opt?.value)}
                          onChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              templateStatus: checked
                                ? [...prev?.templateStatus, opt?.value]
                                : prev?.templateStatus?.filter(s => s !== opt?.value)
                            }));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Date From</label>
                  <Input
                    type="date"
                    value={filters?.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e?.target?.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Date To</label>
                  <Input
                    type="date"
                    value={filters?.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e?.target?.value }))}
                  />
                </div>
              </div>

              {/* Value Range (for proposals) */}
              {filters?.modules?.includes('proposals') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Min Value</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters?.valueMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, valueMin: e?.target?.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Max Value</label>
                    <Input
                      type="number"
                      placeholder="1000000"
                      value={filters?.valueMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, valueMax: e?.target?.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Save Filter */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Input
                  placeholder="Filter name..."
                  value={filterName}
                  onChange={(e) => setFilterName(e?.target?.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveCurrentFilter}
                  disabled={!filterName?.trim()}
                >
                  <Icon name="Save" size={14} className="mr-1" />
                  Save Filter
                </Button>
              </div>
            </div>
          )}

          {/* Saved Filters Panel */}
          {showSavedFilters && (
            <div className="p-4 bg-muted/20 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Saved Filters</h3>
              </div>
              {savedFilters?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved filters yet</p>
              ) : (
                <div className="space-y-2">
                  {savedFilters?.map(sf => (
                    <div key={sf?.id} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{sf?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sf?.createdAt)?.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadSavedFilter(sf)}
                        >
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSavedFilter(sf?.id)}
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search History Panel */}
          {showHistory && (
            <div className="p-4 bg-muted/20 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Recent Searches</h3>
                {searchHistory?.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearchHistory}
                  >
                    Clear History
                  </Button>
                )}
              </div>
              {searchHistory?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No search history</p>
              ) : (
                <div className="space-y-2">
                  {searchHistory?.map(item => (
                    <div 
                      key={item?.id} 
                      className="flex items-center justify-between p-2 bg-background rounded border border-border cursor-pointer hover:bg-muted/50 transition-smooth"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item?.query}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item?.timestamp)?.toLocaleString()}
                        </p>
                      </div>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Searching...</p>
              </div>
            ) : searchResults?.total === 0 && (searchQuery || hasActiveFilters()) ? (
              <div className="p-8 text-center">
                <Icon name="Search" size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No results found</p>
              </div>
            ) : searchResults?.total > 0 ? (
              <div className="p-4 space-y-4">
                {/* Proposals */}
                {searchResults?.proposals?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Icon name="FileText" size={16} />
                      Proposals ({searchResults?.proposals?.length})
                    </h3>
                    <div className="space-y-2">
                      {searchResults?.proposals?.map(result => (
                        <div
                          key={result?.id}
                          onClick={() => navigateToResult(result)}
                          className="p-3 bg-background rounded border border-border hover:bg-muted/50 cursor-pointer transition-smooth"
                        >
                          <p className="text-sm font-medium text-foreground">{result?.displayTitle}</p>
                          <p className="text-xs text-muted-foreground">{result?.displaySubtitle}</p>
                          <p className="text-xs text-muted-foreground mt-1">{result?.displayMeta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clients */}
                {searchResults?.clients?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Icon name="Users" size={16} />
                      Clients ({searchResults?.clients?.length})
                    </h3>
                    <div className="space-y-2">
                      {searchResults?.clients?.map(result => (
                        <div
                          key={result?.id}
                          onClick={() => navigateToResult(result)}
                          className="p-3 bg-background rounded border border-border hover:bg-muted/50 cursor-pointer transition-smooth"
                        >
                          <p className="text-sm font-medium text-foreground">{result?.displayTitle}</p>
                          <p className="text-xs text-muted-foreground">{result?.displaySubtitle}</p>
                          <p className="text-xs text-muted-foreground mt-1">{result?.displayMeta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Templates */}
                {searchResults?.templates?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Icon name="Layout" size={16} />
                      Templates ({searchResults?.templates?.length})
                    </h3>
                    <div className="space-y-2">
                      {searchResults?.templates?.map(result => (
                        <div
                          key={result?.id}
                          onClick={() => navigateToResult(result)}
                          className="p-3 bg-background rounded border border-border hover:bg-muted/50 cursor-pointer transition-smooth"
                        >
                          <p className="text-sm font-medium text-foreground">{result?.displayTitle}</p>
                          <p className="text-xs text-muted-foreground">{result?.displaySubtitle}</p>
                          <p className="text-xs text-muted-foreground mt-1">{result?.displayMeta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Icon name="Search" size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Start typing to search</p>
                <p className="text-xs text-muted-foreground mt-1">Press Ctrl+K to open search anytime</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalSearch;
