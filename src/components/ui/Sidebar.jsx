import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import GlobalSearch from './GlobalSearch';

const Sidebar = ({ isCollapsed = false, onToggleCollapse, collapsed }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, toggleTheme, isEnabled: isDarkModeEnabled } = useTheme();
  const hoverTimeoutRef = useRef(null);

  const navigationItems = [
    {
      label: 'Proposal Dashboard',
      path: '/proposal-management-dashboard',
      icon: 'FileText',
      permission: 'user',
    },
    {
      label: 'Client Dashboard',
      path: '/client-management-dashboard',
      icon: 'Users',
      permission: 'user',
    },
    {
      label: 'Systems Config',
      icon: 'Settings',
      permission: 'admin',
      submenu: [
        {
          label: 'User Management',
          path: '/user-management-and-access-control',
          icon: 'UserCog',
        },
        {
          label: 'System Settings',
          path: '/system-settings-and-configuration-hub',
          icon: 'Sliders',
        },
        {
          label: 'Template Management',
          path: '/proposal-template-management-studio',
          icon: 'Layout',
        },
        {
          label: 'Material Library',
          path: '/material-library-management',
          icon: 'Package',
        },
        {
          label: 'Audit Controls',
          path: '/audit-controls-and-compliance-monitor',
          icon: 'Shield',
        },
        {
          label: 'Additional Scope',
          path: '/additional-scope',
          icon: 'PlusCircle',
        },
        {
          label: 'External Trade',
          path: '/external-trade',
          icon: 'Briefcase',
        },
      ],
    },
    {
      label: 'Email Center',
      path: '/integrated-email-communication-center',
      icon: 'Mail',
      permission: 'user',
    },
    {
      label: 'Document Export',
      path: '/pdf-generation-and-document-export-hub',
      icon: 'Download',
      permission: 'user',
    },
  ];

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const isActiveRoute = (path) => {
    return location?.pathname === path;
  };

  const isActiveSubmenu = (submenu) => {
    return submenu?.some(item => location?.pathname === item?.path);
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
    setIsHovered(false);
  };

  const handleMenuItemClick = () => {
    setIsHovered(false);
    closeMobileMenu();
  };

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef?.current) {
      clearTimeout(hoverTimeoutRef?.current);
    }
    // Set a delay before expanding (400ms for intentional hover)
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 400);
  };

  const handleMouseLeave = () => {
    // Clear the timeout if mouse leaves before delay completes
    if (hoverTimeoutRef?.current) {
      clearTimeout(hoverTimeoutRef?.current);
      hoverTimeoutRef.current = null;
    }
    // Collapse immediately when mouse leaves
    setIsHovered(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef?.current) {
        clearTimeout(hoverTimeoutRef?.current);
      }
    };
  }, []);

  // Keyboard shortcut for search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e?.ctrlKey || e?.metaKey) && e?.key === 'k') {
        e?.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={handleMobileToggle}
        className="fixed top-4 left-4 z-50 lg:hidden w-11 h-11 flex items-center justify-center bg-card dark:bg-card rounded-lg shadow-brand dark:shadow-brand-lg transition-smooth hover:shadow-brand-lg"
        aria-label="Toggle mobile menu"
      >
        <Icon name={isMobileOpen ? 'X' : 'Menu'} size={20} />
      </button>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background dark:bg-background/95 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed lg:fixed top-0 left-0 h-full bg-card dark:bg-card border-r border-border dark:border-border z-[9999] transition-all duration-300 ease-in-out ${
          isHovered ? 'w-[280px] shadow-2xl' : 'w-[68px]'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Icon name="Briefcase" size={24} color="#FFFFFF" />
          </div>
          {isHovered && (
            <div className="flex-1 overflow-hidden">
              <h2 className="text-lg font-heading font-semibold text-foreground dark:text-foreground whitespace-nowrap">
                NeXSYS CORE<sup className="text-xs">™</sup>
              </h2>
            </div>
          )}
        </div>

        {/* Global Search Button */}
        <div className="px-4 py-3 border-b border-border dark:border-border">
          <button
            onClick={() => setIsSearchOpen(true)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth ${
              !isHovered ? 'justify-center' : ''
            }`}
            aria-label="Open search"
          >
            <div className="flex-shrink-0">
              <Icon name="Search" size={18} />
            </div>
            {isHovered && (
              <>
                <span className="flex-1 text-left font-caption text-sm whitespace-nowrap">
                  Search...
                </span>
                <span className="text-xs bg-background px-1.5 py-0.5 rounded border border-border">
                  Ctrl+K
                </span>
              </>
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <ul className="space-y-2">
            {navigationItems?.map((item) => (
              <li key={item?.label}>
                {item?.submenu ? (
                  <div>
                    <div
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                        isActiveSubmenu(item?.submenu) ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground' : 'text-foreground dark:text-foreground'
                      } ${!isHovered ? 'justify-center' : ''}`}
                    >
                      <div className="flex-shrink-0">
                        <Icon name={item?.icon} size={20} />
                      </div>
                      {isHovered && (
                        <span className="flex-1 text-left font-caption font-medium text-sm whitespace-nowrap">
                          {item?.label}
                        </span>
                      )}
                    </div>
                    {/* Always show Systems Config submenu items */}
                    <ul className={`mt-2 space-y-1 transition-all duration-300 ${
                      isHovered ? 'ml-4 opacity-100' : 'ml-0 opacity-0 h-0 overflow-hidden'
                    }`}>
                      {item?.submenu?.map((subItem) => (
                        <li key={subItem?.path}>
                          <Link
                            to={subItem?.path}
                            onClick={handleMenuItemClick}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-smooth hover:bg-muted dark:hover:bg-muted ${
                              isActiveRoute(subItem?.path)
                                ? 'bg-accent text-accent-foreground dark:bg-accent dark:text-accent-foreground'
                                : 'text-muted-foreground dark:text-muted-foreground'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              <Icon name={subItem?.icon} size={18} />
                            </div>
                            {isHovered && (
                              <span className="font-caption font-medium text-sm whitespace-nowrap">
                                {subItem?.label}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <Link
                    to={item?.path}
                    onClick={handleMenuItemClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth hover:bg-muted dark:hover:bg-muted ${
                      isActiveRoute(item?.path)
                        ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground'
                        : 'text-foreground dark:text-foreground'
                    } ${!isHovered ? 'justify-center' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      <Icon name={item?.icon} size={20} />
                    </div>
                    {isHovered && (
                      <span className="font-caption font-medium text-sm whitespace-nowrap">{item?.label}</span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border dark:border-border">
          {isDarkModeEnabled && (
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-smooth mb-2 ${
                !isHovered ? 'justify-center' : ''
              }`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <div className="flex-shrink-0">
                <Icon name={theme === 'light' ? 'Moon' : 'Sun'} size={20} />
              </div>
              {isHovered && (
                <span className="font-caption font-medium text-sm whitespace-nowrap">
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </span>
              )}
            </button>
          )}
          <button
            onClick={async () => {
              try {
                await signOut();
              } catch (error) {
                console.error('Sign out error:', error);
              } finally {
                navigate('/login-and-authentication-portal');
              }
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-smooth mb-2 ${
              !isHovered ? 'justify-center' : ''
            }`}
            aria-label="Sign out"
          >
            <div className="flex-shrink-0">
              <Icon name="LogOut" size={20} />
            </div>
            {isHovered && (
              <span className="font-caption font-medium text-sm whitespace-nowrap">Sign Out</span>
            )}
          </button>
        </div>
      </aside>

      {/* Global Search Modal */}
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
};

export default Sidebar;