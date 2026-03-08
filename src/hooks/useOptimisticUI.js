import { useState, useCallback, useRef } from 'react';

/**
 * Optimistic UI Hook - Phase 1: Quick Wins
 * 
 * Provides instant UI feedback for user actions while syncing with database in background
 * Features:
 * - Immediate UI updates (remove/add/update items instantly)
 * - Automatic rollback on error
 * - Loading state management
 * - Success/error notifications
 * - Feature flag support for non-destructive rollback
 */
export const useOptimisticUI = ({ enabled = false } = {}) => {
  const [optimisticState, setOptimisticState] = useState(new Map());
  const [actionStatus, setActionStatus] = useState({}); // { [id]: 'deleting' | 'saving' | 'saved' | 'error' }
  const rollbackTimeoutsRef = useRef(new Map());

  /**
   * Optimistically delete an item from UI
   */
  const optimisticDelete = useCallback(async (id, items, setItems, deleteFn) => {
    if (!enabled) {
      // Feature disabled - use traditional delete
      setActionStatus(prev => ({ ...prev, [id]: 'deleting' }));
      try {
        await deleteFn(id);
        setItems(prev => prev?.filter(item => item?.id !== id));
        setActionStatus(prev => ({ ...prev, [id]: 'deleted' }));
        return { success: true };
      } catch (error) {
        setActionStatus(prev => ({ ...prev, [id]: 'error' }));
        return { success: false, error };
      }
    }

    // OPTIMISTIC PATH: Remove from UI immediately
    const itemToDelete = items?.find(item => item?.id === id);
    if (!itemToDelete) return { success: false, error: 'Item not found' };

    // Store original state for rollback
    setOptimisticState(prev => new Map(prev)?.set(id, itemToDelete));
    
    // Remove from UI instantly
    setItems(prev => prev?.filter(item => item?.id !== id));
    setActionStatus(prev => ({ ...prev, [id]: 'deleting' }));

    try {
      // Sync with database in background
      await deleteFn(id);
      
      // Success - clear optimistic state
      setOptimisticState(prev => {
        const newState = new Map(prev);
        newState?.delete(id);
        return newState;
      });
      setActionStatus(prev => ({ ...prev, [id]: 'deleted' }));
      
      // Clear status after 2 seconds
      setTimeout(() => {
        setActionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus?.[id];
          return newStatus;
        });
      }, 2000);

      return { success: true };
    } catch (error) {
      console.error('Delete failed, rolling back:', error);
      
      // ROLLBACK: Restore item to UI
      const originalItem = optimisticState?.get(id);
      if (originalItem) {
        setItems(prev => [...prev, originalItem]);
      }
      
      setOptimisticState(prev => {
        const newState = new Map(prev);
        newState?.delete(id);
        return newState;
      });
      setActionStatus(prev => ({ ...prev, [id]: 'error' }));
      
      // Clear error status after 3 seconds
      setTimeout(() => {
        setActionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus?.[id];
          return newStatus;
        });
      }, 3000);

      return { success: false, error };
    }
  }, [enabled, optimisticState]);

  /**
   * Optimistically add an item to UI
   */
  const optimisticAdd = useCallback(async (newItem, items, setItems, addFn) => {
    if (!enabled) {
      // Feature disabled - use traditional add
      setActionStatus(prev => ({ ...prev, [newItem?.id || 'new']: 'saving' }));
      try {
        const result = await addFn(newItem);
        setItems(prev => [result, ...prev]);
        setActionStatus(prev => ({ ...prev, [result?.id]: 'saved' }));
        return { success: true, data: result };
      } catch (error) {
        setActionStatus(prev => ({ ...prev, [newItem?.id || 'new']: 'error' }));
        return { success: false, error };
      }
    }

    // OPTIMISTIC PATH: Add to UI immediately with temporary ID
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...newItem, id: tempId, _isOptimistic: true };
    
    // Add to UI instantly
    setItems(prev => [optimisticItem, ...prev]);
    setActionStatus(prev => ({ ...prev, [tempId]: 'saving' }));

    try {
      // Sync with database in background
      const result = await addFn(newItem);
      
      // Replace optimistic item with real item
      setItems(prev => prev?.map(item => 
        item?.id === tempId ? result : item
      ));
      setActionStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus?.[tempId];
        newStatus[result?.id] = 'saved';
        return newStatus;
      });
      
      // Clear status after 2 seconds
      setTimeout(() => {
        setActionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus?.[result?.id];
          return newStatus;
        });
      }, 2000);

      return { success: true, data: result };
    } catch (error) {
      console.error('Add failed, rolling back:', error);
      
      // ROLLBACK: Remove optimistic item
      setItems(prev => prev?.filter(item => item?.id !== tempId));
      setActionStatus(prev => ({ ...prev, [tempId]: 'error' }));
      
      // Clear error status after 3 seconds
      setTimeout(() => {
        setActionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus?.[tempId];
          return newStatus;
        });
      }, 3000);

      return { success: false, error };
    }
  }, [enabled]);

  /**
   * Optimistically update an item in UI
   */
  const optimisticUpdate = useCallback(async (id, updates, items, setItems, updateFn) => {
    if (!enabled) {
      // Feature disabled - use traditional update
      setActionStatus(prev => ({ ...prev, [id]: 'saving' }));
      try {
        const result = await updateFn(id, updates);
        setItems(prev => prev?.map(item => item?.id === id ? result : item));
        setActionStatus(prev => ({ ...prev, [id]: 'saved' }));
        return { success: true, data: result };
      } catch (error) {
        setActionStatus(prev => ({ ...prev, [id]: 'error' }));
        return { success: false, error };
      }
    }

    // OPTIMISTIC PATH: Update UI immediately
    const originalItem = items?.find(item => item?.id === id);
    if (!originalItem) return { success: false, error: 'Item not found' };

    // Store original state for rollback
    setOptimisticState(prev => new Map(prev)?.set(id, originalItem));
    
    // Update UI instantly
    setItems(prev => prev?.map(item => 
      item?.id === id ? { ...item, ...updates } : item
    ));
    setActionStatus(prev => ({ ...prev, [id]: 'saving' }));

    try {
      // Sync with database in background
      const result = await updateFn(id, updates);
      
      // Update with server response
      setItems(prev => prev?.map(item => item?.id === id ? result : item));
      
      // Clear optimistic state
      setOptimisticState(prev => {
        const newState = new Map(prev);
        newState?.delete(id);
        return newState;
      });
      setActionStatus(prev => ({ ...prev, [id]: 'saved' }));
      
      // Clear status after 2 seconds
      setTimeout(() => {
        setActionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus?.[id];
          return newStatus;
        });
      }, 2000);

      return { success: true, data: result };
    } catch (error) {
      console.error('Update failed, rolling back:', error);
      
      // ROLLBACK: Restore original item
      const original = optimisticState?.get(id);
      if (original) {
        setItems(prev => prev?.map(item => item?.id === id ? original : item));
      }
      
      setOptimisticState(prev => {
        const newState = new Map(prev);
        newState?.delete(id);
        return newState;
      });
      setActionStatus(prev => ({ ...prev, [id]: 'error' }));
      
      // Clear error status after 3 seconds
      setTimeout(() => {
        setActionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus?.[id];
          return newStatus;
        });
      }, 3000);

      return { success: false, error };
    }
  }, [enabled, optimisticState]);

  /**
   * Get action status for an item
   */
  const getActionStatus = useCallback((id) => {
    return actionStatus?.[id] || null;
  }, [actionStatus]);

  /**
   * Clear all optimistic state (cleanup)
   */
  const clearOptimisticState = useCallback(() => {
    setOptimisticState(new Map());
    setActionStatus({});
    rollbackTimeoutsRef?.current?.forEach(timeout => clearTimeout(timeout));
    rollbackTimeoutsRef.current = new Map();
  }, []);

  return {
    optimisticDelete,
    optimisticAdd,
    optimisticUpdate,
    getActionStatus,
    clearOptimisticState,
    isEnabled: enabled
  };
};