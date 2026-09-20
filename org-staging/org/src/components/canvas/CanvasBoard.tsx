import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { Icon } from '../Icon';
import { NodeCard, type HandleSide } from './NodeCard';
import { useStore } from '../../store';
import { useSelection } from '../../lib/selection';
import { clamp, uid } from '../../lib/utils';
import {
  TONE_HEX,
  type Canvas,
  type CanvasEdge,
  type CanvasNode,
  type Id,
  type ToneKey,
  type Viewport,
} from '../../types';

type Tool = 'select' | 'create' | 'text' | 'connect' | 'eraser' | 'magic';

const TOOLS: { id: Tool; icon: string; title: string }[] = [
  { id: 'select', icon: 'cursor', title: 'Выделение · V' },
  { id: 'create', icon: 'square', title: 'Узел-блок · R (протяни мышью)' },
  { id: 'text', icon: 'type', title: 'Текстовый узел · T' },
  { id: 'connect', icon: 'branch', title: 'Связь · C' },
  { id: 'eraser', icon: 'eraser', title: 'Ластик · E' },
  { id: 'magic', icon: 'wand', title: 'Выровнять схему · M' },
];

type Gesture =
  | { kind: 'pan'; startX: number; startY: number; vx: number; vy: number }
  | { kind: 'node'; originX: number; originY: number; starts: Record<Id, { x: number; y: number }>; moved: boolean }
  | { kind: 'resize'; id: Id; startW: number; startH: number; originX: number; originY: number }
  | { kind: 'marquee'; x0: number; y0: number; additive: boolean }
  | { kind: 'link'; from: Id }
  | { kind: 'create'; x0: number; y0: number };

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

function edgeGeometry(a: CanvasNode, b: CanvasNode): string {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  const dx = bcx - acx;
  const dy = bcy - acy;
  let sx: number;
  let sy: number;
  let ex: number;
  let ey: number;
  let c1x: number;
  let c1y: number;
  let c2x: number;
  let c2y: number;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const dir = dx >= 0 ? 1 : -1;
    sx = dir > 0 ? a.x + a.w : a.x;
    sy = acy;
    ex = dir > 0 ? b.x : b.x + b.w;
    ey = bcy;
    const k = Math.max(46, Math.abs(ex - sx) * 0.45);
    c1x = sx + dir * k;
    c1y = sy;
    c2x = ex - dir * k;
    c2y = ey;
  } else {
    const dir = dy >= 0 ? 1 : -1;
    sx = acx;
    sy = dir > 0 ? a.y + a.h : a.y;
    ex = bcx;
    ey = dir > 0 ? b.y : b.y + b.h;
    const k = Math.max(46, Math.abs(ey - sy) * 0.45);
    c1x = sx;
    c1y = sy + dir * k;
    c2x = ex;
    c2y = ey - dir * k;
  }

  return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;
}

