import React, { useState, useRef } from 'react';
import type { Task, Priority } from '../../shared/types';
import { useApp } from '../contexts/AppContext';
import { useToast } from './Toast';

interface TaskItemProps {
  task: Task;
}

const priorityColors: Record<Priority, string> = {
  none: 'border-gray-400 dark:border-gray-500',
  low: 'border-green-500',
  medium: 'border-yellow-500',
  high: 'border-red-500',
};

const priorityBgColors: Record<Priority, string> = {
  none: 'bg-gray-400 dark:bg-gray-500',
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

export function TaskItem({ task }: TaskItemProps) {
  const { toggleTaskComplete, setSelectedTaskId, updateTask } = useApp();
  const { showToast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);
  const undoRef = useRef<boolean>(false);

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    undoRef.current = false;

    if (!task.completed) {
      // Animate completion
      setIsAnimating(true);
      setTimeout(async () => {
        if (!undoRef.current) {
          await toggleTaskComplete(task.id);
          // Show undo toast
          showToast(`"${task.title}" completed`, {
            label: 'Undo',
            onClick: async () => {
              await updateTask(task.id, { completed: false });
            },
          });
        }
        setIsAnimating(false);
      }, 300);
    } else {
      toggleTaskComplete(task.id);
    }
  };

  const formatDueDate = (date: string | null): string | null => {
    if (!date) return null;

    const dueDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);

    if (dueDateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else if (dueDateOnly.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (dueDateOnly < today) {
      return 'Overdue';
    } else {
      return dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const dueDateText = formatDueDate(task.dueDate);
  const isOverdue = dueDateText === 'Overdue';

  return (
    <div
      className={`task-item flex items-start gap-3 px-3 py-2 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-all duration-200 ${
        isAnimating ? 'opacity-50 scale-[0.98]' : ''
      }`}
      onClick={() => setSelectedTaskId(task.id)}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggleComplete}
        className={`flex-shrink-0 w-[18px] h-[18px] mt-0.5 rounded-full border-2 transition-all duration-200 ${
          priorityColors[task.priority]
        } ${task.completed || isAnimating ? priorityBgColors[task.priority] : ''} ${
          isAnimating ? 'scale-110' : 'hover:scale-105'
        }`}
      >
        {(task.completed || isAnimating) && (
          <svg
            className={`w-full h-full text-white p-0.5 ${isAnimating ? 'animate-check' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-tight ${
            task.completed
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {task.title}
        </p>

        {/* Task metadata - compact single line */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {dueDateText && (
            <span
              className={`text-xs ${
                isOverdue
                  ? 'text-red-500'
                  : dueDateText === 'Today'
                  ? 'text-primary-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {task.dueTime
                ? `${dueDateText} ${task.dueTime}`
                : dueDateText}
            </span>
          )}

          {task.priority !== 'none' && (
            <span
              className={`text-[10px] px-1 py-0.5 rounded font-medium uppercase priority-${task.priority}`}
            >
              {task.priority}
            </span>
          )}

          {task.description && (
            <svg
              className="w-3 h-3 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          )}

          {task.recurrencePattern && task.recurrencePattern !== 'none' && (
            <svg
              className="w-3 h-3 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              title="Recurring task"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
