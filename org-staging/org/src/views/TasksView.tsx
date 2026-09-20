import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { PRIORITY_LABEL, TASK_COLUMNS } from '../types';
import type { Task, TaskPriority, ToneKey } from '../types';
import { formatDate } from '../lib/utils';

const PRIORITY_TONE: Record<TaskPriority, ToneKey> = {
  high: 'rose',
  med: 'amber',
  low: 'slate',
};

export function TasksView() {
  const { ws, spacesById, createTask, updateTask, deleteTask, openTab } = useStore();
  const [spaceFilter, setSpaceFilter] = useState<'all' | string>('all');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropColumn, setDropColumn] = useState<string | null>(null);

  const tasks = useMemo(
    () => (spaceFilter === 'all' ? ws.tasks : ws.tasks.filter((t) => t.spaceId === spaceFilter)),
    [ws.tasks, spaceFilter],
  );

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const progressCount = tasks.filter((t) => t.status === 'progress').length;

  const targetSpaceId = spaceFilter === 'all' ? ws.spaces[0]?.id : spaceFilter;

  const addTask = (status?: Task['status']) => {
    createTask({ title: 'Новая задача', spaceId: targetSpaceId, status });
  };

  const handleDrop = (columnId: Task['status']) => {
    if (draggingId) updateTask(draggingId, { status: columnId });
    setDraggingId(null);
    setDropColumn(null);
  };

  return (
    <>
      <div className="view-head">
        <div>
          <h1 className="view-title">Задачи</h1>
          <p className="view-sub">
            {doneCount} из {tasks.length} выполнено · {progressCount} в работе
          </p>
        </div>
        <div className="view-head-actions">
          <select
            value={spaceFilter}
            onChange={(e) => setSpaceFilter(e.target.value)}
            aria-label="Фильтр по пространству"
          >
            <option value="all">Все пространства</option>
            {ws.spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={() => addTask()}>
            <Icon name="plus" size={15} />
            Новая задача
          </button>
        </div>
      </div>

      <div className="view-scroll">
        <div className="board-grid">
          {TASK_COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className={`column tone-${col.tone}`}>
                <div className="column-head">
                  <span className="dot" style={{ background: 'var(--tone)' }} />
                  <span>{col.title}</span>
                  <span className="count">{columnTasks.length}</span>
                  <button
                    className="icon-btn"
                    style={{ marginLeft: 'auto' }}
                    title="Добавить задачу"
                    onClick={() => addTask(col.id)}
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
                <div
                  className={`column-body${dropColumn === col.id ? ' drop-target' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropColumn(col.id);
                  }}
                  onDragLeave={() => setDropColumn((prev) => (prev === col.id ? null : prev))}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(col.id);
                  }}
                >
                  {columnTasks.map((task) => {
                    const space = spacesById[task.spaceId];
                    return (
                      <div
                        key={task.id}
                        className={`task-card${task.status === 'done' ? ' done' : ''}${
                          draggingId === task.id ? ' dragging' : ''
                        }`}
                        draggable
                        onDragStart={(e) => {
                          setDraggingId(task.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDropColumn(null);
                        }}
                      >
                        <div className="title">
                          <input
                            value={task.title}
                            draggable={false}
                            onDragStart={(e) => e.stopPropagation()}
                            onChange={(e) => updateTask(task.id, { title: e.target.value })}
                          />
                        </div>
                        <div className="task-meta">
                          <span className={`chip tone tone-${PRIORITY_TONE[task.priority]}`}>
                            <Icon name="flag" size={12} />
                            {PRIORITY_LABEL[task.priority]}
                          </span>
                          {task.due && (
                            <span className="chip">
                              <Icon name="clock" size={12} />
                              {formatDate(task.due)}
                            </span>
                          )}
                          {space && (
                            <span className={`chip tone tone-${space.tone}`}>{space.name}</span>
                          )}
                          {task.noteId && (
                            <button
                              className="icon-btn"
                              title="Открыть заметку"
                              onClick={() => openTab('note', task.noteId)}
                            >
                              <Icon name="link" size={14} />
                            </button>
                          )}
                          <button
                            className="icon-btn"
                            style={{ marginLeft: 'auto' }}
                            title="Удалить задачу"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {columnTasks.length === 0 && (
                    <div className="empty" style={{ padding: '14px 6px' }}>
                      Перетащи задачу сюда
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
