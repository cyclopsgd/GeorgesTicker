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
import { GeorgeCredit } from './components/GeorgeCredit';
import { MicrosoftSync } from './components/MicrosoftSync';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

type ModalView = 'none' | 'pomodoro' | 'habits' | 'stats' | 'credit' | 'microsoftSync';

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
      <Sidebar
        onOpenPomodoro={() => setActiveModal('pomodoro')}
        onOpenHabits={() => setActiveModal('habits')}
        onOpenStats={() => setActiveModal('stats')}
        onShowCredit={() => setActiveModal('credit')}
        onOpenMicrosoftSync={() => setActiveModal('microsoftSync')}
      />
      <main className="flex-1 flex overflow-hidden">
        {viewMode === 'list' && <TaskList />}
        {viewMode === 'calendar' && <CalendarView />}
        {viewMode === 'matrix' && <EisenhowerMatrix />}
        <TaskDetail />
      </main>

      {/* Modals */}
      <PomodoroTimer isOpen={activeModal === 'pomodoro'} onClose={() => setActiveModal('none')} />
      <HabitTracker isOpen={activeModal === 'habits'} onClose={() => setActiveModal('none')} />
      <StatsDashboard isOpen={activeModal === 'stats'} onClose={() => setActiveModal('none')} />
      <GeorgeCredit isOpen={activeModal === 'credit'} onClose={() => setActiveModal('none')} />
      {activeModal === 'microsoftSync' && <MicrosoftSync onClose={() => setActiveModal('none')} />}
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
