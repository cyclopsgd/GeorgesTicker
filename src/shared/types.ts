// Task priority levels
export type Priority = 'none' | 'low' | 'medium' | 'high';

// Smart list identifiers
export type SmartListId = 'inbox' | 'today' | 'tomorrow' | 'week' | 'all' | 'completed';

// View mode
export type ViewMode = 'list' | 'calendar' | 'matrix';

// Eisenhower Matrix quadrant
export type EisenhowerQuadrant = 'do-first' | 'schedule' | 'delegate' | 'eliminate';

// Parsed task from natural language input
export interface ParsedTaskInput {
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: Priority | null;
  tags: string[];
  listName: string | null;
}

// Recurrence patterns
export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

// Regenerate mode for recurring tasks
export type RegenerateMode = 'on_completion' | 'fixed_schedule';

// Weekday numbers (0 = Sunday, 6 = Saturday)
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Recurrence configuration
export interface RecurrenceConfig {
  pattern: RecurrencePattern;
  interval: number; // Every N days/weeks/months/years
  weekdays: Weekday[]; // For weekly custom patterns
  endDate: string | null; // Optional end date
  regenerateMode: RegenerateMode;
}

// Task interface
export interface Task {
  id: string;
  listId: string | null;
  title: string;
  description: string;
  notes: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: Priority;
  completed: boolean;
  completedAt: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  // Recurrence fields
  recurrencePattern: RecurrencePattern;
  recurrenceInterval: number;
  recurrenceWeekdays: Weekday[];
  recurrenceEndDate: string | null;
  regenerateMode: RegenerateMode;
}

