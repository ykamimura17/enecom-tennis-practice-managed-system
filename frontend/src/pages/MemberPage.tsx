import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { Practice, Attendance, AttendanceStatus, UserInfo } from '../types';
import { PracticeCard } from '../components/PracticeCard';

interface Props {
  userInfo: UserInfo;
}

const PAST_PAGE_SIZE = 10;

export function MemberPage({ userInfo }: Props) {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [attendances, setAttendances] = useState<Record<string, Attendance>>({});
  const [loadingPracticeId, setLoadingPracticeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visiblePastCount, setVisiblePastCount] = useState(PAST_PAGE_SIZE);

  const load = useCallback(async () => {
    try {
      const list = await api.getPractices();
      setPractices(list);
      // 全練習の自分の出欠を取得
      const results = await Promise.all(list.map(p => api.getAttendance(p.id)));
      const map: Record<string, Attendance> = {};
      list.forEach((p, i) => {
        const mine = results[i].find(a => a.lineUserId === userInfo.userId);
        if (mine) map[p.id] = mine;
      });
      setAttendances(map);
    } catch (e) {
      setError('データの読み込みに失敗しました');
    }
  }, [userInfo.userId]);

  useEffect(() => { load(); }, [load]);

  const handleChangeStatus = async (practiceId: string, status: AttendanceStatus) => {
    setLoadingPracticeId(practiceId);
    try {
      const updated = await api.upsertAttendance(
        userInfo.userId, userInfo.displayName, practiceId, status
      );
      setAttendances(prev => ({ ...prev, [practiceId]: updated }));
    } catch {
      alert('登録に失敗しました');
    } finally {
      setLoadingPracticeId(null);
    }
  };

  // 今日以降を上に、過去を下に
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = practices.filter(p => p.date >= today);
  const past = practices.filter(p => p.date < today).reverse();

  return (
    <div style={styles.container}>
      <div style={styles.greeting}>
        <img
          src={userInfo.pictureUrl ?? 'https://profile.line-scdn.net/0h00000000000000000000000000000000'}
          style={styles.avatar}
          alt=""
        />
        <span>こんにちは、{userInfo.displayName}さん</span>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <h2 style={styles.sectionTitle}>今後の練習</h2>
      {upcoming.length === 0 && <p style={styles.empty}>予定されている練習はありません</p>}
      {upcoming.map(p => (
        <PracticeCard
          key={p.id}
          practice={p}
          myAttendance={attendances[p.id]}
          onChangeStatus={handleChangeStatus}
          loading={loadingPracticeId === p.id}
        />
      ))}

      {past.length > 0 && (
        <>
          <h2 style={{ ...styles.sectionTitle, marginTop: 24 }}>過去の練習</h2>
          {past.slice(0, visiblePastCount).map(p => (
            <PracticeCard
              key={p.id}
              practice={p}
              myAttendance={attendances[p.id]}
              onChangeStatus={handleChangeStatus}
              loading={loadingPracticeId === p.id}
              readonly
            />
          ))}
          {visiblePastCount < past.length && (
            <button
              style={styles.moreBtn}
              onClick={() => setVisiblePastCount(c => c + PAST_PAGE_SIZE)}
            >
              もっと見る（残り{past.length - visiblePastCount}件）
            </button>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: { padding: 16, paddingBottom: 40 },
  greeting: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  } as React.CSSProperties,
  avatar: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' as const },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  empty: { fontSize: 14, color: '#888', textAlign: 'center' as const, padding: 24 },
  error: {
    background: '#fff0f0',
    color: '#e53e3e',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  } as React.CSSProperties,
  moreBtn: {
    display: 'block',
    width: '100%',
    padding: '12px 0',
    border: '1px solid #ddd',
    borderRadius: 8,
    background: '#fff',
    fontSize: 14,
    color: '#555',
    cursor: 'pointer',
    marginTop: 4,
  } as React.CSSProperties,
};
