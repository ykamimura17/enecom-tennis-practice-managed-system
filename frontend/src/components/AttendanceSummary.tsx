import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Practice, PracticeStatus, Attendance } from '../types';

interface Props {
  practice: Practice;
  userId: string;
  onFetchAnnounce: (practiceId: string) => Promise<Record<string, unknown>>;
  onShare: (message: Record<string, unknown>) => Promise<void>;
  onStatusChange: (practiceId: string, status: PracticeStatus) => void;
  onEdit: (practice: Practice) => void;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const CANCEL_OPTIONS: { value: Exclude<PracticeStatus, '開催'>; label: string }[] = [
  { value: '雨天中止', label: '雨天中止' },
  { value: '中止',    label: 'その他の理由で中止' },
];

const STATUS_BADGE: Record<PracticeStatus, { label: string; style: React.CSSProperties }> = {
  '開催':    { label: '開催',    style: { background: '#e6f7ed', color: '#06C755' } },
  '雨天中止': { label: '雨天中止', style: { background: '#f0f0f0', color: '#666' } },
  '中止':    { label: '中止',    style: { background: '#f0f0f0', color: '#666' } },
};

export function AttendanceSummary({ practice, userId, onFetchAnnounce, onShare, onStatusChange, onEdit }: Props) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [confirmingAnnounce, setConfirmingAnnounce] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<Record<string, unknown> | null>(null);
  const [selectingCancel, setSelectingCancel] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [togglingActualId, setTogglingActualId] = useState<string | null>(null);

  useEffect(() => {
    api.getAttendance(practice.id).then(setAttendances).catch(() => {});
  }, [practice.id]);

  const count = (s: string) => attendances.filter(a => a.status === s).length;
  const carpoolCount = attendances.filter(a => a.status === '参加' && a.carpool === '必要').length;
  const actualCount = attendances.filter(a => a.actual).length;

  const handleToggleActual = async (a: Attendance) => {
    setTogglingActualId(a.id);
    try {
      const updated = await api.updateActual(userId, a.id, !a.actual);
      setAttendances(prev => prev.map(r => r.id === a.id ? updated : r));
    } catch {
      alert('更新に失敗しました');
    } finally {
      setTogglingActualId(null);
    }
  };

  const d = new Date(practice.date);
  const formattedDate = `${practice.date.replace(/-/g, '/')}（${WEEKDAYS[d.getDay()]}）`;

  const isCancelled = practice.status !== '開催';
  const badge = STATUS_BADGE[practice.status];

  // 「LINE送信」タップ → API呼び出しでメッセージ先取り → 確認UI表示
  const handleAnnounceClick = async () => {
    setAnnouncing(true);
    try {
      const message = await onFetchAnnounce(practice.id);
      setPendingMessage(message);
      setConfirmingAnnounce(true);
    } catch {
      alert('メッセージの取得に失敗しました');
    } finally {
      setAnnouncing(false);
    }
  };

  // 「送信する」タップ → async を使わず同期的に shareTargetPicker を起動する
  const handleAnnounceConfirm = () => {
    if (!pendingMessage) return;
    const message = pendingMessage;
    setConfirmingAnnounce(false);
    setPendingMessage(null);
    // await を挟まずに起動することで iOS のユーザー操作コンテキストを維持する
    onShare(message).catch(() => alert('送信に失敗しました'));
  };

  const handleSetStatus = async (next: PracticeStatus) => {
    setSelectingCancel(false);
    setUpdatingStatus(true);
    try {
      await api.updatePracticeStatus(userId, practice.id, next);
      onStatusChange(practice.id, next);
    } catch {
      alert('変更に失敗しました');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div style={{ ...styles.card, ...(isCancelled ? styles.cardCancelled : {}) }}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <span style={styles.title}>{practice.title}</span>
          {isCancelled && (
            <span style={{ ...styles.statusBadgeChip, ...badge.style }}>{badge.label}</span>
          )}
        </div>

        <div style={styles.actions}>
          {isCancelled ? (
            <button
              style={styles.restoreBtn}
              onClick={() => handleSetStatus('開催')}
              disabled={updatingStatus}
            >
              {updatingStatus ? '変更中...' : '開催に戻す'}
            </button>
          ) : (
            <>
              <button style={styles.editBtn} onClick={() => onEdit(practice)}>
                編集
              </button>
              <button
                style={styles.cancelBtn}
                onClick={() => setSelectingCancel(v => !v)}
                disabled={updatingStatus}
              >
                中止
              </button>
              <button
                style={styles.announceBtn}
                onClick={handleAnnounceClick}
                disabled={announcing}
              >
                {announcing ? '取得中...' : 'LINE送信'}
              </button>
            </>
          )}
        </div>
      </div>
      <div style={styles.sub}>{formattedDate} {practice.time}〜{practice.endTime ?? ''} / {practice.location}</div>

      {/* LINE送信確認（インライン展開） */}
      {confirmingAnnounce && (
        <div style={styles.cancelPicker}>
          <span style={styles.cancelPickerLabel}>LINEグループに練習案内を送信しますか？</span>
          <div style={styles.cancelPickerBtns}>
            <button style={styles.announceConfirmBtn} onClick={handleAnnounceConfirm}>
              送信する
            </button>
            <button style={styles.cancelAbortBtn} onClick={() => setConfirmingAnnounce(false)}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 中止理由選択（インライン展開） */}
      {selectingCancel && (
        <div style={styles.cancelPicker}>
          <span style={styles.cancelPickerLabel}>中止の理由</span>
          <div style={styles.cancelPickerBtns}>
            {CANCEL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                style={styles.cancelOptionBtn}
                onClick={() => handleSetStatus(opt.value)}
              >
                {opt.label}
              </button>
            ))}
            <button style={styles.cancelAbortBtn} onClick={() => setSelectingCancel(false)}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 出欠集計 */}
      <div style={styles.summary} onClick={() => setExpanded(v => !v)}>
        <span style={styles.badge}>参加 {count('参加')}人</span>
        <span style={{ ...styles.badge, ...styles.badgeRed }}>不参加 {count('不参加')}人</span>
        <span style={{ ...styles.badge, ...styles.badgeGray }}>未回答 {count('未回答')}人</span>
        <span style={{ ...styles.badge, ...styles.badgeBlue }}>配車必要 {carpoolCount}人</span>
        <span style={{ ...styles.badge, ...styles.badgeOrange }}>実来場 {actualCount}人</span>
        <span style={styles.toggle}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={styles.detail}>
          {attendances.length === 0 && <p style={styles.empty}>回答がまだありません</p>}
          {attendances.map(a => (
            <div key={a.id} style={{ ...styles.row, ...(a.actual ? styles.rowActual : {}) }}>
              <span style={styles.name}>{a.displayName}</span>
              <span style={styles.rowBadges}>
                {a.status === '参加' && a.carpool && (
                  <span style={{
                    ...styles.attendanceBadge,
                    ...(a.carpool === '必要' ? styles.carpoolNeed : styles.statusGray),
                  }}>
                    配車{a.carpool}
                  </span>
                )}
                <span style={{
                  ...styles.attendanceBadge,
                  ...(a.status === '参加' ? styles.statusGreen
                    : a.status === '不参加' ? styles.statusRed
                    : styles.statusGray),
                }}>
                  {a.status}
                </span>
                <button
                  style={{ ...styles.actualBtn, ...(a.actual ? styles.actualBtnOn : {}) }}
                  onClick={() => handleToggleActual(a)}
                  disabled={togglingActualId === a.id}
                >
                  {a.actual ? '来場✓' : '来場'}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  } as React.CSSProperties,
  cardCancelled: {
    background: '#fafafa',
    borderLeft: '3px solid #ccc',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  } as React.CSSProperties,
  titleRow: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const, flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  statusBadgeChip: {
    fontSize: 11,
    padding: '2px 7px',
    borderRadius: 4,
    fontWeight: 'normal',
    flexShrink: 0,
  } as React.CSSProperties,
  sub: { fontSize: 12, color: '#888', marginBottom: 12 },
  actions: { display: 'flex', gap: 6, flexShrink: 0, alignItems: 'flex-start' },
  editBtn: {
    border: '1px solid #06C755',
    borderRadius: 8,
    background: '#fff',
    color: '#06C755',
    padding: '5px 10px',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  cancelBtn: {
    border: '1px solid #ccc',
    borderRadius: 8,
    background: '#fff',
    color: '#888',
    padding: '5px 10px',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  restoreBtn: {
    border: '1px solid #06C755',
    borderRadius: 8,
    background: '#fff',
    color: '#06C755',
    padding: '5px 10px',
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  announceBtn: {
    background: '#06C755',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  cancelPicker: {
    background: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 12,
  } as React.CSSProperties,
  cancelPickerLabel: {
    display: 'block',
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  cancelPickerBtns: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
  announceConfirmBtn: {
    border: 'none',
    borderRadius: 8,
    background: '#06C755',
    color: '#fff',
    padding: '6px 16px',
    fontSize: 13,
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  cancelOptionBtn: {
    border: '1px solid #ccc',
    borderRadius: 8,
    background: '#fff',
    color: '#555',
    padding: '6px 14px',
    fontSize: 13,
    cursor: 'pointer',
  } as React.CSSProperties,
  cancelAbortBtn: {
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: '#aaa',
    padding: '6px 10px',
    fontSize: 13,
    cursor: 'pointer',
  } as React.CSSProperties,
  summary: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    cursor: 'pointer',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  badge: {
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 12,
    background: '#e6f7ed',
    color: '#06C755',
  } as React.CSSProperties,
  badgeRed: { background: '#fff0f0', color: '#e53e3e' } as React.CSSProperties,
  badgeGray: { background: '#f0f0f0', color: '#888' } as React.CSSProperties,
  badgeBlue: { background: '#eaf2ff', color: '#2b6cb0' } as React.CSSProperties,
  badgeOrange: { background: '#fff7e6', color: '#b7791f' } as React.CSSProperties,
  toggle: { marginLeft: 'auto', fontSize: 12, color: '#888' },
  detail: { marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 },
  empty: { fontSize: 13, color: '#888', textAlign: 'center' as const },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: 14,
  } as React.CSSProperties,
  name: { color: '#333' },
  rowActual: { background: '#f0faf4' } as React.CSSProperties,
  rowBadges: { display: 'flex', gap: 6, alignItems: 'center' } as React.CSSProperties,
  actualBtn: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 10,
    border: '1px solid #ccc',
    background: '#fff',
    color: '#888',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  actualBtnOn: {
    border: '1px solid #38a169',
    background: '#e6f7ed',
    color: '#38a169',
    fontWeight: 'bold',
  } as React.CSSProperties,
  carpoolNeed: { background: '#eaf2ff', color: '#2b6cb0' } as React.CSSProperties,
  attendanceBadge: {
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 10,
  } as React.CSSProperties,
  statusGreen: { background: '#e6f7ed', color: '#06C755' } as React.CSSProperties,
  statusRed: { background: '#fff0f0', color: '#e53e3e' } as React.CSSProperties,
  statusGray: { background: '#f0f0f0', color: '#888' } as React.CSSProperties,
};
