import { useState, useEffect, useCallback } from 'react';
import liff from '@line/liff';
import { api } from '../api/client';
import { Practice, PracticeStatus, UserInfo } from '../types';
import { AttendanceSummary } from '../components/AttendanceSummary';
import { CreatePracticeForm } from '../components/CreatePracticeForm';

interface Props {
  userInfo: UserInfo;
  onPracticeCreated?: () => void;
}

export function AdminPage({ userInfo, onPracticeCreated }: Props) {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await api.getPractices();
      setPractices([...list].reverse()); // 新しい順
    } catch {
      setError('データの読み込みに失敗しました');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = (practiceId: string, status: PracticeStatus) => {
    setPractices(prev => prev.map(p => p.id === practiceId ? { ...p, status } : p));
  };

  const handleCreate = async (data: Omit<Practice, 'id' | 'createdAt' | 'status'>) => {
    await api.createPractice(userInfo.userId, data);
    await load();
    onPracticeCreated?.();
  };

  const handleAnnounce = async (practiceId: string) => {
    const { message } = await api.announcePractice(userInfo.userId, practiceId);
    if (import.meta.env.VITE_MOCK_MODE === 'true') {
      alert('[モック] shareTargetPicker をスキップしました');
      return;
    }
    if (!liff.isApiAvailable('shareTargetPicker')) {
      alert('この機能はLINEアプリ内でのみ使用できます');
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await liff.shareTargetPicker([message as any]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>管理画面</h1>
        <button style={styles.addBtn} onClick={() => setShowForm(true)}>
          ＋ 練習を追加
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {practices.length === 0 && (
        <p style={styles.empty}>練習がまだ登録されていません</p>
      )}

      {practices.map(p => (
        <AttendanceSummary
          key={p.id}
          practice={p}
          userId={userInfo.userId}
          onAnnounce={handleAnnounce}
          onStatusChange={handleStatusChange}
        />
      ))}

      {showForm && (
        <CreatePracticeForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

const styles = {
  container: { padding: 16, paddingBottom: 40 },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  } as React.CSSProperties,
  heading: { fontSize: 18, fontWeight: 'bold' },
  addBtn: {
    background: '#06C755',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  empty: { fontSize: 14, color: '#888', textAlign: 'center' as const, padding: 24 },
  error: {
    background: '#fff0f0',
    color: '#e53e3e',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  } as React.CSSProperties,
};
