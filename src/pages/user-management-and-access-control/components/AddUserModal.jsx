import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { getAllRoles, createRole } from '../../../services/roleService';
import { storageService } from '../../../services/storageService';
import { supabase } from '../../../lib/supabase';

const AddUserModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    permissionLevel: '',
    location: '',
    avatarPath: '',
  });

  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [addingRole, setAddingRole] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  // Fetch roles from database
  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const rolesData = await getAllRoles();
      const roleOptions = rolesData?.map((role) => ({
        value: role?.name,
        label: role?.name,
      })) || [];
      setRoles(roleOptions);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleAddNewRole = async () => {
    if (!newRoleName?.trim()) {
      alert('Please enter a role name');
      return;
    }

    setAddingRole(true);
    try {
      await createRole({
        name: newRoleName?.trim(),
        description: newRoleDescription?.trim() || null,
      });

      // Refresh roles list
      await fetchRoles();

      // Set the newly created role as selected
      setFormData((prev) => ({ ...prev, role: newRoleName?.trim() }));

      // Close add role modal
      setShowAddRoleModal(false);
      setNewRoleName('');
      setNewRoleDescription('');
    } catch (error) {
      console.error('Error adding role:', error);
      alert('Failed to add role. Please try again.');
    } finally {
      setAddingRole(false);
    }
  };

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

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    try {
      let avatarPath = '';

      // Upload avatar if selected
      if (avatarFile) {
        setUploadingAvatar(true);
        const { data: { user } } = await supabase?.auth?.getUser();
        if (user?.id) {
          avatarPath = await storageService?.uploadUserAvatar(avatarFile, user?.id);
        }
        setUploadingAvatar(false);
      }

      // Format permission level for database
      const formattedPermissionLevel = 
        formData?.permissionLevel === 'full' ? 'full' :
        formData?.permissionLevel === 'limited' ? 'limited' : 'view';

      // Submit form with avatar path and formatted permission level
      onSubmit({ 
        ...formData, 
        avatarPath,
        permissionLevel: formattedPermissionLevel
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        permissionLevel: '',
        location: '',
        avatarPath: '',
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      setErrors({});
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to add user. Please try again.');
      setUploadingAvatar(false);
    }
  };

  if (!isOpen) return null;

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
              <Icon name="UserPlus" size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-foreground">
              Add New User
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
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                    <Icon name="User" size={32} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors"
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
                <p className="text-xs text-muted-foreground mt-2">
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-caption font-medium text-foreground">
                    Role <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddRoleModal(true)}
                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                  >
                    <Icon name="Plus" size={12} />
                    Add New Role
                  </button>
                </div>
                <Select
                  options={roles}
                  value={formData?.role}
                  onChange={(value) => handleChange('role', value)}
                  error={errors?.role}
                  placeholder={loadingRoles ? 'Loading roles...' : 'Select an option'}
                  disabled={loadingRoles}
                />
              </div>

              <Select
                label="Department"
                options={departmentOptions}
                value={formData?.department}
                onChange={(value) => handleChange('department', value)}
                error={errors?.department}
                required
              />
            </div>

            <Select
              label="Permission Level"
              description="Determines user access rights across the system"
              options={permissionOptions}
              value={formData?.permissionLevel}
              onChange={(value) => handleChange('permissionLevel', value)}
              error={errors?.permissionLevel}
              required
            />

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="Info" size={18} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-caption font-medium text-foreground mb-1">
                    Account Setup
                  </p>
                  <p className="text-xs text-muted-foreground">
                    A temporary password will be generated and sent to the user's email address. They will be required to change it on first login. Active Directory and SSO integration will be configured automatically.
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
            iconName="UserPlus"
            iconPosition="left"
            iconSize={16}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? 'Uploading...' : 'Add User'}
          </Button>
        </div>
      </div>

      {/* Add New Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowAddRoleModal(false)}
          />
          <div className="relative w-full max-w-md bg-card rounded-lg border border-border shadow-brand-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name="Plus" size={20} className="text-primary" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground">
                  Add New Role
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddRoleModal(false)}
                iconName="X"
                iconSize={20}
              />
            </div>

            <div className="px-6 py-6 space-y-4">
              <Input
                label="Role Name"
                type="text"
                placeholder="e.g., Project Manager"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e?.target?.value)}
                required
              />

              <div>
                <label className="text-sm font-caption font-medium text-foreground mb-2 block">
                  Description (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                  placeholder="Describe the role and its responsibilities"
                  rows={3}
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e?.target?.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowAddRoleModal(false)}
                disabled={addingRole}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleAddNewRole}
                disabled={addingRole}
                iconName="Plus"
                iconPosition="left"
                iconSize={16}
              >
                {addingRole ? 'Adding...' : 'Add Role'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUserModal;