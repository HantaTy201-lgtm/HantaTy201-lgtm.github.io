import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import { formatDate, monthTitle, toISO, todayISO } from '../lib/utils';

const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function CalendarView() {
  const { ws, spacesById, createTask, updateTask, toast, activeSpace } = useStore();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const today = todayISO();

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [cursor]);

  const monthTasks = useMemo(
    () =>
      ws.tasks.filter(
        (t) =>
          t.due &&
          new Date(t.due).getFullYear() === cursor.getFullYear() &&
          new Date(t.due).getMonth() === cursor.getMonth(),
      ),
    [ws.tasks, cursor],
  );

  const tasksByDay = useMemo(() => {
    const map: Record<string, typeof ws.tasks> = {};
    for (const task of ws.tasks) {
      if (!task.due) continue;
      (map[task.due] ??= []).push(task);
    }
    return map;
  }, [ws.tasks]);

  const targetSpaceId = activeSpace !== 'all' ? activeSpace : ws.spaces[0]?.id;

  const addTaskOn = (iso: string) => {
    createTask({ title: 'Новая задача', due: iso, spaceId: targetSpaceId });
    toast('Задача создана на ' + formatDate(iso));
  };

  return (
    <>
      <div className="view-head">
        <div>
          <h1 className="view-title">Календарь</h1>
          <p className="view-sub">
            {monthTitle(cursor)} · {monthTasks.length} задач с датой
          </p>
        </div>
        <div className="view-head-actions">
          <button
            className="btn"
            onClick={() => {
              const d = new Date();
              setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
            }}
          >
            Сегодня
          </button>
          <button
            className="icon-btn"
            title="Предыдущий месяц"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            className="icon-btn"
            title="Следующий месяц"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
          >
            <Icon name="chevron-right" size={16} />
          </button>
          <button className="btn primary" onClick={() => addTaskOn(today)}>
            <Icon name="plus" size={15} />
            Новая задача
          </button>
        </div>
      </div>

      <div className="view-scroll">
        <div className="cal-grid">
          {DOW.map((d) => (
            <div key={d} className="cal-dow">
              {d}
            </div>
          ))}
          {cells.map((date) => {
            const iso = toISO(date);
            const dayTasks = tasksByDay[iso] ?? [];
            const out = date.getMonth() !== cursor.getMonth();
            return (
              <div
                key={iso}
                className={`cal-cell${out ? ' out' : ''}${iso === today ? ' today' : ''}`}
                onClick={() => addTaskOn(iso)}
              >
                <div className="cal-day">{date.getDate()}</div>
                {dayTasks.map((task) => {
                  const space = spacesById[task.spaceId];
                  return (
                    <button
                      key={task.id}
                      className={`cal-chip tone-${space?.tone ?? 'violet'}${
                        task.status === 'done' ? ' done' : ''
                      }`}
                      title={task.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTask(task.id, {
                          status: task.status === 'done' ? 'backlog' : 'done',
                        });
                      }}
                    >
                      {task.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
