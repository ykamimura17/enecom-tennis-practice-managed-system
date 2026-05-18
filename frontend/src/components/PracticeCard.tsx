import { Practice, Attendance, AttendanceStatus } from '../types';

interface Props {
  practice: Practice;
  myAttendance: Attendance | undefined;
  onChangeStatus: (practiceId: string, status: AttendanceStatus) => void;
  loading: boolean;
  readonly?: boolean;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function PracticeCard({ practice, myAttendance, onChangeStatus, loading, readonly = false }: Props) {
  const date = new Date(practice.date);
  const weekday = WEEKDAYS[date.getDay()];
  const formattedDate = `${practice.date.replace(/-/g, '/')}（${weekday}）`;
  const currentStatus = myAttendance?.status ?? null;
  const isCancelled = practice.status !== '開催';

  return (
    <div style={{ ...styles.card, ...(isCancelled ? styles.cardCancelled : {}) }}>
      <div style={styles.titleRow}>
        <span style={styles.title}>{practice.title}</span>
        {isCancelled && (
          <span style={styles.cancelledBadge}>{practice.status}</span>
        )}
      </div>
      <div style={styles.info}>{formattedDate} {practice.time}〜</div>
      <div style={styles.info}>{practice.location}</div>
      {practice.description && (
        <div style={styles.description}>{practice.description}</div>
      )}
      {isCancelled ? null : readonly ? (
        <div style={styles.statusLine}>
          {currentStatus
            ? <span style={styles.statusText}>{currentStatus}</span>
            : <span style={styles.statusTextMuted}>未回答</span>}
        </div>
      ) : (
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
  buttons: { display: 'flex', gap: 8, marginTop: 12 },
  statusLine: { marginTop: 10 },
  statusText: { fontSize: 13, color: '#555' },
  statusTextMuted: { fontSize: 13, color: '#bbb' },
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
};
