import { useState } from 'react';
import { Practice } from '../types';

type FormData = Omit<Practice, 'id' | 'createdAt' | 'status'>;

interface Props {
  onSubmit: (data: FormData) => Promise<void>;
  onClose: () => void;
  initialValues?: FormData;
}

export function CreatePracticeForm({ onSubmit, onClose, initialValues }: Props) {
  const isEdit = !!initialValues;
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [date, setDate] = useState(initialValues?.date ?? '');
  const [time, setTime] = useState(initialValues?.time ?? '');
  const [endTime, setEndTime] = useState(initialValues?.endTime ?? '');
  const [location, setLocation] = useState(initialValues?.location ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !location) {
      setError('タイトル・日付・開始時間・場所は必須です');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ title, date, time, endTime: endTime || undefined, location, description });
      onClose();
    } catch {
      setError(isEdit ? '更新に失敗しました' : '作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.heading}>{isEdit ? '練習を編集' : '練習を追加'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>タイトル</label>
            <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>日付</label>
            <input type="date" style={styles.input} value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div style={styles.timeRow}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>開始時間</label>
              <input type="time" style={styles.input} value={time} onChange={e => setTime(e.target.value)} required />
            </div>
            <div style={styles.timeSep}>〜</div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>終了時間（任意）</label>
              <input type="time" style={styles.input} value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>場所</label>
            <input style={styles.input} value={location} onChange={e => setLocation(e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>備考（任意）</label>
            <textarea
              style={{ ...styles.input, height: 80, resize: 'vertical' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.footer}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" style={styles.submitBtn} disabled={submitting}>
              {submitting ? (isEdit ? '更新中...' : '作成中...') : (isEdit ? '更新' : '作成')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  modal: {
    background: '#fff',
    borderRadius: '16px 16px 0 0',
    padding: 24,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
  },
  heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 13, color: '#555', marginBottom: 4 },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 15,
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  timeRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  } as React.CSSProperties,
  timeSep: {
    fontSize: 16,
    color: '#888',
    paddingBottom: 10,
    flexShrink: 0,
  },
  error: { color: '#e53e3e', fontSize: 13 },
  footer: { display: 'flex', gap: 8, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    padding: '12px 0',
    border: '1px solid #ddd',
    borderRadius: 8,
    background: '#fff',
    fontSize: 15,
    cursor: 'pointer',
  } as React.CSSProperties,
  submitBtn: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    borderRadius: 8,
    background: '#06C755',
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
};
