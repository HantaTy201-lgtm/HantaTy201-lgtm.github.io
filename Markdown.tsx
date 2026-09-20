import { Fragment, type ReactNode } from 'react';

interface Props {
  text: string;
  resolve?: (title: string) => string | undefined;
  onOpenNote?: (id: string) => void;
  onCreateNote?: (title: string) => void;
  onTag?: (tag: string) => void;
}

const INLINE =
  /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[\[[^\]\n]+\]\]|\[[^\]\n]+\]\([^)\n]+\)|#[A-Za-zА-Яа-яЁё0-9_-]+)/g;

function renderInline(text: string, props: Props, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE).filter((part) => part !== '' && part !== undefined);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const title = part.slice(2, -2).trim();
      const targetId = props.resolve?.(title);
      return (
        <span
          key={key}
          className={`wikilink${targetId ? '' : ' missing'}`}
          title={targetId ? 'Открыть заметку' : 'Заметки пока нет — создать'}
          onClick={() => {
            if (targetId) props.onOpenNote?.(targetId);
            else props.onCreateNote?.(title);
          }}
        >
          {title}
        </span>
      );
    }
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (linkMatch) {
      return (
        <a key={key} href={linkMatch[2]} target="_blank" rel="noreferrer">
          {linkMatch[1]}
        </a>
      );
    }
    if (part.startsWith('#') && part.length > 1) {
      return (
        <span key={key} className="tag" onClick={() => props.onTag?.(part.slice(1))}>
          {part}
        </span>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function Markdown({ text, resolve, onOpenNote, onCreateNote, onTag }: Props) {
  const props: Props = { text, resolve, onOpenNote, onCreateNote, onTag };
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.trim().startsWith('```')) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre key={`code-${index}`}>
          <code>{code.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const content = renderInline(heading[2], props, `h${index}`);
      if (level === 1) blocks.push(<h1 key={`h-${index}`}>{content}</h1>);
      else if (level === 2) blocks.push(<h2 key={`h-${index}`}>{content}</h2>);
      else blocks.push(<h3 key={`h-${index}`}>{content}</h3>);
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push(<hr key={`hr-${index}`} />);
      index += 1;
      continue;
    }

    if (line.trim().startsWith('> ')) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('> ')) {
        quote.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push(
        <blockquote key={`q-${index}`}>{renderInline(quote.join(' '), props, `q${index}`)}</blockquote>,
      );
      continue;
    }

    if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && /^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[index])) {
        const raw = lines[index];
        const checked = /\[[xX]\]/.test(raw);
        const content = raw.replace(/^\s*[-*]\s+\[[ xX]\]\s+/, '');
        items.push(
          <li key={`t-${index}`} className="md-task">
            <span className={`checkbox${checked ? ' on' : ''}`} style={{ marginTop: 2 }}>
              {checked ? '✓' : ''}
            </span>
            <span style={checked ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>
              {renderInline(content, props, `t${index}`)}
            </span>
          </li>,
        );
        index += 1;
      }
      blocks.push(<ul key={`ul-${index}`}>{items}</ul>);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index]) && !/\[[ xX]\]/.test(lines[index])) {
        const content = lines[index].replace(/^\s*[-*]\s+/, '');
        items.push(<li key={`li-${index}`}>{renderInline(content, props, `li${index}`)}</li>);
        index += 1;
      }
      blocks.push(<ul key={`ul-${index}`}>{items}</ul>);
      continue;
    }

    if (line.trim() === '') {
      index += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== '' &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith('> ') &&
      !lines[index].trim().startsWith('```')
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={`p-${index}`}>{renderInline(paragraph.join(' '), props, `p${index}`)}</p>);
  }

  return <div className="md">{blocks}</div>;
}
