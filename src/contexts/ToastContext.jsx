import React, { createContext, useContext, useState, useCallback } from 'react';
import Icon from '../components/AppIcon';

/**
 * Toast Notification System - Phase 1: Enhanced Loading States
 * 
 * Provides success/error/info notifications for user actions
 * Features:
 * - Auto-dismiss with configurable duration
 * - Multiple toast stacking
 * - Icon support
 * - Action buttons (undo, retry, etc.)
 * - Feature flag support
 */

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const Toast = ({ toast, onDismiss }) => {
  const getIcon = () => {
    switch (toast?.type) {
      case 'success': return 'CheckCircle2';
      case 'error': return 'AlertCircle';
      case 'warning': return 'AlertTriangle';
      case 'info': return 'Info';
      default: return 'Info';
    }
  };

  const getColors = () => {
    switch (toast?.type) {
      case 'success': return 'bg-success/10 border-success/20 text-success';
      case 'error': return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'warning': return 'bg-warning/10 border-warning/20 text-warning';
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-600';
      default: return 'bg-muted border-border text-foreground';
    }
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${getColors()} shadow-brand-lg animate-in slide-in-from-right-full duration-300`}>
      <Icon name={getIcon()} size={20} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {toast?.title && (
          <p className="font-heading text-sm font-semibold mb-1">
            {toast?.title}
          </p>
        )}
        <p className="font-caption text-sm">
          {toast?.message}
        </p>
        {toast?.action && (
          <button
            onClick={toast?.action?.onClick}
            className="mt-2 text-xs font-medium underline hover:no-underline"
          >
            {toast?.action?.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast?.id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <Icon name="X" size={16} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((options) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      type: options?.type || 'info',
      title: options?.title,
      message: options?.message,
      action: options?.action,
      duration: options?.duration || 3000
    };

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss
    if (toast?.duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, toast?.duration);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev?.filter(t => t?.id !== id));
  }, []);

  const success = useCallback((message, options = {}) => {
    return showToast({ ...options, type: 'success', message });
  }, [showToast]);

  const error = useCallback((message, options = {}) => {
    return showToast({ ...options, type: 'error', message });
  }, [showToast]);

  const warning = useCallback((message, options = {}) => {
    return showToast({ ...options, type: 'warning', message });
  }, [showToast]);

  const info = useCallback((message, options = {}) => {
    return showToast({ ...options, type: 'info', message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
        {toasts?.map(toast => (
          <Toast key={toast?.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;