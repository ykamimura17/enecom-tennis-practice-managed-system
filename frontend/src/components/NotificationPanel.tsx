import { useEffect, useRef } from 'react';
import { Practice } from '../types';

interface Props {
  practices: Practice[];
  seenIds: Set<string>;
  onClose: () => void;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${dateStr.replace(/-/g, '/')}（${WEEKDAYS[d.getDay()]}）`;
}

export function NotificationPanel({ practices, seenIds, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const sorted = [...practices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div ref={panelRef} style={styles.panel}>
      <div style={styles.heading}>お知らせ</div>
      {sorted.length === 0 ? (
        <p style={styles.empty}>お知らせはありません</p>
      ) : (
        <ul style={styles.list}>
          {sorted.map(p => {
            const isNew = !seenIds.has(p.id);
            return (
              <li key={p.id} style={{ ...styles.item, ...(isNew ? styles.itemNew : {}) }}>
                <div style={styles.itemHeader}>
                  <span style={styles.itemTitle}>{p.title}</span>
                  {isNew && <span style={styles.newDot} />}
                </div>
                <div style={styles.itemSub}>
                  {formatDate(p.date)} {p.time}〜 / {p.location}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const styles = {
  panel: {
    position: 'absolute' as const,
    top: 52,
    right: 8,
    width: 300,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 200,
    overflow: 'hidden',
  },
  heading: {
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    borderBottom: '1px solid #eee',
  },
  empty: {
    padding: 20,
    fontSize: 13,
    color: '#888',
    textAlign: 'center' as const,
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    maxHeight: 360,
    overflowY: 'auto' as const,
  },
  item: {
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
  },
  itemNew: {
    background: '#f6fff9',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  newDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#e53e3e',
    flexShrink: 0,
  } as React.CSSProperties,
  itemSub: {
    fontSize: 12,
    color: '#888',
  },
};
