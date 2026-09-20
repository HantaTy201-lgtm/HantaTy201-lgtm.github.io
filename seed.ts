import type { Canvas, KnowledgeBase, Note, Space, Tab, Task, Workspace } from '../types';
import { daysFromNow, uid } from '../lib/utils';

const now = new Date().toISOString();

export const SPACES: Space[] = [
  { id: 'sp_personal', name: 'Личное', tone: 'violet' },
  { id: 'sp_work', name: 'Работа', tone: 'sky' },
  { id: 'sp_projects', name: 'Проекты', tone: 'amber' },
  { id: 'sp_study', name: 'Обучение', tone: 'emerald' },
  { id: 'sp_inspire', name: 'Вдохновение', tone: 'rose' },
];

function note(
  id: string,
  title: string,
  body: string,
  spaceId: string,
  folder: string,
  tags: string[],
  updatedAt = now,
): Note {
  return { id, title, body, spaceId, folder, tags, createdAt: updatedAt, updatedAt };
}

export const NOTES: Note[] = [
  note(
    'n_strategy',
    'Продуктовая стратегия',
    `Org — это не просто заметки. Это пространство, где ты можешь думать, планировать, визуализировать и работать над своими целями. Мы объединяем лучшие практики из Obsidian и Miro, чтобы дать тебе инструмент, который действительно помогает действовать.

## Ключевые принципы

- **Простота** — минимум интерфейса, максимум скорости
- **Визуальность** — связи между идеями видно сразу
- **Гибкость** — свои структуры вместо жёстких шаблонов
- **Свобода** — данные принадлежат тебе

Связанные материалы: [[Конкуренты]], [[Пользовательские сценарии]], [[Идеи для фич]].

> Лучшие идеи приходят не тогда, когда ты их ищешь, а когда ты готов их заметить.

#продукт #стратегия #org`,
    'sp_projects',
    'Продукт',
    ['продукт', 'стратегия', 'org'],
  ),
  note(
    'n_competitors',
    'Конкуренты',
    `Разбор соседних инструментов и того, что забираем себе.

- **Obsidian** — сила в локальных связях и графе. Слабость: визуальная работа с идеями ограничена.
- **Miro** — бесконечный канвас и совместная работа. Слабость: заметки живут отдельно от доски.
- **Notion** — базы и структура. Слабость: тяжёлый и медленный на больших объёмах.

Вывод: Org соединяет граф связей, канвас и базы в одном пространстве. См. [[Продуктовая стратегия]].

#продукт #исследование`,
    'sp_projects',
    'Продукт',
    ['продукт', 'исследование'],
  ),
  note(
    'n_scenarios',
    'Пользовательские сценарии',
    `Кто и зачем открывает Org.

- **Основатель** — собрать стратегию в одном месте и не потерять договорённости
- **Продакт** — связать исследование, фичи и метрики
- **Студент** — вести конспекты и строить карту курса

Основной сценарий: [[Продуктовая стратегия]] → [[Идеи для фич]] → [[MVP]].

#продукт #ux`,
    'sp_projects',
    'Продукт',
    ['продукт', 'ux'],
  ),
  note(
    'n_features',
    'Идеи для фич',
    `Что хочется добавить в продукт.

- [x] Продукт для заметок и канвасов
- [ ] Интеграция с календарем
- [ ] Совместная работа
- [ ] AI-ассистент

Приоритеты сверяем с [[MVP]] и [[Продуктовая стратегия]].

#продукт #фичи`,
    'sp_projects',
    'Продукт',
    ['продукт', 'фичи'],
  ),
  note(
    'n_mvp',
    'MVP',
    `Границы первой версии.

- Заметки с wiki-ссылками и бэклинками
- Канвас с узлами и связями
- Задачи и базы
- Локальное хранение и экспорт

Дальше — синхронизация и совместная работа, см. [[Идеи для фич]].

#продукт #план`,
    'sp_projects',
    'План',
    ['продукт', 'план'],
  ),
  note(
    'n_design',
    'Дизайн-система',
    `Тёмная тема, акцент — фиолетовый, спокойные поверхности и мягкие тени.

- Радиусы: 8 / 10 / 14
- Акценты: фиолетовый, изумрудный, янтарный, небесный
- Типографика: Inter, 13–14 базовый кегль

Применяем в [[MVP]].

#дизайн #ui`,
    'sp_work',
    'Дизайн',
    ['дизайн', 'ui'],
  ),
  note(
    'n_onboarding',
    'Онбординг',
    `Первый запуск должен объяснять ценность за 60 секунд.

1. Создаём демо-канвас с примерами
2. Показываем связь заметка → узел
3. Подсказываем горячие клавиши

См. [[Дизайн-система]].

#продукт #ux`,
    'sp_work',
    'Продукт',
    ['продукт', 'ux'],
  ),
  note(
    'n_retro',
    'Ретроспектива квартала',
    `Что сработало: фокус на связях между идеями.

Что не сработало: слишком много параллельных задач.

Решение: ограничить работу в процессе и планировать через [[План на квартал]].

#команда #ретро`,
    'sp_work',
    'Команда',
    ['команда', 'ретро'],
  ),
  note(
    'n_plan',
    'План на квартал',
    `- Q1 — MVP
- Q2 — Публичный релиз
- Q3 — Масштабирование
- Q4 — Новые рынки

#план #продукт`,
    'sp_personal',
    'План',
    ['план', 'продукт'],
  ),
  note(
    'n_inspire',
    'Вдохновение',
    `> Лучшие идеи приходят не тогда, когда ты их ищешь, а когда ты готов их заметить.

Собираю сюда цитаты, ссылки и наблюдения. См. [[Продуктовая стратегия]].

#вдохновение #идеи`,
    'sp_inspire',
    'Заметки',
    ['вдохновение', 'идеи'],
  ),
  note(
    'n_reading',
    'Список чтения',
    `- «Thinking in Systems» — Донелла Медоуз
- «Shape Up» — Райан Сингер
- «How to Take Smart Notes» — Зонке Аренс

#обучение`,
    'sp_study',
    'Обучение',
    ['обучение'],
  ),
];

