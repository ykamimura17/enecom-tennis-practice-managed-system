import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Attendance, Practice } from '../types';
import './MembersAttendancePage.css';

type Filter = '全員' | '参加予定' | '配車希望';

export function MembersAttendancePage() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [practiceId, setPracticeId] = useState('');
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [filter, setFilter] = useState<Filter>('全員');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getPractices().then(list => {
      if (!active) return;
      const ordered = [...list].sort((a, b) => a.date.localeCompare(b.date));
      const today = new Date();
      const localToday = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
      const firstUpcoming = ordered.find(p => p.date >= localToday);
      const selected = firstUpcoming ?? ordered[ordered.length - 1];
      setPractices(ordered);
      setPracticeId(selected?.id ?? '');
      if (!selected) setLoading(false);
    }).catch(() => { if (active) { setError('練習一覧を取得できませんでした'); setLoading(false); } });
    return () => { active = false; };
  }, []);

  const loadAttendance = useCallback(async (id: string, isActive: () => boolean) => {
    setLoading(true);
    setError('');
    try {
      const records = await api.getAttendance(id);
      if (isActive()) setAttendances(records);
    } catch {
      if (isActive()) { setAttendances([]); setError('出欠データを取得できませんでした'); }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!practiceId) return;
    let active = true;
    void loadAttendance(practiceId, () => active);
    return () => { active = false; };
  }, [practiceId, loadAttendance]);

  const selectedPractice = practices.find(p => p.id === practiceId);
  const counts = useMemo(() => ({
    attending: attendances.filter(a => a.status === '参加').length,
    absent: attendances.filter(a => a.status === '不参加').length,
    unanswered: attendances.filter(a => a.status === '未回答').length,
    carpool: attendances.filter(a => a.status === '参加' && a.carpool === '必要').length,
  }), [attendances]);
  const visible = attendances.filter(a => (
    (filter === '全員' || (filter === '参加予定' ? a.status === '参加' : a.status === '参加' && a.carpool === '必要')) &&
    a.displayName.replaceAll(' ', '').includes(query.replaceAll(' ', ''))
  ));

  return <section className="live-members">
    <div className="live-members-intro"><span>MEMBERS</span><h2>みんなの参加状況</h2><p>イベントを選んで出欠状況を確認できます。</p></div>
    <label className="live-members-selector"><span>対象イベント</span>
      <select value={practiceId} onChange={e => { setPracticeId(e.target.value); setQuery(''); setFilter('全員'); }} disabled={!practices.length} aria-label="出欠を表示するイベント">
        {!practices.length && <option value="">練習がありません</option>}
        {practices.map(p => <option key={p.id} value={p.id}>{p.date.replaceAll('-', '/')} {p.title}{p.status !== '開催' ? '（' + p.status + '）' : ''}</option>)}
      </select>
    </label>
    {selectedPractice && <div className="live-members-event"><strong>{selectedPractice.title}</strong><span>{selectedPractice.date.replaceAll('-', '/')} · {selectedPractice.time} · {selectedPractice.location}</span></div>}
    {error && <p role="alert" className="live-members-error">{error}</p>}
    {loading ? <p className="live-members-empty">読み込み中...</p> : <>
      <div className="live-members-counts"><div><strong>{counts.attending}</strong><span>参加</span></div><div><strong>{counts.absent}</strong><span>不参加</span></div><div><strong>{counts.unanswered}</strong><span>未回答</span></div></div>
      <p className="live-members-note">出欠を登録したメンバー：{attendances.length}人 · 配車希望：{counts.carpool}人</p>
      <label className="live-members-search"><span>名前で検索</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="メンバー名" /></label>
      <div className="live-members-filters" role="group" aria-label="出欠状況で絞り込み">{(['全員', '参加予定', '配車希望'] as const).map(f => <button key={f} type="button" className={filter === f ? 'active' : ''} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}</div>
      <div className="live-members-heading"><h3>メンバー一覧</h3><span>{visible.length}人</span></div>
      <div className="live-members-list">{visible.map(a => <div className="live-members-person" key={a.id}><div className="live-members-avatar">{a.displayName.slice(0, 1)}</div><div className="live-members-name"><strong>{a.displayName}</strong>{a.status === '参加' && a.carpool && <small>配車：{a.carpool}</small>}{a.actual && <small>来場済み</small>}</div><span className={'live-members-status ' + (a.status === '参加' ? 'going' : a.status === '不参加' ? 'absent' : '')}>{a.status}</span></div>)}
        {visible.length === 0 && <p className="live-members-empty">該当する回答はありません</p>}
      </div>
      <p className="live-members-note">未回答人数はAPIに登録された「未回答」の件数です。未登録メンバーは含みません。</p>
    </>}
  </section>;
}
