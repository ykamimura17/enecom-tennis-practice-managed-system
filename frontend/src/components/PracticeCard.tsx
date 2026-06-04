import { useState } from 'react';
import { Practice, Attendance, AttendanceStatus, CarpoolStatus } from '../types';

interface Props {
  practice: Practice;
  myAttendance: Attendance | undefined;
  onChangeStatus: (practiceId: string, status: AttendanceStatus) => void;
  onChangeCarpool: (practiceId: string, carpool: CarpoolStatus) => void;
  loading: boolean;
  readonly?: boolean;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function PracticeCard({ practice, myAttendance, onChangeStatus, onChangeCarpool, loading, readonly = false }: Props) {
  const date = new Date(practice.date);
  const weekday = WEEKDAYS[date.getDay()];
  const formattedDate = `${practice.date.replace(/-/g, '/')}（${weekday}）`;
  const currentStatus = myAttendance?.status ?? null;
  const currentCarpool = myAttendance?.carpool ?? null;
  const isCancelled = practice.status !== '開催';
  const isUnanswered = !isCancelled && !readonly && !currentStatus;

  const [open, setOpen] = useState(false);

  return (
    <div style={{ ...styles.card, ...(isCancelled ? styles.cardCancelled : {}) }}>
      {/* タイトル行 */}
      <div style={styles.titleRow}>
        <span style={styles.title}>{practice.title}</span>
        {isCancelled && (
          <span style={styles.cancelledBadge}>{practice.status}</span>
        )}
      </div>
      <div style={styles.info}>{formattedDate} {practice.time}〜{practice.endTime ?? ''}</div>
      <div style={styles.info}>{practice.location}</div>
      {practice.description && (
        <div style={styles.description}>{practice.description}</div>
      )}

      {isCancelled ? null : readonly ? (
        /* 過去の練習：読み取り専用 */
        <div style={styles.statusLine}>
          {currentStatus
            ? <span style={styles.statusText}>{currentStatus}</span>
            : <span style={styles.statusTextMuted}>未回答</span>}
          {currentStatus === '参加' && currentCarpool && (
            <span style={styles.statusText}>　/　配車: {currentCarpool}</span>
          )}
        </div>
      ) : (
        /* 今後の練習：アコーディオン */
        <>
          {/* 回答状況サマリー行（常に表示） */}
          <div style={styles.summaryRow} onClick={() => setOpen(v => !v)}>
            <div style={styles.summaryLeft}>
              {isUnanswered ? (
                <>
                  <span style={styles.redDot} />
                  <span style={styles.summaryUnanswered}>未回答</span>
                </>
              ) : (
                <span style={{
                  ...styles.summaryStatus,
                  ...(currentStatus === '参加' ? styles.summaryGreen : styles.summaryRed),
                }}>
                  {currentStatus}
                  {currentStatus === '参加' && currentCarpool && `　配車:${currentCarpool}`}
                </span>
              )}
            </div>
            <span style={styles.chevron}>{open ? '▲' : '▼'}</span>
          </div>

          {/* 折り畳みエリア */}
          {open && (
            <div style={styles.panel}>
              <div style={styles.buttons}>
                <button
                  style={{ ...styles.btn, ...(currentStatus === '参加' ? styles.btnActiveGreen : {}) }}
                  onClick={() => onChangeStatus(practice.id, '参加')}
                  disabled={loading}
                >
                  参加
                </button>
                <button
                  style={{ ...styles.btn, ...(currentStatus === '不参加' ? styles.btnActiveRed : {}) }}
                  onClick={() => onChangeStatus(practice.id, '不参加')}
                  disabled={loading}
                >
                  不参加
                </button>
              </div>
              {currentStatus === '参加' && (
                <div style={styles.carpoolSection}>
                  <span style={styles.carpoolLabel}>配車（送迎）は必要ですか？</span>
                  <div style={styles.buttons}>
                    <button
                      style={{ ...styles.btn, ...(currentCarpool === '必要' ? styles.btnActiveGreen : {}) }}
                      onClick={() => onChangeCarpool(practice.id, '必要')}
                      disabled={loading}
                    >
                      必要
                    </button>
                    <button
                      style={{ ...styles.btn, ...(currentCarpool === '不要' ? styles.btnActiveGray : {}) }}
                      onClick={() => onChangeCarpool(practice.id, '不要')}
                      disabled={loading}
                    >
                      不要
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
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
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap' as const,
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cancelledBadge: {
    fontSize: 11,
    padding: '2px 7px',
    borderRadius: 4,
    background: '#f0f0f0',
    color: '#888',
  } as React.CSSProperties,
  info: { fontSize: 14, color: '#555', marginBottom: 4 },
  description: { fontSize: 13, color: '#888', marginTop: 4, marginBottom: 4 },

  /* サマリー行 */
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    cursor: 'pointer',
    padding: '6px 0',
    borderTop: '1px solid #f0f0f0',
  } as React.CSSProperties,
  summaryLeft: { display: 'flex', alignItems: 'center', gap: 6 },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#e53e3e',
    flexShrink: 0,
    display: 'inline-block',
  } as React.CSSProperties,
  summaryUnanswered: { fontSize: 13, color: '#e53e3e', fontWeight: 'bold' },
  summaryStatus: { fontSize: 13, fontWeight: 'bold' },
  summaryGreen: { color: '#06C755' },
  summaryRed: { color: '#e53e3e' },
  chevron: { fontSize: 11, color: '#aaa' },

  /* 折り畳みパネル */
  panel: { paddingTop: 4 },
  buttons: { display: 'flex', gap: 8, marginTop: 12 },
  carpoolSection: { marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 8 },
  carpoolLabel: { fontSize: 13, color: '#888' },

  /* 過去の練習（readonly） */
  statusLine: { marginTop: 10 },
  statusText: { fontSize: 13, color: '#555' },
  statusTextMuted: { fontSize: 13, color: '#bbb' },

  /* ボタン */
  btn: {
    flex: 1,
    padding: '10px 0',
    border: '2px solid #ddd',
    borderRadius: 8,
    background: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
    color: '#555',
  } as React.CSSProperties,
  btnActiveGreen: {
    background: '#06C755',
    borderColor: '#06C755',
    color: '#fff',
  } as React.CSSProperties,
  btnActiveRed: {
    background: '#e53e3e',
    borderColor: '#e53e3e',
    color: '#fff',
  } as React.CSSProperties,
  btnActiveGray: {
    background: '#888',
    borderColor: '#888',
    color: '#fff',
  } as React.CSSProperties,
};