export function CanvasBoard({ canvas }: { canvas: Canvas }) {
  const {
    spacesById,
    mutateCanvas,
    updateCanvas,
    deleteCanvas,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    createTask,
    createNote,
    openTab,
    toast,
  } = useStore();
  const { setCanvasFocus, focusRequest } = useSelection();

  const boardRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [view, setView] = useState<Viewport>(canvas.viewport);
  const [size, setSize] = useState({ w: 960, h: 560 });
  const [tool, setTool] = useState<Tool>('select');
  const [selection, setSelection] = useState<Id[]>([]);
  const [editingId, setEditingId] = useState<Id | null>(null);
  const [dragPositions, setDragPositions] = useState<Record<Id, { x: number; y: number }> | null>(null);
  const [resizeSize, setResizeSize] = useState<{ id: Id; w: number; h: number } | null>(null);
  const [marquee, setMarquee] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [creating, setCreating] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [linkTo, setLinkTo] = useState<{ from: Id; x: number; y: number } | null>(null);
  const [quickAdd, setQuickAdd] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);

  const viewRef = useRef(view);
  viewRef.current = view;

  const nodes = useMemo(
    () =>
      canvas.nodes.map((node) => {
        const moved = dragPositions?.[node.id];
        if (moved) return { ...node, x: moved.x, y: moved.y };
        if (resizeSize && resizeSize.id === node.id) return { ...node, w: resizeSize.w, h: resizeSize.h };
        return node;
      }),
    [canvas.nodes, dragPositions, resizeSize],
  );

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const space = spacesById[canvas.spaceId];

  const markFitted = useCallback(() => {
    if (canvas.fitted) return;
    updateCanvas(canvas.id, { fitted: true });
  }, [canvas.fitted, canvas.id, updateCanvas]);

  useEffect(() => {
    setView(canvas.viewport);
    setSelection([]);
    setEditingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => updateCanvas(canvas.id, { viewport: view }), 350);
    return () => window.clearTimeout(timer);
  }, [view, canvas.id, updateCanvas]);

  useEffect(() => {
    setCanvasFocus({ canvasId: canvas.id, nodeId: selection[0] ?? null });
  }, [selection, canvas.id, setCanvasFocus]);

  useEffect(() => {
    if (!focusRequest || focusRequest.canvasId !== canvas.id) return;
    const node = nodesRef.current.find((n) => n.id === focusRequest.nodeId);
    const el = boardRef.current;
    if (!node || !el) return;
    setSelection([node.id]);
    setView((v) => ({
      ...v,
      x: el.clientWidth / 2 - (node.x + node.w / 2) * v.zoom,
      y: el.clientHeight / 2 - (node.y + node.h / 2) * v.zoom,
    }));
  }, [focusRequest, canvas.id]);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    observer.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      markFitted();
      const rect = el.getBoundingClientRect();
      const current = viewRef.current;
      if (event.ctrlKey || event.metaKey) {
        const zoom = clamp(current.zoom * Math.exp(-event.deltaY * 0.0025), 0.2, 2.5);
        const k = zoom / current.zoom;
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;
        setView({ zoom, x: px - (px - current.x) * k, y: py - (py - current.y) * k });
      } else {
        setView({ ...current, x: current.x - event.deltaX, y: current.y - event.deltaY });
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [markFitted]);

  const toWorld = useCallback((clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    const current = viewRef.current;
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - current.x) / current.zoom,
      y: (clientY - rect.top - current.y) / current.zoom,
    };
  }, []);

  const patchNode = useCallback(
    (id: Id, patch: Partial<CanvasNode>) => {
      mutateCanvas(
        canvas.id,
        (c) => ({ ...c, nodes: c.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }),
        { history: false },
      );
    },
    [canvas.id, mutateCanvas],
  );

  const addNode = useCallback(
    (partial: Partial<CanvasNode> & { x: number; y: number }) => {
      const node: CanvasNode = {
        id: uid('cn'),
        w: 232,
        h: 132,
        title: 'Новый узел',
        icon: '💡',
        tone: 'violet',
        kind: 'note',
        bullets: ['Первый пункт'],
        items: [],
        links: [],
        ...partial,
      };
      mutateCanvas(canvas.id, (c) => ({ ...c, nodes: [...c.nodes, node] }));
      setSelection([node.id]);
      return node;
    },
    [canvas.id, mutateCanvas],
  );

  const removeNodes = useCallback(
    (ids: Id[]) => {
      mutateCanvas(canvas.id, (c) => ({
        ...c,
        nodes: c.nodes.filter((n) => !ids.includes(n.id)),
        edges: c.edges.filter((e) => !ids.includes(e.from) && !ids.includes(e.to)),
      }));
      setSelection((prev) => prev.filter((id) => !ids.includes(id)));
    },
    [canvas.id, mutateCanvas],
  );

  const addEdge = useCallback(
    (from: Id, to: Id) => {
      if (from === to) return;
      const exists = canvas.edges.some((e) => e.from === from && e.to === to);
      if (exists) {
        toast('Связь уже существует');
        return;
      }
      mutateCanvas(canvas.id, (c) => ({
        ...c,
        edges: [...c.edges, { id: uid('ce'), from, to, tone: 'violet' }],
      }));
    },
    [canvas.id, canvas.edges, mutateCanvas, toast],
  );

  const toggleItem = useCallback(
    (nodeId: Id, itemId: Id) => {
      mutateCanvas(canvas.id, (c) => ({
        ...c,
        nodes: c.nodes.map((n) =>
          n.id === nodeId
            ? { ...n, items: n.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
            : n,
        ),
      }));
    },
    [canvas.id, mutateCanvas],
  );

  const addItem = useCallback(
    (nodeId: Id) => {
      mutateCanvas(canvas.id, (c) => ({
        ...c,
        nodes: c.nodes.map((n) =>
          n.id === nodeId ? { ...n, items: [...n.items, { id: uid('ci'), text: 'Новый пункт', done: false }] } : n,
        ),
      }));
    },
    [canvas.id, mutateCanvas],
  );

  const removeItem = useCallback(
    (nodeId: Id, itemId: Id) => {
      mutateCanvas(canvas.id, (c) => ({
        ...c,
        nodes: c.nodes.map((n) =>
          n.id === nodeId ? { ...n, items: n.items.filter((i) => i.id !== itemId) } : n,
        ),
      }));
    },
    [canvas.id, mutateCanvas],
  );

  const fitToView = useCallback(() => {
    const el = boardRef.current;
    if (!el) return;
    const list = nodesRef.current;
    const pad = 80;
    if (!list.length) {
      setView({ x: el.clientWidth / 2 - 120, y: el.clientHeight / 2 - 80, zoom: 1 });
      return;
    }
    const minX = Math.min(...list.map((n) => n.x));
    const minY = Math.min(...list.map((n) => n.y));
    const maxX = Math.max(...list.map((n) => n.x + n.w));
    const maxY = Math.max(...list.map((n) => n.y + n.h));
    const zoom = clamp(
      Math.min((el.clientWidth - pad * 2) / (maxX - minX), (el.clientHeight - pad * 2) / (maxY - minY)),
      0.35,
      1.4,
    );
    setView({
      zoom,
      x: (el.clientWidth - (maxX - minX) * zoom) / 2 - minX * zoom,
      y: (el.clientHeight - (maxY - minY) * zoom) / 2 - minY * zoom,
    });
    markFitted();
  }, [markFitted]);

  const zoomTo = useCallback(
    (next: number) => {
      const el = boardRef.current;
      if (!el) return;
      markFitted();
      const current = viewRef.current;
      const zoom = clamp(next, 0.2, 2.5);
      const k = zoom / current.zoom;
      const cx = el.clientWidth / 2;
      const cy = el.clientHeight / 2;
      setView({ zoom, x: cx - (cx - current.x) * k, y: cy - (cy - current.y) * k });
    },
    [markFitted],
  );

  useEffect(() => {
    if (canvas.fitted) return;
    if (!size.w || !size.h) return;
    const timer = window.setTimeout(fitToView, 60);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas.id, canvas.fitted, size.w, size.h]);

  const magicLayout = useCallback(() => {
    const list = nodesRef.current;
    if (list.length < 2) {
      toast('Нужно минимум два узла');
      return;
    }
    const main = list.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b));
    const others = list.filter((n) => n.id !== main.id);
    const cx = main.x + main.w / 2;
    const cy = main.y + main.h / 2;
    const radius = Math.max(300, 150 + others.length * 22);
    mutateCanvas(canvas.id, (c) => ({
      ...c,
      nodes: c.nodes.map((n) => {
        if (n.id === main.id) return n;
        const index = others.findIndex((o) => o.id === n.id);
        const angle = (index / others.length) * Math.PI * 2 - Math.PI / 2;
        return {
          ...n,
          x: cx + Math.cos(angle) * radius * 1.35 - n.w / 2,
          y: cy + Math.sin(angle) * radius - n.h / 2,
        };
      }),
    }));
    toast('Схема выровнена');
  }, [canvas.id, mutateCanvas, toast]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const board = boardRef.current;
    if (!board) return;
    const world = toWorld(event.clientX, event.clientY);

    if (event.button === 1 || spacePressed) {
      board.setPointerCapture(event.pointerId);
      gesture.current = { kind: 'pan', startX: event.clientX, startY: event.clientY, vx: view.x, vy: view.y };
      return;
    }
    if (event.button !== 0) return;
    if (target.closest('input, textarea')) return;

    const handleEl = target.closest('[data-handle]') as HTMLElement | null;
    if (handleEl) {
      const nodeEl = target.closest('[data-node-id]') as HTMLElement | null;
      const from = nodeEl?.dataset.nodeId ?? selection[0];
      if (from) {
        board.setPointerCapture(event.pointerId);
        gesture.current = { kind: 'link', from };
        setLinkTo({ from, x: world.x, y: world.y });
      }
      return;
    }

    const resizeEl = target.closest('[data-resize]') as HTMLElement | null;
    if (resizeEl) {
      const nodeEl = target.closest('[data-node-id]') as HTMLElement | null;
      const node = canvas.nodes.find((n) => n.id === nodeEl?.dataset.nodeId);
      if (node) {
        board.setPointerCapture(event.pointerId);
        pushHistory();
        gesture.current = {
          kind: 'resize',
          id: node.id,
          startW: node.w,
          startH: node.h,
          originX: event.clientX,
          originY: event.clientY,
        };
      }
      return;
    }

    const nodeEl = target.closest('[data-node-id]') as HTMLElement | null;
    if (nodeEl) {
      const id = nodeEl.dataset.nodeId as Id;
      if (tool === 'eraser') {
        removeNodes([id]);
        return;
      }
      if (tool === 'connect') {
        board.setPointerCapture(event.pointerId);
        gesture.current = { kind: 'link', from: id };
        setLinkTo({ from: id, x: world.x, y: world.y });
        return;
      }
      const additive = event.shiftKey;
      const nextSelection = additive
        ? selection.includes(id)
          ? selection.filter((s) => s !== id)
          : [...selection, id]
        : selection.includes(id) && selection.length > 1
          ? selection
          : [id];
      setSelection(nextSelection);
      const starts: Record<Id, { x: number; y: number }> = {};
      nodes
        .filter((n) => nextSelection.includes(n.id))
        .forEach((n) => {
          starts[n.id] = { x: n.x, y: n.y };
        });
      if (!starts[id]) starts[id] = { x: world.x, y: world.y };
      board.setPointerCapture(event.pointerId);
      gesture.current = { kind: 'node', originX: world.x, originY: world.y, starts, moved: false };
      return;
    }

    if (tool === 'create') {
      board.setPointerCapture(event.pointerId);
      gesture.current = { kind: 'create', x0: world.x, y0: world.y };
      setCreating({ x0: world.x, y0: world.y, x1: world.x, y1: world.y });
      return;
    }
    if (tool === 'text') {
      addNode({ x: world.x - 60, y: world.y - 30, w: 210, h: 96, title: 'Текст', icon: '✳', tone: 'sky', kind: 'quote', bullets: ['Новая мысль'] });
      setTool('select');
      return;
    }

    setSelection([]);
    setEditingId(null);
    if (tool === 'select') {
      board.setPointerCapture(event.pointerId);
      gesture.current = { kind: 'marquee', x0: world.x, y0: world.y, additive: event.shiftKey };
      setMarquee({ x0: world.x, y0: world.y, x1: world.x, y1: world.y });
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    const world = toWorld(event.clientX, event.clientY);

    if (g.kind === 'pan') {
      markFitted();
      setView((v) => ({ ...v, x: g.vx + (event.clientX - g.startX), y: g.vy + (event.clientY - g.startY) }));
      return;
    }

    if (g.kind === 'node') {
      const dx = world.x - g.originX;
      const dy = world.y - g.originY;
      if (!g.moved && Math.abs(dx) + Math.abs(dy) > 1.5) {
        g.moved = true;
        pushHistory();
      }
      if (!g.moved) return;
      const next: Record<Id, { x: number; y: number }> = {};
      Object.entries(g.starts).forEach(([id, start]) => {
        next[id] = { x: start.x + dx, y: start.y + dy };
      });
      setDragPositions(next);
      return;
    }

    if (g.kind === 'resize') {
      const w = Math.max(140, g.startW + (event.clientX - g.originX) / view.zoom);
      const h = Math.max(80, g.startH + (event.clientY - g.originY) / view.zoom);
      setResizeSize({ id: g.id, w, h });
      return;
    }

    if (g.kind === 'marquee') {
      setMarquee({ x0: g.x0, y0: g.y0, x1: world.x, y1: world.y });
      return;
    }

    if (g.kind === 'create') {
      setCreating({ x0: g.x0, y0: g.y0, x1: world.x, y1: world.y });
      return;
    }

    if (g.kind === 'link') {
      setLinkTo({ from: g.from, x: world.x, y: world.y });
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;

    if (g.kind === 'node' && dragPositions) {
      const positions = dragPositions;
      mutateCanvas(
        canvas.id,
        (c) => ({
          ...c,
          nodes: c.nodes.map((n) => (positions[n.id] ? { ...n, x: positions[n.id].x, y: positions[n.id].y } : n)),
        }),
        { history: false },
      );
      setDragPositions(null);
      return;
    }

    if (g.kind === 'resize' && resizeSize) {
      const { id, w, h } = resizeSize;
      mutateCanvas(
        canvas.id,
        (c) => ({ ...c, nodes: c.nodes.map((n) => (n.id === id ? { ...n, w, h } : n)) }),
        { history: false },
      );
      setResizeSize(null);
      return;
    }

    if (g.kind === 'marquee' && marquee) {
      const x0 = Math.min(marquee.x0, marquee.x1);
      const y0 = Math.min(marquee.y0, marquee.y1);
      const x1 = Math.max(marquee.x0, marquee.x1);
      const y1 = Math.max(marquee.y0, marquee.y1);
      if (Math.abs(x1 - x0) > 4 && Math.abs(y1 - y0) > 4) {
        const inside = nodes
          .filter((n) => n.x + n.w > x0 && n.x < x1 && n.y + n.h > y0 && n.y < y1)
          .map((n) => n.id);
        setSelection((prev) => (g.additive ? Array.from(new Set([...prev, ...inside])) : inside));
      }
      setMarquee(null);
      return;
    }

    if (g.kind === 'create' && creating) {
      const x0 = Math.min(creating.x0, creating.x1);
      const y0 = Math.min(creating.y0, creating.y1);
      const w = Math.abs(creating.x1 - creating.x0);
      const h = Math.abs(creating.y1 - creating.y0);
      setCreating(null);
      if (w > 60 && h > 50) {
        addNode({ x: x0, y: y0, w, h, title: 'Новый блок', icon: '🗂', tone: 'violet', kind: 'note', bullets: [] });
      } else {
        addNode({ x: creating.x0 - 116, y: creating.y0 - 66 });
      }
      setTool('select');
      return;
    }

    if (g.kind === 'link') {
      const targetEl = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const nodeEl = targetEl?.closest('[data-node-id]') as HTMLElement | null;
      const to = nodeEl?.dataset.nodeId;
      if (to && to !== g.from) addEdge(g.from, to);
      setLinkTo(null);
    }
  };

  const onDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-node-id]')) return;
    const world = toWorld(event.clientX, event.clientY);
    addNode({ x: world.x - 116, y: world.y - 60, title: 'Новая идея', icon: '✨', tone: 'emerald', kind: 'note', bullets: ['Опиши мысль'] });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditable(event.target)) return;
      if (event.code === 'Space') {
        setSpacePressed(true);
        event.preventDefault();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selection.length) {
          event.preventDefault();
          removeNodes(selection);
        }
        return;
      }
      if (event.key === 'Escape') {
        setSelection([]);
        setEditingId(null);
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'v') setTool('select');
      else if (key === 'r') setTool('create');
      else if (key === 't') setTool('text');
      else if (key === 'c') setTool('connect');
      else if (key === 'e') setTool('eraser');
      else if (key === 'm') magicLayout();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpacePressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [selection, removeNodes, undo, redo, magicLayout]);

  const edgePaths = useMemo(() => {
    const map = new Map(nodes.map((n) => [n.id, n]));
    const result: { edge: CanvasEdge; d: string }[] = [];
    canvas.edges.forEach((edge) => {
      const from = map.get(edge.from);
      const to = map.get(edge.to);
      if (from && to) result.push({ edge, d: edgeGeometry(from, to) });
    });
    return result;
  }, [canvas.edges, nodes]);

  const linkPreview = useMemo(() => {
    if (!linkTo) return null;
    const from = nodes.find((n) => n.id === linkTo.from);
    if (!from) return null;
    return edgeGeometry(from, { ...from, x: linkTo.x - 1, y: linkTo.y - 1, w: 2, h: 2 });
  }, [linkTo, nodes]);

  const svgBox = useMemo(() => {
    const xs = nodes.flatMap((n) => [n.x, n.x + n.w]);
    const ys = nodes.flatMap((n) => [n.y, n.y + n.h]);
    const minX = (xs.length ? Math.min(...xs) : 0) - 3000;
    const minY = (ys.length ? Math.min(...ys) : 0) - 3000;
    const maxX = (xs.length ? Math.max(...xs) : 1000) + 3000;
    const maxY = (ys.length ? Math.max(...ys) : 1000) + 3000;
    return { minX, minY, w: maxX - minX, h: maxY - minY };
  }, [nodes]);

  const mini = useMemo(() => {
    const xs = nodes.flatMap((n) => [n.x, n.x + n.w]);
    const ys = nodes.flatMap((n) => [n.y, n.y + n.h]);
    const vx0 = -view.x / view.zoom;
    const vy0 = -view.y / view.zoom;
    const vx1 = vx0 + size.w / view.zoom;
    const vy1 = vy0 + size.h / view.zoom;
    const minX = Math.min(vx0, xs.length ? Math.min(...xs) : vx0) - 60;
    const minY = Math.min(vy0, ys.length ? Math.min(...ys) : vy0) - 60;
    const maxX = Math.max(vx1, xs.length ? Math.max(...xs) : vx1) + 60;
    const maxY = Math.max(vy1, ys.length ? Math.max(...ys) : vy1) + 60;
    return { minX, minY, w: maxX - minX, h: maxY - minY, vx0, vy0, vw: vx1 - vx0, vh: vy1 - vy0 };
  }, [nodes, view, size]);

  const rectStyle = (x0: number, y0: number, x1: number, y1: number) => ({
    left: Math.min(x0, x1) * view.zoom + view.x,
    top: Math.min(y0, y1) * view.zoom + view.y,
    width: Math.abs(x1 - x0) * view.zoom,
    height: Math.abs(y1 - y0) * view.zoom,
  });

  const selectedNode = selection.length === 1 ? nodes.find((n) => n.id === selection[0]) : undefined;
  const boardCenter = () => {
    const el = boardRef.current;
    if (!el) return { x: 0, y: 0 };
    return toWorld(el.clientWidth / 2, el.clientHeight / 2);
  };

  return (
    <div className="view canvas-view">
      <div className="canvas-head">
        <div className="editor-crumbs">
          <span className={`dot tone-${space?.tone ?? 'violet'}`} style={{ background: 'var(--tone)' }} />
          <span>{space?.name ?? 'Пространство'}</span>
          <span>·</span>
          <span>
            {canvas.nodes.length} узлов · {canvas.edges.length} связей
          </span>
        </div>
        <input
          className="view-title canvas-name"
          value={canvas.name}
          onChange={(event) => updateCanvas(canvas.id, { name: event.target.value })}
        />
        <input
          className="view-sub canvas-desc"
          value={canvas.description}
          onChange={(event) => updateCanvas(canvas.id, { description: event.target.value })}
        />

        <div className="canvas-toolbar">
          {TOOLS.map((item) => (
            <button
              key={item.id}
              className={`tool${tool === item.id ? ' active' : ''}`}
              title={item.title}
              onClick={() => (item.id === 'magic' ? magicLayout() : setTool(item.id))}
            >
              <Icon name={item.icon} size={16} />
            </button>
          ))}
          <span className="sep" />
          <button className="tool" title="Дублировать узел" onClick={() => {
            const node = selectedNode;
            if (!node) {
              toast('Выбери узел');
              return;
            }
            addNode({
              x: node.x + 28,
              y: node.y + 28,
              w: node.w,
              h: node.h,
              title: `${node.title} — копия`,
              icon: node.icon,
              tone: node.tone,
              kind: node.kind,
              bullets: [...node.bullets],
              items: node.items.map((i) => ({ ...i, id: uid('ci') })),
              links: node.links.map((l) => ({ ...l, id: uid('nl') })),
              noteId: node.noteId,
            });
          }}>
            <Icon name="copy" size={16} />
          </button>
          <button
            className="tool"
            title="Создать заметку из узла"
            onClick={() => {
              if (!selectedNode) {
                toast('Выбери узел');
                return;
              }
              const note = createNote(
                { title: selectedNode.title, body: selectedNode.bullets.join('\n\n') },
                false,
              );
              patchNode(selectedNode.id, { noteId: note.id });
              toast('Заметка создана и связана с узлом');
            }}
          >
            <Icon name="note" size={16} />
          </button>
          <button className="tool" title="Удалить канвас" onClick={() => {
            deleteCanvas(canvas.id);
            toast('Канвас удалён');
          }}>
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>

      <div
        ref={boardRef}
        className={`board${canvas.grid ? ' dots' : ''}${spacePressed ? ' tool-hand' : ''}${tool === 'create' || tool === 'text' ? ' tool-create' : ''}${tool === 'connect' ? ' tool-connect' : ''}`}
        style={
          {
            '--grid-size': `${24 * view.zoom}px`,
            '--grid-x': `${view.x}px`,
            '--grid-y': `${view.y}px`,
          } as CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <div
          className="board-world"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
        >
          <svg
            className="board-edges"
            style={{ left: svgBox.minX, top: svgBox.minY }}
            width={svgBox.w}
            height={svgBox.h}
            viewBox={`${svgBox.minX} ${svgBox.minY} ${svgBox.w} ${svgBox.h}`}
          >
            <defs>
              {(Object.keys(TONE_HEX) as ToneKey[]).map((tone) => (
                <marker
                  key={tone}
                  id={`org-arrow-${tone}`}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={TONE_HEX[tone]} />
                </marker>
              ))}
            </defs>
            {edgePaths.map(({ edge, d }) => (
              <g key={edge.id} className={`tone-${edge.tone}`}>
                <path
                  d={d}
                  fill="none"
                  stroke="var(--tone)"
                  strokeWidth={1.6}
                  strokeOpacity={0.75}
                  markerEnd={`url(#org-arrow-${edge.tone})`}
                />
                <path
                  className="hit"
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  onClick={() => {
                    if (tool !== 'eraser') return;
                    mutateCanvas(canvas.id, (c) => ({ ...c, edges: c.edges.filter((e) => e.id !== edge.id) }));
                  }}
                />
              </g>
            ))}
            {linkPreview && (
              <path d={linkPreview} fill="none" stroke="var(--violet)" strokeWidth={1.6} strokeDasharray="5 4" />
            )}
          </svg>

          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              selected={selection.includes(node.id)}
              editing={editingId === node.id}
              dragging={Boolean(dragPositions?.[node.id])}
              showHandles={selection.length === 1 && selection[0] === node.id && !editingId}
              onPointerDown={() => undefined}
              onStartEdit={(target) => {
                setEditingId(target.id);
                setSelection([target.id]);
              }}
              onPatch={patchNode}
              onToggleItem={toggleItem}
              onRemoveItem={removeItem}
              onAddItem={addItem}
              onHandleDown={(event: ReactPointerEvent, node: CanvasNode, _side: HandleSide) => {
                event.stopPropagation();
                const board = boardRef.current;
                if (!board) return;
                const world = toWorld(event.clientX, event.clientY);
                board.setPointerCapture(event.pointerId);
                gesture.current = { kind: 'link', from: node.id };
                setLinkTo({ from: node.id, x: world.x, y: world.y });
              }}
              onResizeDown={(event: ReactPointerEvent, node: CanvasNode) => {
                event.stopPropagation();
                const board = boardRef.current;
                if (!board) return;
                board.setPointerCapture(event.pointerId);
                pushHistory();
                gesture.current = {
                  kind: 'resize',
                  id: node.id,
                  startW: node.w,
                  startH: node.h,
                  originX: event.clientX,
                  originY: event.clientY,
                };
              }}
              onOpenNote={(noteId) => openTab('note', noteId)}
            />
          ))}
        </div>

        {marquee && <div className="marquee" style={rectStyle(marquee.x0, marquee.y0, marquee.x1, marquee.y1)} />}
        {creating && <div className="marquee" style={rectStyle(creating.x0, creating.y0, creating.x1, creating.y1)} />}

        <div className="board-float top-right">
          <button className="icon-btn" title="Уменьшить" onClick={() => zoomTo(view.zoom - 0.1)}>
            <Icon name="minus" size={15} />
          </button>
          <button className="zoom-value" title="Сбросить масштаб" onClick={() => zoomTo(1)}>
            {Math.round(view.zoom * 100)}%
          </button>
          <button className="icon-btn" title="Увеличить" onClick={() => zoomTo(view.zoom + 0.1)}>
            <Icon name="plus" size={15} />
          </button>
          <span className="sep" />
          <button className="icon-btn" title="Показать всё" onClick={fitToView}>
            <Icon name="maximize" size={15} />
          </button>
        </div>

        <div className="minimap">
          <svg viewBox={`${mini.minX} ${mini.minY} ${mini.w} ${mini.h}`} preserveAspectRatio="xMidYMid meet">
            {nodes.map((node) => (
              <rect
                key={node.id}
                className="node-dot"
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                rx={8}
                fill={TONE_HEX[node.tone]}
                fillOpacity={0.35}
              />
            ))}
            <rect className="viewport" x={mini.vx0} y={mini.vy0} width={mini.vw} height={mini.vh} rx={8} />
          </svg>
        </div>

        <div className="board-float bottom-left">
          <button className="icon-btn" title="Показать всё" onClick={fitToView}>
            <Icon name="square" size={15} />
          </button>
          <button className="icon-btn" title="Отменить" disabled={!canUndo} onClick={undo}>
            <Icon name="undo" size={15} />
          </button>
          <button className="icon-btn" title="Повторить" disabled={!canRedo} onClick={redo}>
            <Icon name="redo" size={15} />
          </button>
          <button className="icon-btn" title="Сбросить масштаб" onClick={() => zoomTo(1)}>
            <Icon name="target" size={15} />
          </button>
        </div>

        {quickAdd && (
          <div className="menu" style={{ right: 16, bottom: 70, position: 'absolute' }}>
            <button
              onClick={() => {
                const center = boardCenter();
                addNode({ x: center.x - 116, y: center.y - 66 });
                setQuickAdd(false);
              }}
            >
              <Icon name="square" size={15} />
              Узел
            </button>
            <button
              onClick={() => {
                const center = boardCenter();
                const note = createNote({ title: 'Новая заметка' }, false);
                addNode({
                  x: center.x - 116,
                  y: center.y - 66,
                  title: note.title,
                  icon: '📝',
                  tone: 'sky',
                  bullets: ['Связана с заметкой'],
                  noteId: note.id,
                });
                setQuickAdd(false);
                toast('Заметка создана и добавлена на канвас');
              }}
            >
              <Icon name="note" size={15} />
              Заметка
            </button>
            <button
              onClick={() => {
                createTask({ title: 'Новая задача', canvasId: canvas.id, spaceId: canvas.spaceId });
                setQuickAdd(false);
                toast('Задача добавлена');
              }}
            >
              <Icon name="check-square" size={15} />
              Задача
            </button>
          </div>
        )}

        <button className="fab" title="Быстрое добавление" onClick={() => setQuickAdd((v) => !v)}>
          <Icon name="plus" size={20} />
        </button>

        <div className="canvas-hint">
          Двойной клик — новый узел · протяни от точки на узле — связь · Ctrl + колесо — масштаб · пробел + перетаскивание — панорама
        </div>
      </div>
    </div>
  );
}
