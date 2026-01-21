import React, { useState, useEffect, useCallback } from 'react';
import type { HabitWithStats, CreateHabitDTO, HabitFrequency } from '../../shared/types';

interface HabitTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
const ICONS = ['*', '+', '-', '!', '~', '#', '@', '&', '%'];

export function HabitTracker({ isOpen, onClose }: HabitTrackerProps) {
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<HabitWithStats | null>(null);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFrequency, setFormFrequency] = useState<HabitFrequency>('daily');
  const [formTargetDays, setFormTargetDays] = useState<number[]>([]);
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formIcon, setFormIcon] = useState(ICONS[0]);

  // Calendar state for habit detail view
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const loadHabits = useCallback(async () => {
    const loaded = await window.electronAPI.habit.getAllWithStats();
    setHabits(loaded);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHabits();
    }
  }, [isOpen, loadHabits]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormFrequency('daily');
    setFormTargetDays([]);
    setFormColor(COLORS[0]);
    setFormIcon(ICONS[0]);
    setEditingHabit(null);
  };

  const handleCreateHabit = async () => {
    if (!formName.trim()) return;

    const data: CreateHabitDTO = {
      name: formName.trim(),
      description: formDescription.trim(),
      frequency: formFrequency,
      targetDays: formFrequency !== 'daily' ? formTargetDays : [],
      color: formColor,
      icon: formIcon,
    };

    await window.electronAPI.habit.create(data);
    await loadHabits();
    resetForm();
    setShowCreateForm(false);
  };

  const handleUpdateHabit = async () => {
    if (!editingHabit || !formName.trim()) return;

    await window.electronAPI.habit.update(editingHabit.id, {
      name: formName.trim(),
      description: formDescription.trim(),
      frequency: formFrequency,
      targetDays: formFrequency !== 'daily' ? formTargetDays : [],
      color: formColor,
      icon: formIcon,
    });

    await loadHabits();
    resetForm();
    setShowCreateForm(false);
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    await window.electronAPI.habit.delete(id);
    await loadHabits();
    setSelectedHabit(null);
  };

  const handleToggleCompletion = async (habitId: string, date?: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const targetDate = date || new Date().toISOString().split('T')[0];
    const completions = await window.electronAPI.habit.getCompletions(habitId);
    const isCompleted = completions.some(c => c.completedDate === targetDate);

    if (isCompleted) {
      await window.electronAPI.habit.uncomplete(habitId, targetDate);
    } else {
      await window.electronAPI.habit.complete(habitId, targetDate);
    }

    await loadHabits();
    // Refresh selected habit if it's the one we just toggled
    if (selectedHabit?.id === habitId) {
      const updated = await window.electronAPI.habit.getAllWithStats();
      setSelectedHabit(updated.find(h => h.id === habitId) || null);
    }
  };

  const startEditing = (habit: HabitWithStats) => {
    setEditingHabit(habit);
    setFormName(habit.name);
    setFormDescription(habit.description);
    setFormFrequency(habit.frequency);
    setFormTargetDays(habit.targetDays);
    setFormColor(habit.color);
    setFormIcon(habit.icon);
    setShowCreateForm(true);
  };

  const toggleTargetDay = (day: number) => {
    if (formTargetDays.includes(day)) {
      setFormTargetDays(formTargetDays.filter(d => d !== day));
    } else {
      setFormTargetDays([...formTargetDays, day]);
    }
  };

  // Generate calendar days for habit detail view
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month padding
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedHabit ? selectedHabit.name : 'Habit Tracker'}
          </h2>
          <div className="flex items-center gap-2">
            {selectedHabit && (
              <button
                onClick={() => setSelectedHabit(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {showCreateForm ? (
            /* Create/Edit Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Habit Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Exercise, Read, Meditate"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequency
                </label>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'custom'] as HabitFrequency[]).map(freq => (
                    <button
                      key={freq}
                      onClick={() => setFormFrequency(freq)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        formFrequency === freq
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {formFrequency !== 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Days
                  </label>
                  <div className="flex gap-2">
                    {WEEKDAYS.map((day, index) => (
                      <button
                        key={day}
                        onClick={() => toggleTargetDay(index)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                          formTargetDays.includes(index)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {day.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        formColor === color ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setFormIcon(icon)}
                      className={`w-10 h-10 rounded-md text-lg font-bold transition-colors ${
                        formIcon === icon
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateForm(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingHabit ? handleUpdateHabit : handleCreateHabit}
                  disabled={!formName.trim()}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editingHabit ? 'Update Habit' : 'Create Habit'}
                </button>
              </div>
            </div>
          ) : selectedHabit ? (
            /* Habit Detail View */
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedHabit.currentStreak}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Current Streak</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedHabit.longestStreak}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Longest Streak</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedHabit.completionRate}%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">30-Day Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold" style={{ color: selectedHabit.color }}>
                    {selectedHabit.completedToday ? 'Yes' : 'No'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
                </div>
              </div>

              {/* Quick toggle for today */}
              <button
                onClick={() => handleToggleCompletion(selectedHabit.id)}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  selectedHabit.completedToday
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
              >
                {selectedHabit.completedToday ? 'Completed Today!' : 'Mark as Complete'}
              </button>

              {/* Calendar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                  <HabitCalendar
                    habit={selectedHabit}
                    calendarDays={getCalendarDays()}
                    onToggle={(date) => handleToggleCompletion(selectedHabit.id, date)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => startEditing(selectedHabit)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteHabit(selectedHabit.id)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            /* Habits List */
            <div className="space-y-4">
              {habits.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No habits yet</p>
                  <p className="text-sm">Create your first habit to start tracking!</p>
                </div>
              ) : (
                habits.map(habit => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <button
                      onClick={() => handleToggleCompletion(habit.id)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
                        habit.completedToday
                          ? 'text-white scale-110'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:scale-105'
                      }`}
                      style={habit.completedToday ? { backgroundColor: habit.color } : {}}
                    >
                      {habit.completedToday ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        habit.icon
                      )}
                    </button>

                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedHabit(habit)}>
                      <div className="font-medium text-gray-900 dark:text-white">{habit.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {habit.currentStreak} day streak | {habit.completionRate}% completion
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: habit.color }}>
                        {habit.currentStreak}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">streak</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showCreateForm && !selectedHabit && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              + Create New Habit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component for habit calendar to handle completions
function HabitCalendar({
  habit,
  calendarDays,
  onToggle,
}: {
  habit: HabitWithStats;
  calendarDays: { date: Date; isCurrentMonth: boolean }[];
  onToggle: (date: string) => void;
}) {
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadCompletions();
  }, [habit.id]);

  const loadCompletions = async () => {
    const data = await window.electronAPI.habit.getCompletions(habit.id);
    setCompletions(new Set(data.map(c => c.completedDate)));
  };

  return (
    <>
      {calendarDays.map(({ date, isCurrentMonth }, index) => {
        const dateStr = date.toISOString().split('T')[0];
        const isCompleted = completions.has(dateStr);
        const isToday = dateStr === today;
        const isFuture = date > new Date();

        return (
          <button
            key={index}
            onClick={() => {
              if (!isFuture) {
                onToggle(dateStr);
                // Optimistically update
                setCompletions(prev => {
                  const next = new Set(prev);
                  if (next.has(dateStr)) {
                    next.delete(dateStr);
                  } else {
                    next.add(dateStr);
                  }
                  return next;
                });
              }
            }}
            disabled={isFuture}
            className={`aspect-square rounded-md flex items-center justify-center text-sm transition-colors ${
              !isCurrentMonth
                ? 'text-gray-300 dark:text-gray-600'
                : isCompleted
                ? 'text-white'
                : isToday
                ? 'bg-gray-200 dark:bg-gray-600 font-bold'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            } ${isFuture ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={isCompleted && isCurrentMonth ? { backgroundColor: habit.color } : {}}
          >
            {date.getDate()}
          </button>
        );
      })}
    </>
  );
}
