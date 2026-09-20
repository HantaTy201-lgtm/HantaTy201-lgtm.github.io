import { Icon } from './Icon';
import { useStore, VIEW_ICONS } from '../store';

interface Props {
  panelOpen: boolean;
  onTogglePanel: () => void;
  onToggleSidebar: () => void;
}

export function TopBar({ panelOpen, onTogglePanel, onToggleSidebar }: Props) {
  const { ws, activeTab, openTab, setActiveTab, closeTab, openPalette } = useStore();
  const index = ws.tabs.findIndex((t) => t.id === activeTab.id);

  const step = (delta: number) => {
    const next = ws.tabs[index + delta];
    if (next) setActiveTab(next.id);
  };

  return (
    <div className="topbar">
      <button className="icon-btn" title="Свернуть панель навигации" onClick={onToggleSidebar}>
        <Icon name="side" size={17} />
      </button>
      <button className="icon-btn" title="Предыдущая вкладка" disabled={index <= 0} onClick={() => step(-1)}>
        <Icon name="chevron-left" size={17} />
      </button>
      <button
        className="icon-btn"
        title="Следующая вкладка"
        disabled={index >= ws.tabs.length - 1}
        onClick={() => step(1)}
      >
        <Icon name="chevron-right" size={17} />
      </button>

      <div className="tabstrip">
        {ws.tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab${tab.id === activeTab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={VIEW_ICONS[tab.kind]} size={14} />
            <span>{tab.title}</span>
            <button
              className="tab-close"
              title="Закрыть"
              onClick={(event) => {
                event.stopPropagation();
                closeTab(tab.id);
              }}
            >
              <Icon name="close" size={12} />
            </button>
          </div>
        ))}
        <button className="icon-btn" title="Новая вкладка" onClick={() => openTab('home')}>
          <Icon name="plus" size={16} />
        </button>
      </div>

      <div className="topbar-right">
        <button className="searchbar" onClick={() => openPalette('search')}>
          <Icon name="search" size={15} />
          <span>Поиск по всему</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button className="icon-btn" title="Граф связей" onClick={() => openTab('graph')}>
          <Icon name="grid" size={17} />
        </button>
        <button
          className={`icon-btn${panelOpen ? ' active' : ''}`}
          title="Панель контекста"
          onClick={onTogglePanel}
        >
          <Icon name="panel" size={17} />
        </button>
      </div>
    </div>
  );
}
