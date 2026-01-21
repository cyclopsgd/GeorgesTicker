import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { HabitWithStats, CreateHabitDTO, HabitFrequency, HabitCompletion } from '../../shared/types';
import { useApp } from '../contexts/AppContext';

interface HabitTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

// Emoji categories for habit icons
const EMOJI_CATEGORIES = {
  'Health': ['💪', '🏃', '🧘', '💊', '🥗', '💧', '😴', '🚭'],
  'Productivity': ['📚', '✍️', '💻', '📝', '🎯', '⏰', '📊', '🧠'],
  'Wellness': ['🧘', '🌅', '🌙', '🙏', '😊', '💆', '🌿', '☀️'],
  'Hobbies': ['🎨', '🎵', '🎸', '📷', '🎮', '♟️', '🎬', '📖'],
  'Social': ['👋', '💬', '📞', '👨‍👩‍👧', '🤝', '❤️', '🎉', '✉️'],
  'Finance': ['💰', '💳', '📈', '🏦', '💵', '🎰', '📉', '🧾'],
};

// Motivational messages based on streak
const getMotivationalMessage = (streak: number, completionRate: number): string => {
  if (streak === 0 && completionRate < 30) return "Every journey begins with a single step. Start today!";
  if (streak === 1) return "Great start! Keep the momentum going!";
  if (streak >= 2 && streak < 7) return `${streak} days strong! You're building a habit!`;
  if (streak >= 7 && streak < 14) return "A whole week! You're officially on a roll!";
  if (streak >= 14 && streak < 30) return `${streak} days! You're unstoppable!`;
  if (streak >= 30 && streak < 60) return "A month of consistency! You're a habit master!";
  if (streak >= 60 && streak < 100) return `${streak} days! This is who you are now!`;
  if (streak >= 100) return `${streak} days! Legendary dedication!`;
  if (completionRate >= 80) return "Impressive consistency! Keep it up!";
  if (completionRate >= 50) return "You're making progress. Stay focused!";
  return "Today is a new opportunity!";
};

