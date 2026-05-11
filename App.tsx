import { useState } from 'react';
import { useLiff } from './hooks/useLiff';
import { MemberPage } from './pages/MemberPage';
import { AdminPage } from './pages/AdminPage';

type Tab = 'member' | 'admin';

export default function App() {
  const { userInfo, loading, error } = useLiff();
  const [tab, setTab] = useState<Tab>('member');

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
        <span style={styles.headerTitle}>⚽ 練習管理</span>
      </header>

      {/* タブ（管理者のみ表示） */}
      {userInfo.isAdmin && (
        <div style={styles.tabBar}>
          {(['member', 'admin'] as Tab[]).map(t => (
            <button
              key={t}
              style={{ ...styles.tabBtn, ...(tab === t ? styles.tabBtnActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t === 'member' ? '📋 参加登録' : '🛠 管理'}
            </button>
          ))}
        </div>
      )}

      {/* コンテンツ */}
      <main style={styles.main}>
        {tab === 'member' ? (
          <MemberPage userInfo={userInfo} />
        ) : (
          <AdminPage userInfo={userInfo} />
        )}
      </main>
    </div>
  );
}

const styles = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const },
  header: {
    background: '#06C755',
    padding: '14px 16px',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  } as React.CSSProperties,
  headerTitle: { letterSpacing: 0.5 },
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
