import React, { useState, useEffect } from 'react';
import Icon from '../../../../components/AppIcon';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import { materialService } from '../../../../services/materialService';
import Select from '../../../../components/ui/Select';


const ItemSearchModal = ({ isOpen, onClose, onSelectItem }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'Structural', label: 'Structural' },
    { value: 'Electrical', label: 'Electrical' },
    { value: 'Plumbing', label: 'Plumbing' },
    { value: 'HVAC', label: 'HVAC' },
    { value: 'Finishing', label: 'Finishing' },
    { value: 'Flooring', label: 'Flooring' },
    { value: 'Roofing', label: 'Roofing' },
    { value: 'Insulation', label: 'Insulation' },
    { value: 'Hardware', label: 'Hardware' },
    { value: 'Other', label: 'Other' }
  ];

  useEffect(() => {
    if (isOpen && !showAddNew) {
      fetchMaterials();
    }
  }, [isOpen, searchQuery, categoryFilter, showAddNew]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await materialService?.searchMaterials(searchQuery, categoryFilter || null);
      setLibraryItems(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setLibraryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = libraryItems;

  const handleSelectItem = (item) => {
    onSelectItem({
      id: item?.id,
      name: item?.name,
      unitCost: item?.unit_cost || 0,
      csiCode: item?.csi_code || ''
    });
    setSearchQuery('');
    setCategoryFilter('');
    onClose();
  };

  const handleAddNewItem = () => {
    if (newItemName) {
      onSelectItem({
        id: Date.now(),
        name: newItemName,
        unitCost: 0
      });
      setNewItemName('');
      setShowAddNew(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-heading font-semibold text-foreground">
            {showAddNew ? 'Add New Item' : 'Select Item from Library'}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6">
          {!showAddNew ? (
            <>
              <div className="mb-4 space-y-3">
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                  leftIcon={<Icon name="Search" size={18} />}
                />
                <Select
                  options={categoryOptions}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  placeholder="Filter by category"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
                  {filteredItems?.length > 0 ? (
                    filteredItems?.map((item) => (
                      <button
                        key={item?.id}
                        onClick={() => handleSelectItem(item)}
                        className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {item?.csi_code && (
                              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                {item?.csi_code}
                              </span>
                            )}
                            <p className="font-medium text-foreground">{item?.name}</p>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground">
                              ${parseFloat(item?.unit_cost || 0)?.toFixed(2)} / {item?.unit}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {item?.category}
                            </span>
                          </div>
                        </div>
                        <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="Search" size={48} className="mx-auto mb-2 opacity-50" />
                      <p>No items found</p>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={() => setShowAddNew(true)}
                variant="outline"
                className="w-full"
              >
                <Icon name="Plus" size={18} className="mr-2" />
                Add New Item
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <Input
                  label="Item Name"
                  placeholder="Enter item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e?.target?.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowAddNew(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Library
                </Button>
                <Button
                  onClick={handleAddNewItem}
                  className="flex-1"
                  disabled={!newItemName}
                >
                  Add Item
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemSearchModal;