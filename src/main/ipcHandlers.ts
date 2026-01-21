import { ipcMain, nativeTheme } from 'electron';
import { IPC_CHANNELS, DEFAULT_SETTINGS, type AppSettings, type PomodoroSettings } from '../shared/types';
import { taskService, subtaskService } from '../database/taskService';
import { listService } from '../database/listService';
import { tagService, searchService } from '../database/tagService';
import { recurrenceService } from '../database/recurrenceService';
import { reminderService } from '../database/reminderService';
import { pomodoroService } from '../database/pomodoroService';
import { habitService } from '../database/habitService';
import { statsService } from '../database/statsService';
import { addAndScheduleReminder, snoozeReminder, deleteReminder } from './reminderManager';
import {
  signInWithMicrosoft,
  signOutFromMicrosoft,
  getMicrosoftAccount,
  isMicrosoftSignedIn,
  getMicrosoftConfigStatus,
} from './microsoftAuth';
import {
  syncWithMicrosoft,
  getSyncStatus,
  clearSyncData,
} from './microsoftSync';

// Settings stored in memory (will be persisted to database later)
let settings: AppSettings = { ...DEFAULT_SETTINGS };

export function setupIpcHandlers(): void {
  // Task handlers
  ipcMain.handle(IPC_CHANNELS.TASK_CREATE, (_event, data) => {
    return taskService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.TASK_GET_ALL, () => {
    return taskService.getAll();
  });

  ipcMain.handle(IPC_CHANNELS.TASK_GET_BY_ID, (_event, id) => {
    return taskService.getByIdWithSubtasks(id);
  });

  ipcMain.handle(IPC_CHANNELS.TASK_GET_BY_LIST, (_event, listId) => {
    return taskService.getByListId(listId);
  });

  ipcMain.handle(IPC_CHANNELS.TASK_GET_SMART, (_event, smartListId) => {
    return taskService.getSmartList(smartListId);
  });

  ipcMain.handle(IPC_CHANNELS.TASK_UPDATE, (_event, id, data) => {
    return taskService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.TASK_DELETE, (_event, id) => {
    return taskService.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.TASK_REORDER, (_event, taskIds) => {
    return taskService.reorder(taskIds);
  });

  ipcMain.handle(IPC_CHANNELS.TASK_COMPLETE_RECURRING, (_event, taskId) => {
    return recurrenceService.completeRecurringTask(taskId);
  });

  // Subtask handlers
  ipcMain.handle(IPC_CHANNELS.SUBTASK_CREATE, (_event, data) => {
    return subtaskService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.SUBTASK_UPDATE, (_event, id, data) => {
    return subtaskService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.SUBTASK_DELETE, (_event, id) => {
    return subtaskService.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.SUBTASK_REORDER, (_event, subtaskIds) => {
    return subtaskService.reorder(subtaskIds);
  });

  // List handlers
  ipcMain.handle(IPC_CHANNELS.LIST_CREATE, (_event, data) => {
    return listService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.LIST_GET_ALL, () => {
    return listService.getAll();
  });

  ipcMain.handle(IPC_CHANNELS.LIST_GET_BY_ID, (_event, id) => {
    return listService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.LIST_UPDATE, (_event, id, data) => {
    return listService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.LIST_DELETE, (_event, id) => {
    return listService.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.LIST_REORDER, (_event, listIds) => {
    return listService.reorder(listIds);
  });

  // Tag handlers
  ipcMain.handle(IPC_CHANNELS.TAG_CREATE, (_event, data) => {
    return tagService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.TAG_GET_ALL, () => {
    return tagService.getAll();
  });

  ipcMain.handle(IPC_CHANNELS.TAG_UPDATE, (_event, id, data) => {
    return tagService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.TAG_DELETE, (_event, id) => {
    return tagService.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.TAG_ADD_TO_TASK, (_event, taskId, tagId) => {
    return tagService.addTagToTask(taskId, tagId);
  });

  ipcMain.handle(IPC_CHANNELS.TAG_REMOVE_FROM_TASK, (_event, taskId, tagId) => {
    return tagService.removeTagFromTask(taskId, tagId);
  });

  // Search handlers
  ipcMain.handle(IPC_CHANNELS.TASK_SEARCH, (_event, filter) => {
    return searchService.searchTasks(filter);
  });

  // Reminder handlers
  ipcMain.handle(IPC_CHANNELS.REMINDER_CREATE, (_event, taskId, reminderTime) => {
    return addAndScheduleReminder(taskId, reminderTime);
  });

  ipcMain.handle(IPC_CHANNELS.REMINDER_GET_BY_TASK, (_event, taskId) => {
    return reminderService.getByTaskId(taskId);
  });

  ipcMain.handle(IPC_CHANNELS.REMINDER_GET_PENDING, () => {
    return reminderService.getPending();
  });

  ipcMain.handle(IPC_CHANNELS.REMINDER_UPDATE, (_event, id, data) => {
    return reminderService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.REMINDER_DELETE, (_event, id) => {
    return deleteReminder(id);
  });

  ipcMain.handle(IPC_CHANNELS.REMINDER_SNOOZE, (_event, id, durationMinutes) => {
    return snoozeReminder(id, durationMinutes);
  });

  // Settings handlers
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, newSettings: Partial<AppSettings>) => {
    settings = { ...settings, ...newSettings };
    return settings;
  });

  // Theme handlers
  ipcMain.handle(IPC_CHANNELS.THEME_GET, () => {
    return settings.theme;
  });

  ipcMain.handle(IPC_CHANNELS.THEME_SET, (_event, theme: 'light' | 'dark' | 'system') => {
    settings.theme = theme;
    // Update native theme source
    if (theme === 'system') {
      nativeTheme.themeSource = 'system';
    } else {
      nativeTheme.themeSource = theme;
    }
  });

  ipcMain.handle(IPC_CHANNELS.THEME_GET_SYSTEM, () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  // Pomodoro handlers
  ipcMain.handle(IPC_CHANNELS.POMODORO_CREATE_SESSION, (_event, data) => {
    return pomodoroService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.POMODORO_GET_ALL, () => {
    return pomodoroService.getAll();
  });

  ipcMain.handle(IPC_CHANNELS.POMODORO_GET_BY_TASK, (_event, taskId) => {
    return pomodoroService.getByTaskId(taskId);
  });

  ipcMain.handle(IPC_CHANNELS.POMODORO_UPDATE, (_event, id, data) => {
    return pomodoroService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.POMODORO_DELETE, (_event, id) => {
    return pomodoroService.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.POMODORO_GET_STATS, () => {
    return pomodoroService.getStats();
  });

  ipcMain.handle(IPC_CHANNELS.POMODORO_GET_SETTINGS, () => {
    return pomodoroService.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.POMODORO_UPDATE_SETTINGS, (_event, data: Partial<PomodoroSettings>) => {
    return pomodoroService.updateSettings(data);
  });

  // Habit handlers
  ipcMain.handle(IPC_CHANNELS.HABIT_CREATE, (_event, data) => {
    return habitService.create(data);
  });

  ipcMain.handle(IPC_CHANNELS.HABIT_GET_ALL, (_event, includeArchived) => {
    return habitService.getAll(includeArchived);
  });

  ipcMain.handle(IPC_CHANNELS.HABIT_GET_BY_ID, (_event, id) => {
    return habitService.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.HABIT_UPDATE, (_event, id, data) => {
    return habitService.update(id, data);
  });

  ipcMain.handle(IPC_CHANNELS.HABIT_DELETE, (_event, id) => {
    return habitService.delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.HABIT_COMPLETE, (_event, habitId, date, note) => {
    return habitService.complete(habitId, date, note);
  });

  ipcMain.handle(IPC_CHANNELS.HABIT_UNCOMPLETE, (_event, habitId, date) => {
    return habitService.uncomplete(habitId, date);
  });

  ipcMain.handle(IPC_CHANNELS.HABIT_DECREMENT, (_event, habitId, date) => {
    return habitService.decrementCompletion(habitId, date);
  });

  ipcMain.handle(IPC_CHANNELS.HABIT_UPDATE_NOTE, (_event, habitId, date, note) => {
    return habitService.updateCompletionNote(habitId, date, note);
  });

  ipcMain.handle(IPC_CHANNELS.HABIT_GET_COMPLETIONS, (_event, habitId, startDate, endDate) => {
    return habitService.getCompletions(habitId, startDate, endDate);
  });

  ipcMain.handle(IPC_CHANNELS.HABIT_GET_WITH_STATS, (_event, includeArchived) => {
    return habitService.getAllWithStats(includeArchived);
  });

  // Statistics handlers
  ipcMain.handle(IPC_CHANNELS.STATS_GET_TASK_STATS, () => {
    return statsService.getTaskStats();
  });

  ipcMain.handle(IPC_CHANNELS.STATS_GET_DASHBOARD, () => {
    return statsService.getDashboard();
  });

  // Microsoft sync handlers
  ipcMain.handle(IPC_CHANNELS.MICROSOFT_SIGN_IN, () => {
    return signInWithMicrosoft();
  });

  ipcMain.handle(IPC_CHANNELS.MICROSOFT_SIGN_OUT, () => {
    return signOutFromMicrosoft();
  });

  ipcMain.handle(IPC_CHANNELS.MICROSOFT_GET_ACCOUNT, () => {
    return getMicrosoftAccount();
  });

  ipcMain.handle(IPC_CHANNELS.MICROSOFT_IS_SIGNED_IN, () => {
    return isMicrosoftSignedIn();
  });

  ipcMain.handle(IPC_CHANNELS.MICROSOFT_GET_CONFIG_STATUS, () => {
    return getMicrosoftConfigStatus();
  });

  ipcMain.handle(IPC_CHANNELS.MICROSOFT_SYNC, () => {
    return syncWithMicrosoft();
  });

  ipcMain.handle(IPC_CHANNELS.MICROSOFT_GET_SYNC_STATUS, () => {
    return getSyncStatus();
  });

  ipcMain.handle(IPC_CHANNELS.MICROSOFT_CLEAR_SYNC_DATA, () => {
    return clearSyncData();
  });
}
