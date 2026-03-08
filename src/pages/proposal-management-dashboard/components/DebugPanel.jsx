import React, { useState, useEffect, useRef } from 'react';
import { debugInterceptor } from '../../../services/debugInterceptor';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DebugPanel = ({ isOpen, onClose }) => {
  const { user, sessionRestored } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [authStatus, setAuthStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);

  const validateAuth = async () => {
    const result = await debugInterceptor?.validateAuthToken();
    setAuthStatus(result);
  };

  const updateStats = () => {
    setStats(debugInterceptor?.getStats());
  };

  useEffect(() => {
    if (!isOpen) return;

    // Subscribe to log updates
    const unsubscribe = debugInterceptor?.subscribe((newLogs) => {
      setLogs(newLogs);
      updateStats();
    });

    // Initial load
    setLogs(debugInterceptor?.getLogs());
    updateStats();
    validateAuth();

    // Auto-refresh auth status every 5 seconds
    const authInterval = setInterval(validateAuth, 5000);

    return () => {
      unsubscribe();
      clearInterval(authInterval);
    };
  }, [isOpen]);

  useEffect(() => {
    if (autoScroll && logsEndRef?.current) {
      logsEndRef?.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleClearLogs = () => {
    debugInterceptor?.clearLogs();
    setLogs([]);
    updateStats();
  };

  const filteredLogs = logs?.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'errors') return log?.type === 'query_error';
    if (filter === 'queries') return log?.type?.includes('query');
    if (filter === 'auth') return log?.type?.includes('auth');
    if (filter === 'realtime') return log?.type === 'realtime_event';
    return true;
  });

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'query_start': return 'text-blue-600';
      case 'query_success': return 'text-green-600';
      case 'query_error': return 'text-red-600';
      case 'auth_check': return 'text-purple-600';
      case 'auth_validation': return 'text-indigo-600';
      case 'realtime_event': return 'text-orange-600';
      case 'connection_status': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getLogTypeIcon = (type) => {
    switch (type) {
      case 'query_start': return 'play_arrow';
      case 'query_success': return 'check_circle';
      case 'query_error': return 'error';
      case 'auth_check': return 'shield';
      case 'auth_validation': return 'verified_user';
      case 'realtime_event': return 'sync';
      case 'connection_status': return 'wifi';
      default: return 'info';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date?.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-logs-${new Date()?.toISOString()}.json`;
    link?.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-end">
      <div className="bg-white w-full md:w-2/3 lg:w-1/2 h-[90vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="bug_report" className="text-2xl" />
            <div>
              <h2 className="text-lg font-bold">Debug Console</h2>
              <p className="text-xs text-gray-400">Real-time Request & Auth Monitoring</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <Icon name="close" className="text-2xl" />
          </button>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="bg-gray-100 p-3 border-b grid grid-cols-5 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-gray-700">{stats?.totalQueries}</div>
              <div className="text-gray-500">Total Queries</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-600">{stats?.successfulQueries}</div>
              <div className="text-gray-500">Success</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-600">{stats?.failedQueries}</div>
              <div className="text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">{stats?.authChecks}</div>
              <div className="text-gray-500">Auth Checks</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-600">{stats?.realtimeEvents}</div>
              <div className="text-gray-500">Realtime</div>
            </div>
          </div>
        )}

        {/* Auth Status */}
        {authStatus && (
          <div className={`p-3 border-b ${
            authStatus?.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon 
                  name={authStatus?.valid ? 'check_circle' : 'error'} 
                  className={`text-xl ${
                    authStatus?.valid ? 'text-green-600' : 'text-red-600'
                  }`} 
                />
                <div>
                  <div className="font-semibold text-sm">
                    {authStatus?.valid ? 'Authenticated' : 'Authentication Issue'}
                  </div>
                  {authStatus?.session && (
                    <div className="text-xs text-gray-600">
                      User: {authStatus?.session?.user?.email}
                    </div>
                  )}
                  {authStatus?.error && (
                    <div className="text-xs text-red-600">
                      Error: {authStatus?.error}
                    </div>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={validateAuth}
                className="text-xs"
              >
                <Icon name="refresh" className="text-sm" />
                Revalidate
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="p-3 border-b flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              All ({logs?.length})
            </button>
            <button
              onClick={() => setFilter('errors')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'errors' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Errors
            </button>
            <button
              onClick={() => setFilter('queries')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'queries' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Queries
            </button>
            <button
              onClick={() => setFilter('auth')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'auth' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Auth
            </button>
            <button
              onClick={() => setFilter('realtime')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                filter === 'realtime' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Realtime
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-1 rounded text-xs font-medium ${
                autoScroll ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Icon name="arrow_downward" className="text-xs" />
              Auto-scroll
            </button>
            <Button size="sm" variant="outline" onClick={exportLogs}>
              <Icon name="download" className="text-sm" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearLogs}>
              <Icon name="delete" className="text-sm" />
              Clear
            </Button>
          </div>
        </div>

        {/* Logs Container */}
        <div 
          ref={logsContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50 p-3 font-mono text-xs"
        >
          {filteredLogs?.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Icon name="info" className="text-4xl mb-2" />
              <p>No logs to display</p>
              <p className="text-xs mt-1">Logs will appear here as requests are made</p>
            </div>
          ) : (
            filteredLogs?.map((log) => (
              <div key={log?.id} className="mb-3 bg-white rounded border p-3 shadow-sm">
                {/* Log Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon 
                      name={getLogTypeIcon(log?.type)} 
                      className={`text-lg ${getLogTypeColor(log?.type)}`}
                    />
                    <span className={`font-bold ${getLogTypeColor(log?.type)}`}>
                      {log?.type?.toUpperCase()?.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {formatTimestamp(log?.timestamp)}
                  </span>
                </div>

                {/* Query Name */}
                {log?.queryName && (
                  <div className="mb-2">
                    <span className="text-gray-600">Query: </span>
                    <span className="font-semibold text-gray-900">{log?.queryName}</span>
                  </div>
                )}

                {/* Duration */}
                {log?.duration && (
                  <div className="mb-2">
                    <span className="text-gray-600">Duration: </span>
                    <span className="font-semibold text-blue-600">{log?.duration}</span>
                  </div>
                )}

                {/* Result Count */}
                {log?.resultCount !== undefined && (
                  <div className="mb-2">
                    <span className="text-gray-600">Results: </span>
                    <span className="font-semibold text-green-600">{log?.resultCount}</span>
                  </div>
                )}

                {/* Auth Status */}
                {log?.authStatus && (
                  <div className="mb-2 bg-purple-50 p-2 rounded">
                    <div className="font-semibold text-purple-700 mb-1">Auth Status:</div>
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-gray-600">Has Token: </span>
                        <span className={log?.authStatus?.hasToken ? 'text-green-600' : 'text-red-600'}>
                          {log?.authStatus?.hasToken ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {log?.authStatus?.tokenPreview && (
                        <div>
                          <span className="text-gray-600">Token: </span>
                          <span className="text-gray-800">{log?.authStatus?.tokenPreview}</span>
                        </div>
                      )}
                      {log?.authStatus?.userId && (
                        <div>
                          <span className="text-gray-600">User ID: </span>
                          <span className="text-gray-800">{log?.authStatus?.userId}</span>
                        </div>
                      )}
                      {log?.authStatus?.expiresAt && (
                        <div>
                          <span className="text-gray-600">Expires: </span>
                          <span className={log?.authStatus?.isExpired ? 'text-red-600' : 'text-green-600'}>
                            {log?.authStatus?.expiresAt} {log?.authStatus?.isExpired ? '(EXPIRED)' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Token Info */}
                {log?.tokenInfo && (
                  <div className="mb-2 bg-indigo-50 p-2 rounded">
                    <div className="font-semibold text-indigo-700 mb-1">Token Info:</div>
                    <div className="text-xs space-y-1">
                      {log?.tokenInfo?.email && (
                        <div>
                          <span className="text-gray-600">Email: </span>
                          <span className="text-gray-800">{log?.tokenInfo?.email}</span>
                        </div>
                      )}
                      {log?.tokenInfo?.userId && (
                        <div>
                          <span className="text-gray-600">User ID: </span>
                          <span className="text-gray-800">{log?.tokenInfo?.userId}</span>
                        </div>
                      )}
                      {log?.tokenInfo?.expiresAt && (
                        <div>
                          <span className="text-gray-600">Expires: </span>
                          <span className={log?.tokenInfo?.isExpired ? 'text-red-600' : 'text-green-600'}>
                            {log?.tokenInfo?.expiresAt}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Details */}
                {log?.error && (
                  <div className="mb-2 bg-red-50 p-2 rounded">
                    <div className="font-semibold text-red-700 mb-1">Error:</div>
                    <div className="text-xs space-y-1">
                      <div className="text-red-600">{log?.error?.message}</div>
                      {log?.error?.code && (
                        <div>
                          <span className="text-gray-600">Code: </span>
                          <span className="text-red-600">{log?.error?.code}</span>
                        </div>
                      )}
                      {log?.error?.details && (
                        <div>
                          <span className="text-gray-600">Details: </span>
                          <span className="text-red-600">{log?.error?.details}</span>
                        </div>
                      )}
                      {log?.error?.stack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            Stack Trace
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                            {log?.error?.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {log?.metadata && Object.keys(log?.metadata)?.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      Metadata
                    </summary>
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log?.metadata, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Realtime Payload */}
                {log?.payload && (
                  <div className="mb-2 bg-orange-50 p-2 rounded">
                    <div className="font-semibold text-orange-700 mb-1">Realtime Event:</div>
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-gray-600">Event Type: </span>
                        <span className="text-gray-800">{log?.payload?.eventType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Table: </span>
                        <span className="text-gray-800">{log?.payload?.table}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
