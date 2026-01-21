import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { ToastProvider } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { TaskList } from './components/TaskList';
import { TaskDetail } from './components/TaskDetail';
import { CalendarView } from './components/CalendarView';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { PomodoroTimer } from './components/PomodoroTimer';
import { HabitTracker } from './components/HabitTracker';
import { StatsDashboard } from './components/StatsDashboard';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

type ModalView = 'none' | 'pomodoro' | 'habits' | 'stats';

function AppContent() {
  const { viewMode } = useApp();
  const [activeModal, setActiveModal] = useState<ModalView>('none');

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    onOpenPomodoro: () => setActiveModal('pomodoro'),
    onOpenHabits: () => setActiveModal('habits'),
    onOpenStats: () => setActiveModal('stats'),
  });

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        {viewMode === 'list' && <TaskList />}
        {viewMode === 'calendar' && <CalendarView />}
        {viewMode === 'matrix' && <EisenhowerMatrix />}
        <TaskDetail />
      </main>

      {/* Floating action buttons - compact */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setActiveModal('stats')}
          className="w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
          title="Statistics (Alt+S)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        <button
          onClick={() => setActiveModal('habits')}
          className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
          title="Habit Tracker (Alt+H)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          onClick={() => setActiveModal('pomodoro')}
          className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
          title="Pomodoro Timer (Alt+P)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Modals */}
      <PomodoroTimer isOpen={activeModal === 'pomodoro'} onClose={() => setActiveModal('none')} />
      <HabitTracker isOpen={activeModal === 'habits'} onClose={() => setActiveModal('none')} />
      <StatsDashboard isOpen={activeModal === 'stats'} onClose={() => setActiveModal('none')} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
