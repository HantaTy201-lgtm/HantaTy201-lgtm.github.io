import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { useStore } from '../store';
import { normalize } from '../lib/utils';
import type { Id } from '../types';

interface GraphNode {
  id: Id;
  title: string;
  x: number;
  y: number;
  links: number;
}

const WIDTH = 960;
const HEIGHT = 620;

export function GraphView() {
  const { ws, openTab, activeSpace } = useStore();
  const [hover, setHover] = useState<Id | null>(null);

  const notes = useMemo(
    () => ws.notes.filter((n) => (activeSpace === 'all' ? true : n.spaceId === activeSpace)),
    [ws.notes, activeSpace],
  );

  const { nodes, edges } = useMemo(() => {
    const index = new Map(notes.map((n) => [normalize(n.title), n.id]));
    const graphNodes: GraphNode[] = notes.map((note, i) => {
      const angle = (i / Math.max(1, notes.length)) * Math.PI * 2 - Math.PI / 2;
      const radius = notes.length > 6 ? 210 : 140;
      return {
        id: note.id,
        title: note.title,
        x: WIDTH / 2 + Math.cos(angle) * radius * 1.45,
        y: HEIGHT / 2 + Math.sin(angle) * radius,
        links: 0,
      };
    });
    const map = new Map(graphNodes.map((n) => [n.id, n]));
    const graphEdges: { from: Id; to: Id }[] = [];
    notes.forEach((note) => {
      const matches = note.body.match(/\[\[([^\]]+)\]\]/g) ?? [];
      matches.forEach((match) => {
        const target = index.get(normalize(match.slice(2, -2)));
        if (!target || target === note.id) return;
        if (graphEdges.some((e) => e.from === note.id && e.to === target)) return;
        graphEdges.push({ from: note.id, to: target });
        const a = map.get(note.id);
        const b = map.get(target);
        if (a) a.links += 1;
        if (b) b.links += 1;
      });
    });
    return { nodes: graphNodes, edges: graphEdges };
  }, [notes]);

  const positionOf = (id: Id) => nodes.find((n) => n.id === id);

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h1 className="view-title">Граф связей</h1>
          <p className="view-sub">
            Карта знаний: {notes.length} заметок и {edges.length} связей. Наведи курсор, чтобы подсветить
            соседей, клик — открыть заметку.
          </p>
        </div>
        <div className="view-head-actions">
          <button className="btn" onClick={() => openTab('note')}>
            <Icon name="note" size={15} />
            К заметкам
          </button>
        </div>
      </div>

      <div className="graph-wrap">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
          {edges.map((edge) => {
            const from = positionOf(edge.from);
            const to = positionOf(edge.to);
            if (!from || !to) return null;
            const hot = hover === edge.from || hover === edge.to;
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                className={`graph-edge${hot ? ' hot' : ''}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              />
            );
          })}
          {nodes.map((node) => {
            const hot =
              hover === node.id ||
              edges.some(
                (edge) =>
                  (edge.from === hover && edge.to === node.id) || (edge.to === hover && edge.from === node.id),
              );
            const radius = 6 + Math.min(10, node.links * 1.6);
            return (
              <g
                key={node.id}
                className={`graph-node${hot ? ' hot' : ''}`}
                onMouseEnter={() => setHover(node.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => openTab('note', node.id)}
              >
                <circle cx={node.x} cy={node.y} r={radius} />
                <text x={node.x} y={node.y + radius + 14}>
                  {node.title.length > 26 ? `${node.title.slice(0, 24)}…` : node.title}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="graph-legend">
          {hover ? nodes.find((n) => n.id === hover)?.title : 'Связи строятся из [[wiki-ссылок]] в тексте заметок'}
        </div>
      </div>
    </div>
  );
}
