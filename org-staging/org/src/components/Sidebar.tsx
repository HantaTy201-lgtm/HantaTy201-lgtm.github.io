import { useEffect, useRef, useState } from 'react';
import { Icon, OrgMark } from './Icon';
import { useStore } from '../store';
import type { Space, ViewKind } from '../types';

const NAV: { kind: ViewKind; icon: string; label: string }[] = [
  { kind: 'home', icon: 'home', label: 'Главная' },
  { kind: 'note', icon: 'note', label: 'Заметки' },
  { kind: 'canvas', icon: 'canvas', label: 'Канвасы' },
  { kind: 'knowledge', icon: 'database', label: 'База знаний' },
  { kind: 'tasks', icon: 'check-square', label: 'Задачи' },
  { kind: 'calendar', icon: 'calendar', label: 'Календарь' },
];

export function Sidebar() {
  const {
    ws,
    activeTab,
    activeSpace,
    openTab,
    setActiveSpace,
    createNote,
    createSpace,
    setSettingsOpen,
    exportJson,
    importJson,
    resetDemo,
    toast,
  } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newSpace, setNewSpace] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const spaceCount = (space: Space) =>
    ws.notes.filter((n) => n.spaceId === space.id).length +
    ws.canvases.filter((c) => c.spaceId === space.id).length;

  const submitSpace = () => {
    const name = newSpace.trim();
    if (name) createSpace(name, 'violet');
    setNewSpace('');
    setAdding(false);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <OrgMark size={30} className="brand-mark" />
        <span className="brand-name">Org</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <button
            key={item.kind}
            className={`nav-item${activeTab.kind === item.kind ? ' active' : ''}`}
            onClick={() => openTab(item.kind)}
          >
            <Icon name={item.icon} size={17} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-section">Пространства</div>
      <div className="space-list">
        {ws.spaces.map((space) => (
          <div
            key={space.id}
            className={`space-row tone-${space.tone}${activeSpace === space.id ? ' active' : ''}`}
            onClick={() => setActiveSpace(activeSpace === space.id ? 'all' : space.id)}
          >
            <span className="dot" style={{ background: 'var(--tone)' }} />
            <span>{space.name}</span>
            <span className="count">{spaceCount(space)}</span>
            <button
              className="icon-btn add"
              title="Новая заметка в пространстве"
              onClick={(event) => {
                event.stopPropagation();
                createNote({ spaceId: space.id, title: 'Новая заметка' });
              }}
            >
              <Icon name="plus" size={14} />
            </button>
          </div>
        ))}

        {adding ? (
          <input
            autoFocus
            className="node-item-input"
            style={{ margin: '4px 10px' }}
            placeholder="Название пространства"
            value={newSpace}
            onChange={(event) => setNewSpace(event.target.value)}
            onBlur={submitSpace}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitSpace();
              if (event.key === 'Escape') {
                setNewSpace('');
                setAdding(false);
              }
            }}
          />
        ) : (
          <button className="space-row" onClick={() => setAdding(true)}>
            <Icon name="plus" size={14} />
            <span>Новое пространство</span>
          </button>
        )}
      </div>

      <div className="sidebar-foot">
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button className="user-chip" onClick={() => setMenuOpen((v) => !v)}>
            <span className="avatar">{ws.user.name.slice(0, 1)}</span>
            <span className="name">{ws.user.name}</span>
            <Icon name="chevron-down" size={14} />
          </button>
          {menuOpen && (
            <div className="menu" style={{ left: 0, right: 0, bottom: 44, position: 'absolute' }}>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  openTab('graph');
                }}
              >
                <Icon name="network" size={15} />
                Граф связей
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setSettingsOpen(true);
                }}
              >
                <Icon name="settings" size={15} />
                Настройки
              </button>
              <div className="menu-sep" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  exportJson();
                  toast('Файл рабочего пространства сохранён');
                }}
              >
                <Icon name="download" size={15} />
                Экспорт данных
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  fileRef.current?.click();
                }}
              >
                <Icon name="upload" size={15} />
                Импорт данных
              </button>
              <div className="menu-sep" />
              <button
                className="danger"
                onClick={() => {
                  setMenuOpen(false);
                  resetDemo();
                  toast('Демо-данные восстановлены');
                }}
              >
                <Icon name="refresh" size={15} />
                Сбросить к демо
              </button>
            </div>
          )}
        </div>
        <div className="sidebar-actions">
          <button className="icon-btn" title="Настройки" onClick={() => setSettingsOpen(true)}>
            <Icon name="settings" size={17} />
          </button>
          <button className="icon-btn" title="Граф связей" onClick={() => openTab('graph')}>
            <Icon name="network" size={17} />
          </button>
          <button
            className="icon-btn"
            title="Новая заметка"
            onClick={() => createNote({ title: 'Новая заметка' })}
          >
            <Icon name="plus" size={17} />
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          try {
            await importJson(file);
            toast('Рабочее пространство загружено');
          } catch {
            toast('Не удалось прочитать файл');
          }
        }}
      />
    </aside>
  );
}
