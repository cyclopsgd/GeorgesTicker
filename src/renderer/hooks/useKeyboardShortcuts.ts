import { useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';

interface KeyboardShortcutsOptions {
  onOpenPomodoro?: () => void;
  onOpenHabits?: () => void;
  onOpenStats?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const { setSelectedListId, setViewMode, viewMode } = useApp();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Alt + key shortcuts
    if (e.altKey) {
      switch (e.key.toLowerCase()) {
        case 'p':
          e.preventDefault();
          options.onOpenPomodoro?.();
          break;
        case 'h':
          e.preventDefault();
          options.onOpenHabits?.();
          break;
        case 's':
          e.preventDefault();
          options.onOpenStats?.();
          break;
        case '1':
          e.preventDefault();
          setViewMode('list');
          break;
        case '2':
          e.preventDefault();
          setViewMode('calendar');
          break;
        case '3':
          e.preventDefault();
          setViewMode('matrix');
          break;
      }
      return;
    }

    // Number keys for smart lists (no modifier)
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          setSelectedListId('inbox');
          break;
        case '2':
          e.preventDefault();
          setSelectedListId('today');
          break;
        case '3':
          e.preventDefault();
          setSelectedListId('tomorrow');
          break;
        case '4':
          e.preventDefault();
          setSelectedListId('week');
          break;
        case '5':
          e.preventDefault();
          setSelectedListId('all');
          break;
        case '6':
          e.preventDefault();
          setSelectedListId('completed');
          break;
      }
    }
  }, [setSelectedListId, setViewMode, options]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
