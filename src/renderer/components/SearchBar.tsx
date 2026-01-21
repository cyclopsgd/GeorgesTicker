import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Tag, Priority, TaskFilter, Task } from '../../shared/types';
import { useApp } from '../contexts/AppContext';

interface SearchBarProps {
  onSearch: (filter: TaskFilter) => void;
  onClear: () => void;
  tags: Tag[];
}

export function SearchBar({ onSearch, onClear, tags }: SearchBarProps) {
  const { tasks, setSelectedTaskId } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const priorities: { value: Priority; label: string; color: string }[] = [
    { value: 'high', label: 'High', color: 'bg-red-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'low', label: 'Low', color: 'bg-green-500' },
  ];

  // Filter tasks for inline preview
  const matchingTasks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return tasks
      .filter(t => !t.completed && t.title.toLowerCase().includes(query))
      .slice(0, 5);
  }, [searchQuery, tasks]);

  // Filter matching tags for quick selection
  const matchingTags = useMemo(() => {
    if (!searchQuery.trim() || !searchQuery.startsWith('#')) return [];
    const tagQuery = searchQuery.slice(1).toLowerCase();
    return tags.filter(t => t.name.toLowerCase().includes(tagQuery)).slice(0, 5);
  }, [searchQuery, tags]);

  const handleSearch = () => {
    const filter: TaskFilter = {};

    if (searchQuery.trim() && !searchQuery.startsWith('#')) {
      filter.searchQuery = searchQuery.trim();
    }
    if (selectedTags.length > 0) {
      filter.tagIds = selectedTags;
    }
    if (selectedPriorities.length > 0) {
      filter.priorities = selectedPriorities;
    }

    if (Object.keys(filter).length > 0) {
      onSearch(filter);
      setShowDropdown(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedPriorities([]);
    setIsExpanded(false);
    setShowFilters(false);
    setShowDropdown(false);
    onClear();
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleTagSelect = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      setSelectedTags(prev => [...prev, tagId]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const togglePriority = (priority: Priority) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  // Keyboard shortcut for search (Ctrl/Cmd + F)
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape' && isExpanded) {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [isExpanded]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-search on filter changes
  useEffect(() => {
    if (selectedTags.length > 0 || selectedPriorities.length > 0) {
      handleSearch();
    }
  }, [selectedTags, selectedPriorities]);

  // Show dropdown when typing
  useEffect(() => {
    if (searchQuery.trim()) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const hasActiveFilters = selectedTags.length > 0 || selectedPriorities.length > 0;
  const hasDropdownContent = matchingTasks.length > 0 || matchingTags.length > 0;

  if (!isExpanded) {
    return (
      <button
        onClick={() => {
          setIsExpanded(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title="Search (Ctrl+F)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1.5">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Selected tags chips */}
        {selectedTags.map(tagId => {
          const tag = tags.find(t => t.id === tagId);
          if (!tag) return null;
          return (
            <span
              key={tagId}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full text-white"
              style={{ backgroundColor: tag.color }}
            >
              #{tag.name}
              <button
                onClick={() => toggleTag(tagId)}
                className="hover:bg-white/20 rounded-full"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          );
        })}

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          placeholder={selectedTags.length > 0 ? 'Add more...' : 'Search or #tag'}
          className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-1 rounded transition-colors ${
            hasActiveFilters
              ? 'text-primary-500 bg-primary-100 dark:bg-primary-900/30'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          title="Filters"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </button>
        <button
          onClick={handleClear}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
          title="Close"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Inline search results dropdown */}
      {showDropdown && hasDropdownContent && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
          {/* Matching tags */}
          {matchingTags.length > 0 && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1">
                {matchingTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagSelect(tag.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full hover:opacity-80 transition-opacity text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching tasks */}
          {matchingTasks.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 px-2 pt-2 pb-1">Tasks</p>
              {matchingTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleTaskSelect(task.id)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter dropdown */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50">
          {/* Tags filter */}
          {tags.length > 0 && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={{
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                    }}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Priority filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Priority
            </label>
            <div className="flex gap-1.5">
              {priorities.map(priority => (
                <button
                  key={priority.value}
                  onClick={() => togglePriority(priority.value)}
                  className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                    selectedPriorities.includes(priority.value)
                      ? `${priority.color} text-white`
                      : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
