import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { storageService } from '../../../services/storageService';
import { supabase } from '../../../lib/supabase';

const EditUserModal = ({ isOpen, onClose, onSubmit, user }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    permissionLevel: '',
    location: '',
    status: '',
    avatarPath: '',
  });

  const [errors, setErrors] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        role: user?.role?.toLowerCase() || '',
        department: user?.department?.toLowerCase() || '',
        permissionLevel: user?.permissionLevel === 'Full Access' ? 'full' : user?.permissionLevel === 'Limited Access' ? 'limited' : 'view',
        location: user?.location || '',
        status: user?.status?.toLowerCase() || '',
        avatarPath: user?.avatarPath || '',
      });
      // Set existing avatar as preview
      if (user?.avatar) {
        setAvatarPreview(user?.avatar);
      }
    }
  }, [user]);

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'specialist', label: 'Specialist' },
    { value: 'analyst', label: 'Analyst' },
    { value: 'coordinator', label: 'Coordinator' },
  ];

  const departmentOptions = [
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operations', label: 'Operations' },
    { value: 'it', label: 'IT' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' },
  ];

  const permissionOptions = [
    { value: 'full', label: 'Full Access' },
    { value: 'limited', label: 'Limited Access' },
    { value: 'view', label: 'View Only' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
  ];

  const handleAvatarChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes?.includes(file?.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (2MB)
    if (file?.size > 2097152) {
      alert('Image size must be less than 2MB');
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader?.result);
    };
    reader?.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setFormData((prev) => ({ ...prev, avatarPath: '' }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) newErrors.name = 'Name is required';
    if (!formData?.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData?.phone?.trim()) newErrors.phone = 'Phone is required';
    if (!formData?.role) newErrors.role = 'Role is required';
    if (!formData?.department) newErrors.department = 'Department is required';
    if (!formData?.permissionLevel) newErrors.permissionLevel = 'Permission level is required';
    if (!formData?.location?.trim()) newErrors.location = 'Location is required';
    if (!formData?.status) newErrors.status = 'Status is required';

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    try {
      let avatarPath = formData?.avatarPath || '';

      // Upload new avatar if selected
      if (avatarFile) {
        setUploadingAvatar(true);
        const { data: { user: authUser } } = await supabase?.auth?.getUser();
        if (authUser?.id) {
          avatarPath = await storageService?.uploadUserAvatar(avatarFile, user?.id || authUser?.id);
        }
        setUploadingAvatar(false);
      }

      // Submit form with avatar path
      onSubmit({ 
        ...user, 
        ...formData,
        avatarPath 
      });

      setErrors({});
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
      setUploadingAvatar(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-card rounded-lg border border-border shadow-brand-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="UserCog" size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-foreground">
              Edit User
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Photo Upload Section */}
            <div className="flex flex-col items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="relative">
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-error text-error-foreground rounded-full flex items-center justify-center hover:bg-error/90 transition-smooth shadow-lg"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                    <Icon name="User" size={32} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth text-sm font-caption font-medium"
                >
                  <Icon name="Upload" size={16} />
                  {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground text-center">
                  JPG, PNG or WebP. Max size 2MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Enter full name"
                value={formData?.name}
                onChange={(e) => handleChange('name', e?.target?.value)}
                error={errors?.name}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="user@company.com"
                value={formData?.email}
                onChange={(e) => handleChange('email', e?.target?.value)}
                error={errors?.email}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData?.phone}
                onChange={(e) => handleChange('phone', e?.target?.value)}
                error={errors?.phone}
                required
              />

              <Input
                label="Location"
                type="text"
                placeholder="City, State"
                value={formData?.location}
                onChange={(e) => handleChange('location', e?.target?.value)}
                error={errors?.location}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Role"
                options={roleOptions}
                value={formData?.role}
                onChange={(value) => handleChange('role', value)}
                error={errors?.role}
                required
              />

              <Select
                label="Department"
                options={departmentOptions}
                value={formData?.department}
                onChange={(value) => handleChange('department', value)}
                error={errors?.department}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Permission Level"
                description="Determines user access rights"
                options={permissionOptions}
                value={formData?.permissionLevel}
                onChange={(value) => handleChange('permissionLevel', value)}
                error={errors?.permissionLevel}
                required
              />

              <Select
                label="Account Status"
                options={statusOptions}
                value={formData?.status}
                onChange={(value) => handleChange('status', value)}
                error={errors?.status}
                required
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="AlertTriangle" size={18} className="text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-caption font-medium text-foreground mb-1">
                    Permission Changes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Modifying user permissions will take effect immediately. The user may need to log out and log back in to see all changes reflected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            iconName="Save"
            iconPosition="left"
            iconSize={16}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? 'Uploading...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;