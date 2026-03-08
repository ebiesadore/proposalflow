import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import { Copy, RefreshCw } from 'lucide-react';

const AddModuleModal = ({ isOpen, onClose, onSave, editingModule }) => {
  const [formData, setFormData] = useState({
    moduleUid: '',
    moduleName: '',
    category: '',
    areaUse: '',
    quantity: '',
    weightKg: '',
    weightTonnage: '',
    costPerUnit: '',
    unitRatePSF: '', // Unit Rate $ PSF = Cost per Unit $
    moduleFeatures: 'dry',
    wallSystems: false,
    fenestration: false,
    cladding: false,
    description: '',
    // Module Dimensions - mm
    lengthMM: '',
    widthMM: '',
    heightMM: '',
    // Module Dimensions - feet
    lengthFeet: '',
    widthFeet: '',
    heightFeet: '',
    // Calculated values
    areaMM: '',
    areaFeet: '',
    volumeM3: '',
    volumeFeet: ''
  });

  const [errors, setErrors] = useState({});

  // Generate Module UID on mount or populate with editing data
  useEffect(() => {
    if (isOpen) {
      if (editingModule) {
        // Populate form with editing module data
        setFormData({
          moduleUid: editingModule?.moduleUid || '',
          moduleName: editingModule?.moduleName || '',
          category: editingModule?.category || '',
          areaUse: editingModule?.areaUse || '',
          quantity: editingModule?.quantity || '',
          weightKg: editingModule?.weightKg || '',
          weightTonnage: editingModule?.weightTonnage || '',
          costPerUnit: editingModule?.costPerUnit || '',
          unitRatePSF: editingModule?.unitRatePSF || editingModule?.costPerUnit || '',
          moduleFeatures: editingModule?.moduleFeatures || 'dry',
          wallSystems: editingModule?.wallSystems || false,
          fenestration: editingModule?.fenestration || false,
          cladding: editingModule?.cladding || false,
          description: editingModule?.description || '',
          lengthMM: editingModule?.lengthMM || '',
          widthMM: editingModule?.widthMM || '',
          heightMM: editingModule?.heightMM || '',
          lengthFeet: editingModule?.lengthFeet || '',
          widthFeet: editingModule?.widthFeet || '',
          heightFeet: editingModule?.heightFeet || '',
          areaMM: editingModule?.areaMM || '',
          areaFeet: editingModule?.areaFeet || '',
          volumeM3: editingModule?.volumeM3 || '',
          volumeFeet: editingModule?.volumeFeet || ''
        });
      } else {
        generateModuleUid();
      }
    }
  }, [isOpen, editingModule]);

  const generateModuleUid = () => {
    const timestamp = Date.now();
    const uid = `MOD-${timestamp}-0EN03`;
    setFormData(prev => ({ ...prev, moduleUid: uid }));
  };

  // Calculate area and volume for mm
  const calculateMmValues = (length, width, height) => {
    let areaMM = '';
    let volumeM3 = '';
    let areaFeet = '';
    let volumeFeet = '';

    if (length && width) {
      const lengthVal = parseFloat(length);
      const widthVal = parseFloat(width);
      
      if (!isNaN(lengthVal) && !isNaN(widthVal) && lengthVal > 0 && widthVal > 0) {
        const areaInMm2 = lengthVal * widthVal;
        const areaInM2 = areaInMm2 / 1000000; // Convert mm² to m²
        areaMM = areaInM2?.toFixed(2);

        // Also calculate feet values from mm
        const lengthFt = lengthVal / 304.8;
        const widthFt = widthVal / 304.8;
        const areaInFt2 = lengthFt * widthFt;
        areaFeet = areaInFt2?.toFixed(2);

        if (height) {
          const heightVal = parseFloat(height);
          if (!isNaN(heightVal) && heightVal > 0) {
            const volumeInMm3 = areaInMm2 * heightVal;
            const volumeInM3 = volumeInMm3 / 1000000000; // Convert mm³ to m³
            volumeM3 = volumeInM3?.toFixed(3);

            // Also calculate volume in feet
            const heightFt = heightVal / 304.8;
            const volumeInFt3 = areaInFt2 * heightFt;
            volumeFeet = volumeInFt3?.toFixed(3);
          }
        }
      }
    }

    return { areaMM, volumeM3, areaFeet, volumeFeet };
  };

  // Calculate area and volume for feet
  const calculateFeetValues = (length, width, height) => {
    let areaFeet = '';
    let volumeFeet = '';
    let areaMM = '';
    let volumeM3 = '';

    if (length && width) {
      const lengthVal = parseFloat(length);
      const widthVal = parseFloat(width);
      
      if (!isNaN(lengthVal) && !isNaN(widthVal) && lengthVal > 0 && widthVal > 0) {
        const areaInFt2 = lengthVal * widthVal;
        areaFeet = areaInFt2?.toFixed(2);

        // Also calculate metric values from feet
        const lengthMm = lengthVal * 304.8;
        const widthMm = widthVal * 304.8;
        const areaInMm2 = lengthMm * widthMm;
        const areaInM2 = areaInMm2 / 1000000;
        areaMM = areaInM2?.toFixed(2);

        if (height) {
          const heightVal = parseFloat(height);
          if (!isNaN(heightVal) && heightVal > 0) {
            const volumeInFt3 = areaInFt2 * heightVal;
            volumeFeet = volumeInFt3?.toFixed(3);

            // Also calculate volume in m³
            const heightMm = heightVal * 304.8;
            const volumeInMm3 = areaInMm2 * heightMm;
            const volumeInM3 = volumeInMm3 / 1000000000;
            volumeM3 = volumeInM3?.toFixed(3);
          }
        }
      }
    }

    return { areaFeet, volumeFeet, areaMM, volumeM3 };
  };

  const categoryOptions = [
    { value: 'ppvc-module', label: 'PPVC Module' },
    { value: 'floor-cassettes', label: 'floor Cassettes' },
    { value: 'roof-cassettes', label: 'Roof Cassettes' },
    { value: 'roof-modules-flat', label: 'Roof Modules Flat' },
    { value: 'roof-module-pitched', label: 'Roof Module Pitched' },
    { value: 'roof-module-hybrid', label: 'Roof Module Hybrid' },
    { value: 'panelized-module', label: 'Panelized Module' },
    { value: 'kit-of-parts', label: 'Kit of Parts' }
  ];

  const areaUseOptions = [
    { value: 'living-space', label: 'Living Space' },
    { value: 'bedroom', label: 'Bedroom' },
    { value: 'bathroom', label: 'Bathroom' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'office', label: 'Office' },
    { value: 'storage', label: 'Storage' },
    { value: 'utility', label: 'Utility' },
    { value: 'common-area', label: 'Common Area' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    
    let updatedFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    // Auto-convert weight to tonnage
    if (name === 'weightKg' && value) {
      const tonnage = (parseFloat(value) / 1000)?.toFixed(3);
      updatedFormData.weightTonnage = tonnage;
    }

    // Unit Rate $ PSF = Cost per Unit $
    if (name === 'costPerUnit' && value) {
      updatedFormData.unitRatePSF = value;
    }

    // Handle mm dimension changes
    if (name === 'lengthMM' || name === 'widthMM' || name === 'heightMM') {
      // Clear feet input values when mm is used
      if (value) {
        updatedFormData.lengthFeet = '';
        updatedFormData.widthFeet = '';
        updatedFormData.heightFeet = '';
      }

      // Calculate both mm and feet values
      const { areaMM, volumeM3, areaFeet, volumeFeet } = calculateMmValues(
        name === 'lengthMM' ? value : updatedFormData?.lengthMM,
        name === 'widthMM' ? value : updatedFormData?.widthMM,
        name === 'heightMM' ? value : updatedFormData?.heightMM
      );
      updatedFormData.areaMM = areaMM;
      updatedFormData.volumeM3 = volumeM3;
      updatedFormData.areaFeet = areaFeet;
      updatedFormData.volumeFeet = volumeFeet;
    }

    // Handle feet dimension changes
    if (name === 'lengthFeet' || name === 'widthFeet' || name === 'heightFeet') {
      // Clear mm input values when feet is used
      if (value) {
        updatedFormData.lengthMM = '';
        updatedFormData.widthMM = '';
        updatedFormData.heightMM = '';
      }

      // Calculate both feet and mm values
      const { areaFeet, volumeFeet, areaMM, volumeM3 } = calculateFeetValues(
        name === 'lengthFeet' ? value : updatedFormData?.lengthFeet,
        name === 'widthFeet' ? value : updatedFormData?.widthFeet,
        name === 'heightFeet' ? value : updatedFormData?.heightFeet
      );
      updatedFormData.areaFeet = areaFeet;
      updatedFormData.volumeFeet = volumeFeet;
      updatedFormData.areaMM = areaMM;
      updatedFormData.volumeM3 = volumeM3;
    }

    setFormData(updatedFormData);

    // Clear error for this field
    if (errors?.[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name) => (value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors?.[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCopyUid = () => {
    navigator?.clipboard?.writeText(formData?.moduleUid);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.moduleName?.trim()) newErrors.moduleName = 'Module name is required';
    if (!formData?.category) newErrors.category = 'Category is required';
    if (!formData?.areaUse) newErrors.areaUse = 'Area use is required';
    if (!formData?.quantity || parseFloat(formData?.quantity) <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    if (!formData?.weightKg || parseFloat(formData?.weightKg) <= 0) {
      newErrors.weightKg = 'Valid weight is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateForm()) {
      onSave(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      moduleUid: '',
      moduleName: '',
      category: '',
      areaUse: '',
      quantity: '',
      weightKg: '',
      weightTonnage: '',
      costPerUnit: '',
      unitRatePSF: '',
      moduleFeatures: 'dry',
      wallSystems: false,
      fenestration: false,
      cladding: false,
      description: '',
      lengthMM: '',
      widthMM: '',
      heightMM: '',
      lengthFeet: '',
      widthFeet: '',
      heightFeet: '',
      areaMM: '',
      areaFeet: '',
      volumeM3: '',
      volumeFeet: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-3xl bg-card rounded-lg border border-border shadow-brand-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name="Box" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold text-foreground">
                {editingModule ? 'Edit Module' : 'Create New Module'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Define module specifications and configuration
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Module UID */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Module UID <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={formData?.moduleUid}
                  disabled
                  className="flex-1 bg-muted/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUid}
                  title="Copy UID"
                >
                  <Copy size={16} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateModuleUid}
                  title="Regenerate UID"
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
            </div>

            {/* Module Name & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Module Name"
                name="moduleName"
                type="text"
                placeholder="Enter module name"
                value={formData?.moduleName}
                onChange={handleInputChange}
                error={errors?.moduleName}
                required
              />
              <Select
                label="Category"
                options={categoryOptions}
                value={formData?.category}
                onChange={handleSelectChange('category')}
                placeholder="Select module category"
                error={errors?.category}
                required
              />
            </div>

            {/* Area Use & Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Area Use"
                options={areaUseOptions}
                value={formData?.areaUse}
                onChange={handleSelectChange('areaUse')}
                placeholder="Select area use"
                error={errors?.areaUse}
                required
              />
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                placeholder="Enter quantity"
                value={formData?.quantity}
                onChange={handleInputChange}
                error={errors?.quantity}
                min="1"
                required
              />
            </div>

            {/* Weight (KG) & Tonnage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Weight (KG)"
                name="weightKg"
                type="number"
                placeholder="Enter weight in kilograms"
                value={formData?.weightKg}
                onChange={handleInputChange}
                error={errors?.weightKg}
                min="0"
                step="0.01"
                required
              />
              <Input
                label="Weight (Tonnage)"
                name="weightTonnage"
                type="text"
                value={formData?.weightTonnage}
                disabled
                className="bg-muted/50"
              />
              <Input
                label="Cost per Unit $"
                name="costPerUnit"
                type="number"
                placeholder="Enter cost per unit"
                value={formData?.costPerUnit}
                onChange={handleInputChange}
                error={errors?.costPerUnit}
                min="0"
                step="0.01"
              />
            </div>

            {/* Module Dimensions */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Module Dimensions
              </label>
              
              {/* MM Dimensions */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Millimeters (mm)</p>
                <div className="grid grid-cols-1 gap-3">
                  {/* Length, Width, Height - MM */}
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-2">
                      <Input
                        label="Length (mm)"
                        name="lengthMM"
                        type="number"
                        placeholder="Length"
                        value={formData?.lengthMM}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        disabled={formData?.lengthFeet || formData?.widthFeet || formData?.heightFeet}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label="Width (mm)"
                        name="widthMM"
                        type="number"
                        placeholder="Width"
                        value={formData?.widthMM}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        disabled={formData?.lengthFeet || formData?.widthFeet || formData?.heightFeet}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label="Height (mm)"
                        name="heightMM"
                        type="number"
                        placeholder="Height"
                        value={formData?.heightMM}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        disabled={formData?.lengthFeet || formData?.widthFeet || formData?.heightFeet}
                      />
                    </div>
                    <div className="col-span-6 flex gap-2 pt-6">
                      <div className="flex-1 px-3 py-2 bg-muted/30 rounded-md border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Area (m²)</p>
                        <p className="text-sm font-medium text-foreground">
                          {formData?.areaMM || '0.00'} m²
                        </p>
                      </div>
                      <div className="flex-1 px-3 py-2 bg-muted/30 rounded-md border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Volume (m³)</p>
                        <p className="text-sm font-medium text-foreground">
                          {formData?.volumeM3 || '0.000'} m³
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feet Dimensions */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Feet (decimal format, e.g., 9.5 = 9 feet 6 inches)</p>
                <div className="grid grid-cols-1 gap-3">
                  {/* Length, Width, Height - Feet */}
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-2">
                      <Input
                        label="Length (ft)"
                        name="lengthFeet"
                        type="number"
                        placeholder="Length"
                        value={formData?.lengthFeet}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        disabled={formData?.lengthMM || formData?.widthMM || formData?.heightMM}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label="Width (ft)"
                        name="widthFeet"
                        type="number"
                        placeholder="Width"
                        value={formData?.widthFeet}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        disabled={formData?.lengthMM || formData?.widthMM || formData?.heightMM}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label="Height (ft)"
                        name="heightFeet"
                        type="number"
                        placeholder="Height"
                        value={formData?.heightFeet}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        disabled={formData?.lengthMM || formData?.widthMM || formData?.heightMM}
                      />
                    </div>
                    <div className="col-span-6 flex gap-2 pt-6">
                      <div className="flex-1 px-3 py-2 bg-muted/30 rounded-md border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Area (ft²)</p>
                        <p className="text-sm font-medium text-foreground">
                          {formData?.areaFeet || '0.00'} ft²
                        </p>
                      </div>
                      <div className="flex-1 px-3 py-2 bg-muted/30 rounded-md border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Volume (ft³)</p>
                        <p className="text-sm font-medium text-foreground">
                          {formData?.volumeFeet || '0.000'} ft³
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Module Features */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Module Features
              </label>
              
              {/* Dry or Wet Unit */}
              <div className="mb-2">
                <p className="text-sm text-muted-foreground mb-2">Dry or Wet Unit</p>
              </div>
              
              {/* Single row with radio buttons and checkboxes side by side */}
              <div className="flex items-center gap-8">
                {/* Dry/Wet Radio Buttons */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="moduleFeatures"
                      value="dry"
                      checked={formData?.moduleFeatures === 'dry'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary border-border focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Dry</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="moduleFeatures"
                      value="wet"
                      checked={formData?.moduleFeatures === 'wet'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary border-border focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Wet</span>
                  </label>
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="wallSystems"
                      checked={formData?.wallSystems}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Wall Systems</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="fenestration"
                      checked={formData?.fenestration}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Fenestration</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="cladding"
                      checked={formData?.cladding}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Cladding</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData?.description}
                onChange={handleInputChange}
                placeholder="Add additional notes or specifications"
                rows={4}
                className="w-full px-3 py-2 text-sm text-foreground bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            iconName="Check"
            iconPosition="left"
            iconSize={16}
          >
            {editingModule ? 'Update Module' : 'Add Module'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddModuleModal;