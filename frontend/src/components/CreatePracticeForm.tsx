import { useState } from 'react';
import { Practice } from '../types';

interface Props {
  onSubmit: (data: Omit<Practice, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  onClose: () => void;
}

export function CreatePracticeForm({ onSubmit, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !location) {
      setError('タイトル・日付・時間・場所は必須です');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ title, date, time, location, description });
      onClose();
    } catch {
      setError('作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.heading}>練習を追加</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>タイトル</label>
            <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>日付</label>
            <input type="date" style={styles.input} value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>時間</label>
            <input type="time" style={styles.input} value={time} onChange={e => setTime(e.target.value)} required />
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
              {submitting ? '作成中...' : '作成'}
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