export function HabitTracker({ isOpen, onClose }: HabitTrackerProps) {
  const { showToast } = useApp();
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<HabitWithStats | null>(null);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFrequency, setFormFrequency] = useState<HabitFrequency>('daily');
  const [formTargetDays, setFormTargetDays] = useState<number[]>([]);
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formIcon, setFormIcon] = useState('💪');
  const [formWeeklyGoal, setFormWeeklyGoal] = useState(0);
  const [formTargetCount, setFormTargetCount] = useState(1);
  const [formReminderTime, setFormReminderTime] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Calendar state for habit detail view
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const loadHabits = useCallback(async () => {
    const loaded = await window.electronAPI.habit.getAllWithStats(showArchived);
    setHabits(loaded);
  }, [showArchived]);

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
    setFormIcon('💪');
    setFormWeeklyGoal(0);
    setFormTargetCount(1);
    setFormReminderTime('');
    setEditingHabit(null);
    setShowEmojiPicker(false);
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
      weeklyGoal: formWeeklyGoal,
      targetCount: formTargetCount,
      reminderTime: formReminderTime || null,
    };

    await window.electronAPI.habit.create(data);
    await loadHabits();
    resetForm();
    setShowCreateForm(false);
    showToast?.(`Habit "${formName}" created!`);
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
      weeklyGoal: formWeeklyGoal,
      targetCount: formTargetCount,
      reminderTime: formReminderTime || null,
    });

    await loadHabits();
    resetForm();
    setShowCreateForm(false);
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this habit? This cannot be undone.')) return;
    await window.electronAPI.habit.delete(id);
    await loadHabits();
    setSelectedHabit(null);
    showToast?.('Habit deleted');
  };

  const handleArchiveHabit = async (habit: HabitWithStats) => {
    await window.electronAPI.habit.update(habit.id, { archived: !habit.archived });
    await loadHabits();
    setSelectedHabit(null);
    showToast?.(habit.archived ? 'Habit restored' : 'Habit archived');
  };

  const handleToggleCompletion = async (habitId: string, date?: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const targetDate = date || new Date().toISOString().split('T')[0];
    const completions = await window.electronAPI.habit.getCompletions(habitId);
    const existingCompletion = completions.find(c => c.completedDate === targetDate);

    if (existingCompletion) {
      // If target count is 1, toggle off; otherwise show count controls
      if (habit.targetCount === 1) {
        await window.electronAPI.habit.uncomplete(habitId, targetDate);
        showToast?.(`"${habit.name}" unmarked`, {
          label: 'Undo',
          onClick: async () => {
            await window.electronAPI.habit.complete(habitId, targetDate);
            await loadHabits();
          },
        });
      } else {
        // Increment count
        await window.electronAPI.habit.complete(habitId, targetDate);
      }
    } else {
      await window.electronAPI.habit.complete(habitId, targetDate);
      showToast?.(`"${habit.name}" completed!`, {
        label: 'Undo',
        onClick: async () => {
          await window.electronAPI.habit.uncomplete(habitId, targetDate);
          await loadHabits();
        },
      });
    }

    await loadHabits();
    // Refresh selected habit
    if (selectedHabit?.id === habitId) {
      const updated = await window.electronAPI.habit.getAllWithStats();
      setSelectedHabit(updated.find(h => h.id === habitId) || null);
    }
  };

  const handleDecrementCompletion = async (habitId: string, date?: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const targetDate = date || new Date().toISOString().split('T')[0];
    await window.electronAPI.habit.decrement(habitId, targetDate);
    await loadHabits();

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
    setFormWeeklyGoal(habit.weeklyGoal);
    setFormTargetCount(habit.targetCount);
    setFormReminderTime(habit.reminderTime || '');
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

    // Pad to 42 for consistent height
    while (days.length < 42) {
      days.push({ date: new Date(year, month + 1, days.length - lastDay.getDate() - startPadding + 1), isCurrentMonth: false });
    }

    return days;
  };

  // Filter habits by active tab
  const displayedHabits = useMemo(() => {
    return habits.filter(h => activeTab === 'archived' ? h.archived : !h.archived);
  }, [habits, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500 to-emerald-600">
          <div className="flex items-center gap-3">
            {selectedHabit && (
              <button
                onClick={() => setSelectedHabit(null)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-semibold text-white">
              {selectedHabit ? selectedHabit.name : 'Habit Tracker'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showCreateForm ? (
            /* Create/Edit Form */
            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Habit Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Exercise, Read, Meditate"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Icon & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-full px-4 py-3 text-2xl border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      {formIcon}
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute z-10 top-full left-0 mt-2 w-72 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-3 max-h-64 overflow-y-auto">
                        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                          <div key={category} className="mb-3">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{category}</div>
                            <div className="flex flex-wrap gap-1">
                              {emojis.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    setFormIcon(emoji);
                                    setShowEmojiPicker(false);
                                  }}
                                  className={`w-8 h-8 text-lg rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                                    formIcon === emoji ? 'bg-green-100 dark:bg-green-900/30' : ''
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormColor(color)}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                          formColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency
                </label>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'custom'] as HabitFrequency[]).map(freq => (
                    <button
                      key={freq}
                      onClick={() => setFormFrequency(freq)}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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

              {/* Target Days */}
              {formFrequency !== 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Days
                  </label>
                  <div className="flex gap-2">
                    {WEEKDAYS.map((day, index) => (
                      <button
                        key={day}
                        onClick={() => toggleTargetDay(index)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                          formTargetDays.includes(index)
                            ? 'bg-green-500 text-white scale-110'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {day.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly Goal & Target Count */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Weekly Goal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={formWeeklyGoal}
                      onChange={(e) => setFormWeeklyGoal(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">times/week</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">0 = no goal</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Daily Target
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formTargetCount}
                      onChange={(e) => setFormTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">times/day</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">e.g., 8 glasses of water</p>
                </div>
              </div>

              {/* Reminder Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Daily Reminder
                </label>
                <input
                  type="time"
                  value={formReminderTime}
                  onChange={(e) => setFormReminderTime(e.target.value)}
                  className="w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty for no reminder</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateForm(false);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={editingHabit ? handleUpdateHabit : handleCreateHabit}
                  disabled={!formName.trim()}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {editingHabit ? 'Update Habit' : 'Create Habit'}
                </button>
              </div>
            </div>
          ) : selectedHabit ? (
            /* Habit Detail View */
            <HabitDetailView
              habit={selectedHabit}
              calendarMonth={calendarMonth}
              setCalendarMonth={setCalendarMonth}
              getCalendarDays={getCalendarDays}
              onToggle={handleToggleCompletion}
              onDecrement={handleDecrementCompletion}
              onEdit={() => startEditing(selectedHabit)}
              onDelete={() => handleDeleteHabit(selectedHabit.id)}
              onArchive={() => handleArchiveHabit(selectedHabit)}
            />
          ) : (
            /* Habits List */
            <div className="p-4">
              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Active ({habits.filter(h => !h.archived).length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('archived');
                    setShowArchived(true);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'archived'
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Archived
                </button>
              </div>

              {displayedHabits.length === 0 ? (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <div className="text-6xl mb-4">{activeTab === 'archived' ? '📦' : '🎯'}</div>
                  <p className="text-lg font-medium">
                    {activeTab === 'archived' ? 'No archived habits' : 'No habits yet'}
                  </p>
                  <p className="text-sm mt-1">
                    {activeTab === 'archived' ? 'Archived habits will appear here' : 'Create your first habit to start tracking!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedHabits.map(habit => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onToggle={() => handleToggleCompletion(habit.id)}
                      onDecrement={() => handleDecrementCompletion(habit.id)}
                      onSelect={() => setSelectedHabit(habit)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showCreateForm && !selectedHabit && activeTab === 'active' && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Habit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Habit Card Component
function HabitCard({
  habit,
  onToggle,
  onDecrement,
  onSelect,
}: {
  habit: HabitWithStats;
  onToggle: () => void;
  onDecrement: () => void;
  onSelect: () => void;
}) {
  const progressPercent = habit.weeklyGoal > 0
    ? Math.min(100, (habit.weeklyProgress / habit.weeklyGoal) * 100)
    : 0;

  const isFullyCompletedToday = habit.targetCount > 1
    ? habit.todayCount >= habit.targetCount
    : habit.completedToday;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
        habit.archived
          ? 'bg-gray-100 dark:bg-gray-700/50 opacity-70'
          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {/* Completion Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
            isFullyCompletedToday
              ? 'text-white scale-105 shadow-lg'
              : 'bg-gray-200 dark:bg-gray-600 hover:scale-105'
          }`}
          style={isFullyCompletedToday ? { backgroundColor: habit.color } : {}}
        >
          {isFullyCompletedToday ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            habit.icon
          )}
        </button>
        {/* Count controls for multi-count habits */}
        {habit.targetCount > 1 && habit.todayCount > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDecrement();
              }}
              className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 text-xs"
            >
              -
            </button>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 min-w-[2rem] text-center">
              {habit.todayCount}/{habit.targetCount}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 text-xs"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Habit Info */}
      <div className="flex-1 cursor-pointer" onClick={onSelect}>
        <div className="font-medium text-gray-900 dark:text-white">{habit.name}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3">
          <span className="flex items-center gap-1">
            🔥 {habit.currentStreak} day{habit.currentStreak !== 1 ? 's' : ''}
          </span>
          <span>{habit.completionRate}%</span>
        </div>
        {/* Weekly Progress Bar */}
        {habit.weeklyGoal > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
              <span>This week</span>
              <span>{habit.weeklyProgress}/{habit.weeklyGoal}</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%`, backgroundColor: habit.color }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Streak Display */}
      <div className="text-right">
        <div className="text-2xl font-bold" style={{ color: habit.color }}>
          {habit.currentStreak}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">streak</div>
      </div>
    </div>
  );
}

// Habit Detail View Component
function HabitDetailView({
  habit,
  calendarMonth,
  setCalendarMonth,
  getCalendarDays,
  onToggle,
  onDecrement,
  onEdit,
  onDelete,
  onArchive,
}: {
  habit: HabitWithStats;
  calendarMonth: Date;
  setCalendarMonth: (date: Date) => void;
  getCalendarDays: () => { date: Date; isCurrentMonth: boolean }[];
  onToggle: (habitId: string, date?: string) => void;
  onDecrement: (habitId: string, date?: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
}) {
  const motivationalMessage = getMotivationalMessage(habit.currentStreak, habit.completionRate);

  return (
    <div className="p-6 space-y-6">
      {/* Motivational Banner */}
      <div
        className="p-4 rounded-xl text-white"
        style={{ background: `linear-gradient(135deg, ${habit.color}, ${habit.color}dd)` }}
      >
        <div className="text-3xl mb-2">{habit.icon}</div>
        <p className="text-white/90 text-sm">{motivationalMessage}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{habit.currentStreak}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Current Streak</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{habit.longestStreak}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Best Streak</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{habit.completionRate}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">30-Day Rate</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{habit.totalCompletions}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
        </div>
      </div>

      {/* Weekly Progress */}
      {habit.weeklyGoal > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Weekly Goal</span>
            <span className="text-gray-500 dark:text-gray-400">{habit.weeklyProgress}/{habit.weeklyGoal}</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (habit.weeklyProgress / habit.weeklyGoal) * 100)}%`,
                backgroundColor: habit.color,
              }}
            />
          </div>
        </div>
      )}

      {/* Best Day Insight */}
      {habit.bestDayOfWeek !== null && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <span className="text-lg">💡</span>
            <span className="text-sm">
              You're most consistent on <strong>{WEEKDAYS[habit.bestDayOfWeek]}s</strong>
            </span>
          </div>
        </div>
      )}

      {/* Quick Toggle for Today */}
      <button
        onClick={() => onToggle(habit.id)}
        className={`w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-3 ${
          habit.completedToday
            ? 'text-white shadow-lg'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        style={habit.completedToday ? { backgroundColor: habit.color } : {}}
      >
        {habit.completedToday ? (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Completed Today!
            {habit.targetCount > 1 && ` (${habit.todayCount}/${habit.targetCount})`}
          </>
        ) : (
          <>
            <span className="text-2xl">{habit.icon}</span>
            Mark as Complete
          </>
        )}
      </button>

      {/* Heatmap Calendar */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
          <HabitHeatmap
            habit={habit}
            calendarDays={getCalendarDays()}
            onToggle={(date) => onToggle(habit.id, date)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onEdit}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          Edit
        </button>
        <button
          onClick={onArchive}
          className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {habit.archived ? 'Restore' : 'Archive'}
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// GitHub-style Heatmap Calendar
function HabitHeatmap({
  habit,
  calendarDays,
  onToggle,
}: {
  habit: HabitWithStats;
  calendarDays: { date: Date; isCurrentMonth: boolean }[];
  onToggle: (date: string) => void;
}) {
  const [completions, setCompletions] = useState<Map<string, number>>(new Map());
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadCompletions();
  }, [habit.id]);

  const loadCompletions = async () => {
    const data = await window.electronAPI.habit.getCompletions(habit.id);
    const map = new Map<string, number>();
    data.forEach(c => map.set(c.completedDate, c.count));
    setCompletions(map);
  };

  // Calculate opacity based on completion count vs target
  const getOpacity = (count: number): number => {
    if (count === 0) return 0;
    const ratio = Math.min(1, count / habit.targetCount);
    return 0.3 + ratio * 0.7; // Min 0.3, max 1.0
  };

  return (
    <>
      {calendarDays.map(({ date, isCurrentMonth }, index) => {
        const dateStr = date.toISOString().split('T')[0];
        const count = completions.get(dateStr) || 0;
        const isToday = dateStr === today;
        const isFuture = date > new Date();
        const opacity = getOpacity(count);

        return (
          <button
            key={index}
            onClick={() => {
              if (!isFuture) {
                onToggle(dateStr);
                // Optimistically update
                setCompletions(prev => {
                  const next = new Map(prev);
                  const current = next.get(dateStr) || 0;
                  if (current > 0 && habit.targetCount === 1) {
                    next.delete(dateStr);
                  } else {
                    next.set(dateStr, current + 1);
                  }
                  return next;
                });
              }
            }}
            disabled={isFuture}
            className={`aspect-square rounded-md flex items-center justify-center text-sm transition-all ${
              !isCurrentMonth
                ? 'text-gray-300 dark:text-gray-600'
                : isToday && count === 0
                ? 'ring-2 ring-offset-1 font-bold'
                : ''
            } ${isFuture ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110'}`}
            style={{
              backgroundColor: count > 0 && isCurrentMonth ? habit.color : undefined,
              opacity: count > 0 && isCurrentMonth ? opacity : undefined,
              color: count > 0 && isCurrentMonth ? 'white' : undefined,
              ['--tw-ring-color' as any]: habit.color,
            }}
            title={count > 0 ? `${count} completion${count > 1 ? 's' : ''}` : undefined}
          >
            {date.getDate()}
          </button>
        );
      })}
    </>
  );
}