const NODES: Canvas['nodes'] = [
  {
    id: 'cn_ideas',
    x: 60,
    y: 250,
    w: 232,
    h: 152,
    title: 'Идеи',
    icon: '💡',
    tone: 'amber',
    kind: 'note',
    bullets: [
      'Продукт для заметок + канвасы',
      'Интеграция с календарем',
      'Совместная работа',
      'AI-ассистент',
    ],
    items: [],
    links: [],
    noteId: 'n_features',
  },
  {
    id: 'cn_projects',
    x: 430,
    y: 96,
    w: 226,
    h: 158,
    title: 'Проекты',
    icon: '📁',
    tone: 'violet',
    kind: 'checklist',
    bullets: [],
    items: [
      { id: uid('ci'), text: 'Доработать MVP', done: false },
      { id: uid('ci'), text: 'Запустить бету', done: false },
      { id: uid('ci'), text: 'Собрать фидбек', done: false },
      { id: uid('ci'), text: 'Масштабирование', done: false },
    ],
    links: [],
    noteId: 'n_mvp',
  },
  {
    id: 'cn_org',
    x: 336,
    y: 300,
    w: 250,
    h: 112,
    title: 'Org',
    icon: '',
    tone: 'violet',
    kind: 'text',
    bullets: ['Заметки. Канвасы. Люди.'],
    items: [],
    links: [],
    noteId: 'n_strategy',
  },
  {
    id: 'cn_inspire',
    x: 686,
    y: 276,
    w: 244,
    h: 140,
    title: 'Вдохновение',
    icon: '✳',
    tone: 'emerald',
    kind: 'quote',
    bullets: ['«Лучшие идеи приходят не тогда, когда ты их ищешь, а когда ты готов их заметить»'],
    items: [],
    links: [],
    noteId: 'n_inspire',
  },
  {
    id: 'cn_plan',
    x: 150,
    y: 470,
    w: 240,
    h: 150,
    title: 'План',
    icon: '📅',
    tone: 'sky',
    kind: 'checklist',
    bullets: [],
    items: [
      { id: uid('ci'), text: 'Q1 — MVP', done: false },
      { id: uid('ci'), text: 'Q2 — Публичный релиз', done: false },
      { id: uid('ci'), text: 'Q3 — Масштабирование', done: false },
      { id: uid('ci'), text: 'Q4 — Новые рынки', done: false },
    ],
    links: [],
    noteId: 'n_plan',
  },
  {
    id: 'cn_links',
    x: 556,
    y: 480,
    w: 224,
    h: 146,
    title: 'Связи',
    icon: '🔗',
    tone: 'violet',
    kind: 'links',
    bullets: [],
    items: [],
    links: [
      { id: uid('nl'), from: 'Продукт', to: 'Маркетинг' },
      { id: uid('nl'), from: 'UX', to: 'Разработка' },
      { id: uid('nl'), from: 'Бизнес', to: 'Команда' },
    ],
  },
];

export const CANVASES: Canvas[] = [
  {
    id: 'cv_main',
    name: 'Мой канвас',
    description: 'Здесь рождаются большие идеи. Объединяй заметки, создавай связи, планируй и визуализируй.',
    spaceId: 'sp_projects',
    nodes: NODES,
    edges: [
      { id: 'ce_1', from: 'cn_ideas', to: 'cn_projects', tone: 'violet' },
      { id: 'ce_2', from: 'cn_projects', to: 'cn_org', tone: 'violet' },
      { id: 'ce_3', from: 'cn_ideas', to: 'cn_org', tone: 'violet' },
      { id: 'ce_4', from: 'cn_org', to: 'cn_inspire', tone: 'emerald' },
      { id: 'ce_5', from: 'cn_org', to: 'cn_plan', tone: 'sky' },
      { id: 'ce_6', from: 'cn_org', to: 'cn_links', tone: 'violet' },
    ],
    viewport: { x: -20, y: -60, zoom: 0.92 },
    grid: true,
    updatedAt: now,
  },
];

export const TASKS: Task[] = [
  {
    id: uid('t'),
    title: 'Подготовить презентацию',
    status: 'done',
    priority: 'high',
    due: daysFromNow(-2),
    spaceId: 'sp_work',
    noteId: 'n_strategy',
    canvasId: 'cv_main',
    createdAt: now,
  },
  {
    id: uid('t'),
    title: 'Собрать команду',
    status: 'backlog',
    priority: 'med',
    due: daysFromNow(4),
    spaceId: 'sp_work',
    noteId: 'n_strategy',
    createdAt: now,
  },
  {
    id: uid('t'),
    title: 'Провести интервью с пользователями',
    status: 'progress',
    priority: 'high',
    due: daysFromNow(1),
    spaceId: 'sp_projects',
    noteId: 'n_scenarios',
    createdAt: now,
  },
  {
    id: uid('t'),
    title: 'Оформить лендинг',
    status: 'backlog',
    priority: 'med',
    due: daysFromNow(7),
    spaceId: 'sp_projects',
    createdAt: now,
  },
  {
    id: uid('t'),
    title: 'Спринт-ревью',
    status: 'review',
    priority: 'low',
    due: daysFromNow(2),
    spaceId: 'sp_work',
    noteId: 'n_retro',
    createdAt: now,
  },
  {
    id: uid('t'),
    title: 'Собрать прототип канваса',
    status: 'progress',
    priority: 'high',
    due: daysFromNow(3),
    spaceId: 'sp_projects',
    noteId: 'n_mvp',
    canvasId: 'cv_main',
    createdAt: now,
  },
  {
    id: uid('t'),
    title: 'Прочитать Shape Up',
    status: 'backlog',
    priority: 'low',
    due: daysFromNow(12),
    spaceId: 'sp_study',
    noteId: 'n_reading',
    createdAt: now,
  },
];

export const BASES: KnowledgeBase[] = [
  {
    id: 'kb_main',
    name: 'База знаний',
    icon: 'database',
    view: 'table',
    rows: [
      {
        id: uid('r'),
        name: 'Продуктовая стратегия',
        type: 'Документ',
        status: 'Актуально',
        spaceId: 'sp_projects',
        tags: ['продукт', 'стратегия'],
        updatedAt: now,
        noteId: 'n_strategy',
      },
      {
        id: uid('r'),
        name: 'Пользовательские сценарии',
        type: 'Исследование',
        status: 'Актуально',
        spaceId: 'sp_projects',
        tags: ['ux'],
        updatedAt: now,
        noteId: 'n_scenarios',
      },
      {
        id: uid('r'),
        name: 'Конкуренты',
        type: 'Исследование',
        status: 'В работе',
        spaceId: 'sp_projects',
        tags: ['исследование'],
        updatedAt: now,
        noteId: 'n_competitors',
      },
      {
        id: uid('r'),
        name: 'Дизайн-система',
        type: 'Гайд',
        status: 'В работе',
        spaceId: 'sp_work',
        tags: ['дизайн', 'ui'],
        updatedAt: now,
        noteId: 'n_design',
      },
      {
        id: uid('r'),
        name: 'Онбординг',
        type: 'Процесс',
        status: 'Черновик',
        spaceId: 'sp_work',
        tags: ['ux'],
        updatedAt: now,
        noteId: 'n_onboarding',
      },
      {
        id: uid('r'),
        name: 'Ретроспектива квартала',
        type: 'Процесс',
        status: 'Архив',
        spaceId: 'sp_work',
        tags: ['команда'],
        updatedAt: now,
        noteId: 'n_retro',
      },
    ],
  },
];

export const TABS: Tab[] = [
  { id: uid('tab'), kind: 'canvas', refId: 'cv_main', title: 'Мой канвас' },
  { id: uid('tab'), kind: 'home', title: 'Главная' },
];

export function createSeed(): Workspace {
  return {
    version: 1,
    user: { name: 'Alex' },
    spaces: SPACES,
    notes: NOTES,
    canvases: CANVASES,
    tasks: TASKS,
    bases: BASES,
    tabs: TABS,
    activeTabId: TABS[0].id,
    activeSpaceId: 'all',
  };
}
