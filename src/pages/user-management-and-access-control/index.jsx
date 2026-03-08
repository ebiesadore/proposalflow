import React, { useState, useEffect } from "react";
import Sidebar from "../../components/ui/Sidebar";
import Breadcrumb from "../../components/ui/Breadcrumb";

import SystemsConfigTabs from "../../components/ui/SystemsConfigTabs";
import RoleBasedAccess from "../../components/ui/RoleBasedAccess";
import IntegrationStatus from "../../components/ui/IntegrationStatus";
import Icon from "../../components/AppIcon";

import UserTableRow from "./components/UserTableRow";
import BulkActionsBar from "./components/BulkActionsBar";
import UserDetailsPanel from "./components/UserDetailsPanel";
import AddUserModal from "./components/AddUserModal";
import EditUserModal from "./components/EditUserModal";
import { storageService } from "../../services/storageService";
import { getAllUsers, createUser, updateUser, deleteUser, toggleUserStatus } from "../../services/userService";

const UserManagementAndAccessControl = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        department: "all",
        role: "all",
        status: "all",
        permission: "all",
    });
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch users from database on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Failed to load users. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        {
            icon: "Users",
            label: "Total Users",
            value: users?.length?.toString(),
            trend: "up",
            trendValue: "+12%",
            color: "primary",
        },
        {
            icon: "UserCheck",
            label: "Active Users",
            value: users?.filter((u) => u?.status === "Active")?.length?.toString(),
            trend: "up",
            trendValue: "+8%",
            color: "success",
        },
        {
            icon: "UserX",
            label: "Inactive Users",
            value: users?.filter((u) => u?.status === "Inactive")?.length?.toString(),
            color: "warning",
        },
        {
            icon: "Shield",
            label: "Full Access",
            value: users
                ?.filter((u) => u?.permissionLevel === "Full Access" || u?.permissionLevel === "full")
                ?.length?.toString(),
            color: "accent",
        },
    ];

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            search: "",
            department: "all",
            role: "all",
            status: "all",
            permission: "all",
        });
    };

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev?.key === key && prev?.direction === "asc" ? "desc" : "asc",
        }));
    };

    const handleSelectUser = (userId, checked) => {
        setSelectedUsers((prev) => (checked ? [...prev, userId] : prev?.filter((id) => id !== userId)));
    };

    const filteredUsers = users?.filter((user) => {
        const matchesSearch =
            user?.name?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
            user?.email?.toLowerCase()?.includes(filters?.search?.toLowerCase());
        const matchesDepartment =
            filters?.department === "all" || user?.department?.toLowerCase() === filters?.department;
        const matchesRole = filters?.role === "all" || user?.role?.toLowerCase() === filters?.role;
        const matchesStatus = filters?.status === "all" || user?.status?.toLowerCase() === filters?.status;
        const matchesPermission =
            filters?.permission === "all" ||
            (filters?.permission === "full" && user?.permissionLevel === "Full Access") ||
            (filters?.permission === "limited" && user?.permissionLevel === "Limited Access") ||
            (filters?.permission === "view" && user?.permissionLevel === "View Only");

        return matchesSearch && matchesDepartment && matchesRole && matchesStatus && matchesPermission;
    });

    const handleSelectAll = (checked) => {
        setSelectedUsers(checked ? filteredUsers?.map((u) => u?.id) : []);
    };

    const handleClearSelection = () => {
        setSelectedUsers([]);
    };

    const handleViewDetails = (user) => {
        setSelectedUser(user);
        setIsDetailsPanelOpen(true);
    };

    const handleEdit = (user) => {
        setUserToEdit(user);
        setIsEditModalOpen(true);
        setIsDetailsPanelOpen(false);
    };

    const handleToggleStatus = async (userId) => {
        try {
            const user = users?.find((u) => u?.id === userId);
            if (!user) return;

            await toggleUserStatus(userId, user?.status);

            // Update local state
            setUsers((prev) =>
                prev?.map((u) =>
                    u?.id === userId ? { ...u, status: u?.status === "Active" ? "Inactive" : "Active" } : u,
                ),
            );
        } catch (err) {
            console.error("Error toggling user status:", err);
            alert("Failed to update user status. Please try again.");
        }
    };

    const handleAddUser = async (userData) => {
        try {
            // Get avatar URL if avatar was uploaded
            let avatarUrl = "https://img.rocket.new/generatedImages/rocket_gen_img_14f99bc91-1767522014091.png";

            if (userData?.avatarPath) {
                try {
                    const signedUrl = await storageService?.getUserAvatarUrl(userData?.avatarPath);
                    if (signedUrl) {
                        avatarUrl = signedUrl;
                    }
                } catch (error) {
                    console.error("Error fetching avatar URL:", error);
                }
            }

            // Prepare user data for database
            const newUserData = {
                name: userData?.name,
                email: userData?.email,
                phone: userData?.phone,
                location: userData?.location,
                avatarPath: userData?.avatarPath || avatarUrl,
                status: "Active",
                role: userData?.role,
                department: userData?.department,
                permissionLevel: userData?.permissionLevel,
            };

            // Save to database
            const createdUser = await createUser(newUserData);

            // Add to local state
            setUsers((prev) => [createdUser, ...prev]);
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Error adding user:", error);
            alert("Failed to add user. Please try again.");
        }
    };

    const handleUpdateUser = async (updatedUser) => {
        try {
            await updateUser(updatedUser?.id, updatedUser);

            // Update local state
            setUsers((prev) =>
                prev?.map((user) => (user?.id === updatedUser?.id ? { ...user, ...updatedUser } : user)),
            );

            setIsEditModalOpen(false);
            setUserToEdit(null);

            if (selectedUser?.id === updatedUser?.id) {
                setSelectedUser(null);
                setIsDetailsPanelOpen(false);
            }
        } catch (err) {
            console.error("Error updating user:", err);
            alert("Failed to update user. Please try again.");
        }
    };

    const handleBulkActivate = async () => {
        try {
            // Update each selected user
            await Promise.all(
                selectedUsers?.map((userId) => {
                    const user = users?.find((u) => u?.id === userId);
                    return updateUser(userId, { ...user, status: "Active" });
                }),
            );

            // Update local state
            setUsers((prev) =>
                prev?.map((user) => (selectedUsers?.includes(user?.id) ? { ...user, status: "Active" } : user)),
            );

            setSelectedUsers([]);
        } catch (err) {
            console.error("Error bulk activating users:", err);
            alert("Failed to activate users. Please try again.");
        }
    };

    const handleBulkDeactivate = async () => {
        try {
            // Update each selected user
            await Promise.all(
                selectedUsers?.map((userId) => {
                    const user = users?.find((u) => u?.id === userId);
                    return updateUser(userId, { ...user, status: "Inactive" });
                }),
            );

            // Update local state
            setUsers((prev) =>
                prev?.map((user) => (selectedUsers?.includes(user?.id) ? { ...user, status: "Inactive" } : user)),
            );

            setSelectedUsers([]);
        } catch (err) {
            console.error("Error bulk deactivating users:", err);
            alert("Failed to deactivate users. Please try again.");
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedUsers?.length} user(s)?`)) {
            try {
                // Delete each selected user
                await Promise.all(selectedUsers?.map((userId) => deleteUser(userId)));

                // Update local state
                setUsers((prev) => prev?.filter((user) => !selectedUsers?.includes(user?.id)));
                setSelectedUsers([]);
            } catch (err) {
                console.error("Error bulk deleting users:", err);
                alert("Failed to delete users. Please try again.");
            }
        }
    };

    const handleDeleteUser = async (user) => {
        if (window.confirm(`Are you sure you want to delete ${user?.name}?`)) {
            try {
                await deleteUser(user?.id);

                // Update local state
                setUsers((prev) => prev?.filter((u) => u?.id !== user?.id));

                if (selectedUser?.id === user?.id) {
                    setSelectedUser(null);
                    setIsDetailsPanelOpen(false);
                }
            } catch (err) {
                console.error("Error deleting user:", err);
                alert("Failed to delete user. Please try again.");
            }
        }
    };

    const sortedUsers = [...filteredUsers]?.sort((a, b) => {
        const aValue = a?.[sortConfig?.key];
        const bValue = b?.[sortConfig?.key];

        if (sortConfig?.key === "lastLogin") {
            return sortConfig?.direction === "asc"
                ? new Date(aValue) - new Date(bValue)
                : new Date(bValue) - new Date(aValue);
        }

        if (typeof aValue === "string") {
            return sortConfig?.direction === "asc" ? aValue?.localeCompare(bValue) : bValue?.localeCompare(aValue);
        }

        return sortConfig?.direction === "asc" ? aValue - bValue : bValue - aValue;
    });

    return (
        <RoleBasedAccess requiredPermission="admin">
            <div className="flex min-h-screen bg-background">
                <Sidebar collapsed={isSidebarCollapsed} onToggleCollapse={setIsSidebarCollapsed} />

                <main className="flex-1 ml-[68px] transition-smooth">
                    <div className="sticky top-0 z-40 bg-card border-b border-border">
                        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                                        User Management
                                    </h1>
                                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                                        Manage staff accounts, roles, and access permissions
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth flex items-center gap-2 font-caption font-medium text-sm"
                                    >
                                        <Icon name="UserPlus" size={18} />
                                        Add User
                                    </button>
                                    <IntegrationStatus compact />
                                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                        <Icon name="User" size={20} color="#FFFFFF" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SystemsConfigTabs />
                    </div>

                    <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
                        <Breadcrumb />

                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-muted-foreground">Loading users...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
                                <p className="text-destructive font-medium">{error}</p>
                            </div>
                        )}

                        {!loading && !error && (
                            <div className="max-w-[1600px] mx-auto space-y-6">
                                <div className="bg-card rounded-lg border border-border shadow-brand overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1000px]">
                                            <thead className="bg-muted border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-4 text-left">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                selectedUsers?.length === filteredUsers?.length &&
                                                                filteredUsers?.length > 0
                                                            }
                                                            onChange={(e) => handleSelectAll(e?.target?.checked)}
                                                            className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                                                        />
                                                    </th>
                                                    <th className="px-4 py-4 text-left">
                                                        <button
                                                            onClick={() => handleSort("name")}
                                                            className="flex items-center gap-2 font-caption font-medium text-sm text-foreground hover:text-primary transition-smooth"
                                                        >
                                                            User
                                                            <Icon
                                                                name={
                                                                    sortConfig?.key === "name"
                                                                        ? sortConfig?.direction === "asc" ?"ChevronUp" :"ChevronDown" :"ChevronsUpDown"
                                                                }
                                                                size={14}
                                                            />
                                                        </button>
                                                    </th>
                                                    <th className="px-4 py-4 text-left">
                                                        <button
                                                            onClick={() => handleSort("role")}
                                                            className="flex items-center gap-2 font-caption font-medium text-sm text-foreground hover:text-primary transition-smooth"
                                                        >
                                                            Role
                                                            <Icon
                                                                name={
                                                                    sortConfig?.key === "role"
                                                                        ? sortConfig?.direction === "asc" ?"ChevronUp" :"ChevronDown" :"ChevronsUpDown"
                                                                }
                                                                size={14}
                                                            />
                                                        </button>
                                                    </th>
                                                    <th className="px-4 py-4 text-left">
                                                        <button
                                                            onClick={() => handleSort("department")}
                                                            className="flex items-center gap-2 font-caption font-medium text-sm text-foreground hover:text-primary transition-smooth"
                                                        >
                                                            Department
                                                            <Icon
                                                                name={
                                                                    sortConfig?.key === "department"
                                                                        ? sortConfig?.direction === "asc" ?"ChevronUp" :"ChevronDown" :"ChevronsUpDown"
                                                                }
                                                                size={14}
                                                            />
                                                        </button>
                                                    </th>
                                                    <th className="px-4 py-4 text-left">
                                                        <button
                                                            onClick={() => handleSort("lastLogin")}
                                                            className="flex items-center gap-2 font-caption font-medium text-sm text-foreground hover:text-primary transition-smooth"
                                                        >
                                                            Last Login
                                                            <Icon
                                                                name={
                                                                    sortConfig?.key === "lastLogin"
                                                                        ? sortConfig?.direction === "asc" ?"ChevronUp" :"ChevronDown" :"ChevronsUpDown"
                                                                }
                                                                size={14}
                                                            />
                                                        </button>
                                                    </th>
                                                    <th className="px-4 py-4 text-left">
                                                        <button
                                                            onClick={() => handleSort("status")}
                                                            className="flex items-center gap-2 font-caption font-medium text-sm text-foreground hover:text-primary transition-smooth"
                                                        >
                                                            Status
                                                            <Icon
                                                                name={
                                                                    sortConfig?.key === "status"
                                                                        ? sortConfig?.direction === "asc" ?"ChevronUp" :"ChevronDown" :"ChevronsUpDown"
                                                                }
                                                                size={14}
                                                            />
                                                        </button>
                                                    </th>
                                                    <th className="px-4 py-4 text-left">
                                                        <span className="font-caption font-medium text-sm text-foreground">
                                                            Permission
                                                        </span>
                                                    </th>
                                                    <th className="px-4 py-4 text-left">
                                                        <span className="font-caption font-medium text-sm text-foreground">
                                                            Actions
                                                        </span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedUsers?.map((user) => (
                                                    <UserTableRow
                                                        key={user?.id}
                                                        user={user}
                                                        onEdit={handleEdit}
                                                        onToggleStatus={handleToggleStatus}
                                                        onDelete={handleDeleteUser}
                                                        isSelected={selectedUsers?.includes(user?.id)}
                                                        onSelect={handleSelectUser}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {sortedUsers?.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-12 px-6">
                                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                                <Icon name="Users" size={32} className="text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                                                No users found
                                            </h3>
                                            <p className="text-sm text-muted-foreground text-center max-w-md">
                                                No users match your current filters. Try adjusting your search criteria
                                                or reset filters.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {isDetailsPanelOpen && (
                    <UserDetailsPanel
                        user={selectedUser}
                        onClose={() => {
                            setIsDetailsPanelOpen(false);
                            setSelectedUser(null);
                        }}
                        onEdit={handleEdit}
                    />
                )}

                <BulkActionsBar
                    selectedCount={selectedUsers?.length}
                    onActivate={handleBulkActivate}
                    onDeactivate={handleBulkDeactivate}
                    onChangeRole={() => alert("Change role functionality")}
                    onResetPassword={() => alert("Reset password functionality")}
                    onDelete={handleBulkDelete}
                    onClearSelection={handleClearSelection}
                />

                <AddUserModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={handleAddUser}
                />

                <EditUserModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setUserToEdit(null);
                    }}
                    onSubmit={handleUpdateUser}
                    user={userToEdit}
                />
            </div>
        </RoleBasedAccess>
    );
};

export default UserManagementAndAccessControl;
