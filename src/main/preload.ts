import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type {
  Task,
  Subtask,
  TaskWithSubtasks,
  List,
  Tag,
  Reminder,
  CreateTaskDTO,
  UpdateTaskDTO,
  CreateSubtaskDTO,
  UpdateSubtaskDTO,
  CreateListDTO,
  UpdateListDTO,
  CreateTagDTO,
  UpdateTagDTO,
  UpdateReminderDTO,
  TaskFilter,
  SmartListId,
  AppSettings,
  PomodoroSession,
  PomodoroSettings,
  PomodoroStats,
  CreatePomodoroSessionDTO,
  UpdatePomodoroSessionDTO,
  Habit,
  HabitCompletion,
  HabitWithStats,
  CreateHabitDTO,
  UpdateHabitDTO,
  TaskStats,
  DashboardStats,
  MicrosoftAccount,
  MicrosoftSyncResult,
  MicrosoftSyncStatus,
  MicrosoftConfigStatus,
} from '../shared/types';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
const electronAPI = {
  // Task operations
  task: {
    create: (data: CreateTaskDTO): Promise<Task> =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_CREATE, data),
    getAll: (): Promise<Task[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_GET_ALL),
    getById: (id: string): Promise<TaskWithSubtasks | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_GET_BY_ID, id),
    getByList: (listId: string | null): Promise<Task[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_GET_BY_LIST, listId),
    getSmart: (smartListId: SmartListId): Promise<Task[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_GET_SMART, smartListId),
    update: (id: string, data: UpdateTaskDTO): Promise<Task | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_UPDATE, id, data),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_DELETE, id),
    reorder: (taskIds: string[]): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_REORDER, taskIds),
    search: (filter: TaskFilter): Promise<Task[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_SEARCH, filter),
    completeRecurring: (taskId: string): Promise<{ completedTask: Task; nextTask: Task | null } | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_COMPLETE_RECURRING, taskId),
  },

  // Subtask operations
  subtask: {
    create: (data: CreateSubtaskDTO): Promise<Subtask> =>
      ipcRenderer.invoke(IPC_CHANNELS.SUBTASK_CREATE, data),
    update: (id: string, data: UpdateSubtaskDTO): Promise<Subtask | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.SUBTASK_UPDATE, id, data),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SUBTASK_DELETE, id),
    reorder: (subtaskIds: string[]): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SUBTASK_REORDER, subtaskIds),
  },

  // List operations
  list: {
    create: (data: CreateListDTO): Promise<List> =>
      ipcRenderer.invoke(IPC_CHANNELS.LIST_CREATE, data),
    getAll: (): Promise<List[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.LIST_GET_ALL),
    getById: (id: string): Promise<List | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.LIST_GET_BY_ID, id),
    update: (id: string, data: UpdateListDTO): Promise<List | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.LIST_UPDATE, id, data),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.LIST_DELETE, id),
    reorder: (listIds: string[]): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.LIST_REORDER, listIds),
  },

  // Tag operations
  tag: {
    create: (data: CreateTagDTO): Promise<Tag> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAG_CREATE, data),
    getAll: (): Promise<Tag[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAG_GET_ALL),
    update: (id: string, data: UpdateTagDTO): Promise<Tag | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAG_UPDATE, id, data),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAG_DELETE, id),
    addToTask: (taskId: string, tagId: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAG_ADD_TO_TASK, taskId, tagId),
    removeFromTask: (taskId: string, tagId: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.TAG_REMOVE_FROM_TASK, taskId, tagId),
  },

  // Reminder operations
  reminder: {
    create: (taskId: string, reminderTime: string): Promise<Reminder> =>
      ipcRenderer.invoke(IPC_CHANNELS.REMINDER_CREATE, taskId, reminderTime),
    getByTask: (taskId: string): Promise<Reminder[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.REMINDER_GET_BY_TASK, taskId),
    getPending: (): Promise<Reminder[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.REMINDER_GET_PENDING),
    update: (id: string, data: UpdateReminderDTO): Promise<Reminder | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.REMINDER_UPDATE, id, data),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.REMINDER_DELETE, id),
    snooze: (id: string, durationMinutes: number): Promise<Reminder | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.REMINDER_SNOOZE, id, durationMinutes),
    // Listen for reminder events
    onTriggered: (callback: (data: { reminderId: string; taskId: string; taskTitle: string }) => void) => {
      ipcRenderer.on('reminder:triggered', (_event, data) => callback(data));
    },
    onClicked: (callback: (taskId: string) => void) => {
      ipcRenderer.on('reminder:clicked', (_event, taskId) => callback(taskId));
    },
  },

  // Settings operations
  settings: {
    get: (): Promise<AppSettings> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    set: (settings: Partial<AppSettings>): Promise<AppSettings> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
  },

  // Theme operations
  theme: {
    get: (): Promise<'light' | 'dark' | 'system'> =>
      ipcRenderer.invoke(IPC_CHANNELS.THEME_GET),
    set: (theme: 'light' | 'dark' | 'system'): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.THEME_SET, theme),
    getSystem: (): Promise<'light' | 'dark'> =>
      ipcRenderer.invoke(IPC_CHANNELS.THEME_GET_SYSTEM),
  },

  // Pomodoro operations
  pomodoro: {
    createSession: (data: CreatePomodoroSessionDTO): Promise<PomodoroSession> =>
      ipcRenderer.invoke(IPC_CHANNELS.POMODORO_CREATE_SESSION, data),
    getAll: (): Promise<PomodoroSession[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.POMODORO_GET_ALL),
    getByTask: (taskId: string): Promise<PomodoroSession[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.POMODORO_GET_BY_TASK, taskId),
    update: (id: string, data: UpdatePomodoroSessionDTO): Promise<PomodoroSession | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.POMODORO_UPDATE, id, data),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.POMODORO_DELETE, id),
    getStats: (): Promise<PomodoroStats> =>
      ipcRenderer.invoke(IPC_CHANNELS.POMODORO_GET_STATS),
    getSettings: (): Promise<PomodoroSettings> =>
      ipcRenderer.invoke(IPC_CHANNELS.POMODORO_GET_SETTINGS),
    updateSettings: (data: Partial<PomodoroSettings>): Promise<PomodoroSettings> =>
      ipcRenderer.invoke(IPC_CHANNELS.POMODORO_UPDATE_SETTINGS, data),
  },

  // Habit operations
  habit: {
    create: (data: CreateHabitDTO): Promise<Habit> =>
      ipcRenderer.invoke(IPC_CHANNELS.HABIT_CREATE, data),
    getAll: (includeArchived?: boolean): Promise<Habit[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.HABIT_GET_ALL, includeArchived),
    getById: (id: string): Promise<Habit | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.HABIT_GET_BY_ID, id),
    update: (id: string, data: UpdateHabitDTO): Promise<Habit | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.HABIT_UPDATE, id, data),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.HABIT_DELETE, id),
    complete: (habitId: string, date?: string, note?: string): Promise<HabitCompletion | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.HABIT_COMPLETE, habitId, date, note),
    uncomplete: (habitId: string, date?: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.HABIT_UNCOMPLETE, habitId, date),
    decrement: (habitId: string, date?: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.HABIT_DECREMENT, habitId, date),
    updateNote: (habitId: string, date: string, note: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.HABIT_UPDATE_NOTE, habitId, date, note),
    getCompletions: (habitId: string, startDate?: string, endDate?: string): Promise<HabitCompletion[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.HABIT_GET_COMPLETIONS, habitId, startDate, endDate),
    getAllWithStats: (includeArchived?: boolean): Promise<HabitWithStats[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.HABIT_GET_WITH_STATS, includeArchived),
  },

  // Statistics operations
  stats: {
    getTaskStats: (): Promise<TaskStats> =>
      ipcRenderer.invoke(IPC_CHANNELS.STATS_GET_TASK_STATS),
    getDashboard: (): Promise<DashboardStats> =>
      ipcRenderer.invoke(IPC_CHANNELS.STATS_GET_DASHBOARD),
  },

  // Microsoft sync operations
  microsoft: {
    signIn: (): Promise<{ success: boolean; account?: MicrosoftAccount; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.MICROSOFT_SIGN_IN),
    signOut: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.MICROSOFT_SIGN_OUT),
    getAccount: (): Promise<MicrosoftAccount | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.MICROSOFT_GET_ACCOUNT),
    isSignedIn: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.MICROSOFT_IS_SIGNED_IN),
    getConfigStatus: (): Promise<MicrosoftConfigStatus> =>
      ipcRenderer.invoke(IPC_CHANNELS.MICROSOFT_GET_CONFIG_STATUS),
    sync: (): Promise<MicrosoftSyncResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.MICROSOFT_SYNC),
    getSyncStatus: (): Promise<MicrosoftSyncStatus> =>
      ipcRenderer.invoke(IPC_CHANNELS.MICROSOFT_GET_SYNC_STATUS),
    clearSyncData: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.MICROSOFT_CLEAR_SYNC_DATA),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the renderer process
export type ElectronAPI = typeof electronAPI;
