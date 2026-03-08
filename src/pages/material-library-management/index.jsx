import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import Breadcrumb from '../../components/ui/Breadcrumb';
import SystemsConfigTabs from '../../components/ui/SystemsConfigTabs';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { materialService } from '../../services/materialService';

const MaterialLibraryManagement = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unitCost: '',
    unit: 'piece',
    category: '01_General Requirements',
    csiCode1: '',
    csiCode2: ''
  });
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: '00_Procurement and Contracting Requirements', label: '00_Procurement and Contracting Requirements' },
    { value: '01_General Requirements', label: '01_General Requirements' },
    { value: '02_Existing Conditions', label: '02_Existing Conditions' },
    { value: '03_Concrete', label: '03_Concrete' },
    { value: '04_Masonry', label: '04_Masonry' },
    { value: '05_Metals', label: '05_Metals' },
    { value: '06_Wood, Plastics, and Composites', label: '06_Wood, Plastics, and Composites' },
    { value: '07_Thermal and Moisture Protection', label: '07_Thermal and Moisture Protection' },
    { value: '08_Openings', label: '08_Openings' },
    { value: '09_Finishes', label: '09_Finishes' },
    { value: '10_Specialties', label: '10_Specialties' },
    { value: '11_Equipment', label: '11_Equipment' },
    { value: '12_Furnishings', label: '12_Furnishings' },
    { value: '13_Special Construction', label: '13_Special Construction' },
    { value: '14_Conveying Equipment', label: '14_Conveying Equipment' },
    { value: '21_Fire Suppression', label: '21_Fire Suppression' },
    { value: '22_Plumbing', label: '22_Plumbing' },
    { value: '23_HVAC', label: '23_HVAC' },
    { value: '25_Integrated Automation', label: '25_Integrated Automation' },
    { value: '26_Electrical', label: '26_Electrical' },
    { value: '27_Communications', label: '27_Communications' },
    { value: '28_Electronic Safety and Security', label: '28_Electronic Safety and Security' },
    { value: '31_Earthwork', label: '31_Earthwork' },
    { value: '32_Exterior Improvements', label: '32_Exterior Improvements' },
    { value: '33_Utilities', label: '33_Utilities' },
    { value: '34_Transportation', label: '34_Transportation' },
    { value: '35_Waterway and Marine Construction', label: '35_Waterway and Marine Construction' },
    { value: '40_Process Integration', label: '40_Process Integration' },
    { value: '41_Material Processing and Handling Equipment', label: '41_Material Processing and Handling Equipment' },
    { value: '42_Process Heating, Cooling, and Drying Equipment', label: '42_Process Heating, Cooling, and Drying Equipment' },
    { value: '43_Process Gas and Liquid Handling', label: '43_Process Gas and Liquid Handling' },
    { value: '44_Pollution and Waste Control Equipment', label: '44_Pollution and Waste Control Equipment' },
    { value: '45_Industry-Specific Manufacturing Equipment', label: '45_Industry-Specific Manufacturing Equipment' },
    { value: '46_Water and Wastewater Equipment', label: '46_Water and Wastewater Equipment' },
    { value: '48_Electrical Power Generation', label: '48_Electrical Power Generation' }
  ];

  const unitOptions = [
    { value: 'm', label: 'Meter (m)' },
    { value: 'ft', label: 'Feet (ft)' },
    { value: 'sqm', label: 'Square Meter (sqm)' },
    { value: 'sqft', label: 'Square Feet (sqft)' },
    { value: 'cum', label: 'Cubic Meter (cum)' },
    { value: 'cuft', label: 'Cubic Feet (cuft)' },
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'lb', label: 'Pound (lb)' },
    { value: 'L', label: 'Liter (L)' },
    { value: 'gal', label: 'Gallon (gal)' },
    { value: 'piece', label: 'Piece' },
    { value: 'box', label: 'Box' },
    { value: 'roll', label: 'Roll' },
    { value: 'sheet', label: 'Sheet' }
  ];

  useEffect(() => {
    fetchMaterials();
  }, [searchQuery, categoryFilter]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await materialService?.searchMaterials(searchQuery, categoryFilter || null);
      setMaterials(data);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError(err?.message || 'Failed to load materials');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = () => {
    setFormData({
      name: '',
      description: '',
      unitCost: '',
      unit: 'piece',
      category: '01_General Requirements',
      csiCode1: '',
      csiCode2: ''
    });
    setError('');
    setIsAddModalOpen(true);
  };

  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setFormData({
      name: material?.name || '',
      description: material?.description || '',
      unitCost: material?.unit_cost || '',
      unit: material?.unit || 'piece',
      category: material?.category || '01_General Requirements',
      csiCode1: '',
      csiCode2: ''
    });
    setError('');
    setIsEditModalOpen(true);
  };

  const handleDeleteMaterial = (material) => {
    setSelectedMaterial(material);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e?.preventDefault();
    try {
      setError('');
      await materialService?.createMaterial(formData);
      setIsAddModalOpen(false);
      fetchMaterials();
    } catch (err) {
      console.error('Error creating material:', err);
      setError(err?.message || 'Failed to create material');
    }
  };

  const handleSubmitEdit = async (e) => {
    e?.preventDefault();
    try {
      setError('');
      await materialService?.updateMaterial(selectedMaterial?.id, formData);
      setIsEditModalOpen(false);
      fetchMaterials();
    } catch (err) {
      console.error('Error updating material:', err);
      setError(err?.message || 'Failed to update material');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await materialService?.deleteMaterial(selectedMaterial?.id);
      setIsDeleteModalOpen(false);
      fetchMaterials();
    } catch (err) {
      console.error('Error deleting material:', err);
      setError(err?.message || 'Failed to delete material');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className="flex-1 flex flex-col overflow-hidden ml-[68px]">
        <div className="sticky top-0 z-40 bg-card border-b border-border">
          <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                  Material Library Management
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Manage your configurable material list
                </p>
              </div>
              <Button onClick={handleAddMaterial}>
                <Icon name="Plus" size={18} className="mr-2" />
                Add Material
              </Button>
            </div>
          </div>

          <SystemsConfigTabs />
        </div>

        <div className="flex-1 overflow-auto p-6">
          <Breadcrumb
            items={[
              { label: 'Systems Configuration', path: '/user-management-and-access-control' },
              { label: 'Materials', path: '/material-library-management' },
            ]}
          />

          <div className="bg-background border border-border rounded-lg">
            <div className="p-6 border-b border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                  leftIcon={<Icon name="Search" size={18} />}
                />
                <Select
                  options={categoryOptions}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  placeholder="Filter by category"
                  searchable
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading materials...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Icon name="AlertCircle" size={48} className="text-red-500 mb-4" />
                <p className="text-foreground font-medium text-lg mb-2">Failed to load materials</p>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchMaterials}>
                  <Icon name="RefreshCw" size={18} className="mr-2" />
                  Retry
                </Button>
              </div>
            ) : materials?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Icon name="Package" size={64} className="text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground text-lg mb-2">No materials found</p>
                <p className="text-sm text-muted-foreground mb-4">Get started by adding your first material</p>
                <Button onClick={handleAddMaterial}>
                  <Icon name="Plus" size={18} className="mr-2" />
                  Add Material
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {materials?.map((material) => (
                      <tr key={material?.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {material?.csi_code && (
                              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                                {material?.csi_code}
                              </span>
                            )}
                            <div className="text-sm font-medium text-foreground">{material?.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground max-w-xs truncate">{material?.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">${parseFloat(material?.unit_cost || 0)?.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">{material?.unit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                            {material?.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditMaterial(material)}
                            className="text-primary hover:text-primary/80 mr-4 transition-colors"
                          >
                            <Icon name="Edit" size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(material)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Icon name="Trash2" size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Add Material Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground">Add New Material</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {/* 1. Category - Moved to top */}
              <Select
                label="Category"
                options={categoryOptions?.filter(opt => opt?.value !== '')}
                value={formData?.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
              />

              {/* 2. CSI Code Section */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">CSI Code</label>
                <div className="flex items-center gap-2">
                  {/* Auto-filled 2 digits from category */}
                  <div className="w-20">
                    <Input
                      value={formData?.category?.substring(0, 2) || ''}
                      disabled
                      className="bg-muted text-center font-mono"
                    />
                  </div>
                  <span className="text-muted-foreground">.</span>
                  {/* Manual input box 1 */}
                  <div className="w-20">
                    <Input
                      placeholder="xx"
                      maxLength={2}
                      value={formData?.csiCode1}
                      onChange={(e) => {
                        const value = e?.target?.value?.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, csiCode1: value });
                      }}
                      className="text-center font-mono"
                    />
                  </div>
                  <span className="text-muted-foreground">.</span>
                  {/* Manual input box 2 */}
                  <div className="w-20">
                    <Input
                      placeholder="xx"
                      maxLength={2}
                      value={formData?.csiCode2}
                      onChange={(e) => {
                        const value = e?.target?.value?.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, csiCode2: value });
                      }}
                      className="text-center font-mono"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Format: {formData?.category?.substring(0, 2) || '00'}.{formData?.csiCode1 || 'xx'}.{formData?.csiCode2 || 'xx'}
                </p>
              </div>

              {/* 3. Material Name */}
              <Input
                label="Material Name"
                placeholder="Enter material name"
                value={formData?.name}
                onChange={(e) => setFormData({ ...formData, name: e?.target?.value })}
                required
              />

              {/* 4. Unit Selection */}
              <Select
                label="Unit Selection"
                options={unitOptions}
                value={formData?.unit}
                onChange={(value) => setFormData({ ...formData, unit: value })}
              />

              {/* 5. Unit Cost ($)* */}
              <Input
                label="Unit Cost ($)*"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData?.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e?.target?.value })}
                required
              />

              {/* 6. Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  rows="3"
                  placeholder="Enter material description"
                  value={formData?.description}
                  onChange={(e) => setFormData({ ...formData, description: e?.target?.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Material
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Material Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground">Edit Material</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <Input
                label="Material Name"
                placeholder="Enter material name"
                value={formData?.name}
                onChange={(e) => setFormData({ ...formData, name: e?.target?.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  rows="3"
                  placeholder="Enter material description"
                  value={formData?.description}
                  onChange={(e) => setFormData({ ...formData, description: e?.target?.value })}
                />
              </div>
              <Input
                label="Unit Cost ($)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData?.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e?.target?.value })}
                required
              />
              <Select
                label="Unit"
                options={unitOptions}
                value={formData?.unit}
                onChange={(value) => setFormData({ ...formData, unit: value })}
              />
              <Select
                label="Category"
                options={categoryOptions?.filter(opt => opt?.value !== '')}
                value={formData?.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
              />
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-heading font-semibold text-foreground">Delete Material</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-foreground mb-4">
                Are you sure you want to delete <strong>{selectedMaterial?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setIsDeleteModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialLibraryManagement;