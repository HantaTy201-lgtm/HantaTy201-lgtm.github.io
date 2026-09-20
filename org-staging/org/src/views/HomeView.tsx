import { useMemo } from 'react';
import { Icon } from '../components/Icon';
import { useStore } from '../store';
import { excerpt, plural, relativeTime, todayISO } from '../lib/utils';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

export function HomeView() {
  const { ws, spacesById, openTab, createNote, createCanvas, createTask, updateTask, toast } = useStore();

  const recent = useMemo(
    () => [...ws.notes].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 4),
    [ws.notes],
  );
  const today = todayISO();
  const todayTasks = ws.tasks.filter((t) => t.due === today);
  const openTasks = ws.tasks.filter((t) => t.status !== 'done');
  const links = useMemo(() => {
    const index = new Set(ws.notes.map((n) => n.title.trim().toLowerCase()));
    let total = 0;
    ws.notes.forEach((note) => {
      const matches = note.body.match(/\[\[([^\]]+)\]\]/g) ?? [];
      matches.forEach((match) => {
        if (index.has(match.slice(2, -2).trim().toLowerCase())) total += 1;
      });
    });
    return total;
  }, [ws.notes]);

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h1 className="view-title">
            {greeting()}, {ws.user.name}
          </h1>
          <p className="view-sub">
            Структурируй мысли. Визуализируй идеи. Делай больше. Сейчас в работе {openTasks.length}{' '}
            {plural(openTasks.length, 'задача', 'задачи', 'задач')}.
          </p>
        </div>
        <div className="view-head-actions">
          <button
            className="btn"
            onClick={() => {
              const created = createCanvas('Новый канвас');
              openTab('canvas', created.id);
            }}
          >
            <Icon name="canvas" size={15} />
            Канвас
          </button>
          <button
            className="btn primary"
            onClick={() => {
              const created = createNote({ title: 'Новая заметка' });
              openTab('note', created.id);
            }}
          >
            <Icon name="plus" size={15} />
            Заметка
          </button>
        </div>
      </div>

      <div className="view-scroll">
        <div className="home-grid">
          <div className="card stat-card">
            <div className="stat-value">{ws.notes.length}</div>
            <div className="stat-label">заметок в {ws.spaces.length} пространствах</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{ws.canvases.length}</div>
            <div className="stat-label">канвасов</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{links}</div>
            <div className="stat-label">связей между заметками</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">
              {ws.tasks.filter((t) => t.status === 'done').length}/{ws.tasks.length}
            </div>
            <div className="stat-label">задач выполнено</div>
          </div>
        </div>

        <div className="section-title">
          <Icon name="clock" size={14} />
          Недавние заметки
        </div>
        <div className="home-grid">
          {recent.map((note) => (
            <button key={note.id} className="card tile" onClick={() => openTab('note', note.id)}>
              <span className="t">
                <Icon name="note" size={15} />
                {note.title}
              </span>
              <span className="s">{excerpt(note.body, 90) || 'Пустая заметка'}</span>
              <span className="m">
                <span
                  className={`dot tone-${spacesById[note.spaceId]?.tone ?? 'violet'}`}
                  style={{ background: 'var(--tone)' }}
                />
                {spacesById[note.spaceId]?.name}
                <span>·</span>
                {relativeTime(note.updatedAt)}
              </span>
            </button>
          ))}
        </div>

        <div className="section-title">
          <Icon name="check-square" size={14} />
          Задачи на сегодня
          <span className="count">{todayTasks.length}</span>
          <button className="btn small ghost" style={{ marginLeft: 'auto' }} onClick={() => openTab('tasks')}>
            Все задачи
            <Icon name="arrow-right" size={13} />
          </button>
        </div>
        <div className="home-grid">
          {todayTasks.length === 0 && (
            <div className="card tile">
              <span className="t">
                <Icon name="sparkles" size={15} />
                На сегодня задач нет
              </span>
              <span className="s">Запланируй что-то важное или просто отдохни.</span>
              <span className="m">
                <button
                  className="btn small ghost"
                  onClick={() => {
                    createTask({ title: 'Новая задача', due: today });
                    toast('Задача создана на сегодня');
                  }}
                >
                  <Icon name="plus" size={12} />
                  добавить
                </button>
              </span>
            </div>
          )}
          {todayTasks.map((task) => (
            <button
              key={task.id}
              className="card tile"
              onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'backlog' : 'done' })}
            >
              <span className="t">
                <span className={`checkbox${task.status === 'done' ? ' on' : ''}`}>
                  {task.status === 'done' ? '✓' : ''}
                </span>
                {task.title}
              </span>
              <span className="s">
                {spacesById[task.spaceId]?.name} · {task.status === 'done' ? 'выполнено' : 'в плане'}
              </span>
              <span className="m">
                <Icon name="clock" size={12} />
                сегодня
              </span>
            </button>
          ))}
        </div>

        <div className="section-title">
          <Icon name="canvas" size={14} />
          Канвасы
          <button className="btn small ghost" style={{ marginLeft: 'auto' }} onClick={() => openTab('canvas')}>
            Все канвасы
            <Icon name="arrow-right" size={13} />
          </button>
        </div>
        <div className="home-grid">
          {ws.canvases.map((canvas) => (
            <button key={canvas.id} className="card tile" onClick={() => openTab('canvas', canvas.id)}>
              <span className="t">
                <Icon name="canvas" size={15} />
                {canvas.name}
              </span>
              <span className="s">{canvas.description}</span>
              <span className="m">
                {canvas.nodes.length} узлов · {canvas.edges.length} связей
              </span>
            </button>
          ))}
        </div>

        <div className="section-title">
          <Icon name="layers" size={14} />
          Пространства
        </div>
        <div className="home-grid" style={{ paddingBottom: 26 }}>
          {ws.spaces.map((space) => {
            const notes = ws.notes.filter((n) => n.spaceId === space.id).length;
            const canvases = ws.canvases.filter((c) => c.spaceId === space.id).length;
            return (
              <button
                key={space.id}
                className={`card tile tone-${space.tone}`}
                onClick={() => openTab('note')}
              >
                <span className="t">
                  <span className="dot" style={{ background: 'var(--tone)' }} />
                  {space.name}
                </span>
                <span className="s">
                  {notes} заметок · {canvases} канвасов
                </span>
                <span className="m">
                  <Icon name="arrow-up-right" size={13} />
                  открыть заметки
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
