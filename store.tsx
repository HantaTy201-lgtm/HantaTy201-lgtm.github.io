import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  Canvas,
  Id,
  KnowledgeBase,
  Note,
  Space,
  Tab,
  Task,
  ToneKey,
  ViewKind,
  Workspace,
} from './types';
import { createSeed } from './data/seed';
import { downloadJson, uid } from './lib/utils';

const STORAGE_KEY = 'org.workspace.v1';
const HISTORY_LIMIT = 60;

export const VIEW_LABELS: Record<ViewKind, string> = {
  home: 'Главная',
  note: 'Заметка',
  canvas: 'Канвас',
  knowledge: 'База знаний',
  tasks: 'Задачи',
  calendar: 'Календарь',
  graph: 'Граф связей',
};

export const VIEW_ICONS: Record<ViewKind, string> = {
  home: 'home',
  note: 'note',
  canvas: 'canvas',
  knowledge: 'database',
  tasks: 'check-square',
  calendar: 'calendar',
  graph: 'network',
};

function loadWorkspace(): Workspace {
  const seed = createSeed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<Workspace> | null;
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) return seed;

    const notes = Array.isArray(parsed.notes) ? parsed.notes : [];
    const canvases = Array.isArray(parsed.canvases) ? parsed.canvases : [];
    // A workspace with no notes *and* no canvases is a broken/truncated save,
    // not an intentional empty one - restore the demo seed instead of a blank app.
    if (notes.length === 0 && canvases.length === 0) return seed;

    const spaces = Array.isArray(parsed.spaces) && parsed.spaces.length ? parsed.spaces : seed.spaces;
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const bases = Array.isArray(parsed.bases) && parsed.bases.length ? parsed.bases : seed.bases;

    const noteIds = new Set(notes.map((n) => n.id));
    const canvasIds = new Set(canvases.map((c) => c.id));
    let tabs = (Array.isArray(parsed.tabs) ? parsed.tabs : []).filter((t) => {
      if (t.kind === 'note') return !!t.refId && noteIds.has(t.refId);
      if (t.kind === 'canvas') return !!t.refId && canvasIds.has(t.refId);
      return true;
    });
    if (tabs.length === 0) tabs = seed.tabs;

    const activeTabId = tabs.some((t) => t.id === parsed.activeTabId) ? parsed.activeTabId! : tabs[0].id;
    const activeSpaceId =
      parsed.activeSpaceId === 'all' || spaces.some((s) => s.id === parsed.activeSpaceId)
        ? parsed.activeSpaceId!
        : 'all';

    return {
      version: 1,
      user: parsed.user && typeof parsed.user.name === 'string' ? parsed.user : seed.user,
      spaces,
      notes,
      canvases,
      tasks,
      bases,
      tabs,
      activeTabId,
      activeSpaceId,
    };
  } catch {
    return seed;
  }
}

function tabTitle(kind: ViewKind, refId: Id | undefined, ws: Workspace): string {
  if (kind === 'note') return ws.notes.find((n) => n.id === refId)?.title ?? VIEW_LABELS.note;
  if (kind === 'canvas') return ws.canvases.find((c) => c.id === refId)?.name ?? VIEW_LABELS.canvas;
  return VIEW_LABELS[kind];
}

