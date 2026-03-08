import { supabase } from '../lib/supabase';

/**
 * Retry helper with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} - Result of the function
 */
const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable (502, 503, 504, network errors)
      const isRetryable =
        error?.message?.includes('502') ||
        error?.message?.includes('503') ||
        error?.message?.includes('504') ||
        error?.message?.includes('Network') ||
        error?.message?.includes('timeout') ||
        error?.status === 502 ||
        error?.status === 503 ||
        error?.status === 504;

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: wait longer with each retry
      const waitTime = delay * Math.pow(2, attempt);
      console.warn(`Storage operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${waitTime}ms...`, error?.message);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
};

export const storageService = {
  /**
   * Upload a client logo to private storage
   * @param {File} file - The logo file to upload
   * @param {string} userId - The authenticated user's ID
   * @returns {Promise<string>} - The file path in storage
   */
  async uploadClientLogo(file, userId) {
    try {
      if (!file) throw new Error('No file provided');
      if (!userId) throw new Error('User ID required');

      // Generate unique file path
      const fileExt = file?.name?.split('.')?.pop();
      const fileName = `${Date.now()}-${Math.random()?.toString(36)?.substring(7)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to storage with retry logic
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase?.storage
          ?.from('client-logos')
          ?.upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error:', error);
          throw new Error(error?.message || 'Failed to upload logo');
        }

        return data;
      });

      return result?.path;
    } catch (error) {
      console.error('Upload client logo error:', error);
      throw error;
    }
  },

  /**
   * Get signed URL for a private client logo
   * @param {string} filePath - The file path in storage
   * @returns {Promise<string>} - The signed URL
   */
  async getClientLogoUrl(filePath) {
    try {
      if (!filePath) return null;

      // Get signed URL with retry logic
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase?.storage
          ?.from('client-logos')
          ?.createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) {
          // Ignore abort errors (component unmounted or request cancelled)
          if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('signal is aborted')) {
            return null;
          }

          // Only log non-404 errors (404 means file doesn't exist, which is expected)
          if (error?.statusCode !== '404' && !error?.message?.includes('Object not found')) {
            console.error('Get URL error:', error);
          }

          // For 502 errors, throw to trigger retry
          if (error?.message?.includes('502') || error?.status === 502) {
            throw error;
          }
          // For other errors including 'Object not found', return null (file might not exist)
          return null;
        }

        return data;
      });

      return result?.signedUrl || null;
    } catch (error) {
      // Ignore abort errors (component unmounted or request cancelled)
      if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('signal is aborted')) {
        return null;
      }

      // Only log unexpected errors, not 'Object not found' errors
      if (!error?.message?.includes('Object not found') && error?.statusCode !== '404') {
        console.error('Get client logo URL error:', error);
      }
      // Return null instead of throwing to prevent UI breaks
      return null;
    }
  },

  /**
   * Delete a client logo from storage
   * @param {string} filePath - The file path in storage
   * @returns {Promise<boolean>} - Success status
   */
  async deleteClientLogo(filePath) {
    try {
      if (!filePath) return true;

      // Delete with retry logic
      await retryWithBackoff(async () => {
        const { error } = await supabase?.storage
          ?.from('client-logos')
          ?.remove([filePath]);

        if (error) {
          console.error('Delete error:', error);
          throw new Error(error?.message || 'Failed to delete logo');
        }
      });

      return true;
    } catch (error) {
      console.error('Delete client logo error:', error);
      throw error;
    }
  },

  /**
   * Upload a user avatar to private storage
   * @param {File} file - The avatar file to upload
   * @param {string} userId - The authenticated user's ID
   * @returns {Promise<string>} - The file path in storage
   */
  async uploadUserAvatar(file, userId) {
    try {
      if (!file) throw new Error('No file provided');
      if (!userId) throw new Error('User ID required');

      // Generate unique file path
      const fileExt = file?.name?.split('.')?.pop();
      const fileName = `${Date.now()}-${Math.random()?.toString(36)?.substring(7)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to storage with retry logic
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase?.storage
          ?.from('user-avatars')
          ?.upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error:', error);
          throw new Error(error?.message || 'Failed to upload avatar');
        }

        return data;
      });

      return result?.path;
    } catch (error) {
      console.error('Upload user avatar error:', error);
      throw error;
    }
  },

  /**
   * Get signed URL for a private user avatar
   * @param {string} filePath - The file path in storage
   * @returns {Promise<string>} - The signed URL
   */
  async getUserAvatarUrl(filePath) {
    try {
      if (!filePath) return null;

      // Get signed URL with retry logic
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase?.storage
          ?.from('user-avatars')
          ?.createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) {
          // Ignore abort errors (component unmounted or request cancelled)
          if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('signal is aborted')) {
            return null;
          }

          // Only log non-404 errors (404 means file doesn't exist, which is expected)
          if (error?.statusCode !== '404' && !error?.message?.includes('Object not found')) {
            console.error('Get URL error:', error);
          }

          // For 502 errors, throw to trigger retry
          if (error?.message?.includes('502') || error?.status === 502) {
            throw error;
          }
          // For other errors including 'Object not found', return null (file might not exist)
          return null;
        }

        return data;
      });

      return result?.signedUrl || null;
    } catch (error) {
      // Ignore abort errors (component unmounted or request cancelled)
      if (error?.name === 'AbortError' || error?.message?.includes('aborted') || error?.message?.includes('signal is aborted')) {
        return null;
      }

      // Only log unexpected errors, not 'Object not found' errors
      if (!error?.message?.includes('Object not found') && error?.statusCode !== '404') {
        console.error('Get user avatar URL error:', error);
      }
      // Return null instead of throwing to prevent UI breaks
      return null;
    }
  },

  /**
   * Delete a user avatar from storage
   * @param {string} filePath - The file path in storage
   * @returns {Promise<boolean>} - Success status
   */
  async deleteUserAvatar(filePath) {
    try {
      if (!filePath) return true;

      // Delete with retry logic
      await retryWithBackoff(async () => {
        const { error } = await supabase?.storage
          ?.from('user-avatars')
          ?.remove([filePath]);

        if (error) {
          console.error('Delete error:', error);
          throw new Error(error?.message || 'Failed to delete avatar');
        }
      });

      return true;
    } catch (error) {
      console.error('Delete user avatar error:', error);
      throw error;
    }
  }
};
