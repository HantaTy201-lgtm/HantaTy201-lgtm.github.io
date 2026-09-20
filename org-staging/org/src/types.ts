export type Id = string;

export type ToneKey = 'violet' | 'emerald' | 'amber' | 'sky' | 'rose' | 'slate';

export interface Space {
  id: Id;
  name: string;
  tone: ToneKey;
}

export interface ChecklistItem {
  id: Id;
  text: string;
  done: boolean;
}

export interface Note {
  id: Id;
  title: string;
  body: string;
  spaceId: Id;
  folder: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

export type CanvasNodeKind = 'note' | 'checklist' | 'quote' | 'links' | 'text';

export interface NodeLink {
  id: Id;
  from: string;
  to: string;
}

export interface CanvasNode {
  id: Id;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  icon: string;
  tone: ToneKey;
  kind: CanvasNodeKind;
  bullets: string[];
  items: ChecklistItem[];
  links: NodeLink[];
  noteId?: Id;
}

export interface CanvasEdge {
  id: Id;
  from: Id;
  to: Id;
  tone: ToneKey;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Canvas {
  id: Id;
  name: string;
  description: string;
  spaceId: Id;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: Viewport;
  grid: boolean;
  fitted?: boolean;
  updatedAt: string;
}

export type TaskStatus = 'backlog' | 'progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'med' | 'high';

export interface Task {
  id: Id;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due?: string;
  spaceId: Id;
  noteId?: Id;
  canvasId?: Id;
  createdAt: string;
}

export interface DbRow {
  id: Id;
  name: string;
  type: string;
  status: string;
  spaceId: Id;
  tags: string[];
  updatedAt: string;
  noteId?: Id;
}

export interface KnowledgeBase {
  id: Id;
  name: string;
  icon: string;
  view: 'table' | 'gallery';
  rows: DbRow[];
}

export type ViewKind = 'home' | 'note' | 'canvas' | 'knowledge' | 'tasks' | 'calendar' | 'graph';

export interface Tab {
  id: Id;
  kind: ViewKind;
  refId?: Id;
  title: string;
}

export interface Workspace {
  version: number;
  user: { name: string };
  spaces: Space[];
  notes: Note[];
  canvases: Canvas[];
  tasks: Task[];
  bases: KnowledgeBase[];
  tabs: Tab[];
  activeTabId: Id;
  activeSpaceId: Id | 'all';
}

export const TONES: ToneKey[] = ['violet', 'emerald', 'amber', 'sky', 'rose', 'slate'];

export const TONE_HEX: Record<ToneKey, string> = {
  violet: '#7c5cff',
  emerald: '#34d399',
  amber: '#f5b544',
  sky: '#5b9dff',
  rose: '#f472b6',
  slate: '#94a3b8',
};

export const TASK_COLUMNS: { id: TaskStatus; title: string; tone: ToneKey }[] = [
  { id: 'backlog', title: 'Бэклог', tone: 'slate' },
  { id: 'progress', title: 'В работе', tone: 'sky' },
  { id: 'review', title: 'На проверке', tone: 'amber' },
  { id: 'done', title: 'Готово', tone: 'emerald' },
];

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Низкий',
  med: 'Средний',
  high: 'Высокий',
};
