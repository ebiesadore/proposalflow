import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { storageService } from '../../../services/storageService';
import { supabase } from '../../../lib/supabase';

const EditClientModal = ({ isOpen, onClose, onSave, client }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    primaryContact: '',
    email: '',
    phone: '',
    industry: '',
    location: '',
    status: 'Active',
    clientSince: '',
    description: '',
    logo: '',
    logoAlt: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (client) {
      setFormData({
        companyName: client?.companyName || '',
        primaryContact: client?.primaryContact || '',
        email: client?.email || '',
        phone: client?.phone || '',
        industry: client?.industry || '',
        location: client?.location || '',
        status: client?.status || 'Active',
        clientSince: client?.clientSince || '',
        description: client?.description || '',
        logo: client?.logo || '',
        logoAlt: client?.logoAlt || ''
      });
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value } = e?.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors?.[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file?.type?.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, logo: 'Please select an image file' }));
      return;
    }

    // Validate file size (max 5MB)
    if (file?.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: 'Image size must be less than 5MB' }));
      return;
    }

    try {
      setIsUploading(true);
      setErrors((prev) => ({ ...prev, logo: '' }));

      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload and get the file path (not the signed URL)
      const logoPath = await storageService?.uploadClientLogo(file, user?.id);

      setFormData((prev) => ({
        ...prev,
        logo: logoPath,
        logoAlt: `${formData?.companyName || 'Company'} logo`
      }));
    } catch (error) {
      console.error('Logo upload error:', error);
      setErrors((prev) => ({ ...prev, logo: 'Failed to upload logo. Please try again.' }));
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.companyName?.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData?.primaryContact?.trim()) {
      newErrors.primaryContact = 'Primary contact is required';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData?.phone?.trim()) {
      newErrors.phone = 'Phone is required';
    }

    if (!formData?.industry?.trim()) {
      newErrors.industry = 'Industry is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const newErrors = {};
    if (!formData?.companyName?.trim()) newErrors.companyName = 'Company name is required';
    if (!formData?.email?.trim()) newErrors.email = 'Email is required';
    if (formData?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (Object.keys(newErrors)?.length > 0) {
      setErrors(newErrors);
      return;
    }

    // PHASE 2: Enhanced save with retry logic
    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave({ ...client, ...formData });
      setRetryCount(0);
      onClose();
    } catch (error) {
      console.error('[EditClientModal] Save failed:', error);
      setSaveError(error?.message || 'Failed to update client. Please try again.');
      setRetryCount((prev) => prev + 1);
    } finally {
      setIsSaving(false);
    }
  };

  // PHASE 2: Retry handler
  const handleRetry = () => {
    setSaveError(null);
    handleSubmit(new Event('submit'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-lg shadow-brand w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Edit Client
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-smooth"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-caption font-medium text-foreground mb-2">
              Company Logo
            </label>
            <div className="flex items-center gap-4">
              {formData?.logo && (
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img
                    src={formData?.logo}
                    alt={formData?.logoAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    iconName="Upload"
                    iconPosition="left"
                    disabled={isUploading}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                </label>
                {errors?.logo && (
                  <p className="text-xs text-destructive mt-1">{errors?.logo}</p>
                )}
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-caption font-medium text-foreground mb-2">
              Company Name *
            </label>
            <Input
              name="companyName"
              value={formData?.companyName}
              onChange={handleChange}
              placeholder="Enter company name"
              error={errors?.companyName}
            />
          </div>

          {/* Primary Contact */}
          <div>
            <label className="block text-sm font-caption font-medium text-foreground mb-2">
              Primary Contact *
            </label>
            <Input
              name="primaryContact"
              value={formData?.primaryContact}
              onChange={handleChange}
              placeholder="Enter contact name"
              error={errors?.primaryContact}
            />
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-2">
                Email *
              </label>
              <Input
                type="email"
                name="email"
                value={formData?.email}
                onChange={handleChange}
                placeholder="email@example.com"
                error={errors?.email}
              />
            </div>
            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-2">
                Phone *
              </label>
              <Input
                type="tel"
                name="phone"
                value={formData?.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                error={errors?.phone}
              />
            </div>
          </div>

          {/* Industry and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-2">
                Industry *
              </label>
              <Input
                name="industry"
                value={formData?.industry}
                onChange={handleChange}
                placeholder="e.g., Technology, Finance"
                error={errors?.industry}
              />
            </div>
            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-2">
                Location
              </label>
              <Input
                name="location"
                value={formData?.location}
                onChange={handleChange}
                placeholder="City, State"
              />
            </div>
          </div>

          {/* Status and Client Since */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData?.status}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-caption font-medium text-foreground mb-2">
                Client Since
              </label>
              <Input
                name="clientSince"
                value={formData?.clientSince}
                onChange={handleChange}
                placeholder="e.g., 2023"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-caption font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData?.description}
              onChange={handleChange}
              placeholder="Enter company description"
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {errors?.submit && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{errors?.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSaving || isUploading}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClientModal;