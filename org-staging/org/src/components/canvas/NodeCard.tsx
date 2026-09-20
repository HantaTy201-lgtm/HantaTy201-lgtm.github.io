import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { Icon, OrgMark } from '../Icon';
import type { CanvasNode } from '../../types';

export type HandleSide = 'l' | 'r' | 't' | 'b';

interface Props {
  node: CanvasNode;
  selected: boolean;
  editing: boolean;
  dragging: boolean;
  showHandles: boolean;
  onPointerDown: (event: ReactPointerEvent, node: CanvasNode) => void;
  onStartEdit: (node: CanvasNode) => void;
  onPatch: (id: string, patch: Partial<CanvasNode>) => void;
  onToggleItem: (nodeId: string, itemId: string) => void;
  onRemoveItem: (nodeId: string, itemId: string) => void;
  onAddItem: (nodeId: string) => void;
  onHandleDown: (event: ReactPointerEvent, node: CanvasNode, side: HandleSide) => void;
  onResizeDown: (event: ReactPointerEvent, node: CanvasNode) => void;
  onOpenNote: (noteId: string) => void;
}

const HANDLES: { side: HandleSide; style: CSSProperties }[] = [
  { side: 't', style: { left: '50%', top: -6, transform: 'translateX(-50%)' } },
  { side: 'b', style: { left: '50%', bottom: -6, transform: 'translateX(-50%)' } },
  { side: 'l', style: { left: -6, top: '50%', transform: 'translateY(-50%)' } },
  { side: 'r', style: { right: -6, top: '50%', transform: 'translateY(-50%)' } },
];

export function NodeCard({
  node,
  selected,
  editing,
  dragging,
  showHandles,
  onPointerDown,
  onStartEdit,
  onPatch,
  onToggleItem,
  onRemoveItem,
  onAddItem,
  onHandleDown,
  onResizeDown,
  onOpenNote,
}: Props) {
  const isCenter = node.kind === 'text';

  const head = editing ? (
    <div className="node-head">
      <span className="node-icon">{node.icon || '•'}</span>
      <input
        className="node-edit"
        autoFocus
        value={node.title}
        onChange={(event) => onPatch(node.id, { title: event.target.value })}
      />
    </div>
  ) : (
    <div className="node-head">
      <span className="node-icon">{node.icon || '•'}</span>
      <span className="node-title">{node.title}</span>
      {node.noteId && (
        <button
          className="node-badge"
          title="Открыть заметку"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            if (node.noteId) onOpenNote(node.noteId);
          }}
        >
          заметка
        </button>
      )}
    </div>
  );

  const bullets = editing ? (
    <>
      {node.bullets.map((bullet, index) => (
        <input
          key={`b${index}`}
          className="node-item-input"
          value={bullet}
          onChange={(event) => {
            const bullets = [...node.bullets];
            bullets[index] = event.target.value;
            onPatch(node.id, { bullets });
          }}
        />
      ))}
      <button
        className="node-sub"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onPatch(node.id, { bullets: [...node.bullets, ''] });
        }}
      >
        + пункт
      </button>
    </>
  ) : node.kind === 'quote' ? (
    node.bullets.map((bullet, index) => (
      <p className="node-quote" key={`q${index}`}>
        {bullet}
      </p>
    ))
  ) : (
    node.bullets.map((bullet, index) => (
      <div className="node-bullet" key={`b${index}`}>
        <span>{bullet}</span>
      </div>
    ))
  );

  const items = editing ? (
    <>
      {node.items.map((item) => (
        <div className="node-check" key={item.id}>
          <button
            className={`node-box${item.done ? ' on' : ''}`}
            style={item.done ? { background: 'var(--tone)', borderColor: 'transparent' } : undefined}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onToggleItem(node.id, item.id);
            }}
          >
            <Icon name="check" size={9} strokeWidth={3} />
          </button>
          <input
            className="node-item-input"
            value={item.text}
            onChange={(event) => {
              const items = node.items.map((i) =>
                i.id === item.id ? { ...i, text: event.target.value } : i,
              );
              onPatch(node.id, { items });
            }}
          />
          <button
            className="node-sub"
            title="Удалить пункт"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onRemoveItem(node.id, item.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        className="node-sub"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onAddItem(node.id);
        }}
      >
        + пункт
      </button>
    </>
  ) : (
    node.items.map((item) => (
      <button
        className={`node-check${item.done ? ' done' : ''}`}
        key={item.id}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggleItem(node.id, item.id);
        }}
      >
        <span className="node-box">
          <Icon name="check" size={9} strokeWidth={3} />
        </span>
        <span>{item.text}</span>
      </button>
    ))
  );

  const links = editing ? (
    <>
      {node.links.map((link) => (
        <div className="node-link-row" key={link.id}>
          <input
            className="node-item-input"
            value={link.from}
            onChange={(event) =>
              onPatch(node.id, {
                links: node.links.map((l) => (l.id === link.id ? { ...l, from: event.target.value } : l)),
              })
            }
          />
          <span className="arrow">→</span>
          <input
            className="node-item-input"
            value={link.to}
            onChange={(event) =>
              onPatch(node.id, {
                links: node.links.map((l) => (l.id === link.id ? { ...l, to: event.target.value } : l)),
              })
            }
          />
          <button
            className="node-sub"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onPatch(node.id, { links: node.links.filter((l) => l.id !== link.id) });
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        className="node-sub"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onPatch(node.id, {
            links: [
              ...node.links,
              { id: `nl_${Math.random().toString(36).slice(2, 8)}`, from: 'Продукт', to: 'Команда' },
            ],
          });
        }}
      >
        + связь
      </button>
    </>
  ) : (
    node.links.map((link) => (
      <div className="node-link-row" key={link.id}>
        <span>{link.from}</span>
        <span className="arrow">→</span>
        <span>{link.to}</span>
      </div>
    ))
  );

  return (
    <div
      className={`node tone-${node.tone}${selected ? ' selected' : ''}${dragging ? ' dragging' : ''}`}
      data-node-id={node.id}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
      onPointerDown={(event) => onPointerDown(event, node)}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onStartEdit(node);
      }}
    >
      {isCenter ? (
        <>
          <div className="node-center-title">
            <OrgMark size={34} className="mark" />
            <h3>{node.title}</h3>
          </div>
          <div className="node-body node-center">
            {bullets}
            {items}
            {links}
          </div>
        </>
      ) : (
        <>
          {head}
          <div className="node-body">
            {bullets}
            {items}
            {links}
          </div>
        </>
      )}

      {showHandles &&
        HANDLES.map((handle) => (
          <span
            key={handle.side}
            className="handle"
            data-handle={handle.side}
            style={handle.style}
            onPointerDown={(event) => onHandleDown(event, node, handle.side)}
          />
        ))}
      {selected && !editing && (
        <span className="node-resize" onPointerDown={(event) => onResizeDown(event, node)} />
      )}
    </div>
  );
}
