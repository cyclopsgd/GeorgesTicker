import React, { useState, useEffect, useCallback } from 'react';
import type { DashboardStats, TaskStats, PomodoroStats } from '../../shared/types';

interface StatsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'tasks' | 'pomodoro' | 'habits';

export function StatsDashboard({ isOpen, onClose }: StatsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const data = await window.electronAPI.stats.getDashboard();
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, loadStats]);

  if (!isOpen) return null;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'pomodoro', label: 'Focus' },
    { id: 'habits', label: 'Habits' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Statistics Dashboard</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : stats ? (
            <>
              {activeTab === 'overview' && <OverviewTab stats={stats} />}
              {activeTab === 'tasks' && <TasksTab stats={stats.tasks} />}
              {activeTab === 'pomodoro' && <PomodoroTab stats={stats.pomodoro} />}
              {activeTab === 'habits' && <HabitsTab stats={stats.habits} />}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">Failed to load statistics</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ stats }: { stats: DashboardStats }) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Tasks Completed"
          value={stats.tasks.completedTasks}
          color="text-blue-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Focus Minutes"
          value={stats.pomodoro.totalFocusMinutes}
          color="text-red-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Active Habits"
          value={stats.habits.activeHabits}
          color="text-green-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          label="Avg Streak"
          value={stats.habits.averageStreak}
          suffix="days"
          color="text-purple-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Today's Progress */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Today's Progress</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.pomodoro.sessionsToday}</div>
            <div className="text-sm opacity-80">Pomodoro Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.pomodoro.focusMinutesToday}</div>
            <div className="text-sm opacity-80">Focus Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.habits.completedToday}</div>
            <div className="text-sm opacity-80">Habits Done</div>
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Completion</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.tasks.completionRate}%` }}
              />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.tasks.completionRate}%
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {stats.tasks.completedTasks} of {stats.tasks.totalTasks} tasks completed
        </div>
      </div>
    </div>
  );
}

// Tasks Tab
function TasksTab({ stats }: { stats: TaskStats }) {
  return (
    <div className="space-y-6">
      {/* Task Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={stats.totalTasks} color="text-blue-600" />
        <StatCard label="Completed" value={stats.completedTasks} color="text-green-600" />
        <StatCard label="Pending" value={stats.pendingTasks} color="text-yellow-600" />
        <StatCard label="Overdue" value={stats.overdueTasks} color="text-red-600" />
      </div>

      {/* Tasks by Priority */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tasks by Priority</h3>
        <div className="space-y-3">
          {stats.tasksByPriority.map(({ priority, count }) => (
            <div key={priority} className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`} />
              <span className="flex-1 capitalize text-gray-700 dark:text-gray-300">{priority}</span>
              <span className="font-medium text-gray-900 dark:text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks by List */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tasks by List</h3>
        <div className="space-y-3">
          {stats.tasksByList.slice(0, 5).map(({ listId, listName, count }) => (
            <div key={listId || 'inbox'} className="flex items-center gap-3">
              <span className="flex-1 text-gray-700 dark:text-gray-300">{listName}</span>
              <span className="font-medium text-gray-900 dark:text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Chart */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Completions (Last 30 Days)</h3>
        <div className="h-32 flex items-end gap-1">
          {stats.tasksCompletedByDay.length > 0 ? (
            stats.tasksCompletedByDay.slice(-30).map(({ date, count }) => {
              const maxCount = Math.max(...stats.tasksCompletedByDay.map(d => d.count), 1);
              const height = (count / maxCount) * 100;
              return (
                <div
                  key={date}
                  className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${date}: ${count} tasks`}
                />
              );
            })
          ) : (
            <div className="flex-1 text-center text-gray-500 dark:text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Average Completion Time */}
      <div className="text-center text-gray-500 dark:text-gray-400">
        Average time to complete a task: <span className="font-semibold text-gray-900 dark:text-white">{stats.averageCompletionTime} hours</span>
      </div>
    </div>
  );
}

// Pomodoro Tab
function PomodoroTab({ stats }: { stats: PomodoroStats }) {
  const hours = Math.floor(stats.totalFocusMinutes / 60);
  const minutes = stats.totalFocusMinutes % 60;

  return (
    <div className="space-y-6">
      {/* Total Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-lg p-6 text-white">
          <div className="text-4xl font-bold">{stats.totalSessions}</div>
          <div className="text-sm opacity-80">Total Sessions</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg p-6 text-white">
          <div className="text-4xl font-bold">
            {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
          </div>
          <div className="text-sm opacity-80">Total Focus Time</div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500">{stats.sessionsToday}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500">{stats.focusMinutesToday}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Minutes</div>
          </div>
        </div>
      </div>

      {/* Sessions by Task */}
      {stats.sessionsByTask.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Tasks by Focus Time</h3>
          <div className="space-y-4">
            {stats.sessionsByTask.map(({ taskId, taskTitle, sessions, minutes }) => (
              <div key={taskId || 'none'} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 truncate">{taskTitle}</span>
                  <span className="text-gray-500 dark:text-gray-400">{sessions} sessions ({minutes}m)</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{
                      width: `${(minutes / Math.max(...stats.sessionsByTask.map(s => s.minutes), 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.sessionsByTask.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Complete some Pomodoro sessions to see your focus statistics!
        </div>
      )}
    </div>
  );
}

// Habits Tab
function HabitsTab({ stats }: { stats: DashboardStats['habits'] }) {
  return (
    <div className="space-y-6">
      {/* Habit Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Habits" value={stats.totalHabits} color="text-green-600" />
        <StatCard label="Active" value={stats.activeHabits} color="text-blue-600" />
        <StatCard label="Completed Today" value={stats.completedToday} color="text-purple-600" />
        <StatCard label="Longest Streak" value={stats.longestStreak} suffix="days" color="text-orange-600" />
      </div>

      {/* Streak Info */}
      <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-lg p-6 text-white text-center">
        <div className="text-sm opacity-80 mb-2">Average Habit Streak</div>
        <div className="text-5xl font-bold">{stats.averageStreak}</div>
        <div className="text-sm opacity-80 mt-2">days</div>
      </div>

      {/* Today's Progress */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Progress</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{
                  width: `${stats.activeHabits > 0 ? (stats.completedToday / stats.activeHabits) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.completedToday}/{stats.activeHabits}
          </div>
        </div>
      </div>

      {stats.totalHabits === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Create some habits to track your progress!
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({
  label,
  value,
  suffix,
  color = 'text-gray-900 dark:text-white',
  icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
      {icon && <div className={`${color} mb-2`}>{icon}</div>}
      <div className={`text-2xl font-bold ${color}`}>
        {value}
        {suffix && <span className="text-sm font-normal ml-1">{suffix}</span>}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
}
