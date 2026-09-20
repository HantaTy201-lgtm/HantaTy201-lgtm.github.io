import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Icon } from '../components/Icon';
import type { DbRow } from '../types';
import { normalize, relativeTime, uid } from '../lib/utils';

type SortKey = 'name' | 'type' | 'status' | 'spaceId' | 'tags' | 'updatedAt';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Название' },
  { key: 'type', label: 'Тип' },
  { key: 'status', label: 'Статус' },
  { key: 'spaceId', label: 'Пространство' },
  { key: 'tags', label: 'Теги' },
  { key: 'updatedAt', label: 'Обновлено' },
];

export function KnowledgeView() {
  const { ws, spacesById, updateBase, openTab, toast } = useStore();
  const [baseIndex, setBaseIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'updatedAt',
    dir: 'desc',
  });

  const base = ws.bases[baseIndex] ?? ws.bases[0];

  const rows = useMemo(() => {
    if (!base) return [];
    const q = normalize(query);
    const filtered = q
      ? base.rows.filter(
          (r) =>
            normalize(r.name).includes(q) ||
            normalize(r.type).includes(q) ||
            r.tags.some((t) => normalize(t).includes(q)),
        )
      : base.rows;
    const sorted = [...filtered].sort((a, b) => {
      const av = sort.key === 'tags' ? a.tags.join(', ') : String(a[sort.key] ?? '');
      const bv = sort.key === 'tags' ? b.tags.join(', ') : String(b[sort.key] ?? '');
      return av.localeCompare(bv, 'ru');
    });
    return sort.dir === 'asc' ? sorted : sorted.reverse();
  }, [base, query, sort]);

  if (!base) {
    return (
      <>
        <div className="view-head">
          <div>
            <h1 className="view-title">База знаний</h1>
            <p className="view-sub">
              Структурируй материалы: типы, статусы, теги и связи с заметками.
            </p>
          </div>
        </div>
        <div className="empty">База пока пуста</div>
      </>
    );
  }

  const patchRow = (rowId: string, patch: Partial<DbRow>) => {
    updateBase(base.id, (b) => ({
      ...b,
      rows: b.rows.map((r) =>
        r.id === rowId ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
      ),
    }));
  };

  const addRow = () => {
    const row: DbRow = {
      id: uid('r'),
      name: 'Новая запись',
      type: 'Заметка',
      status: 'Черновик',
      spaceId: ws.spaces[0]?.id ?? '',
      tags: [],
      updatedAt: new Date().toISOString(),
    };
    updateBase(base.id, (b) => ({ ...b, rows: [...b.rows, row] }));
  };

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );
  };

  return (
    <>
      <div className="view-head">
        <div>
          <h1 className="view-title">База знаний</h1>
          <p className="view-sub">
            Структурируй материалы: типы, статусы, теги и связи с заметками.
          </p>
        </div>
        <div className="view-head-actions">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по базе"
            aria-label="Поиск по базе"
          />
          {ws.bases.length > 1 && (
            <select
              value={baseIndex}
              onChange={(e) => setBaseIndex(Number(e.target.value))}
              aria-label="Выбор базы"
            >
              {ws.bases.map((b, i) => (
                <option key={b.id} value={i}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <button className="btn primary" onClick={addRow}>
            <Icon name="plus" size={15} />
            Запись
          </button>
        </div>
      </div>

      <div className="view-scroll">
        <div className="kb-wrap">
          <table className="kb-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}>
                    {col.label}
                    {sort.key === col.key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
                <th aria-label="Действия" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const space = spacesById[row.spaceId];
                return (
                  <tr key={row.id}>
                    <td>
                      <button
                        className="kb-row-name"
                        onClick={() => {
                          if (row.noteId) openTab('note', row.noteId);
                          else toast('У записи нет связанной заметки');
                        }}
                      >
                        <Icon name="note" size={15} />
                        {row.name}
                      </button>
                    </td>
                    <td>
                      <input
                        value={row.type}
                        onChange={(e) => patchRow(row.id, { type: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={row.status}
                        onChange={(e) => patchRow(row.id, { status: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={row.spaceId}
                        onChange={(e) => patchRow(row.id, { spaceId: e.target.value })}
                      >
                        {ws.spaces.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {row.tags.map((tag) => (
                        <span key={tag} className="chip">
                          {tag}
                        </span>
                      ))}
                    </td>
                    <td>{relativeTime(row.updatedAt)}</td>
                    <td>
                      <button
                        className="icon-btn"
                        title="Удалить запись"
                        onClick={() =>
                          updateBase(base.id, (b) => ({
                            ...b,
                            rows: b.rows.filter((r) => r.id !== row.id),
                          }))
                        }
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 1}>
                    <div className="empty">Ничего не найдено</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
