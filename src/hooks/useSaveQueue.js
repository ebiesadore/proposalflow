import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Save Queue Hook - Non-destructive concurrent save prevention
 * 
 * Features:
 * - FIFO queue processing
 * - Duplicate detection
 * - Automatic retry with exponential backoff
 * - Priority system (manual saves jump ahead)
 * - Feature flag support for instant rollback
 * - 60-second timeout protection
 * 
 * @param {Object} options Configuration options
 * @param {Function} options.saveFn The actual save function to execute
 * @param {boolean} options.enabled Feature flag to enable/disable queue (default: false)
 * @param {number} options.maxRetries Maximum retry attempts (default: 1)
 * @param {number} options.retryDelay Initial retry delay in ms (default: 1000)
 * @param {number} options.timeout Save operation timeout in ms (default: 60000)
 */
export const useSaveQueue = ({ saveFn, enabled = false, maxRetries = 1, retryDelay = 1000, timeout = 60000 }) => {
  const [queue, setQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [queueStats, setQueueStats] = useState({
    totalSaves: 0,
    successfulSaves: 0,
    failedSaves: 0,
    averageProcessingTime: 0
  });
  
  const processingRef = useRef(false);
  const lastSaveDataRef = useRef(null);
  const isMountedRef = useRef(true);
  const processingTimesRef = useRef([]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Check if save data is duplicate of last save
   */
  const isDuplicate = useCallback((saveData) => {
    if (!lastSaveDataRef?.current) return false;
    
    try {
      return JSON.stringify(lastSaveDataRef?.current) === JSON.stringify(saveData);
    } catch (error) {
      console.warn('Failed to compare save data:', error);
      return false;
    }
  }, []);

  /**
   * Process the save queue
   */
  const processQueue = useCallback(async () => {
    // Prevent concurrent processing
    if (processingRef?.current || !isMountedRef?.current) {
      return;
    }

    // Get next item from queue
    const nextItem = queue?.[0];
    if (!nextItem) {
      setIsProcessing(false);
      setSaveStatus('idle');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setSaveStatus('saving');

    const startTime = Date.now();
    let retryCount = 0;
    let success = false;
    const abortController = new AbortController();

    // Set timeout for save operation
    const timeoutId = setTimeout(() => {
      console.warn('[Save Queue] Save operation timeout after 60 seconds');
      abortController?.abort();
    }, timeout);

    while (retryCount <= maxRetries && !success && isMountedRef?.current) {
      try {
        // Execute the save function with abort signal
        await saveFn(nextItem?.data, { signal: abortController?.signal });
        
        if (!isMountedRef?.current) {
          clearTimeout(timeoutId);
          return;
        }

        // Save successful
        success = true;
        lastSaveDataRef.current = nextItem?.data;
        setLastSaveTime(new Date());
        setSaveStatus('saved');

        // Update stats
        const processingTime = Date.now() - startTime;
        processingTimesRef?.current?.push(processingTime);
        if (processingTimesRef?.current?.length > 10) {
          processingTimesRef?.current?.shift(); // Keep only last 10
        }

        setQueueStats(prev => ({
          totalSaves: prev?.totalSaves + 1,
          successfulSaves: prev?.successfulSaves + 1,
          failedSaves: prev?.failedSaves,
          averageProcessingTime: processingTimesRef?.current?.reduce((a, b) => a + b, 0) / processingTimesRef?.current?.length
        }));

        // Call success callback if provided
        if (nextItem?.onSuccess) {
          nextItem?.onSuccess();
        }

      } catch (error) {
        // Check if error is due to abort
        if (error?.name === 'AbortError') {
          console.error('[Save Queue] Save operation aborted (timeout or manual cancellation)');
          setSaveStatus('error');
          
          setQueueStats(prev => ({
            ...prev,
            totalSaves: prev?.totalSaves + 1,
            failedSaves: prev?.failedSaves + 1
          }));

          if (nextItem?.onError) {
            nextItem?.onError(new Error('Save operation timeout'));
          }
          break;
        }
        
        retryCount++;
        
        if (retryCount <= maxRetries) {
          // Wait before retry with exponential backoff
          const waitTime = retryDelay * Math.pow(2, retryCount - 1);
          console.log(`[Save Queue] Save attempt ${retryCount} failed, retrying in ${waitTime}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          // Max retries reached
          console.error('[Save Queue] Save failed after max retries:', error);
          setSaveStatus('error');
          
          setQueueStats(prev => ({
            ...prev,
            totalSaves: prev?.totalSaves + 1,
            failedSaves: prev?.failedSaves + 1
          }));

          // Call error callback if provided
          if (nextItem?.onError) {
            nextItem?.onError(error);
          }
        }
      }
    }

    clearTimeout(timeoutId);

    if (!isMountedRef?.current) return;

    // Remove processed item from queue
    setQueue(prev => prev?.slice(1));
    processingRef.current = false;

    // Process next item if queue not empty
    if (queue?.length > 1) {
      // Use setTimeout to prevent stack overflow
      setTimeout(() => {
        if (isMountedRef?.current) {
          processQueue();
        }
      }, 100);
    } else {
      setIsProcessing(false);
      setSaveStatus(success ? 'saved' : 'error');
    }
  }, [queue, saveFn, maxRetries, retryDelay, timeout]);

  /**
   * Add save to queue
   */
  const enqueueSave = useCallback((saveData, options = {}) => {
    const { priority = 'normal', onSuccess, onError } = options;

    // Check for duplicate
    if (isDuplicate(saveData)) {
      console.log('Skipping duplicate save');
      return;
    }

    const saveItem = {
      id: Date.now() + Math.random(),
      data: saveData,
      priority,
      timestamp: new Date(),
      onSuccess,
      onError
    };

    setQueue(prev => {
      // If high priority, add to front of queue (after current processing item)
      if (priority === 'high') {
        return [prev?.[0], saveItem, ...prev?.slice(1)]?.filter(Boolean);
      }
      // Normal priority, add to end
      return [...prev, saveItem];
    });

    setSaveStatus('unsaved');
  }, [isDuplicate]);

  /**
   * Clear the entire queue
   */
  const clearQueue = useCallback(() => {
    setQueue([]);
    setSaveStatus('idle');
  }, []);

  /**
   * Get queue information
   */
  const getQueueInfo = useCallback(() => {
    return {
      length: queue?.length,
      isProcessing,
      saveStatus,
      lastSaveTime,
      stats: queueStats
    };
  }, [queue?.length, isProcessing, saveStatus, lastSaveTime, queueStats]);

  // Auto-process queue when items are added
  useEffect(() => {
    if (enabled && queue?.length > 0 && !processingRef?.current && isMountedRef?.current) {
      processQueue();
    }
  }, [enabled, queue?.length, processQueue]);

  return {
    // Core functions
    enqueueSave,
    clearQueue,
    getQueueInfo,
    
    // Status
    isProcessing,
    saveStatus,
    lastSaveTime,
    queueLength: queue?.length,
    queueStats,
    
    // Feature flag status
    isEnabled: enabled
  };
};