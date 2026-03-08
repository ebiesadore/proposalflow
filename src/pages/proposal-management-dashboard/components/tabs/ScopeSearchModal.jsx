import React, { useState, useEffect } from 'react';
import Icon from '../../../../components/AppIcon';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import { additionalScopeService } from '../../../../services/additionalScopeService';

const ScopeSearchModal = ({ isOpen, onClose, onSelectScope }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchScopes();
    }
  }, [isOpen]);

  const fetchScopes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await additionalScopeService?.getAllScopes();
      setScopes(data);
    } catch (error) {
      console.error('Error fetching scopes:', error);
      setError(error?.message || 'Failed to load scopes');
      setScopes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredScopes = scopes?.filter((scope) => {
    if (!searchQuery) return true;
    const query = searchQuery?.toLowerCase();
    return (
      scope?.scopeCode?.toLowerCase()?.includes(query) ||
      scope?.scopeCategory?.toLowerCase()?.includes(query) ||
      scope?.scopeOfWork?.toLowerCase()?.includes(query) ||
      scope?.description?.toLowerCase()?.includes(query)
    );
  });

  const handleSelectScope = (scope) => {
    onSelectScope({
      id: scope?.id,
      scopeCode: scope?.scopeCode,
      scopeCategory: scope?.scopeCategory,
      scopeOfWork: scope?.scopeOfWork,
      description: scope?.description
    });
    setSearchQuery('');
    onClose();
  };

  const getCategoryLabel = (value) => {
    const categoryMap = {
      'site_preparation': 'Site Preparation',
      'landscaping': 'Landscaping',
      'security_systems': 'Security Systems',
      'signage': 'Signage',
      'furniture': 'Furniture',
      'equipment': 'Equipment',
      'technology': 'Technology',
      'permits': 'Permits & Fees',
      'consulting': 'Consulting Services',
      'testing': 'Testing & Inspection',
      'warranty': 'Warranty & Maintenance',
      'vertical_mobility': 'Vertical Mobility',
      'facade': 'Facade',
      'footing': 'Footing',
      'mep': 'MEP',
      'shaft': 'Shaft',
      'balustrade': 'Balustrade',
      'wellness': 'Wellness',
      'fit_out': 'Fit Out',
      'other': 'Other'
    };
    return categoryMap?.[value] || value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Select Additional Scope
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <Input
              placeholder="Search by scope code, category, or scope of work..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e?.target?.value)}
              leftIcon={<Icon name="Search" size={18} />}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Icon name="AlertCircle" size={48} className="mx-auto mb-2 text-destructive opacity-50" />
              <p className="text-sm text-destructive">{error}</p>
              <Button onClick={fetchScopes} className="mt-4">
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredScopes?.length > 0 ? (
                filteredScopes?.map((scope) => (
                  <button
                    key={scope?.id}
                    onClick={() => handleSelectScope(scope)}
                    className="w-full flex flex-col gap-2 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-md bg-primary/10 text-primary font-mono font-semibold text-sm">
                          {scope?.scopeCode}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-foreground">
                          {getCategoryLabel(scope?.scopeCategory)}
                        </span>
                      </div>
                      <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Scope of Work: {scope?.scopeOfWork}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {scope?.description}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="Search" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No scopes found</p>
                  {searchQuery && (
                    <p className="text-xs mt-1">Try adjusting your search query</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScopeSearchModal;