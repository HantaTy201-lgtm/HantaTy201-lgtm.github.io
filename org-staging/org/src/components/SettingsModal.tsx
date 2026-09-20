import { useRef, useState } from 'react';
import { Icon } from './Icon';
import { useStore } from '../store';

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'Ctrl + K', action: 'Командная палитра и поиск' },
  { keys: 'Ctrl + B', action: 'Свернуть панель навигации' },
  { keys: 'Ctrl + \\', action: 'Скрыть панель контекста' },
  { keys: 'V / R / T / C / E', action: 'Инструменты канваса' },
  { keys: 'Двойной клик', action: 'Новый узел на канвасе' },
  { keys: 'Ctrl + колесо', action: 'Масштаб канваса' },
  { keys: 'Пробел + перетаскивание', action: 'Панорама канваса' },
  { keys: 'Ctrl + Z / Ctrl + Y', action: 'Отменить / повторить' },
  { keys: '[[ ]', action: 'Связь между заметками' },
  { keys: '#тег', action: 'Метка внутри заметки' },
];

export function SettingsModal() {
  const { ws, setSettingsOpen, exportJson, importJson, resetDemo, setUserName, toast } = useStore();
  const [name, setName] = useState(ws.user.name);
  const fileRef = useRef<HTMLInputElement>(null);

  const bytes = new Blob([JSON.stringify(ws)]).size;

  return (
    <div className="overlay" onMouseDown={() => setSettingsOpen(false)}>
      <div className="modal wide" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <Icon name="settings" size={17} />
          <span style={{ flex: 1, color: 'var(--txt)', fontSize: 15 }}>Настройки Org</span>
          <button className="icon-btn" onClick={() => setSettingsOpen(false)}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '64vh', padding: '4px 0 12px' }}>
          <div className="form-row">
            <label>Имя пользователя</label>
            <input value={name} onChange={(event) => setName(event.target.value)} onBlur={() => {
              const trimmed = name.trim() || 'Гость';
              setName(trimmed);
              if (trimmed !== ws.user.name) {
                setUserName(trimmed);
                toast('Имя сохранено');
              }
            }} />
          </div>

          <div className="panel-section" style={{ margin: '12px 18px 0' }}>
            <h4>Рабочее пространство</h4>
            <div className="stat-label" style={{ marginBottom: 10 }}>
              {ws.notes.length} заметок · {ws.canvases.length} канвасов · {ws.tasks.length} задач ·{' '}
              {(bytes / 1024).toFixed(1)} КБ данных в локальном хранилище браузера
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => { exportJson(); toast('Файл рабочего пространства сохранён'); }}>
                <Icon name="download" size={15} />
                Экспорт JSON
              </button>
              <button className="btn" onClick={() => fileRef.current?.click()}>
                <Icon name="upload" size={15} />
                Импорт JSON
              </button>
              <button
                className="btn"
                onClick={() => {
                  resetDemo();
                  toast('Демо-данные восстановлены');
                }}
              >
                <Icon name="refresh" size={15} />
                Сбросить к демо
              </button>
            </div>
            <p className="stat-label" style={{ marginTop: 10 }}>
              Org работает локально: данные хранятся в этом браузере и не отправляются на сервер.
              Экспортируй JSON, чтобы перенести пространство на другое устройство.
            </p>
          </div>

          <div className="panel-section" style={{ margin: '18px 18px 0' }}>
            <h4>Горячие клавиши</h4>
            {SHORTCUTS.map((item) => (
              <div
                key={item.keys}
                style={{ display: 'flex', gap: 12, padding: '4px 0', fontSize: 12.5, color: 'var(--txt-2)' }}
              >
                <span className="chip" style={{ minWidth: 168, justifyContent: 'center' }}>
                  {item.keys}
                </span>
                <span>{item.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-foot">
          <span>Org · структурируй мысли, визуализируй идеи, делай больше</span>
          <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={() => setSettingsOpen(false)}>
            Готово
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            try {
              await importJson(file);
              toast('Рабочее пространство загружено');
              setSettingsOpen(false);
            } catch {
              toast('Не удалось прочитать файл');
            }
          }}
        />
      </div>
    </div>
  );
}
