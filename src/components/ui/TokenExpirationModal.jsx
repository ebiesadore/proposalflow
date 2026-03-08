import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TokenExpirationModal = ({ isOpen, onClose, expiresIn, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(expiresIn);

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(expiresIn);

    const intervalId = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [isOpen, expiresIn]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase?.auth?.refreshSession();
      
      if (error) {
        console.error('[TokenExpirationModal] Failed to refresh session:', error);
        alert('Failed to refresh session. Please sign in again.');
      } else {
        console.log('[TokenExpirationModal] Session refreshed successfully');
        onRefresh?.();
        onClose();
      }
    } catch (error) {
      console.error('[TokenExpirationModal] Error refreshing session:', error);
      alert('An error occurred while refreshing your session.');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isOpen) return null;

  const isUrgent = countdown < 5;
  const isCritical = countdown < 2;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isCritical ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' : isUrgent ?'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20': 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isCritical ? 'bg-red-100 dark:bg-red-900/40' : isUrgent ?'bg-orange-100 dark:bg-orange-900/40': 'bg-yellow-100 dark:bg-yellow-900/40'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                isCritical ? 'text-red-600 dark:text-red-400' : isUrgent ?'text-orange-600 dark:text-orange-400': 'text-yellow-600 dark:text-yellow-400'
              }`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isCritical ? 'Session Expiring Immediately!' : isUrgent ? 'Session Expiring Soon' : 'Session Expiration Warning'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Action required to continue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Countdown Display */}
          <div className="text-center py-4">
            <div className={`text-5xl font-bold mb-2 ${
              isCritical ? 'text-red-600 dark:text-red-400 animate-pulse' : isUrgent ?'text-orange-600 dark:text-orange-400': 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {countdown}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {countdown === 1 ? 'minute' : 'minutes'} remaining
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Your authentication session is about to expire. To continue working without interruption, 
              please refresh your session now.
            </p>
          </div>

          {/* Consequences */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              What happens if session expires:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>You'll be signed out automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Unsaved changes may be lost</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>You'll need to sign in again</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              isCritical
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : isUrgent
                ? 'bg-orange-600 hover:bg-orange-700 text-white' :'bg-yellow-600 hover:bg-yellow-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Refresh Session Now</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenExpirationModal;
