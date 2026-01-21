import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import type { Task } from '../../shared/types';

interface CalendarViewProps {
  onDateSelect?: (date: Date) => void;
  compact?: boolean;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CalendarView({ onDateSelect, compact = false }: CalendarViewProps) {
  const { tasks, updateTask, setSelectedTaskId } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Get the first day of the month
  const firstDayOfMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [currentDate]);

  // Get the last day of the month
  const lastDayOfMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  }, [currentDate]);

  // Generate calendar days (always 42 cells = 6 weeks for consistent height)
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];

    // Add empty days for the start of the month
    const startDay = firstDayOfMonth.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    // Pad to exactly 42 cells (6 weeks) for consistent height
    while (days.length < 42) {
      days.push(null);
    }

    return days;
  }, [firstDayOfMonth, lastDayOfMonth, currentDate]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};

    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = task.dueDate.split('T')[0]; // Get just the date part
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if date is today
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Format date to YYYY-MM-DD
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle drag start
  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, date: Date | null) => {
    if (date && draggedTask) {
      e.preventDefault();
    }
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, date: Date | null) => {
    e.preventDefault();
    if (date && draggedTask) {
      const newDueDate = formatDateKey(date);
      await updateTask(draggedTask.id, { dueDate: newDueDate });
      setDraggedTask(null);
    }
  };

  // Handle date click
  const handleDateClick = (date: Date | null) => {
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  // Priority colors for task dots
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  if (compact) {
    // Mini calendar for sidebar
    return (
      <div className="p-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {MONTH_NAMES[currentDate.getMonth()].slice(0, 3)} {currentDate.getFullYear()}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className="text-center text-xs text-gray-400 py-1">
              {day[0]}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((date, index) => {
            const dateKey = date ? formatDateKey(date) : '';
            const dayTasks = date ? tasksByDate[dateKey] || [] : [];
            const hasTask = dayTasks.length > 0;

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={!date}
                className={`
                  relative aspect-square text-xs flex items-center justify-center rounded
                  ${!date ? 'invisible' : ''}
                  ${isToday(date) ? 'bg-primary-500 text-white font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                  ${hasTask && !isToday(date) ? 'font-medium' : ''}
                `}
              >
                {date?.getDate()}
                {hasTask && !isToday(date) && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Full calendar view
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </header>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const dateKey = date ? formatDateKey(date) : '';
            const dayTasks = date ? tasksByDate[dateKey] || [] : [];

            return (
              <div
                key={index}
                onDragOver={(e) => handleDragOver(e, date)}
                onDrop={(e) => handleDrop(e, date)}
                className={`
                  min-h-[100px] p-2 rounded-lg border transition-colors
                  ${!date ? 'invisible' : ''}
                  ${isToday(date)
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }
                  ${draggedTask && date ? 'hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10' : ''}
                `}
              >
                {date && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isToday(date)
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[80px]">
                      {dayTasks.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`
                            text-xs p-1 rounded cursor-pointer truncate
                            ${task.completed
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 line-through'
                              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }
                          `}
                        >
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${getPriorityColor(task.priority)}`} />
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 pl-1">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
