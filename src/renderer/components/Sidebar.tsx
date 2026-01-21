import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { SMART_LISTS, type SmartListId } from '../../shared/types';
import { CalendarView } from './CalendarView';

export function Sidebar() {
  const { lists, selectedListId, setSelectedListId, createList, deleteList, viewMode, setViewMode } = useApp();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showMiniCalendar, setShowMiniCalendar] = useState(true);

  const handleCreateList = async () => {
    if (newListName.trim()) {
      await createList(newListName.trim());
      setNewListName('');
      setIsCreatingList(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateList();
    } else if (e.key === 'Escape') {
      setIsCreatingList(false);
      setNewListName('');
    }
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <aside className="w-56 h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* App title */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary-600 dark:text-primary-400">
            George's Ticker
          </h1>
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="List View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Calendar View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Eisenhower Matrix"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Calendar */}
      {showMiniCalendar && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-3 pt-2">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Calendar
            </h2>
            <button
              onClick={() => setShowMiniCalendar(false)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400"
              title="Hide calendar"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
          <CalendarView compact onDateSelect={(date) => {
            // When clicking a date, switch to list view showing tasks for that day
            setViewMode('list');
            // Could also filter to show only that date's tasks
          }} />
        </div>
      )}

      {!showMiniCalendar && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowMiniCalendar(true)}
            className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Show calendar
          </button>
        </div>
      )}

      {/* Smart Lists */}
      <nav className="flex-1 overflow-y-auto p-1.5">
        <div className="mb-3">
          <h2 className="px-2 py-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Smart Lists
          </h2>
          <ul>
            {SMART_LISTS.map(smartList => (
              <li key={smartList.id}>
                <button
                  onClick={() => setSelectedListId(smartList.id)}
                  className={`sidebar-item w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm ${
                    selectedListId === smartList.id ? 'active' : ''
                  }`}
                >
                  <span className="text-base">{smartList.icon}</span>
                  <span className="flex-1">{smartList.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* User Lists */}
        <div>
          <div className="flex items-center justify-between px-2 py-1">
            <h2 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Lists
            </h2>
            <button
              onClick={() => setIsCreatingList(true)}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Add List"
            >
              <svg
                className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {isCreatingList && (
            <div className="px-2 py-1">
              <input
                type="text"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!newListName.trim()) {
                    setIsCreatingList(false);
                  }
                }}
                placeholder="List name..."
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:border-primary-500"
                autoFocus
              />
            </div>
          )}

          <ul>
            {lists.map(list => (
              <li key={list.id} className="group">
                <button
                  onClick={() => setSelectedListId(list.id)}
                  className={`sidebar-item w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm ${
                    selectedListId === list.id ? 'active' : ''
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="flex-1 truncate">{list.name}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm(`Delete "${list.name}"?`)) {
                        deleteList(list.id);
                      }
                    }}
                    className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-opacity"
                    title="Delete list"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Theme toggle */}
      <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={cycleTheme}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          {resolvedTheme === 'dark' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
          <span className="capitalize">{theme}</span>
        </button>
      </div>
    </aside>
  );
}
