import React, { useState, useEffect } from 'react';
import type { MicrosoftAccount, MicrosoftSyncStatus, MicrosoftConfigStatus } from '../../shared/types';

interface MicrosoftSyncProps {
  onClose: () => void;
}

export function MicrosoftSync({ onClose }: MicrosoftSyncProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [account, setAccount] = useState<MicrosoftAccount | null>(null);
  const [syncStatus, setSyncStatus] = useState<MicrosoftSyncStatus | null>(null);
  const [configStatus, setConfigStatus] = useState<MicrosoftConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial state
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const [signedIn, acc, status, config] = await Promise.all([
        window.electronAPI.microsoft.isSignedIn(),
        window.electronAPI.microsoft.getAccount(),
        window.electronAPI.microsoft.getSyncStatus(),
        window.electronAPI.microsoft.getConfigStatus(),
      ]);
      setIsSignedIn(signedIn);
      setAccount(acc);
      setSyncStatus(status);
      setConfigStatus(config);
    } catch (err) {
      console.error('Failed to load Microsoft status:', err);
      setError('Failed to load sync status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const result = await window.electronAPI.microsoft.signIn();
      if (result.success && result.account) {
        setIsSignedIn(true);
        setAccount(result.account as MicrosoftAccount);
        setSyncResult({ success: true, message: 'Successfully signed in!' });
      } else {
        setError(result.error || 'Sign in failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await window.electronAPI.microsoft.signOut();
      setIsSignedIn(false);
      setAccount(null);
      setSyncResult({ success: true, message: 'Signed out successfully' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const result = await window.electronAPI.microsoft.sync();
      if (result.success) {
        setSyncResult({
          success: true,
          message: `Sync complete! Pulled ${result.pulled} tasks, pushed ${result.pushed} tasks.`,
        });
        // Refresh sync status
        const status = await window.electronAPI.microsoft.getSyncStatus();
        setSyncStatus(status);
      } else {
        setError(result.errors.join(', ') || 'Sync failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearSyncData = async () => {
    if (!confirm('Are you sure you want to clear all sync data? This will not delete any tasks.')) {
      return;
    }
    try {
      await window.electronAPI.microsoft.clearSyncData();
      setSyncStatus({ lastSyncTime: null, taskCount: 0, listCount: 0 });
      setSyncResult({ success: true, message: 'Sync data cleared' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear sync data');
    }
  };

  const formatLastSync = (time: string | null) => {
    if (!time) return 'Never';
    const date = new Date(time);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-white" viewBox="0 0 23 23" fill="currentColor">
              <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
            </svg>
            <h2 className="text-lg font-semibold text-white">Microsoft To Do Sync</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <>
              {/* Configuration Warning */}
              {configStatus && !configStatus.configured && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Configuration Required</p>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        To use Microsoft sync, you need to register an app in Azure AD and set the client ID.
                      </p>
                      <a
                        href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                      >
                        Register an app in Azure Portal
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Status */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account</h3>
                {isSignedIn && account ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {account.username?.charAt(0).toUpperCase() || 'M'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {account.name || account.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{account.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="text-sm text-red-500 hover:text-red-600 dark:text-red-400"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSignIn}
                    disabled={isSigningIn || (configStatus && !configStatus.configured)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {isSigningIn ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 23 23" fill="currentColor">
                          <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
                        </svg>
                        Sign in with Microsoft
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Sync Status */}
              {isSignedIn && syncStatus && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sync Status</h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>Last sync: {formatLastSync(syncStatus.lastSyncTime)}</p>
                    <p>Synced tasks: {syncStatus.taskCount}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSync}
                      disabled={isSyncing}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
                    >
                      {isSyncing ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Syncing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Sync Now
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleClearSyncData}
                      className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      title="Clear sync mappings"
                    >
                      Clear Data
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {syncResult && syncResult.success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{syncResult.message}</span>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Sync your tasks with Microsoft To Do to access them across all your devices.</p>
                <p>Tasks are synced to your default To Do list.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
