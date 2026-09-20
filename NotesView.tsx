import { useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { useStore } from '../store';
import { excerpt, formatDate, normalize, plural, relativeTime } from '../lib/utils';
import type { Id, Note } from '../types';

export function NotesView({ noteId }: { noteId?: Id }) {
  const { ws, notesById, spacesById, activeSpace, createNote, updateNote, deleteNote, openTab, toast } =
    useStore();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [suggest, setSuggest] = useState<{ start: number; query: string } | null>(null);
  const [suggestIndex, setSuggestIndex] = useState(0);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const note = noteId ? notesById[noteId] : undefined;

  const list = useMemo(() => {
    const search = normalize(query);
    return ws.notes
      .filter((n) => (activeSpace === 'all' ? true : n.spaceId === activeSpace))
      .filter((n) => {
        if (!search) return true;
        return (
          normalize(n.title).includes(search) ||
          normalize(n.body).includes(search) ||
          n.tags.some((tag) => normalize(tag).includes(search))
        );
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [ws.notes, activeSpace, query]);

  const titleIndex = useMemo(() => {
    const map = new Map<string, string>();
    ws.notes.forEach((n) => map.set(normalize(n.title), n.id));
    return map;
  }, [ws.notes]);

  const resolve = (title: string) => titleIndex.get(normalize(title));
  const openNote = (id: string) => openTab('note', id);
  const createFromLink = (title: string) => {
    const created = createNote({ title, spaceId: note?.spaceId });
    toast(`Заметка «${title}» создана`);
    openTab('note', created.id);
  };

  const suggestions = useMemo(() => {
    if (!suggest) return [];
    const search = normalize(suggest.query);
    return ws.notes
      .filter((n) => n.id !== note?.id)
      .filter((n) => !search || normalize(n.title).includes(search))
      .slice(0, 8);
  }, [suggest, ws.notes, note?.id]);

  const onBodyChange = (value: string, cursor: number) => {
    if (!note) return;
    updateNote(note.id, { body: value });
    const before = value.slice(0, cursor);
    const start = before.lastIndexOf('[[');
    if (start !== -1 && !before.slice(start).includes(']]') && !before.slice(start).includes('\n')) {
      setSuggest({ start, query: before.slice(start + 2) });
      setSuggestIndex(0);
    } else {
      setSuggest(null);
    }
  };

  const applySuggestion = (title: string) => {
    if (!note || !suggest || !areaRef.current) return;
    const cursor = areaRef.current.selectionStart;
    const value = note.body;
    const next = `${value.slice(0, suggest.start)}[[${title}]]${value.slice(cursor)}`;
    updateNote(note.id, { body: next });
    setSuggest(null);
    window.setTimeout(() => {
      const position = suggest.start + title.length + 4;
      areaRef.current?.focus();
      areaRef.current?.setSelectionRange(position, position);
    }, 0);
  };

  const renderEditor = (target: Note) => (
    <div className="notes-editor">
      <div className="editor-head">
        <div className="editor-crumbs">
          <span>{spacesById[target.spaceId]?.name ?? 'Пространство'}</span>
          <span>·</span>
          <span>{target.folder}</span>
          <span>·</span>
          <span>обновлено {relativeTime(target.updatedAt)}</span>
        </div>
        <input
          className="editor-title"
          value={target.title}
          placeholder="Название заметки"
          onChange={(event) => updateNote(target.id, { title: event.target.value })}
        />
        <div className="editor-toolbar">
          {target.tags.map((tag) => (
            <span className="chip tone tone-violet" key={tag}>
              #{tag}
            </span>
          ))}
          <button
            className="btn small ghost"
            onClick={() => {
              const tag = window.prompt('Новый тег');
              if (tag) updateNote(target.id, { tags: Array.from(new Set([...target.tags, tag.replace(/^#/, '')])) });
            }}
          >
            <Icon name="tag" size={13} />
            тег
          </button>
          <button className="btn small ghost" onClick={() => openTab('graph')}>
            <Icon name="network" size={13} />
            граф
          </button>
          <button
            className="btn small ghost"
            onClick={() => {
              deleteNote(target.id);
              toast('Заметка удалена');
            }}
          >
            <Icon name="trash" size={13} />
            удалить
          </button>
          <div className="editor-modes">
            {(['edit', 'split', 'preview'] as const).map((value) => (
              <button
                key={value}
                className={mode === value ? 'active' : ''}
                onClick={() => setMode(value)}
              >
                {value === 'edit' ? 'Текст' : value === 'split' ? 'Рядом' : 'Просмотр'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`editor-body${mode === 'split' ? ' split' : mode}`}>
        {mode !== 'preview' && (
          <div style={{ position: 'relative', display: 'flex', minHeight: 0 }}>
            <textarea
              ref={areaRef}
              className="editor-text"
              value={target.body}
              spellCheck={false}
              placeholder="Пиши здесь. Используй [[название заметки]] для связей и #теги для категорий."
              onChange={(event) => onBodyChange(event.target.value, event.target.selectionStart)}
              onKeyDown={(event) => {
                if (!suggest || !suggestions.length) return;
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setSuggestIndex((v) => (v + 1) % suggestions.length);
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setSuggestIndex((v) => (v - 1 + suggestions.length) % suggestions.length);
                } else if (event.key === 'Enter' || event.key === 'Tab') {
                  event.preventDefault();
                  applySuggestion(suggestions[suggestIndex].title);
                } else if (event.key === 'Escape') {
                  setSuggest(null);
                }
              }}
            />
            {suggest && suggestions.length > 0 && (
              <div className="wikilink-popup" style={{ left: 26, bottom: 18 }}>
                {suggestions.map((item, index) => (
                  <button
                    key={item.id}
                    className={index === suggestIndex ? 'active' : ''}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applySuggestion(item.title);
                    }}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {mode !== 'edit' && (
          <div className="editor-preview">
            <Markdown
              text={target.body}
              resolve={resolve}
              onOpenNote={openNote}
              onCreateNote={createFromLink}
              onTag={(tag) => setQuery(`#${tag}`)}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="view">
      <div className="notes-view">
        <div className="notes-list">
          <div className="notes-list-head">
            <div className="notes-search">
              <Icon name="search" size={14} />
              <input
                placeholder="Поиск по заметкам"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <button
              className="icon-btn"
              title="Новая заметка"
              onClick={() => {
                const created = createNote({ title: 'Новая заметка' });
                openTab('note', created.id);
              }}
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
          <div className="notes-list-body">
            {list.length === 0 && <div className="empty">Ничего не найдено</div>}
            {list.map((item) => (
              <button
                key={item.id}
                className={`note-item${item.id === noteId ? ' active' : ''}`}
                onClick={() => openTab('note', item.id)}
              >
                <span className="t">
                  <Icon name="note" size={14} />
                  {item.title}
                </span>
                <span className="s">{excerpt(item.body, 70) || 'Пустая заметка'}</span>
                <span className="m">
                  <span className={`dot tone-${spacesById[item.spaceId]?.tone ?? 'violet'}`} style={{ background: 'var(--tone)' }} />
                  {spacesById[item.spaceId]?.name}
                  <span>·</span>
                  {relativeTime(item.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {note ? (
          renderEditor(note)
        ) : (
          <div className="notes-editor">
            <div className="empty" style={{ marginTop: 80 }}>
              <p>
                {list.length} {plural(list.length, 'заметка', 'заметки', 'заметок')} в рабочем пространстве
              </p>
              <p style={{ marginTop: 12 }}>
                Выбери заметку слева или создай новую. Связывай их через <code>[[двойные скобки]]</code> —
                связи появятся в панели справа и в графе.
              </p>
              <button
                className="btn primary"
                style={{ marginTop: 18 }}
                onClick={() => {
                  const created = createNote({ title: 'Новая заметка' });
                  openTab('note', created.id);
                }}
              >
                <Icon name="plus" size={15} />
                Создать заметку
              </button>
              <p style={{ marginTop: 24, fontSize: 12 }}>
                Последнее обновление: {formatDate(list[0]?.updatedAt ?? new Date().toISOString())}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
