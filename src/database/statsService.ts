import { getDatabase } from './database';
import { pomodoroService } from './pomodoroService';
import { habitService } from './habitService';
import type { TaskStats, DashboardStats, Priority } from '../shared/types';

export const statsService = {
  // Get task statistics
  getTaskStats(): TaskStats {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];

    // Basic task counts
    const totalTasks = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count;
    const completedTasks = (db.prepare('SELECT COUNT(*) as count FROM tasks WHERE completed = 1').get() as any).count;
    const pendingTasks = (db.prepare('SELECT COUNT(*) as count FROM tasks WHERE completed = 0').get() as any).count;
    const overdueTasks = (db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE completed = 0 AND due_date IS NOT NULL AND due_date < ?
    `).get(today) as any).count;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Tasks completed by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const tasksCompletedByDay = db.prepare(`
      SELECT date(completed_at) as date, COUNT(*) as count
      FROM tasks
      WHERE completed = 1 AND completed_at IS NOT NULL AND date(completed_at) >= ?
      GROUP BY date(completed_at)
      ORDER BY date ASC
    `).all(thirtyDaysAgoStr) as { date: string; count: number }[];

    // Tasks completed by week (last 12 weeks)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
    const twelveWeeksAgoStr = twelveWeeksAgo.toISOString().split('T')[0];

    const tasksCompletedByWeek = db.prepare(`
      SELECT strftime('%Y-W%W', completed_at) as week, COUNT(*) as count
      FROM tasks
      WHERE completed = 1 AND completed_at IS NOT NULL AND date(completed_at) >= ?
      GROUP BY strftime('%Y-W%W', completed_at)
      ORDER BY week ASC
    `).all(twelveWeeksAgoStr) as { week: string; count: number }[];

    // Tasks by priority
    const tasksByPriority = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM tasks
      WHERE completed = 0
      GROUP BY priority
    `).all() as { priority: Priority; count: number }[];

    // Tasks by list
    const tasksByList = db.prepare(`
      SELECT
        t.list_id as listId,
        COALESCE(l.name, 'Inbox') as listName,
        COUNT(*) as count
      FROM tasks t
      LEFT JOIN lists l ON t.list_id = l.id
      WHERE t.completed = 0
      GROUP BY t.list_id
      ORDER BY count DESC
    `).all() as { listId: string; listName: string; count: number }[];

    // Average completion time (in hours)
    const avgCompletionResult = db.prepare(`
      SELECT AVG(
        (julianday(completed_at) - julianday(created_at)) * 24
      ) as avg_hours
      FROM tasks
      WHERE completed = 1 AND completed_at IS NOT NULL
    `).get() as { avg_hours: number | null };

    const averageCompletionTime = avgCompletionResult.avg_hours
      ? Math.round(avgCompletionResult.avg_hours * 10) / 10
      : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      tasksCompletedByDay,
      tasksCompletedByWeek,
      tasksByPriority,
      tasksByList,
      averageCompletionTime,
    };
  },

  // Get dashboard statistics (combined)
  getDashboard(): DashboardStats {
    const taskStats = this.getTaskStats();
    const pomodoroStats = pomodoroService.getStats();
    const habitsWithStats = habitService.getAllWithStats(false);

    // Calculate habit statistics
    const totalHabits = habitsWithStats.length;
    const activeHabits = habitsWithStats.filter(h => !h.archived).length;
    const completedToday = habitsWithStats.filter(h => h.completedToday).length;

    const streaks = habitsWithStats.map(h => h.currentStreak);
    const averageStreak = streaks.length > 0
      ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length)
      : 0;
    const longestStreak = Math.max(...streaks, 0);

    return {
      tasks: taskStats,
      pomodoro: pomodoroStats,
      habits: {
        totalHabits,
        activeHabits,
        completedToday,
        averageStreak,
        longestStreak,
      },
    };
  },
};
