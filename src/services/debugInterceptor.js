import { supabase } from '../lib/supabase';

class DebugInterceptor {
  constructor() {
    this.logs = [];
    this.maxLogs = 500;
    this.listeners = [];
    this.isEnabled = true;
    this.startTime = Date.now();
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  subscribe(callback) {
    this.listeners?.push(callback);
    return () => {
      this.listeners = this.listeners?.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners?.forEach(callback => callback(this.logs));
  }

  addLog(logEntry) {
    if (!this.isEnabled) return;

    const entry = {
      ...logEntry,
      timestamp: new Date()?.toISOString(),
      relativeTime: Date.now() - this.startTime,
      id: `${Date.now()}-${Math.random()?.toString(36)?.substr(2, 9)}`
    };

    this.logs?.unshift(entry);

    // Keep only the most recent logs
    if (this.logs?.length > this.maxLogs) {
      this.logs = this.logs?.slice(0, this.maxLogs);
    }

    this.notifyListeners();
  }

  async captureQuery(queryName, queryFn, metadata = {}) {
    const startTime = performance.now();
    const logId = `${Date.now()}-${Math.random()?.toString(36)?.substr(2, 9)}`;

    // Log query start
    this.addLog({
      type: 'query_start',
      queryName,
      metadata,
      logId
    });

    try {
      // Get current auth state
      const { data: { session } } = await supabase?.auth?.getSession();
      const authToken = session?.access_token;
      const userId = session?.user?.id;

      this.addLog({
        type: 'auth_check',
        queryName,
        logId,
        authStatus: {
          hasToken: !!authToken,
          tokenPreview: authToken ? `${authToken?.substring(0, 20)}...` : null,
          userId,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000)?.toISOString() : null,
          isExpired: session?.expires_at ? Date.now() / 1000 > session?.expires_at : true
        }
      });

      // Execute the query
      const result = await queryFn();
      const duration = performance.now() - startTime;

      // Log successful query
      this.addLog({
        type: 'query_success',
        queryName,
        logId,
        duration: `${duration?.toFixed(2)}ms`,
        resultCount: Array.isArray(result?.data) ? result?.data?.length : result?.data ? 1 : 0,
        metadata
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      // Log query error with full stack trace
      this.addLog({
        type: 'query_error',
        queryName,
        logId,
        duration: `${duration?.toFixed(2)}ms`,
        error: {
          message: error?.message || 'Unknown error',
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          stack: error?.stack,
          name: error?.name,
          category: error?.category || 'unknown',
          originalError: error?.originalError ? {
            message: error?.originalError?.message,
            name: error?.originalError?.name
          } : null
        },
        metadata
      });

      throw error;
    }
  }

  async validateAuthToken() {
    try {
      const { data: { session }, error } = await supabase?.auth?.getSession();

      if (error) {
        this.addLog({
          type: 'auth_validation',
          status: 'error',
          error: error?.message
        });
        return { valid: false, error: error?.message };
      }

      if (!session) {
        this.addLog({
          type: 'auth_validation',
          status: 'no_session'
        });
        return { valid: false, error: 'No active session' };
      }

      const isExpired = session?.expires_at ? Date.now() / 1000 > session?.expires_at : true;

      this.addLog({
        type: 'auth_validation',
        status: isExpired ? 'expired' : 'valid',
        tokenInfo: {
          userId: session?.user?.id,
          email: session?.user?.email,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000)?.toISOString() : null,
          isExpired,
          tokenPreview: session?.access_token ? `${session?.access_token?.substring(0, 20)}...` : null
        }
      });

      return {
        valid: !isExpired,
        session,
        isExpired
      };
    } catch (error) {
      this.addLog({
        type: 'auth_validation',
        status: 'error',
        error: error?.message,
        stack: error?.stack
      });
      return { valid: false, error: error?.message };
    }
  }

  logConnectionStatus(status) {
    this.addLog({
      type: 'connection_status',
      status,
      timestamp: new Date()?.toISOString()
    });
  }

  logRealtimeEvent(event, payload) {
    this.addLog({
      type: 'realtime_event',
      event,
      payload: {
        eventType: payload?.eventType,
        table: payload?.table,
        schema: payload?.schema,
        commitTimestamp: payload?.commit_timestamp
      }
    });
  }

  getLogs() {
    return this.logs;
  }

  getLogsByType(type) {
    return this.logs?.filter(log => log?.type === type);
  }

  getErrorLogs() {
    return this.logs?.filter(log => log?.type === 'query_error');
  }

  getStats() {
    const totalQueries = this.logs?.filter(log => log?.type === 'query_start')?.length;
    const successfulQueries = this.logs?.filter(log => log?.type === 'query_success')?.length;
    const failedQueries = this.logs?.filter(log => log?.type === 'query_error')?.length;
    const authChecks = this.logs?.filter(log => log?.type === 'auth_check')?.length;
    const realtimeEvents = this.logs?.filter(log => log?.type === 'realtime_event')?.length;

    return {
      totalQueries,
      successfulQueries,
      failedQueries,
      authChecks,
      realtimeEvents,
      successRate: totalQueries > 0 ? ((successfulQueries / totalQueries) * 100)?.toFixed(1) : 0
    };
  }
}

export const debugInterceptor = new DebugInterceptor();
export default debugInterceptor;
