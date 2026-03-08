import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { X, Upload } from 'lucide-react';
import { storageService } from '../../../services/storageService';
import { supabase } from '../../../lib/supabase';

const AddClientModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    industry: '',
    website: '',
    companySize: '',
    
    // Primary Contact
    primaryContact: '',
    email: '',
    phone: '',
    jobTitle: '',
    
    // Secondary Contact (Optional)
    secondaryContact: '',
    secondaryEmail: '',
    secondaryPhone: '',
    
    // Company Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    
    // Billing Information
    billingAddressSame: true,
    billingAddressLine1: '',
    billingAddressLine2: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: '',
    
    // Client Preferences
    preferredContactMethod: 'email',
    timezone: '',
    language: 'English',
    
    // Business Details
    annualRevenue: '',
    clientSource: '',
    notes: '',
    tags: ''
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const industryOptions = [
    { value: 'Technology', label: 'Technology' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Education', label: 'Education' },
    { value: 'Real Estate', label: 'Real Estate' },
    { value: 'Consulting', label: 'Consulting' },
    { value: 'Other', label: 'Other' }
  ];

  const companySizeOptions = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' }
  ];

  const contactMethodOptions = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'both', label: 'Both' }
  ];

  const clientSourceOptions = [
    { value: 'Referral', label: 'Referral' },
    { value: 'Website', label: 'Website' },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Cold Outreach', label: 'Cold Outreach' },
    { value: 'Event', label: 'Event/Conference' },
    { value: 'Partner', label: 'Partner' },
    { value: 'Other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
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

  const handleKeyDown = (e) => {
    // Prevent Enter key from submitting the form in ALL cases except textarea
    if (e?.key === 'Enter' && e?.target?.tagName !== 'TEXTAREA') {
      e?.preventDefault();
      e?.stopPropagation();
      return false;
    }
  };

  const handleLogoChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes?.includes(file?.type)) {
      setErrors(prev => ({ ...prev, logo: 'Please upload a valid image (JPEG, PNG, WebP, or SVG)' }));
      return;
    }

    // Validate file size (5MB)
    if (file?.size > 5242880) {
      setErrors(prev => ({ ...prev, logo: 'Logo file size must be less than 5MB' }));
      return;
    }

    setLogoFile(file);
    setErrors(prev => ({ ...prev, logo: '' }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader?.result);
    };
    reader?.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setErrors(prev => ({ ...prev, logo: '' }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData?.companyName?.trim()) newErrors.companyName = 'Company name is required';
      if (!formData?.industry) newErrors.industry = 'Industry is required';
      if (!formData?.primaryContact?.trim()) newErrors.primaryContact = 'Primary contact is required';
      if (!formData?.email?.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData?.phone?.trim()) newErrors.phone = 'Phone is required';
    }

    if (step === 2) {
      // Address fields are optional - no required validation
      if (!formData?.billingAddressSame) {
        // Only validate billing address if user explicitly unchecked "same as company address"
        // and has started filling in billing fields
        const hasBillingData = formData?.billingAddressLine1?.trim() || formData?.billingCity?.trim();
        if (hasBillingData) {
          if (!formData?.billingAddressLine1?.trim()) newErrors.billingAddressLine1 = 'Billing address is required';
          if (!formData?.billingCity?.trim()) newErrors.billingCity = 'Billing city is required';
          if (!formData?.billingState?.trim()) newErrors.billingState = 'Billing state is required';
          if (!formData?.billingZipCode?.trim()) newErrors.billingZipCode = 'Billing ZIP code is required';
          if (!formData?.billingCountry?.trim()) newErrors.billingCountry = 'Billing country is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    setSaveError(null);
    await handleSubmit(new Event('submit'));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (validateStep(currentStep)) {
      setUploadingLogo(true);
      setIsSaving(true);
      setSaveError(null);
      let logoPath = '';

      try {
        // Upload logo if provided
        if (logoFile) {
          const { data: { user } } = await supabase?.auth?.getUser();
          if (!user) throw new Error('Not authenticated');
          
          logoPath = await storageService?.uploadClientLogo(logoFile, user?.id);
        }

        // Build location string only if city/state are provided
        const locationParts = [formData?.city?.trim(), formData?.state?.trim()]?.filter(Boolean);
        const location = locationParts?.length > 0 ? locationParts?.join(', ') : '';

        // Prepare client data for Supabase
        const clientData = {
          companyName: formData?.companyName,
          industry: formData?.industry,
          primaryContact: formData?.primaryContact,
          email: formData?.email,
          phone: formData?.phone,
          location: location,
          status: 'Active',
          clientSince: new Date()?.getFullYear()?.toString(),
          description: formData?.notes || `${formData?.companyName} - ${formData?.industry} company`,
          logo: logoPath,
          logoAlt: `${formData?.companyName} company logo`
        };
        
        await onSave(clientData);
      } catch (error) {
        console.error('Submit error:', error);
        setSaveError(error?.message || 'Failed to add client');
        setErrors(prev => ({ ...prev, submit: error?.message || 'Failed to add client' }));
      } finally {
        setUploadingLogo(false);
        setIsSaving(false);
      }
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          1
        </div>
        <div className={`h-1 w-12 ${
          currentStep >= 2 ? 'bg-primary' : 'bg-muted'
        }`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          2
        </div>
        <div className={`h-1 w-12 ${
          currentStep >= 3 ? 'bg-primary' : 'bg-muted'
        }`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          3
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">Company & Contact Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">
            Company Name <span className="text-destructive">*</span>
          </label>
          <Input
            name="companyName"
            value={formData?.companyName}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter company name"
            error={errors?.companyName}
          />
          {errors?.companyName && <p className="text-xs text-destructive mt-1">{errors?.companyName}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Company Logo (Optional)
          </label>
          
          {!logoPreview ? (
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="logo-upload"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="hidden"
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-foreground font-medium">Click to upload logo</p>
                <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or SVG (max 5MB)</p>
              </label>
            </div>
          ) : (
            <div className="border border-border rounded-lg p-4 flex items-center gap-4">
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{logoFile?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(logoFile?.size / 1024 / 1024)?.toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          {errors?.logo && <p className="text-xs text-destructive mt-1">{errors?.logo}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Industry <span className="text-destructive">*</span>
          </label>
          <Select
            name="industry"
            value={formData?.industry}
            onChange={handleSelectChange('industry')}
            options={industryOptions}
            placeholder="Select industry"
          />
          {errors?.industry && <p className="text-xs text-destructive mt-1">{errors?.industry}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Company Size</label>
          <Select
            name="companySize"
            value={formData?.companySize}
            onChange={handleSelectChange('companySize')}
            options={companySizeOptions}
            placeholder="Select company size"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">Website</label>
          <Input
            name="website"
            value={formData?.website}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="https://www.example.com"
          />
        </div>
      </div>

      <div className="border-t border-border pt-4 mt-6">
        <h4 className="text-md font-semibold text-foreground mb-4">Primary Contact</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Full Name <span className="text-destructive">*</span>
            </label>
            <Input
              name="primaryContact"
              value={formData?.primaryContact}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter contact name"
              error={errors?.primaryContact}
            />
            {errors?.primaryContact && <p className="text-xs text-destructive mt-1">{errors?.primaryContact}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Job Title</label>
            <Input
              name="jobTitle"
              value={formData?.jobTitle}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g., CEO, CTO"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              name="email"
              type="email"
              value={formData?.email}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="contact@example.com"
              error={errors?.email}
            />
            {errors?.email && <p className="text-xs text-destructive mt-1">{errors?.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Phone <span className="text-destructive">*</span>
            </label>
            <Input
              name="phone"
              type="tel"
              value={formData?.phone}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="+1 (555) 123-4567"
              error={errors?.phone}
            />
            {errors?.phone && <p className="text-xs text-destructive mt-1">{errors?.phone}</p>}
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4 mt-6">
        <h4 className="text-md font-semibold text-foreground mb-4">Secondary Contact (Optional)</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <Input
              name="secondaryContact"
              value={formData?.secondaryContact}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter contact name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <Input
              name="secondaryEmail"
              type="email"
              value={formData?.secondaryEmail}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
            <Input
              name="secondaryPhone"
              type="tel"
              value={formData?.secondaryPhone}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">Address & Billing Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">
            Address Line 1 <span className="text-destructive">*</span>
          </label>
          <Input
            name="addressLine1"
            value={formData?.addressLine1}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Street address"
            error={errors?.addressLine1}
          />
          {errors?.addressLine1 && <p className="text-xs text-destructive mt-1">{errors?.addressLine1}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">Address Line 2</label>
          <Input
            name="addressLine2"
            value={formData?.addressLine2}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Apt, suite, unit, building, floor, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            City <span className="text-destructive">*</span>
          </label>
          <Input
            name="city"
            value={formData?.city}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="City"
            error={errors?.city}
          />
          {errors?.city && <p className="text-xs text-destructive mt-1">{errors?.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            State/Province <span className="text-destructive">*</span>
          </label>
          <Input
            name="state"
            value={formData?.state}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="State"
            error={errors?.state}
          />
          {errors?.state && <p className="text-xs text-destructive mt-1">{errors?.state}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            ZIP/Postal Code <span className="text-destructive">*</span>
          </label>
          <Input
            name="zipCode"
            value={formData?.zipCode}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="ZIP Code"
            error={errors?.zipCode}
          />
          {errors?.zipCode && <p className="text-xs text-destructive mt-1">{errors?.zipCode}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Country <span className="text-destructive">*</span>
          </label>
          <Input
            name="country"
            value={formData?.country}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Country"
            error={errors?.country}
          />
          {errors?.country && <p className="text-xs text-destructive mt-1">{errors?.country}</p>}
        </div>
      </div>

      <div className="border-t border-border pt-4 mt-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="billingAddressSame"
            name="billingAddressSame"
            checked={formData?.billingAddressSame}
            onChange={handleInputChange}
            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
          />
          <label htmlFor="billingAddressSame" className="ml-2 text-sm font-medium text-foreground">
            Billing address is the same as company address
          </label>
        </div>

        {!formData?.billingAddressSame && (
          <div>
            <h4 className="text-md font-semibold text-foreground mb-4">Billing Address</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Address Line 1 <span className="text-destructive">*</span>
                </label>
                <Input
                  name="billingAddressLine1"
                  value={formData?.billingAddressLine1}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Street address"
                  error={errors?.billingAddressLine1}
                />
                {errors?.billingAddressLine1 && <p className="text-xs text-destructive mt-1">{errors?.billingAddressLine1}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Address Line 2</label>
                <Input
                  name="billingAddressLine2"
                  value={formData?.billingAddressLine2}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Apt, suite, unit, building, floor, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  City <span className="text-destructive">*</span>
                </label>
                <Input
                  name="billingCity"
                  value={formData?.billingCity}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="City"
                  error={errors?.billingCity}
                />
                {errors?.billingCity && <p className="text-xs text-destructive mt-1">{errors?.billingCity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  State/Province <span className="text-destructive">*</span>
                </label>
                <Input
                  name="billingState"
                  value={formData?.billingState}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="State"
                  error={errors?.billingState}
                />
                {errors?.billingState && <p className="text-xs text-destructive mt-1">{errors?.billingState}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  ZIP/Postal Code <span className="text-destructive">*</span>
                </label>
                <Input
                  name="billingZipCode"
                  value={formData?.billingZipCode}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="ZIP Code"
                  error={errors?.billingZipCode}
                />
                {errors?.billingZipCode && <p className="text-xs text-destructive mt-1">{errors?.billingZipCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Country <span className="text-destructive">*</span>
                </label>
                <Input
                  name="billingCountry"
                  value={formData?.billingCountry}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Country"
                  error={errors?.billingCountry}
                />
                {errors?.billingCountry && <p className="text-xs text-destructive mt-1">{errors?.billingCountry}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4 mt-6">
        <h4 className="text-md font-semibold text-foreground mb-4">Preferences & Additional Details</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Preferred Contact Method</label>
            <Select
              name="preferredContactMethod"
              value={formData?.preferredContactMethod}
              onChange={handleSelectChange('preferredContactMethod')}
              options={contactMethodOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Timezone</label>
            <Input
              name="timezone"
              value={formData?.timezone}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g., EST, PST, GMT"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Language</label>
            <Input
              name="language"
              value={formData?.language}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="English"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Annual Revenue</label>
            <Input
              name="annualRevenue"
              value={formData?.annualRevenue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g., $1M - $5M"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1">Client Source</label>
            <Select
              name="clientSource"
              value={formData?.clientSource}
              onChange={handleSelectChange('clientSource')}
              options={clientSourceOptions}
              placeholder="How did you acquire this client?"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1">Tags</label>
            <Input
              name="tags"
              value={formData?.tags}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter tags separated by commas (e.g., VIP, High Priority)"
            />
            <p className="text-xs text-muted-foreground mt-1">Separate multiple tags with commas</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData?.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="Add any additional notes about this client..."
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">Preferences & Additional Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Preferred Contact Method</label>
          <Select
            name="preferredContactMethod"
            value={formData?.preferredContactMethod}
            onChange={handleSelectChange('preferredContactMethod')}
            options={contactMethodOptions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Timezone</label>
          <Input
            name="timezone"
            value={formData?.timezone}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g., EST, PST, GMT"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Language</label>
          <Input
            name="language"
            value={formData?.language}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="English"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Annual Revenue</label>
          <Input
            name="annualRevenue"
            value={formData?.annualRevenue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g., $1M - $5M"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">Client Source</label>
          <Select
            name="clientSource"
            value={formData?.clientSource}
            onChange={handleSelectChange('clientSource')}
            options={clientSourceOptions}
            placeholder="How did you acquire this client?"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">Tags</label>
          <Input
            name="tags"
            value={formData?.tags}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter tags separated by commas (e.g., VIP, High Priority)"
          />
          <p className="text-xs text-muted-foreground mt-1">Separate multiple tags with commas</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
          <textarea
            name="notes"
            value={formData?.notes}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            placeholder="Add any additional notes about this client..."
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-heading font-semibold text-foreground">Add New Client</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {renderStepIndicator()}

          <form onSubmit={handleSubmit} onKeyDown={(e) => {
            // Prevent Enter key from submitting form unless it's in a textarea or the submit button
            if (e?.key === 'Enter' && e?.target?.tagName !== 'TEXTAREA' && e?.target?.type !== 'submit') {
              e?.preventDefault();
              e?.stopPropagation();
            }
          }}>
            <div className="overflow-y-auto max-h-[calc(90vh-16rem)]">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </div>

            {/* PHASE 2: Error display and retry UI */}
            {saveError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">Save Failed</h3>
                    <p className="mt-1 text-sm text-red-700">{saveError}</p>
                    {retryCount > 0 && (
                      <p className="mt-1 text-xs text-red-600">Attempt {retryCount} failed</p>
                    )}
                  </div>
                  <button
                    onClick={handleRetry}
                    disabled={isSaving}
                    className="flex-shrink-0 px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                >
                  Cancel
                </Button>

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="default"
                    disabled={uploadingLogo || isSaving}
                  >
                    {uploadingLogo || isSaving ? 'Saving...' : 'Add Client'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;