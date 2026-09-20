import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import { useStore, VIEW_ICONS, VIEW_LABELS } from '../store';
import { excerpt, normalize, relativeTime } from '../lib/utils';
import type { ViewKind } from '../types';

interface Item {
  id: string;
  group: string;
  label: string;
  sub?: string;
  icon: string;
  run: () => void;
}

export function CommandPalette() {
  const {
    ws,
    paletteMode,
    setPaletteOpen,
    openTab,
    createNote,
    createCanvas,
    createTask,
    exportJson,
    resetDemo,
    setSettingsOpen,
    toast,
  } = useStore();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const items = useMemo<Item[]>(() => {
    const close = () => setPaletteOpen(false);
    const views: ViewKind[] = ['home', 'note', 'canvas', 'knowledge', 'tasks', 'calendar', 'graph'];
    const commands: Item[] = [
      {
        id: 'cmd-note',
        group: 'Действия',
        label: 'Создать заметку',
        icon: 'plus',
        run: () => {
          const note = createNote({ title: 'Новая заметка' });
          openTab('note', note.id);
          close();
        },
      },
      {
        id: 'cmd-canvas',
        group: 'Действия',
        label: 'Создать канвас',
        icon: 'canvas',
        run: () => {
          const canvas = createCanvas('Новый канвас');
          openTab('canvas', canvas.id);
          close();
        },
      },
      {
        id: 'cmd-task',
        group: 'Действия',
        label: 'Создать задачу',
        icon: 'check-square',
        run: () => {
          createTask({ title: 'Новая задача' });
          openTab('tasks');
          toast('Задача добавлена в бэклог');
          close();
        },
      },
      ...views.map<Item>((kind) => ({
        id: `cmd-view-${kind}`,
        group: 'Перейти',
        label: VIEW_LABELS[kind],
        icon: VIEW_ICONS[kind],
        run: () => {
          openTab(kind);
          close();
        },
      })),
      {
        id: 'cmd-export',
        group: 'Данные',
        label: 'Экспортировать рабочее пространство',
        icon: 'download',
        run: () => {
          exportJson();
          toast('Файл сохранён');
          close();
        },
      },
      {
        id: 'cmd-settings',
        group: 'Данные',
        label: 'Настройки',
        icon: 'settings',
        run: () => {
          setSettingsOpen(true);
          close();
        },
      },
      {
        id: 'cmd-reset',
        group: 'Данные',
        label: 'Сбросить к демо-данным',
        icon: 'refresh',
        run: () => {
          resetDemo();
          toast('Демо-данные восстановлены');
          close();
        },
      },
    ];

    const notes: Item[] = ws.notes.map((note) => ({
      id: note.id,
      group: 'Заметки',
      label: note.title,
      sub: excerpt(note.body, 46) || relativeTime(note.updatedAt),
      icon: 'note',
      run: () => {
        openTab('note', note.id);
        close();
      },
    }));

    const canvases: Item[] = ws.canvases.map((canvas) => ({
      id: canvas.id,
      group: 'Канвасы',
      label: canvas.name,
      sub: `${canvas.nodes.length} узлов`,
      icon: 'canvas',
      run: () => {
        openTab('canvas', canvas.id);
        close();
      },
    }));

    const tasks: Item[] = ws.tasks.slice(0, 40).map((task) => ({
      id: task.id,
      group: 'Задачи',
      label: task.title,
      sub: task.status === 'done' ? 'выполнено' : task.due ? `до ${task.due}` : 'без срока',
      icon: 'check-square',
      run: () => {
        openTab('tasks');
        close();
      },
    }));

    if (paletteMode === 'search') return [...notes, ...canvases, ...tasks, ...commands];
    return [...commands, ...notes, ...canvases, ...tasks];
  }, [
    ws,
    paletteMode,
    openTab,
    createNote,
    createCanvas,
    createTask,
    exportJson,
    resetDemo,
    setSettingsOpen,
    setPaletteOpen,
    toast,
  ]);

  const filtered = useMemo(() => {
    const search = normalize(query);
    if (!search) return items.slice(0, 24);
    const scored = items
      .map((item) => {
        const label = normalize(item.label);
        if (label.startsWith(search)) return { item, score: 0 };
        if (label.includes(search)) return { item, score: 1 };
        if (normalize(item.sub ?? '').includes(search)) return { item, score: 2 };
        return null;
      })
      .filter((value): value is { item: Item; score: number } => value !== null)
      .sort((a, b) => a.score - b.score);
    return scored.slice(0, 24).map((value) => value.item);
  }, [items, query]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();
    filtered.forEach((item) => {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const flat = groups.flatMap(([, list]) => list);

  return (
    <div className="overlay" onMouseDown={() => setPaletteOpen(false)}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <Icon name="search" size={17} />
          <input
            ref={inputRef}
            value={query}
            placeholder="Ищи заметки, канвасы, задачи или команды"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setIndex((v) => (flat.length ? (v + 1) % flat.length : 0));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setIndex((v) => (flat.length ? (v - 1 + flat.length) % flat.length : 0));
              } else if (event.key === 'Enter') {
                event.preventDefault();
                flat[index]?.run();
              } else if (event.key === 'Escape') {
                setPaletteOpen(false);
              }
            }}
          />
          <span className="chip">Esc</span>
        </div>
        <div className="modal-body">
          {flat.length === 0 && <div className="empty">Ничего не найдено</div>}
          {groups.map(([group, list]) => (
            <div key={group}>
              <div className="palette-group">{group}</div>
              {list.map((item) => {
                const position = flat.indexOf(item);
                return (
                  <button
                    key={item.id}
                    className={`palette-item${position === index ? ' active' : ''}`}
                    onMouseEnter={() => setIndex(position)}
                    onClick={item.run}
                  >
                    <Icon name={item.icon} size={16} />
                    {item.label}
                    {item.sub && <span className="sub">{item.sub}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <span>↑↓ — навигация</span>
          <span>Enter — открыть</span>
          <span style={{ marginLeft: 'auto' }}>{flat.length} результатов</span>
        </div>
      </div>
    </div>
  );
}
