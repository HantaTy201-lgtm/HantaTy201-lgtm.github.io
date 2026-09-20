import { useMemo } from 'react';
import { CanvasBoard } from '../components/canvas/CanvasBoard';
import { Icon } from '../components/Icon';
import { useStore } from '../store';
import { relativeTime } from '../lib/utils';
import { TONE_HEX, type Id } from '../types';

export function CanvasView({ canvasId }: { canvasId?: Id }) {
  const { ws, canvasesById, spacesById, createCanvas, openTab, activeSpace, toast } = useStore();
  const canvas = canvasId ? canvasesById[canvasId] : undefined;

  const list = useMemo(
    () =>
      ws.canvases
        .filter((c) => (activeSpace === 'all' ? true : c.spaceId === activeSpace))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [ws.canvases, activeSpace],
  );

  if (canvas) return <CanvasBoard canvas={canvas} />;

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h1 className="view-title">Канвасы</h1>
          <p className="view-sub">
            Бесконечная доска: собирай идеи в узлы, соединяй их связями и привязывай к заметкам.
          </p>
        </div>
        <div className="view-head-actions">
          <button
            className="btn primary"
            onClick={() => {
              const created = createCanvas('Новый канвас');
              openTab('canvas', created.id);
              toast('Канвас создан');
            }}
          >
            <Icon name="plus" size={15} />
            Новый канвас
          </button>
        </div>
      </div>

      <div className="view-scroll">
        <div className="gallery-grid">
          {list.map((item) => {
            const xs = item.nodes.flatMap((n) => [n.x, n.x + n.w]);
            const ys = item.nodes.flatMap((n) => [n.y, n.y + n.h]);
            const minX = xs.length ? Math.min(...xs) : 0;
            const minY = ys.length ? Math.min(...ys) : 0;
            const spanX = xs.length ? Math.max(...xs) - minX : 1;
            const spanY = ys.length ? Math.max(...ys) - minY : 1;
            return (
              <button
                key={item.id}
                className="card gallery-card"
                onClick={() => openTab('canvas', item.id)}
              >
                <div className="gallery-thumb">
                  {item.nodes.slice(0, 14).map((node) => (
                    <i
                      key={node.id}
                      className={`tone-${node.tone}`}
                      style={{
                        left: `${((node.x - minX) / spanX) * 82 + 6}%`,
                        top: `${((node.y - minY) / spanY) * 74 + 8}%`,
                        width: `${Math.max(8, (node.w / spanX) * 82)}%`,
                        height: `${Math.max(6, (node.h / spanY) * 74)}%`,
                        background: `color-mix(in srgb, ${TONE_HEX[node.tone]} 22%, transparent)`,
                        borderColor: `color-mix(in srgb, ${TONE_HEX[node.tone]} 50%, transparent)`,
                      }}
                    />
                  ))}
                </div>
                <div className="t">
                  <Icon name="canvas" size={15} />
                  {item.name}
                </div>
                <div className="s">{item.description}</div>
                <div className="m">
                  <span>{item.nodes.length} узлов</span>
                  <span>·</span>
                  <span>{item.edges.length} связей</span>
                  <span>·</span>
                  <span>{relativeTime(item.updatedAt)}</span>
                </div>
                <div className="m">
                  <span
                    className={`dot tone-${spacesById[item.spaceId]?.tone ?? 'violet'}`}
                    style={{ background: 'var(--tone)' }}
                  />
                  {spacesById[item.spaceId]?.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
