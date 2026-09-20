import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ContextPanel } from './components/ContextPanel';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { HomeView } from './views/HomeView';
import { NotesView } from './views/NotesView';
import { CanvasView } from './views/CanvasView';
import { GraphView } from './views/GraphView';
import { TasksView } from './views/TasksView';
import { CalendarView } from './views/CalendarView';
import { KnowledgeView } from './views/KnowledgeView';
import { SelectionProvider } from './lib/selection';
import { useStore } from './store';

function ActiveView() {
  const { activeTab } = useStore();

  switch (activeTab.kind) {
    case 'note':
      return <NotesView noteId={activeTab.refId} />;
    case 'canvas':
      return <CanvasView canvasId={activeTab.refId} />;
    case 'knowledge':
      return (
        <div className="view">
          <KnowledgeView />
        </div>
      );
    case 'tasks':
      return (
        <div className="view">
          <TasksView />
        </div>
      );
    case 'calendar':
      return (
        <div className="view">
          <CalendarView />
        </div>
      );
    case 'graph':
      return <GraphView />;
    case 'home':
    default:
      return <HomeView />;
  }
}

export function App() {
  const { paletteOpen, settingsOpen, toastMessage, openPalette } = useStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openPalette('all');
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setSidebarCollapsed((v) => !v);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '\\') {
        event.preventDefault();
        setPanelOpen((v) => !v);
        return;
      }
      if (event.key === 'Escape' && typing) {
        (target as HTMLElement).blur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openPalette]);

  return (
    <SelectionProvider>
      <div className={`app${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <Sidebar />
        <div className="main">
          <TopBar
            panelOpen={panelOpen}
            onTogglePanel={() => setPanelOpen((v) => !v)}
            onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
          />
          <div className={`workspace${panelOpen ? '' : ' panel-hidden'}`}>
            <ActiveView />
            <ContextPanel />
          </div>
        </div>

        {paletteOpen && <CommandPalette />}
        {settingsOpen && <SettingsModal />}
        {toastMessage && <div className="toast">{toastMessage}</div>}
      </div>
    </SelectionProvider>
  );
}
