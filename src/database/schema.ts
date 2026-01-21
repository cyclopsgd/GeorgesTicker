// Database schema creation SQL
export const CREATE_TABLES_SQL = `
-- Lists table
CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT '📁',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  list_id TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  due_date TEXT,
  due_time TEXT,
  priority TEXT DEFAULT 'none' CHECK(priority IN ('none', 'low', 'medium', 'high')),
  completed INTEGER DEFAULT 0,
  completed_at TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- Recurrence fields
  recurrence_pattern TEXT DEFAULT 'none' CHECK(recurrence_pattern IN ('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom')),
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_weekdays TEXT DEFAULT '[]',
  recurrence_end_date TEXT,
  regenerate_mode TEXT DEFAULT 'on_completion' CHECK(regenerate_mode IN ('on_completion', 'fixed_schedule')),
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE SET NULL
);

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Task-Tags junction table (many-to-many)
CREATE TABLE IF NOT EXISTS task_tags (
  task_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (task_id, tag_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  reminder_time TEXT NOT NULL,
  triggered INTEGER DEFAULT 0,
  snoozed_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(title);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(reminder_time);
`;

// Migration system for future schema updates
export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    sql: CREATE_TABLES_SQL,
  },
  {
    version: 2,
    name: 'add_recurrence_fields',
    sql: `
-- Add recurrence fields to tasks table
ALTER TABLE tasks ADD COLUMN recurrence_pattern TEXT DEFAULT 'none' CHECK(recurrence_pattern IN ('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'));
ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER DEFAULT 1;
ALTER TABLE tasks ADD COLUMN recurrence_weekdays TEXT DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN recurrence_end_date TEXT;
ALTER TABLE tasks ADD COLUMN regenerate_mode TEXT DEFAULT 'on_completion' CHECK(regenerate_mode IN ('on_completion', 'fixed_schedule'));
`,
  },
  {
    version: 3,
    name: 'add_reminders_table',
    sql: `
-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  reminder_time TEXT NOT NULL,
  triggered INTEGER DEFAULT 0,
  snoozed_until TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(reminder_time);
`,
  },
  {
    version: 4,
    name: 'add_pomodoro_tables',
    sql: `
-- Pomodoro sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  status TEXT NOT NULL DEFAULT 'work' CHECK(status IN ('work', 'short_break', 'long_break', 'paused', 'completed')),
  duration_minutes INTEGER NOT NULL,
  actual_minutes INTEGER DEFAULT 0,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- Pomodoro settings table (single row)
CREATE TABLE IF NOT EXISTS pomodoro_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  work_duration INTEGER NOT NULL DEFAULT 25,
  short_break_duration INTEGER NOT NULL DEFAULT 5,
  long_break_duration INTEGER NOT NULL DEFAULT 15,
  sessions_before_long_break INTEGER NOT NULL DEFAULT 4,
  auto_start_breaks INTEGER NOT NULL DEFAULT 0,
  auto_start_work INTEGER NOT NULL DEFAULT 0,
  notification_sound INTEGER NOT NULL DEFAULT 1
);

-- Insert default settings
INSERT OR IGNORE INTO pomodoro_settings (id) VALUES (1);

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_id ON pomodoro_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_started_at ON pomodoro_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_status ON pomodoro_sessions(status);
`,
  },
  {
    version: 5,
    name: 'add_habits_tables',
    sql: `
-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#10b981',
  icon TEXT DEFAULT '✓',
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK(frequency IN ('daily', 'weekly', 'custom')),
  target_days TEXT DEFAULT '[]',
  reminder_time TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived INTEGER NOT NULL DEFAULT 0
);

-- Habit completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL,
  completed_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  UNIQUE(habit_id, completed_date)
);

CREATE INDEX IF NOT EXISTS idx_habits_archived ON habits(archived);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completed_date);
`,
  },
  {
    version: 6,
    name: 'enhance_habits',
    sql: `
-- Add weekly goal and target count to habits
ALTER TABLE habits ADD COLUMN weekly_goal INTEGER DEFAULT 0;
ALTER TABLE habits ADD COLUMN target_count INTEGER DEFAULT 1;

-- Add count and note to habit completions
ALTER TABLE habit_completions ADD COLUMN count INTEGER DEFAULT 1;
ALTER TABLE habit_completions ADD COLUMN note TEXT DEFAULT '';
`,
  },
];
