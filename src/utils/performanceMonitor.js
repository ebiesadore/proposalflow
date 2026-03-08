/**
 * Performance Monitoring Utility
 * 
 * Tracks query response times, detects slow queries, and provides performance trends
 */

const MAX_HISTORY_SIZE = 100;
const SLOW_QUERY_THRESHOLD = 3000; // 3 seconds
const WARNING_QUERY_THRESHOLD = 1000; // 1 second

class PerformanceMonitor {
  constructor() {
    this.queryHistory = [];
    this.slowQueries = [];
    this.listeners = [];
    this.aggregateStats = {
      totalQueries: 0,
      totalTime: 0,
      avgLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      slowQueryCount: 0,
      warningQueryCount: 0
    };
  }

  recordQuery(operation, duration, success = true, error = null) {
    const queryRecord = {
      operation,
      duration,
      success,
      error: error?.message || null,
      timestamp: Date.now(),
      isSlow: duration > SLOW_QUERY_THRESHOLD,
      isWarning: duration > WARNING_QUERY_THRESHOLD
    };

    // Add to history
    this.queryHistory?.push(queryRecord);
    if (this.queryHistory?.length > MAX_HISTORY_SIZE) {
      this.queryHistory?.shift();
    }

    // Track slow queries separately
    if (queryRecord?.isSlow) {
      this.slowQueries?.push(queryRecord);
      if (this.slowQueries?.length > 20) {
        this.slowQueries?.shift();
      }
      console.warn(`[PerformanceMonitor] Slow query detected: ${operation} took ${duration}ms`);
    }

    // Update aggregate stats
    this.updateAggregateStats(queryRecord);

    // Notify listeners
    this.notifyListeners(queryRecord);

    return queryRecord;
  }

  updateAggregateStats(queryRecord) {
    this.aggregateStats.totalQueries++;
    this.aggregateStats.totalTime += queryRecord?.duration;
    this.aggregateStats.avgLatency = this.aggregateStats?.totalTime / this.aggregateStats?.totalQueries;
    this.aggregateStats.minLatency = Math.min(this.aggregateStats?.minLatency, queryRecord?.duration);
    this.aggregateStats.maxLatency = Math.max(this.aggregateStats?.maxLatency, queryRecord?.duration);
    
    if (queryRecord?.isSlow) {
      this.aggregateStats.slowQueryCount++;
    }
    if (queryRecord?.isWarning) {
      this.aggregateStats.warningQueryCount++;
    }
  }

  getRecentPerformance(count = 10) {
    return this.queryHistory?.slice(-count);
  }

  getSlowQueries() {
    return this.slowQueries;
  }

  getAggregateStats() {
    return { ...this.aggregateStats };
  }

  getPerformanceTrend(windowSize = 20) {
    const recent = this.queryHistory?.slice(-windowSize);
    if (recent?.length === 0) return null;

    const avgLatency = recent?.reduce((sum, q) => sum + q?.duration, 0) / recent?.length;
    const successRate = (recent?.filter(q => q?.success)?.length / recent?.length) * 100;
    const slowQueryRate = (recent?.filter(q => q?.isSlow)?.length / recent?.length) * 100;

    return {
      avgLatency: Math.round(avgLatency),
      successRate: Math.round(successRate * 10) / 10,
      slowQueryRate: Math.round(slowQueryRate * 10) / 10,
      sampleSize: recent?.length,
      trend: this.calculateTrend(recent)
    };
  }

  calculateTrend(queries) {
    if (queries?.length < 2) return 'stable';

    const midpoint = Math.floor(queries?.length / 2);
    const firstHalf = queries?.slice(0, midpoint);
    const secondHalf = queries?.slice(midpoint);

    const firstAvg = firstHalf?.reduce((sum, q) => sum + q?.duration, 0) / firstHalf?.length;
    const secondAvg = secondHalf?.reduce((sum, q) => sum + q?.duration, 0) / secondHalf?.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 20) return 'degrading';
    if (change < -20) return 'improving';
    return 'stable';
  }

  getPerformanceStatus() {
    const stats = this.getAggregateStats();
    const trend = this.getPerformanceTrend();

    if (!trend) {
      return {
        status: 'unknown',
        color: 'text-gray-500',
        label: 'No Data',
        avgLatency: 0
      };
    }

    if (trend?.avgLatency > SLOW_QUERY_THRESHOLD) {
      return {
        status: 'critical',
        color: 'text-red-500',
        label: 'Critical',
        avgLatency: trend?.avgLatency,
        message: 'Queries are very slow'
      };
    }

    if (trend?.avgLatency > WARNING_QUERY_THRESHOLD || trend?.trend === 'degrading') {
      return {
        status: 'warning',
        color: 'text-yellow-500',
        label: 'Warning',
        avgLatency: trend?.avgLatency,
        message: trend?.trend === 'degrading' ? 'Performance degrading' : 'Queries are slow'
      };
    }

    return {
      status: 'good',
      color: 'text-green-500',
      label: 'Good',
      avgLatency: trend?.avgLatency,
      message: trend?.trend === 'improving' ? 'Performance improving' : 'Performance stable'
    };
  }

  onPerformanceChange(callback) {
    this.listeners?.push(callback);
    return () => {
      this.listeners = this.listeners?.filter(cb => cb !== callback);
    };
  }

  notifyListeners(queryRecord) {
    this.listeners?.forEach(listener => {
      try {
        listener(queryRecord, this.getPerformanceStatus());
      } catch (error) {
        console.error('[PerformanceMonitor] Error in listener:', error);
      }
    });
  }

  reset() {
    this.queryHistory = [];
    this.slowQueries = [];
    this.aggregateStats = {
      totalQueries: 0,
      totalTime: 0,
      avgLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      slowQueryCount: 0,
      warningQueryCount: 0
    };
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

export const recordQuery = (operation, duration, success, error) => 
  performanceMonitor?.recordQuery(operation, duration, success, error);

export const getRecentPerformance = (count) => 
  performanceMonitor?.getRecentPerformance(count);

export const getSlowQueries = () => 
  performanceMonitor?.getSlowQueries();

export const getAggregateStats = () => 
  performanceMonitor?.getAggregateStats();

export const getPerformanceTrend = (windowSize) => 
  performanceMonitor?.getPerformanceTrend(windowSize);

export const getPerformanceStatus = () => 
  performanceMonitor?.getPerformanceStatus();

export const onPerformanceChange = (callback) => 
  performanceMonitor?.onPerformanceChange(callback);

export const resetPerformanceMonitor = () => 
  performanceMonitor?.reset();