// Subtask interface
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// List interface
export interface List {
  id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// Tag interface
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// Reminder interface
export interface Reminder {
  id: string;
  taskId: string;
  reminderTime: string; // ISO datetime
  triggered: boolean;
  snoozedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

// Task with subtasks, tags, and reminders
export interface TaskWithSubtasks extends Task {
  subtasks: Subtask[];
  tags: Tag[];
  reminders?: Reminder[];
}

// Create/Update DTOs
export interface CreateTaskDTO {
  listId?: string | null;
  title: string;
  description?: string;
  notes?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: Priority;
  recurrencePattern?: RecurrencePattern;
  recurrenceInterval?: number;
  recurrenceWeekdays?: Weekday[];
  recurrenceEndDate?: string | null;
  regenerateMode?: RegenerateMode;
}

export interface UpdateTaskDTO {
  listId?: string | null;
  title?: string;
  description?: string;
  notes?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: Priority;
  completed?: boolean;
  position?: number;
  recurrencePattern?: RecurrencePattern;
  recurrenceInterval?: number;
  recurrenceWeekdays?: Weekday[];
  recurrenceEndDate?: string | null;
  regenerateMode?: RegenerateMode;
}

export interface CreateSubtaskDTO {
  taskId: string;
  title: string;
}

export interface UpdateSubtaskDTO {
  title?: string;
  completed?: boolean;
  position?: number;
}

export interface CreateListDTO {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateListDTO {
  name?: string;
  color?: string;
  icon?: string;
  position?: number;
}

export interface CreateTagDTO {
  name: string;
  color?: string;
}

export interface UpdateTagDTO {
  name?: string;
  color?: string;
}

export interface CreateReminderDTO {
  taskId: string;
  reminderTime: string; // ISO datetime
}

export interface UpdateReminderDTO {
  reminderTime?: string;
  triggered?: boolean;
  snoozedUntil?: string | null;
}

// Search/Filter options
export interface TaskFilter {
  searchQuery?: string;
  tagIds?: string[];
  priorities?: Priority[];
  dateRange?: {
    start: string;
    end: string;
  };
  completed?: boolean;
}

// IPC Channel names
export const IPC_CHANNELS = {
  // Tasks
  TASK_CREATE: 'task:create',
  TASK_GET_ALL: 'task:getAll',
  TASK_GET_BY_ID: 'task:getById',
  TASK_GET_BY_LIST: 'task:getByList',
  TASK_GET_SMART: 'task:getSmart',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  TASK_REORDER: 'task:reorder',
  TASK_COMPLETE_RECURRING: 'task:completeRecurring',

  // Subtasks
  SUBTASK_CREATE: 'subtask:create',
  SUBTASK_UPDATE: 'subtask:update',
  SUBTASK_DELETE: 'subtask:delete',
  SUBTASK_REORDER: 'subtask:reorder',

  // Lists
  LIST_CREATE: 'list:create',
  LIST_GET_ALL: 'list:getAll',
  LIST_GET_BY_ID: 'list:getById',
  LIST_UPDATE: 'list:update',
  LIST_DELETE: 'list:delete',
  LIST_REORDER: 'list:reorder',

  // Tags
  TAG_CREATE: 'tag:create',
  TAG_GET_ALL: 'tag:getAll',
  TAG_UPDATE: 'tag:update',
  TAG_DELETE: 'tag:delete',
  TAG_ADD_TO_TASK: 'tag:addToTask',
  TAG_REMOVE_FROM_TASK: 'tag:removeFromTask',

  // Search
  TASK_SEARCH: 'task:search',

  // Reminders
  REMINDER_CREATE: 'reminder:create',
  REMINDER_GET_BY_TASK: 'reminder:getByTask',
  REMINDER_GET_PENDING: 'reminder:getPending',
  REMINDER_UPDATE: 'reminder:update',
  REMINDER_DELETE: 'reminder:delete',
  REMINDER_SNOOZE: 'reminder:snooze',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Theme
  THEME_GET: 'theme:get',
  THEME_SET: 'theme:set',
  THEME_GET_SYSTEM: 'theme:getSystem',

  // Pomodoro
  POMODORO_CREATE_SESSION: 'pomodoro:createSession',
  POMODORO_GET_ALL: 'pomodoro:getAll',
  POMODORO_GET_BY_TASK: 'pomodoro:getByTask',
  POMODORO_UPDATE: 'pomodoro:update',
  POMODORO_DELETE: 'pomodoro:delete',
  POMODORO_GET_STATS: 'pomodoro:getStats',
  POMODORO_GET_SETTINGS: 'pomodoro:getSettings',
  POMODORO_UPDATE_SETTINGS: 'pomodoro:updateSettings',

  // Habits
  HABIT_CREATE: 'habit:create',
  HABIT_GET_ALL: 'habit:getAll',
  HABIT_GET_BY_ID: 'habit:getById',
  HABIT_UPDATE: 'habit:update',
  HABIT_DELETE: 'habit:delete',
  HABIT_COMPLETE: 'habit:complete',
  HABIT_UNCOMPLETE: 'habit:uncomplete',
  HABIT_DECREMENT: 'habit:decrement',
  HABIT_UPDATE_NOTE: 'habit:updateNote',
  HABIT_GET_COMPLETIONS: 'habit:getCompletions',
  HABIT_GET_WITH_STATS: 'habit:getWithStats',

  // Statistics
  STATS_GET_TASK_STATS: 'stats:getTaskStats',
  STATS_GET_DASHBOARD: 'stats:getDashboard',

  // Microsoft Sync
  MICROSOFT_SIGN_IN: 'microsoft:signIn',
  MICROSOFT_SIGN_OUT: 'microsoft:signOut',
  MICROSOFT_GET_ACCOUNT: 'microsoft:getAccount',
  MICROSOFT_IS_SIGNED_IN: 'microsoft:isSignedIn',
  MICROSOFT_GET_CONFIG_STATUS: 'microsoft:getConfigStatus',
  MICROSOFT_SYNC: 'microsoft:sync',
  MICROSOFT_GET_SYNC_STATUS: 'microsoft:getSyncStatus',
  MICROSOFT_CLEAR_SYNC_DATA: 'microsoft:clearSyncData',
} as const;

// Application settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultListId: string | null;
  showCompletedTasks: boolean;
  startMinimized: boolean;
  minimizeToTray: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  defaultListId: null,
  showCompletedTasks: true,
  startMinimized: false,
  minimizeToTray: true,
};

// Smart list definitions
export const SMART_LISTS: { id: SmartListId; name: string; icon: string }[] = [
  { id: 'inbox', name: 'Inbox', icon: '📥' },
  { id: 'today', name: 'Today', icon: '📅' },
  { id: 'tomorrow', name: 'Tomorrow', icon: '🌅' },
  { id: 'week', name: 'Next 7 Days', icon: '📆' },
  { id: 'all', name: 'All Tasks', icon: '📋' },
  { id: 'completed', name: 'Completed', icon: '✅' },
];

// ============================================================================
// Phase 3: Pomodoro Timer Types
// ============================================================================

// Pomodoro session status
export type PomodoroStatus = 'work' | 'short_break' | 'long_break' | 'paused' | 'completed';

// Pomodoro session interface
export interface PomodoroSession {
  id: string;
  taskId: string | null;
  status: PomodoroStatus;
  durationMinutes: number;
  actualMinutes: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

// Pomodoro settings interface
export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  notificationSound: boolean;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  notificationSound: true,
};

// Pomodoro DTOs
export interface CreatePomodoroSessionDTO {
  taskId?: string | null;
  status: PomodoroStatus;
  durationMinutes: number;
}

export interface UpdatePomodoroSessionDTO {
  status?: PomodoroStatus;
  actualMinutes?: number;
  completedAt?: string | null;
}

// Pomodoro statistics
export interface PomodoroStats {
  totalSessions: number;
  totalFocusMinutes: number;
  sessionsToday: number;
  focusMinutesToday: number;
  sessionsByTask: { taskId: string; taskTitle: string; sessions: number; minutes: number }[];
}

// ============================================================================
// Phase 3: Habit Tracker Types
// ============================================================================

// Habit frequency type
export type HabitFrequency = 'daily' | 'weekly' | 'custom';

// Habit interface
export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  frequency: HabitFrequency;
  targetDays: number[]; // For weekly: 0-6 (Sun-Sat), for custom: specific days
  reminderTime: string | null; // HH:mm format
  weeklyGoal: number; // Target completions per week (0 = no goal)
  targetCount: number; // How many times per day (for countable habits like "drink 8 glasses")
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

// Habit completion record
export interface HabitCompletion {
  id: string;
  habitId: string;
  completedDate: string; // YYYY-MM-DD
  count: number; // How many times completed (for countable habits)
  note: string; // Optional note for the completion
  createdAt: string;
}

// Habit with streak info
export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  todayCount: number; // How many times completed today
  completionRate: number; // percentage
  weeklyProgress: number; // completions this week
  bestDayOfWeek: number | null; // 0-6, day with most completions
  totalCompletions: number; // all-time completions
}

// Habit DTOs
export interface CreateHabitDTO {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  frequency: HabitFrequency;
  targetDays?: number[];
  reminderTime?: string | null;
  weeklyGoal?: number;
  targetCount?: number;
}

export interface UpdateHabitDTO {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  frequency?: HabitFrequency;
  targetDays?: number[];
  reminderTime?: string | null;
  weeklyGoal?: number;
  targetCount?: number;
  archived?: boolean;
}

// ============================================================================
// Phase 3: Statistics Types
// ============================================================================

// Task statistics
export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasksCompletedByDay: { date: string; count: number }[];
  tasksCompletedByWeek: { week: string; count: number }[];
  tasksByPriority: { priority: Priority; count: number }[];
  tasksByList: { listId: string; listName: string; count: number }[];
  averageCompletionTime: number; // hours from creation to completion
}

// Combined statistics dashboard
export interface DashboardStats {
  tasks: TaskStats;
  pomodoro: PomodoroStats;
  habits: {
    totalHabits: number;
    activeHabits: number;
    completedToday: number;
    averageStreak: number;
    longestStreak: number;
  };
}

// ============================================================================
// Microsoft Sync Types
// ============================================================================

export interface MicrosoftAccount {
  homeAccountId: string;
  environment: string;
  tenantId: string;
  username: string;
  localAccountId: string;
  name?: string;
}

export interface MicrosoftSyncResult {
  success: boolean;
  pulled: number;
  pushed: number;
  errors: string[];
}

export interface MicrosoftSyncStatus {
  lastSyncTime: string | null;
  taskCount: number;
  listCount: number;
}

export interface MicrosoftConfigStatus {
  configured: boolean;
  clientId: string;
}
