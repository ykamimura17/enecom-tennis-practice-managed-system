import { useState, useEffect, useCallback } from 'react';
import { useLiff } from './hooks/useLiff';
import { MemberPage } from './pages/MemberPage';
import { AdminPage } from './pages/AdminPage';
import { NotificationPanel } from './components/NotificationPanel';
import { api } from './api/client';
import { Practice } from './types';

type Tab = 'member' | 'admin';

const SEEN_KEY = 'seen_practice_ids';

function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
}

export default function App() {
  const { userInfo, loading, error } = useLiff();
  const [tab, setTab] = useState<Tab>('member');
  const [practices, setPractices] = useState<Practice[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(loadSeenIds);
  const [showNotifications, setShowNotifications] = useState(false);

  const hasUnread = practices.some(p => !seenIds.has(p.id));

  const loadPractices = useCallback(async () => {
    try {
      const list = await api.getPractices();
      setPractices(list);
    } catch {
      // 取得失敗時は通知なし
    }
  }, []);

  useEffect(() => {
    if (userInfo) loadPractices();
  }, [userInfo, loadPractices]);

  const handleOpenNotifications = () => {
    setShowNotifications(v => {
      if (!v) {
        // パネルを開くときに全件既読にする
        const next = new Set([...seenIds, ...practices.map(p => p.id)]);
        setSeenIds(next);
        saveSeenIds(next);
      }
      return !v;
    });
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 12, color: '#888', fontSize: 14 }}>読み込み中...</p>
      </div>
    );
  }

  if (error || !userInfo) {
    return (
      <div style={styles.center}>
        <p style={{ color: '#e53e3e', fontSize: 14 }}>{error ?? 'ログインが必要です'}</p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* ヘッダー */}
      <header style={styles.header}>
        <span style={styles.headerTitle}>🎾 練習管理</span>
        <div style={styles.headerRight}>
          <button style={styles.bellBtn} onClick={handleOpenNotifications} aria-label="お知らせ">
            <BellIcon />
            {hasUnread && <span style={styles.redDot} />}
          </button>
        </div>
      </header>

      {/* 通知パネル */}
      {showNotifications && (
        <div style={styles.panelWrapper}>
          <NotificationPanel
            practices={practices}
            seenIds={seenIds}
            onClose={() => setShowNotifications(false)}
          />
        </div>
      )}

      {/* タブ（管理者のみ表示） */}
      {userInfo.isAdmin && (
        <div style={styles.tabBar}>
          {(['member', 'admin'] as Tab[]).map(t => (
            <button
              key={t}
              style={{ ...styles.tabBtn, ...(tab === t ? styles.tabBtnActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t === 'member' ? '参加登録' : '管理'}
            </button>
          ))}
        </div>
      )}

      {/* コンテンツ */}
      <main style={styles.main}>
        {tab === 'member' ? (
          <MemberPage userInfo={userInfo} />
        ) : (
          <AdminPage userInfo={userInfo} onPracticeCreated={loadPractices} />
        )}
      </main>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

const styles = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const },
  header: {
    position: 'relative' as const,
    background: '#06C755',
    padding: '14px 16px',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  headerTitle: { letterSpacing: 0.5 },
  headerRight: { display: 'flex', alignItems: 'center' },
  bellBtn: {
    position: 'relative' as const,
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,
  redDot: {
    position: 'absolute' as const,
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#e53e3e',
    border: '1.5px solid #06C755',
  } as React.CSSProperties,
  panelWrapper: {
    position: 'relative' as const,
    zIndex: 200,
  },
  tabBar: {
    display: 'flex',
    background: '#fff',
    borderBottom: '1px solid #eee',
  } as React.CSSProperties,
  tabBtn: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    background: 'transparent',
    fontSize: 14,
    color: '#888',
    cursor: 'pointer',
    fontWeight: 'bold',
    borderBottom: '2px solid transparent',
  } as React.CSSProperties,
  tabBtnActive: {
    color: '#06C755',
    borderBottom: '2px solid #06C755',
  } as React.CSSProperties,
  main: { flex: 1, background: '#f5f5f5' } as React.CSSProperties,
  center: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #eee',
    borderTop: '3px solid #06C755',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  } as React.CSSProperties,
};
