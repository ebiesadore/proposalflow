import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const Breadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Route mapping for breadcrumb labels
  const routeLabels = {
    '/': 'Login',
    '/login-and-authentication-portal': 'Login',
    '/proposal-management-dashboard': 'Proposal Management',
    '/client-management-dashboard': 'Client Management',
    '/user-management-and-access-control': 'User Management',
    '/proposal-template-management-studio': 'Template Management Studio',
    '/integrated-email-communication-center': 'Email Center',
    '/pdf-generation-and-document-export-hub': 'Document Export',
    '/system-settings-and-configuration-hub': 'System Settings',
    '/audit-controls-and-compliance-monitor': 'Audit & Compliance'
  };

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = () => {
    const paths = location?.pathname?.split('/')?.filter(Boolean);
    const breadcrumbs = [{ label: 'Home', path: '/' }];

    let currentPath = '';
    paths?.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = routeLabels?.[currentPath] || segment?.split('-')?.map(word => 
        word?.charAt(0)?.toUpperCase() + word?.slice(1)
      )?.join(' ');
      breadcrumbs?.push({ label, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleBack = () => {
    navigate(-1);
  };

  // Don't show breadcrumb on login page
  if (location?.pathname === '/' || location?.pathname === '/login-and-authentication-portal') {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 transition-colors">
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          aria-label="Go back"
        >
          <Icon name="ChevronLeft" className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="flex items-center">
          <ol className="flex items-center gap-2">
            {breadcrumbs?.map((crumb, index) => (
              <li key={crumb?.path} className="flex items-center gap-2">
                {index > 0 && (
                  <Icon name="ChevronRight" className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                )}
                {index === breadcrumbs?.length - 1 ? (
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {crumb?.label}
                  </span>
                ) : (
                  <Link
                    to={crumb?.path}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    {crumb?.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
};

export default Breadcrumb;