export interface StoreValue {
  ws: Workspace;
  notesById: Record<Id, Note>;
  canvasesById: Record<Id, Canvas>;
  spacesById: Record<Id, Space>;
  activeTab: Tab;
  activeSpace: Id | 'all';
  canUndo: boolean;
  canRedo: boolean;
  historyVersion: number;
  toastMessage: string | null;
  paletteOpen: boolean;
  paletteMode: 'all' | 'search';
  settingsOpen: boolean;
  toast: (message: string) => void;
  openPalette: (mode?: 'all' | 'search') => void;
  setPaletteOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  openTab: (kind: ViewKind, refId?: Id) => void;
  setActiveTab: (tabId: Id) => void;
  closeTab: (tabId: Id) => void;
  setActiveSpace: (spaceId: Id | 'all') => void;
  createSpace: (name: string, tone?: ToneKey) => Space;
  setUserName: (name: string) => void;
  createNote: (patch?: Partial<Note>, open?: boolean) => Note;
  updateNote: (id: Id, patch: Partial<Note>) => void;
  deleteNote: (id: Id) => void;
  createCanvas: (name?: string, spaceId?: Id) => Canvas;
  updateCanvas: (id: Id, patch: Partial<Canvas>) => void;
  mutateCanvas: (id: Id, fn: (canvas: Canvas) => Canvas, options?: { history?: boolean }) => void;
  deleteCanvas: (id: Id) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  createTask: (patch?: Partial<Task>) => Task;
  updateTask: (id: Id, patch: Partial<Task>) => void;
  deleteTask: (id: Id) => void;
  updateBase: (id: Id, fn: (base: KnowledgeBase) => KnowledgeBase) => void;
  exportJson: () => void;
  importJson: (file: File) => Promise<void>;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ws, setWs] = useState<Workspace>(() => loadWorkspace());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMode, setPaletteMode] = useState<'all' | 'search'>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyTick, setHistoryTick] = useState(0);
  const past = useRef<Canvas[][]>([]);
  const future = useRef<Canvas[][]>([]);
  const toastTimer = useRef<number | undefined>(undefined);
  const wsRef = useRef(ws);
  wsRef.current = ws;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
      } catch {
        /* storage full or unavailable */
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [ws]);

  const toast = useCallback((message: string) => {
    setToastMessage(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMessage(null), 2200);
  }, []);

  const openPalette = useCallback((mode: 'all' | 'search' = 'all') => {
    setPaletteMode(mode);
    setPaletteOpen(true);
  }, []);

  const notesById = useMemo(
    () => Object.fromEntries(ws.notes.map((n) => [n.id, n])) as Record<Id, Note>,
    [ws.notes],
  );
  const canvasesById = useMemo(
    () => Object.fromEntries(ws.canvases.map((c) => [c.id, c])) as Record<Id, Canvas>,
    [ws.canvases],
  );
  const spacesById = useMemo(
    () => Object.fromEntries(ws.spaces.map((s) => [s.id, s])) as Record<Id, Space>,
    [ws.spaces],
  );

  const openTab = useCallback((kind: ViewKind, refId?: Id) => {
    setWs((prev) => {
      const existing = prev.tabs.find((t) => t.kind === kind && t.refId === refId);
      if (existing) return { ...prev, activeTabId: existing.id };
      const tab: Tab = { id: uid('tab'), kind, refId, title: tabTitle(kind, refId, prev) };
      return { ...prev, tabs: [...prev.tabs, tab], activeTabId: tab.id };
    });
  }, []);

  const setActiveTab = useCallback((tabId: Id) => {
    setWs((prev) => ({ ...prev, activeTabId: tabId }));
  }, []);

  const closeTab = useCallback((tabId: Id) => {
    setWs((prev) => {
      const index = prev.tabs.findIndex((t) => t.id === tabId);
      if (index === -1) return prev;
      const tabs = prev.tabs.filter((t) => t.id !== tabId);
      if (!tabs.length) {
        const fallback: Tab = { id: uid('tab'), kind: 'home', title: VIEW_LABELS.home };
        return { ...prev, tabs: [fallback], activeTabId: fallback.id };
      }
      const activeTabId =
        prev.activeTabId === tabId ? tabs[Math.min(index, tabs.length - 1)].id : prev.activeTabId;
      return { ...prev, tabs, activeTabId };
    });
  }, []);

  const setActiveSpace = useCallback((spaceId: Id | 'all') => {
    setWs((prev) => ({ ...prev, activeSpaceId: spaceId }));
  }, []);

  const createSpace = useCallback(
    (name: string, tone: ToneKey = 'violet') => {
      const space: Space = { id: uid('sp'), name, tone };
      setWs((prev) => ({ ...prev, spaces: [...prev.spaces, space] }));
      return space;
    },
    [],
  );

  const setUserName = useCallback((name: string) => {
    setWs((prev) => ({ ...prev, user: { ...prev.user, name } }));
  }, []);

  const createNote = useCallback((patch: Partial<Note> = {}, open = true) => {
    const timestamp = new Date().toISOString();
    const current = wsRef.current;
    const spaceId =
      patch.spaceId ?? (current.activeSpaceId !== 'all' ? current.activeSpaceId : current.spaces[0].id);
    const note: Note = {
      id: uid('n'),
      title: patch.title ?? 'Без названия',
      body: patch.body ?? '',
      spaceId,
      folder: patch.folder ?? 'Заметки',
      tags: patch.tags ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const tab: Tab = { id: uid('tab'), kind: 'note', refId: note.id, title: note.title };
    setWs((prev) => ({
      ...prev,
      notes: [note, ...prev.notes],
      tabs: open ? [...prev.tabs, tab] : prev.tabs,
      activeTabId: open ? tab.id : prev.activeTabId,
    }));
    return note;
  }, []);

  const updateNote = useCallback((id: Id, patch: Partial<Note>) => {
    setWs((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
      ),
      tabs: prev.tabs.map((t) =>
        t.kind === 'note' && t.refId === id && patch.title ? { ...t, title: patch.title } : t,
      ),
    }));
  }, []);

  const deleteNote = useCallback((id: Id) => {
    setWs((prev) => {
      const tabs = prev.tabs.filter((t) => !(t.kind === 'note' && t.refId === id));
      const nextTabs = tabs.length ? tabs : [{ id: uid('tab'), kind: 'home' as ViewKind, title: 'Главная' }];
      return {
        ...prev,
        notes: prev.notes.filter((n) => n.id !== id),
        tasks: prev.tasks.filter((t) => t.noteId !== id),
        bases: prev.bases.map((b) => ({ ...b, rows: b.rows.filter((r) => r.noteId !== id) })),
        canvases: prev.canvases.map((c) => ({
          ...c,
          nodes: c.nodes.map((n) => (n.noteId === id ? { ...n, noteId: undefined } : n)),
        })),
        tabs: nextTabs,
        activeTabId: nextTabs.some((t) => t.id === prev.activeTabId) ? prev.activeTabId : nextTabs[0].id,
      };
    });
  }, []);

  const createCanvas = useCallback((name = 'Новый канвас', spaceId?: Id) => {
    const timestamp = new Date().toISOString();
    const current = wsRef.current;
    const canvas: Canvas = {
      id: uid('cv'),
      name,
      description: 'Собери идеи в узлы и соедини их связями.',
      spaceId: spaceId ?? (current.activeSpaceId !== 'all' ? current.activeSpaceId : current.spaces[0].id),
      nodes: [
        {
          id: uid('cn'),
          x: 320,
          y: 220,
          w: 250,
          h: 112,
          title: 'Org',
          icon: '',
          tone: 'violet',
          kind: 'text',
          bullets: ['Заметки. Канвасы. Люди.'],
          items: [],
          links: [],
        },
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      grid: true,
      updatedAt: timestamp,
    };
    const tab: Tab = { id: uid('tab'), kind: 'canvas', refId: canvas.id, title: canvas.name };
    setWs((prev) => ({
      ...prev,
      canvases: [...prev.canvases, canvas],
      tabs: [...prev.tabs, tab],
      activeTabId: tab.id,
    }));
    return canvas;
  }, []);

  const updateCanvas = useCallback((id: Id, patch: Partial<Canvas>) => {
    setWs((prev) => ({
      ...prev,
      canvases: prev.canvases.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
      ),
      tabs: prev.tabs.map((t) =>
        t.kind === 'canvas' && t.refId === id && patch.name ? { ...t, title: patch.name } : t,
      ),
    }));
  }, []);

  const pushHistory = useCallback(() => {
    past.current.push(structuredClone(wsRef.current.canvases));
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    future.current = [];
    setHistoryTick((v) => v + 1);
  }, []);

  const mutateCanvas = useCallback(
    (id: Id, fn: (canvas: Canvas) => Canvas, options: { history?: boolean } = {}) => {
      const history = options.history ?? true;
      if (history) pushHistory();
      setWs((prev) => ({
        ...prev,
        canvases: prev.canvases.map((c) =>
          c.id === id ? { ...fn(c), updatedAt: new Date().toISOString() } : c,
        ),
      }));
    },
    [pushHistory],
  );

  const deleteCanvas = useCallback((id: Id) => {
    setWs((prev) => {
      const tabs = prev.tabs.filter((t) => !(t.kind === 'canvas' && t.refId === id));
      const nextTabs = tabs.length ? tabs : [{ id: uid('tab'), kind: 'home' as ViewKind, title: 'Главная' }];
      return {
        ...prev,
        canvases: prev.canvases.filter((c) => c.id !== id),
        tasks: prev.tasks.map((t) => (t.canvasId === id ? { ...t, canvasId: undefined } : t)),
        tabs: nextTabs,
        activeTabId: nextTabs.some((t) => t.id === prev.activeTabId) ? prev.activeTabId : nextTabs[0].id,
      };
    });
  }, []);

  const undo = useCallback(() => {
    const snapshot = past.current.pop();
    if (!snapshot) return;
    future.current.push(structuredClone(wsRef.current.canvases));
    setWs((prev) => ({ ...prev, canvases: snapshot }));
    setHistoryTick((v) => v + 1);
  }, []);

  const redo = useCallback(() => {
    const snapshot = future.current.pop();
    if (!snapshot) return;
    past.current.push(structuredClone(wsRef.current.canvases));
    setWs((prev) => ({ ...prev, canvases: snapshot }));
    setHistoryTick((v) => v + 1);
  }, []);

  const createTask = useCallback((patch: Partial<Task> = {}) => {
    const current = wsRef.current;
    const task: Task = {
      id: uid('t'),
      title: patch.title ?? 'Новая задача',
      status: patch.status ?? 'backlog',
      priority: patch.priority ?? 'med',
      due: patch.due,
      spaceId:
        patch.spaceId ?? (current.activeSpaceId !== 'all' ? current.activeSpaceId : current.spaces[0].id),
      noteId: patch.noteId,
      canvasId: patch.canvasId,
      createdAt: new Date().toISOString(),
    };
    setWs((prev) => ({ ...prev, tasks: [...prev.tasks, task] }));
    return task;
  }, []);

  const updateTask = useCallback((id: Id, patch: Partial<Task>) => {
    setWs((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const deleteTask = useCallback((id: Id) => {
    setWs((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  }, []);

  const updateBase = useCallback((id: Id, fn: (base: KnowledgeBase) => KnowledgeBase) => {
    setWs((prev) => ({
      ...prev,
      bases: prev.bases.map((b) => (b.id === id ? fn(b) : b)),
    }));
  }, []);

  const exportJson = useCallback(() => {
    downloadJson(`org-workspace-${new Date().toISOString().slice(0, 10)}.json`, ws);
  }, [ws]);

  const importJson = useCallback(
    async (file: File) => {
      const text = await file.text();
      const parsed = JSON.parse(text) as Workspace;
      if (!parsed || !Array.isArray(parsed.notes) || !Array.isArray(parsed.canvases)) {
        throw new Error('Некорректный файл рабочего пространства');
      }
      setWs({ ...createSeed(), ...parsed, version: 1 });
    },
    [],
  );

  const resetDemo = useCallback(() => {
    past.current = [];
    future.current = [];
    setWs(createSeed());
  }, []);

  const activeTab = useMemo(
    () => ws.tabs.find((t) => t.id === ws.activeTabId) ?? ws.tabs[0],
    [ws.tabs, ws.activeTabId],
  );

  const value: StoreValue = {
    ws,
    notesById,
    canvasesById,
    spacesById,
    activeTab,
    activeSpace: ws.activeSpaceId,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    historyVersion: historyTick,
    toastMessage,
    paletteOpen,
    paletteMode,
    settingsOpen,
    toast,
    openPalette,
    setPaletteOpen,
    setSettingsOpen,
    openTab,
    setActiveTab,
    closeTab,
    setActiveSpace,
    createSpace,
    setUserName,
    createNote,
    updateNote,
    deleteNote,
    createCanvas,
    updateCanvas,
    mutateCanvas,
    deleteCanvas,
    pushHistory,
    undo,
    redo,
    createTask,
    updateTask,
    deleteTask,
    updateBase,
    exportJson,
    importJson,
    resetDemo,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function useFilteredNotes(): Note[] {
  const { ws, activeSpace } = useStore();
  return useMemo(
    () =>
      activeSpace === 'all'
        ? ws.notes
        : ws.notes.filter((n) => n.spaceId === activeSpace),
    [ws.notes, activeSpace],
  );
}

export { tabTitle, STORAGE_KEY };
