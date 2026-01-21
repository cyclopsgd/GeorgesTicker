import { Client } from '@microsoft/microsoft-graph-client';
import { getMicrosoftAccessToken, isMicrosoftSignedIn } from './microsoftAuth';
import { getDatabase } from '../database/database';
import { taskService } from '../database/taskService';
import { listService } from '../database/listService';
import type { Task, List, Priority } from '../shared/types';
import Store from 'electron-store';
import 'isomorphic-fetch';

// Store schema type
interface SyncStoreSchema {
  lastSyncTime: string | null;
  taskMappings: Record<string, string>; // localId -> microsoftId
  listMappings: Record<string, string>; // localId -> microsoftListId
}

// Store for sync metadata - use type assertion to fix electron-store typing issues
const syncStore = new Store({
  name: 'microsoft-sync',
  defaults: {
    lastSyncTime: null,
    taskMappings: {},
    listMappings: {},
  },
}) as Store<SyncStoreSchema> & {
  get<K extends keyof SyncStoreSchema>(key: K): SyncStoreSchema[K];
  set<K extends keyof SyncStoreSchema>(key: K, value: SyncStoreSchema[K]): void;
  delete<K extends keyof SyncStoreSchema>(key: K): void;
  clear(): void;
};

// Microsoft To Do task interface
interface MicrosoftTodoTask {
  id?: string;
  title: string;
  body?: {
    content: string;
    contentType: 'text' | 'html';
  };
  importance?: 'low' | 'normal' | 'high';
  status?: 'notStarted' | 'inProgress' | 'completed' | 'waitingOnOthers' | 'deferred';
  dueDateTime?: {
    dateTime: string;
    timeZone: string;
  };
  completedDateTime?: {
    dateTime: string;
    timeZone: string;
  };
  createdDateTime?: string;
  lastModifiedDateTime?: string;
}

interface MicrosoftTodoList {
  id?: string;
  displayName: string;
  isOwner?: boolean;
  isShared?: boolean;
  wellknownListName?: 'none' | 'defaultList' | 'flaggedEmails' | 'unknownFutureValue';
}

// Get Microsoft Graph client
async function getGraphClient(): Promise<Client | null> {
  const token = await getMicrosoftAccessToken();
  if (!token) return null;

  return Client.init({
    authProvider: (done) => {
      done(null, token);
    },
  });
}

// Convert our priority to Microsoft importance
function toMicrosoftImportance(priority: Priority): 'low' | 'normal' | 'high' {
  switch (priority) {
    case 'high': return 'high';
    case 'medium': return 'normal';
    case 'low': return 'low';
    default: return 'normal';
  }
}

// Convert Microsoft importance to our priority
function fromMicrosoftImportance(importance?: string): Priority {
  switch (importance) {
    case 'high': return 'high';
    case 'normal': return 'medium';
    case 'low': return 'low';
    default: return 'none';
  }
}

// Convert our task to Microsoft format
function toMicrosoftTask(task: Task): MicrosoftTodoTask {
  const msTask: MicrosoftTodoTask = {
    title: task.title,
    importance: toMicrosoftImportance(task.priority),
    status: task.completed ? 'completed' : 'notStarted',
  };

  if (task.description || task.notes) {
    msTask.body = {
      content: task.description || task.notes || '',
      contentType: 'text',
    };
  }

  if (task.dueDate) {
    const dueDateTime = task.dueTime
      ? `${task.dueDate}T${task.dueTime}:00`
      : `${task.dueDate}T00:00:00`;
    msTask.dueDateTime = {
      dateTime: dueDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  return msTask;
}

// Get all Microsoft To Do lists
export async function getMicrosoftLists(): Promise<MicrosoftTodoList[]> {
  if (!isMicrosoftSignedIn()) return [];

  try {
    const client = await getGraphClient();
    if (!client) return [];

    const response = await client.api('/me/todo/lists').get();
    return response.value || [];
  } catch (error) {
    console.error('Failed to get Microsoft lists:', error);
    return [];
  }
}

// Get tasks from a Microsoft To Do list
export async function getMicrosoftTasks(listId: string): Promise<MicrosoftTodoTask[]> {
  if (!isMicrosoftSignedIn()) return [];

  try {
    const client = await getGraphClient();
    if (!client) return [];

    const response = await client
      .api(`/me/todo/lists/${listId}/tasks`)
      .top(100)
      .get();
    return response.value || [];
  } catch (error) {
    console.error('Failed to get Microsoft tasks:', error);
    return [];
  }
}

// Create a task in Microsoft To Do
export async function createMicrosoftTask(listId: string, task: Task): Promise<string | null> {
  if (!isMicrosoftSignedIn()) return null;

  try {
    const client = await getGraphClient();
    if (!client) return null;

    const msTask = toMicrosoftTask(task);
    const response = await client
      .api(`/me/todo/lists/${listId}/tasks`)
      .post(msTask);

    // Store mapping
    if (response.id) {
      const mappings = syncStore.get('taskMappings') || {};
      mappings[task.id] = response.id;
      syncStore.set('taskMappings', mappings);
    }

    return response.id || null;
  } catch (error) {
    console.error('Failed to create Microsoft task:', error);
    return null;
  }
}

// Update a task in Microsoft To Do
export async function updateMicrosoftTask(listId: string, microsoftTaskId: string, task: Task): Promise<boolean> {
  if (!isMicrosoftSignedIn()) return false;

  try {
    const client = await getGraphClient();
    if (!client) return false;

    const msTask = toMicrosoftTask(task);
    await client
      .api(`/me/todo/lists/${listId}/tasks/${microsoftTaskId}`)
      .patch(msTask);

    return true;
  } catch (error) {
    console.error('Failed to update Microsoft task:', error);
    return false;
  }
}

// Delete a task in Microsoft To Do
export async function deleteMicrosoftTask(listId: string, microsoftTaskId: string): Promise<boolean> {
  if (!isMicrosoftSignedIn()) return false;

  try {
    const client = await getGraphClient();
    if (!client) return false;

    await client
      .api(`/me/todo/lists/${listId}/tasks/${microsoftTaskId}`)
      .delete();

    return true;
  } catch (error) {
    console.error('Failed to delete Microsoft task:', error);
    return false;
  }
}

// Create a list in Microsoft To Do
export async function createMicrosoftList(name: string): Promise<string | null> {
  if (!isMicrosoftSignedIn()) return null;

  try {
    const client = await getGraphClient();
    if (!client) return null;

    const response = await client
      .api('/me/todo/lists')
      .post({ displayName: name });

    return response.id || null;
  } catch (error) {
    console.error('Failed to create Microsoft list:', error);
    return null;
  }
}

// Full sync - Pull from Microsoft and merge with local
export async function syncWithMicrosoft(): Promise<{
  success: boolean;
  pulled: number;
  pushed: number;
  errors: string[];
}> {
  const result = { success: false, pulled: 0, pushed: 0, errors: [] as string[] };

  if (!isMicrosoftSignedIn()) {
    result.errors.push('Not signed in to Microsoft');
    return result;
  }

  try {
    const client = await getGraphClient();
    if (!client) {
      result.errors.push('Failed to get Graph client');
      return result;
    }

    // Get Microsoft lists
    const msLists = await getMicrosoftLists();
    const listMappings = syncStore.get('listMappings') || {};
    const taskMappings = syncStore.get('taskMappings') || {};

    // Find or create a default list for syncing
    let defaultMsList = msLists.find(l => l.wellknownListName === 'defaultList');
    if (!defaultMsList && msLists.length > 0) {
      defaultMsList = msLists[0];
    }

    if (!defaultMsList?.id) {
      // Create a new list
      const newListId = await createMicrosoftList("George's Ticker Tasks");
      if (newListId) {
        defaultMsList = { id: newListId, displayName: "George's Ticker Tasks" };
      } else {
        result.errors.push('Failed to create default list');
        return result;
      }
    }

    const msListId = defaultMsList.id!;

    // Get all tasks from Microsoft
    const msTasks = await getMicrosoftTasks(msListId);

    // Get all local tasks
    const localTasks = taskService.getAll();

    // Create a map of Microsoft tasks by ID
    const msTaskMap = new Map<string, MicrosoftTodoTask>();
    msTasks.forEach(t => {
      if (t.id) msTaskMap.set(t.id, t);
    });

    // Create reverse mapping (microsoftId -> localId)
    const reverseMappings: Record<string, string> = {};
    Object.entries(taskMappings as Record<string, string>).forEach(([localId, msId]) => {
      reverseMappings[msId] = localId;
    });

    // Pull new tasks from Microsoft (that we don't have locally)
    for (const msTask of msTasks) {
      if (!msTask.id) continue;

      const localId = reverseMappings[msTask.id];
      if (!localId) {
        // New task from Microsoft - create locally
        try {
          const newTask = taskService.create({
            title: msTask.title,
            description: msTask.body?.content || '',
            priority: fromMicrosoftImportance(msTask.importance),
            dueDate: msTask.dueDateTime?.dateTime?.split('T')[0] || null,
          });

          if (msTask.status === 'completed') {
            taskService.update(newTask.id, { completed: true });
          }

          // Store mapping
          taskMappings[newTask.id] = msTask.id;
          result.pulled++;
        } catch (error) {
          result.errors.push(`Failed to import task: ${msTask.title}`);
        }
      }
    }

    // Push local tasks that aren't in Microsoft
    for (const localTask of localTasks) {
      const msId = taskMappings[localTask.id];
      if (!msId) {
        // New local task - push to Microsoft
        try {
          const newMsId = await createMicrosoftTask(msListId, localTask);
          if (newMsId) {
            taskMappings[localTask.id] = newMsId;
            result.pushed++;
          }
        } catch (error) {
          result.errors.push(`Failed to push task: ${localTask.title}`);
        }
      } else if (msTaskMap.has(msId)) {
        // Task exists in both - sync updates
        // For simplicity, we'll use local as source of truth
        // A more sophisticated sync would compare lastModified timestamps
        try {
          await updateMicrosoftTask(msListId, msId, localTask);
        } catch (error) {
          result.errors.push(`Failed to update task: ${localTask.title}`);
        }
      }
    }

    // Save updated mappings
    syncStore.set('taskMappings', taskMappings);
    syncStore.set('lastSyncTime', new Date().toISOString());

    result.success = true;
    return result;
  } catch (error) {
    console.error('Sync error:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    return result;
  }
}

// Get sync status
export function getSyncStatus(): {
  lastSyncTime: string | null;
  taskCount: number;
  listCount: number;
} {
  const taskMappings = syncStore.get('taskMappings') || {};
  const listMappings = syncStore.get('listMappings') || {};

  return {
    lastSyncTime: syncStore.get('lastSyncTime') || null,
    taskCount: Object.keys(taskMappings).length,
    listCount: Object.keys(listMappings).length,
  };
}

// Clear all sync data
export function clearSyncData(): void {
  syncStore.clear();
}
