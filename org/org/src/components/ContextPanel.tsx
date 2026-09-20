import { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { Markdown } from './Markdown';
import { useStore } from '../store';
import { useSelection } from '../lib/selection';
import { escapeRegExp, formatDate, normalize, plural, relativeTime, todayISO } from '../lib/utils';
import type { Note } from '../types';

const KIND_LABEL: Record<string, string> = {
  note: 'Заметка',
  checklist: 'Чек-лист',
  quote: 'Цитата',
  links: 'Связи',
  text: 'Заголовок',
};

export function ContextPanel() {
  const {
    ws,
    activeTab,
    notesById,
    canvasesById,
    spacesById,
    updateNote,
    updateTask,
    createTask,
    openTab,
    mutateCanvas,
    deleteCanvas,
    createNote,
    toast,
  } = useStore();
  const { canvasFocus, requestFocus } = useSelection();
  const [tab, setTab] = useState<'notes' | 'board'>('notes');

  const canvas =
    activeTab.kind === 'canvas' && activeTab.refId ? canvasesById[activeTab.refId] : undefined;
  const focusNodeId = canvas && canvasFocus?.canvasId === canvas.id ? canvasFocus.nodeId : null;
  const focusedNode = canvas?.nodes.find((n) => n.id === focusNodeId);

  const fallbackNodeId = canvas?.nodes.find((n) => n.noteId)?.noteId;

  const note: Note | undefined =
    activeTab.kind === 'note' && activeTab.refId
      ? notesById[activeTab.refId]
      : focusedNode?.noteId
        ? notesById[focusedNode.noteId]
        : fallbackNodeId
          ? notesById[fallbackNodeId]
          : undefined;

  const backlinks = useMemo(() => {
    if (!note) return [];
    const pattern = new RegExp(`\\[\\[\\s*${escapeRegExp(note.title)}\\s*\\]\\]`, 'i');
    return ws.notes.filter((n) => n.id !== note.id && pattern.test(n.body));
  }, [note, ws.notes]);

  const outgoing = useMemo(() => {
    if (!note) return [];
    const index = new Map(ws.notes.map((n) => [normalize(n.title), n]));
    const matches = note.body.match(/\[\[([^\]]+)\]\]/g) ?? [];
    const result: Note[] = [];
    matches.forEach((match) => {
      const target = index.get(normalize(match.slice(2, -2)));
      if (target && !result.some((r) => r.id === target.id)) result.push(target);
    });
    return result;
  }, [note, ws.notes]);

  const noteTasks = note ? ws.tasks.filter((t) => t.noteId === note.id) : [];
  const todayTasks = ws.tasks.filter((t) => t.due === todayISO());

  return (
    <aside className="panel">
      <div className="panel-head">
        <button className={`panel-tab${tab === 'notes' ? ' active' : ''}`} onClick={() => setTab('notes')}>
          <Icon name="note" size={14} />
          Заметки
        </button>
        <button className={`panel-tab${tab === 'board' ? ' active' : ''}`} onClick={() => setTab('board')}>
          <Icon name="canvas" size={14} />
          Доска
        </button>
        <div className="panel-head-actions">
          <button
            className="icon-btn"
            title={note ? 'Новая задача к заметке' : 'Новая заметка'}
            onClick={() => {
              if (note) {
                createTask({ title: 'Новая задача', noteId: note.id, spaceId: note.spaceId });
                toast('Задача добавлена к заметке');
              } else {
                const created = createNote({ title: 'Новая заметка' });
                openTab('note', created.id);
              }
            }}
          >
            <Icon name="plus" size={15} />
          </button>
          <button
            className="icon-btn"
            title="Открыть заметку"
            disabled={!note}
            onClick={() => note && openTab('note', note.id)}
          >
            <Icon name="arrow-up-right" size={15} />
          </button>
        </div>
      </div>

      {tab === 'notes' ? (
        note ? (
          <div className="panel-body">
            <h3 className="note-title">{note.title}</h3>
            <div className="note-meta">
              {spacesById[note.spaceId]?.name} · {formatDate(note.updatedAt)} · обновлено{' '}
              {relativeTime(note.updatedAt)}
            </div>
            <Markdown
              text={note.body}
              resolve={(title) =>
                ws.notes.find((n) => normalize(n.title) === normalize(title))?.id
              }
              onOpenNote={(id) => openTab('note', id)}
              onCreateNote={(title) => {
                const created = createNote({ title, spaceId: note.spaceId });
                openTab('note', created.id);
              }}
              onTag={(tag) => openTab('note')}
            />

            {note.tags.length > 0 && (
              <div className="panel-section">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {note.tags.map((tag) => (
                    <span className="chip tone tone-violet" key={tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="panel-section">
              <h4>Связанные заметки</h4>
              {backlinks.length === 0 && <div className="stat-label">Пока никто не ссылается</div>}
              {backlinks.map((item) => (
                <button key={item.id} className="backlink" onClick={() => openTab('note', item.id)}>
                  <Icon name="link" size={14} />
                  {item.title}
                </button>
              ))}
              {outgoing.length > 0 && (
                <>
                  <h4 style={{ marginTop: 14 }}>Ссылается на</h4>
                  {outgoing.map((item) => (
                    <button key={item.id} className="backlink" onClick={() => openTab('note', item.id)}>
                      <Icon name="arrow-up-right" size={14} />
                      {item.title}
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="panel-section">
              <h4>Задачи</h4>
              {noteTasks.length === 0 && (
                <div className="stat-label">Нет задач, связанных с заметкой</div>
              )}
              {noteTasks.map((task) => (
                <button
                  key={task.id}
                  className={`task-row${task.status === 'done' ? ' done' : ''}`}
                  onClick={() =>
                    updateTask(task.id, { status: task.status === 'done' ? 'backlog' : 'done' })
                  }
                >
                  <span className={`checkbox${task.status === 'done' ? ' on' : ''}`}>
                    {task.status === 'done' ? '✓' : ''}
                  </span>
                  <span className="task-text">{task.title}</span>
                </button>
              ))}
              <button
                className="btn small ghost"
                style={{ marginTop: 8 }}
                onClick={() => {
                  createTask({ title: 'Новая задача', noteId: note.id, spaceId: note.spaceId });
                  toast('Задача добавлена');
                }}
              >
                <Icon name="plus" size={13} />
                добавить задачу
              </button>
            </div>

            <div className="panel-section">
              <h4>Свойства</h4>
              <div className="stat-label">Пространство: {spacesById[note.spaceId]?.name}</div>
              <div className="stat-label">Папка: {note.folder}</div>
              <div className="stat-label">Создано: {formatDate(note.createdAt)}</div>
              <div className="stat-label">
                Размер: {note.body.length} {plural(note.body.length, 'символ', 'символа', 'символов')}
              </div>
              <button
                className="btn small ghost"
                style={{ marginTop: 8 }}
                onClick={() => {
                  updateNote(note.id, { pinned: !note.pinned });
                  toast(note.pinned ? 'Закрепление снято' : 'Заметка закреплена');
                }}
              >
                <Icon name="star" size={13} />
                {note.pinned ? 'Открепить' : 'Закрепить'}
              </button>
            </div>
          </div>
        ) : (
          <div className="panel-body">
            <h3 className="note-title">Сводка</h3>
            <div className="note-meta">Org · локальное рабочее пространство</div>
            <div className="stat-label">
              {ws.notes.length} заметок · {ws.canvases.length} канвасов · {ws.tasks.length} задач
            </div>
            <div className="panel-section">
              <h4>Задачи на сегодня</h4>
              {todayTasks.length === 0 && <div className="stat-label">Ничего не запланировано</div>}
              {todayTasks.map((task) => (
                <button
                  key={task.id}
                  className={`task-row${task.status === 'done' ? ' done' : ''}`}
                  onClick={() =>
                    updateTask(task.id, { status: task.status === 'done' ? 'backlog' : 'done' })
                  }
                >
                  <span className={`checkbox${task.status === 'done' ? ' on' : ''}`}>
                    {task.status === 'done' ? '✓' : ''}
                  </span>
                  <span className="task-text">{task.title}</span>
                </button>
              ))}
            </div>
            <div className="panel-section">
              <h4>Недавние заметки</h4>
              {[...ws.notes]
                .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
                .slice(0, 5)
                .map((item) => (
                  <button key={item.id} className="backlink" onClick={() => openTab('note', item.id)}>
                    <Icon name="note" size={14} />
                    {item.title}
                  </button>
                ))}
            </div>
          </div>
        )
      ) : canvas ? (
        <div className="panel-body">
          <h3 className="note-title">{canvas.name}</h3>
          <div className="note-meta">
            {spacesById[canvas.spaceId]?.name} · {canvas.nodes.length} узлов · {canvas.edges.length} связей
          </div>
          <p className="stat-label">{canvas.description}</p>

          <div className="panel-section">
            <h4>Узлы</h4>
            <div className="node-list">
              {canvas.nodes.map((node) => (
                <button
                  key={node.id}
                  className="node-list-row"
                  onClick={() => requestFocus(canvas.id, node.id)}
                >
                  <span className={`dot tone-${node.tone}`} style={{ background: 'var(--tone)' }} />
                  {node.title}
                  <span className="num">{KIND_LABEL[node.kind]}</span>
                </button>
              ))}
            </div>
          </div>

          {focusedNode && (
            <div className="panel-section">
              <h4>Выбранный узел</h4>
              <div className="stat-label">Название: {focusedNode.title}</div>
              <div className="stat-label">Тип: {KIND_LABEL[focusedNode.kind]}</div>
              <div className="stat-label">
                Размер: {Math.round(focusedNode.w)} × {Math.round(focusedNode.h)}
              </div>
              {focusedNode.noteId && (
                <button
                  className="backlink"
                  onClick={() => focusedNode.noteId && openTab('note', focusedNode.noteId)}
                >
                  <Icon name="note" size={14} />
                  Открыть связанную заметку
                </button>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                <button
                  className="btn small"
                  onClick={() =>
                    mutateCanvas(canvas.id, (c) => ({
                      ...c,
                      nodes: c.nodes.map((n) =>
                        n.id === focusedNode.id ? { ...n, kind: n.kind === 'checklist' ? 'note' : 'checklist' } : n,
                      ),
                    }))
                  }
                >
                  <Icon name="check-square" size={13} />
                  {focusedNode.kind === 'checklist' ? 'в список' : 'в чек-лист'}
                </button>
                <button
                  className="btn small"
                  onClick={() =>
                    mutateCanvas(canvas.id, (c) => ({
                      ...c,
                      nodes: c.nodes.map((n) =>
                        n.id === focusedNode.id
                          ? { ...n, items: [...n.items, { id: `ci_${Date.now()}`, text: 'Новый пункт', done: false }] }
                          : n,
                      ),
                    }))
                  }
                >
                  <Icon name="plus" size={13} />
                  пункт
                </button>
              </div>
            </div>
          )}

          <div className="panel-section">
            <h4>Связи</h4>
            {canvas.edges.length === 0 && <div className="stat-label">Связей пока нет</div>}
            {canvas.edges.map((edge) => {
              const from = canvas.nodes.find((n) => n.id === edge.from);
              const to = canvas.nodes.find((n) => n.id === edge.to);
              return (
                <div key={edge.id} className="node-list-row">
                  <span className={`dot tone-${edge.tone}`} style={{ background: 'var(--tone)' }} />
                  {from?.title} → {to?.title}
                </div>
              );
            })}
          </div>

          <div className="panel-section">
            <h4>Вид</h4>
            <button
              className="btn small"
              onClick={() => mutateCanvas(canvas.id, (c) => ({ ...c, grid: !c.grid }), { history: false })}
            >
              <Icon name="grid" size={13} />
              {canvas.grid ? 'Скрыть сетку' : 'Показать сетку'}
            </button>
            <button
              className="btn small"
              style={{ marginLeft: 8 }}
              onClick={() => {
                deleteCanvas(canvas.id);
                toast('Канвас удалён');
              }}
            >
              <Icon name="trash" size={13} />
              Удалить канвас
            </button>
          </div>
        </div>
      ) : (
        <div className="panel-empty">
          Открой заметку или канвас — здесь появится контекст: содержимое, связи, задачи и свойства.
        </div>
      )}
    </aside>
  );
}
