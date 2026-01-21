import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, action, duration = 4000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 150);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleAction = () => {
    action?.onClick();
    setIsExiting(true);
    setTimeout(onClose, 150);
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 150);
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${
        isExiting ? 'toast-exit' : 'toast-enter'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg shadow-lg">
        <span className="text-sm">{message}</span>
        {action && (
          <button
            onClick={handleAction}
            className="text-sm font-medium text-blue-400 dark:text-blue-600 hover:text-blue-300 dark:hover:text-blue-700 transition-colors"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={handleClose}
          className="ml-2 p-1 hover:bg-gray-700 dark:hover:bg-gray-300 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Toast container for managing multiple toasts
interface ToastItem {
  id: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (message: string, action?: { label: string; onClick: () => void }) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, action?: { label: string; onClick: () => void }) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, action }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          action={toast.action}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
