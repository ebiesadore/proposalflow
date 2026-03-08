import React, { useState, useEffect } from 'react';
import Icon from '../../../../components/AppIcon';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import { externalTradeService } from '../../../../services/externalTradeService';

const TradeSearchModal = ({ isOpen, onClose, onSelectTrade }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchTrades();
    }
  }, [isOpen]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await externalTradeService?.getAllTrades();
      setTrades(data);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setError(error?.message || 'Failed to load trades');
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = trades?.filter((trade) => {
    if (!searchQuery) return true;
    const query = searchQuery?.toLowerCase();
    return (
      trade?.tradeCode?.toLowerCase()?.includes(query) ||
      trade?.tradeCategory?.toLowerCase()?.includes(query) ||
      trade?.scopeOfWork?.toLowerCase()?.includes(query) ||
      trade?.description?.toLowerCase()?.includes(query)
    );
  });

  const handleSelectTrade = (trade) => {
    onSelectTrade({
      id: trade?.id,
      tradeCode: trade?.tradeCode,
      tradeCategory: trade?.tradeCategory,
      scopeOfWork: trade?.scopeOfWork,
      description: trade?.description
    });
    setSearchQuery('');
    onClose();
  };

  const getCategoryLabel = (value) => {
    const categoryMap = {
      'electrical': 'Electrical',
      'plumbing': 'Plumbing',
      'hvac': 'HVAC',
      'carpentry': 'Carpentry',
      'masonry': 'Masonry',
      'painting': 'Painting',
      'roofing': 'Roofing',
      'flooring': 'Flooring',
      'specilist': 'Specilist',
      'fire_safty': 'Fire Safty',
      'steel_fabricator': 'Steel Fabricator',
      'automation': 'Automation',
      'plasterers': 'Plasterers'
    };
    return categoryMap?.[value] || value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Select External Trade
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
              placeholder="Search by trade code, category, or scope of work..."
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
              <Button onClick={fetchTrades} className="mt-4">
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredTrades?.length > 0 ? (
                filteredTrades?.map((trade) => (
                  <button
                    key={trade?.id}
                    onClick={() => handleSelectTrade(trade)}
                    className="w-full flex flex-col gap-2 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-md bg-primary/10 text-primary font-mono font-semibold text-sm">
                          {trade?.tradeCode}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-foreground">
                          {getCategoryLabel(trade?.tradeCategory)}
                        </span>
                      </div>
                      <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Scope of Work: {trade?.scopeOfWork}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {trade?.description}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="Search" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No trades found</p>
                  {searchQuery && (
                    <p className="text-xs mt-1">Try adjusting your search query</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TradeSearchModal;