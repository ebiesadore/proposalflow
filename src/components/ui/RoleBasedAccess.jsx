import React, { createContext, useContext, useState } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [userRole, setUserRole] = useState('admin');
  const [permissions, setPermissions] = useState(['user', 'admin']);

  const hasPermission = (requiredPermission) => {
    if (!requiredPermission) return true;
    return permissions?.includes(requiredPermission);
  };

  return (
    <RoleContext.Provider value={{ userRole, permissions, hasPermission, setUserRole, setPermissions }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
};

const RoleBasedAccess = ({ children, requiredPermission, fallback = null }) => {
  const { hasPermission } = useRole();

  if (!hasPermission(requiredPermission)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center px-6 py-12 bg-card rounded-xl shadow-brand-lg max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
            Access Restricted
          </h3>
          <p className="text-muted-foreground font-caption">
            You don't have permission to access this area. Please contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedAccess;