import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database';
import type {
  Habit,
  HabitCompletion,
  HabitWithStats,
  HabitFrequency,
  CreateHabitDTO,
  UpdateHabitDTO,
} from '../shared/types';

// Convert database row to Habit
function rowToHabit(row: any): Habit {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    color: row.color,
    icon: row.icon,
    frequency: row.frequency as HabitFrequency,
    targetDays: JSON.parse(row.target_days || '[]'),
    reminderTime: row.reminder_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archived: Boolean(row.archived),
  };
}

// Convert database row to HabitCompletion
function rowToCompletion(row: any): HabitCompletion {
  return {
    id: row.id,
    habitId: row.habit_id,
    completedDate: row.completed_date,
    createdAt: row.created_at,
  };
}

// Calculate streak for a habit
function calculateStreak(completions: string[], targetDays: number[], frequency: HabitFrequency): { current: number; longest: number } {
  if (completions.length === 0) return { current: 0, longest: 0 };

  // Sort completions in descending order (most recent first)
  const sortedDates = [...completions].sort((a, b) => b.localeCompare(a));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Check if habit should be done today
  const shouldDoToday = shouldDoHabitOnDate(today, targetDays, frequency);

  // Start checking from today or yesterday depending on if habit was completed today
  let checkDate = new Date(today);
  if (!sortedDates.includes(todayStr) && shouldDoToday) {
    // Haven't completed today but should have - streak might be broken
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate current streak
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const shouldDo = shouldDoHabitOnDate(checkDate, targetDays, frequency);

    if (shouldDo) {
      if (sortedDates.includes(dateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    checkDate.setDate(checkDate.getDate() - 1);

    // Don't go back more than a year
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    if (checkDate < yearAgo) break;
  }

  // Calculate longest streak by going through all dates
  const allDates = new Set(sortedDates);
  let streakStart = new Date(today);
  streakStart.setFullYear(streakStart.getFullYear() - 1);

  checkDate = new Date(streakStart);
  while (checkDate <= today) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const shouldDo = shouldDoHabitOnDate(checkDate, targetDays, frequency);

    if (shouldDo) {
      if (allDates.has(dateStr)) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    checkDate.setDate(checkDate.getDate() + 1);
  }

  return { current: currentStreak, longest: longestStreak };
}

// Check if habit should be done on a specific date
function shouldDoHabitOnDate(date: Date, targetDays: number[], frequency: HabitFrequency): boolean {
  if (frequency === 'daily') return true;

  const dayOfWeek = date.getDay(); // 0-6 (Sun-Sat)

  if (frequency === 'weekly' || frequency === 'custom') {
    return targetDays.includes(dayOfWeek);
  }

  return true;
}

export const habitService = {
  // Create a new habit
  create(data: CreateHabitDTO): Habit {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO habits (id, name, description, color, icon, frequency, target_days, reminder_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.description || '',
      data.color || '#10b981',
      data.icon || '✓',
      data.frequency,
      JSON.stringify(data.targetDays || []),
      data.reminderTime || null,
      now,
      now
    );

    return this.getById(id)!;
  },

  // Get habit by ID
  getById(id: string): Habit | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
    return row ? rowToHabit(row) : null;
  },

  // Get all habits (optionally include archived)
  getAll(includeArchived = false): Habit[] {
    const db = getDatabase();
    const query = includeArchived
      ? 'SELECT * FROM habits ORDER BY created_at DESC'
      : 'SELECT * FROM habits WHERE archived = 0 ORDER BY created_at DESC';
    const rows = db.prepare(query).all();
    return rows.map(rowToHabit);
  },

  // Update a habit
  update(id: string, data: UpdateHabitDTO): Habit | null {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) return null;

    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [new Date().toISOString()];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      values.push(data.icon);
    }
    if (data.frequency !== undefined) {
      updates.push('frequency = ?');
      values.push(data.frequency);
    }
    if (data.targetDays !== undefined) {
      updates.push('target_days = ?');
      values.push(JSON.stringify(data.targetDays));
    }
    if (data.reminderTime !== undefined) {
      updates.push('reminder_time = ?');
      values.push(data.reminderTime);
    }
    if (data.archived !== undefined) {
      updates.push('archived = ?');
      values.push(data.archived ? 1 : 0);
    }

    values.push(id);
    db.prepare(`UPDATE habits SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.getById(id);
  },

  // Delete a habit
  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM habits WHERE id = ?').run(id);
    return result.changes > 0;
  },

  // Mark habit as complete for a date
  complete(habitId: string, date?: string): HabitCompletion | null {
    const db = getDatabase();
    const completedDate = date || new Date().toISOString().split('T')[0];

    // Check if already completed
    const existing = db.prepare(
      'SELECT * FROM habit_completions WHERE habit_id = ? AND completed_date = ?'
    ).get(habitId, completedDate);

    if (existing) return rowToCompletion(existing);

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO habit_completions (id, habit_id, completed_date, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, habitId, completedDate, now);

    const row = db.prepare('SELECT * FROM habit_completions WHERE id = ?').get(id);
    return row ? rowToCompletion(row) : null;
  },

  // Remove completion for a date
  uncomplete(habitId: string, date?: string): boolean {
    const db = getDatabase();
    const completedDate = date || new Date().toISOString().split('T')[0];

    const result = db.prepare(
      'DELETE FROM habit_completions WHERE habit_id = ? AND completed_date = ?'
    ).run(habitId, completedDate);

    return result.changes > 0;
  },

  // Get completions for a habit
  getCompletions(habitId: string, startDate?: string, endDate?: string): HabitCompletion[] {
    const db = getDatabase();

    let query = 'SELECT * FROM habit_completions WHERE habit_id = ?';
    const params: any[] = [habitId];

    if (startDate) {
      query += ' AND completed_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND completed_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY completed_date DESC';

    const rows = db.prepare(query).all(...params);
    return rows.map(rowToCompletion);
  },

  // Get habit with statistics
  getWithStats(id: string): HabitWithStats | null {
    const habit = this.getById(id);
    if (!habit) return null;

    return this.addStatsToHabit(habit);
  },

  // Get all habits with statistics
  getAllWithStats(includeArchived = false): HabitWithStats[] {
    const habits = this.getAll(includeArchived);
    return habits.map(habit => this.addStatsToHabit(habit));
  },

  // Add statistics to a habit
  addStatsToHabit(habit: Habit): HabitWithStats {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];

    // Get all completions for this habit in the last year
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    const yearAgoStr = yearAgo.toISOString().split('T')[0];

    const completions = db.prepare(`
      SELECT completed_date FROM habit_completions
      WHERE habit_id = ? AND completed_date >= ?
      ORDER BY completed_date DESC
    `).all(habit.id, yearAgoStr) as { completed_date: string }[];

    const completionDates = completions.map(c => c.completed_date);
    const completedToday = completionDates.includes(today);

    // Calculate streaks
    const { current, longest } = calculateStreak(completionDates, habit.targetDays, habit.frequency);

    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let expectedCompletions = 0;
    let actualCompletions = 0;
    const checkDate = new Date(thirtyDaysAgo);

    while (checkDate <= new Date()) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (shouldDoHabitOnDate(checkDate, habit.targetDays, habit.frequency)) {
        expectedCompletions++;
        if (completionDates.includes(dateStr)) {
          actualCompletions++;
        }
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }

    const completionRate = expectedCompletions > 0
      ? Math.round((actualCompletions / expectedCompletions) * 100)
      : 0;

    return {
      ...habit,
      currentStreak: current,
      longestStreak: longest,
      completedToday,
      completionRate,
    };
  },
};
