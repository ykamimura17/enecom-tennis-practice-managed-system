import { useState } from 'react';
import type { ReactNode } from 'react';
import hero from './assets/tennis-image.png';
import './mobile.css';

export type AttendanceChoice = '未回答' | '参加' | '不参加';
export type CarpoolChoice = '必要' | '不要';
export type MobileRegistrationProps = {
  initialStatus?: AttendanceChoice;
  initialCarpool?: CarpoolChoice;
  initialComment?: string;
  saved?: boolean;
};

const icons = {
  back: <path d="m15 18-6-6 6-6" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  note: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><circle cx="17" cy="8" r="2"/><path d="M17 14a5 5 0 0 1 4 5"/></>,
  car: <><path d="M5 11 7 5h10l2 6M4 11h16a1 1 0 0 1 1 1v6H3v-6a1 1 0 0 1 1-1Z"/><path d="M6 18v2m12-2v2M6 14h2m8 0h2"/></>,
  message: <path d="M4 4h16v13H9l-5 4V4Z"/>,
  home: <path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>,
  check: <path d="m5 12 5 5L20 7"/>,
  people: <><circle cx="8" cy="9" r="3"/><circle cx="17" cy="9" r="3"/><path d="M2 20v-2a6 6 0 0 1 12 0v2m0 0v-2a6 6 0 0 1 8 0v2"/></>,
  clipboard: <><rect x="4" y="4" width="16" height="18" rx="2"/><path d="M9 3h6v3H9Zm0 12 2 2 4-5"/></>,
};
type IconName = keyof typeof icons;
function Icon({ name, size = 23 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}
function Section({ title, badge, icon, children }: { title: string; badge: '必須' | '任意'; icon: IconName; children: ReactNode }) {
  return <section className="tm-section tm-card"><div className="tm-section-heading"><Icon name={icon} size={27}/><h2>{title}</h2><span className={'tm-badge '+(badge === '必須' ? 'required' : 'optional')}>{badge}</span></div>{children}</section>;
}
function Choice({ label, checked, onClick, horizontal = false }: { label: string; checked: boolean; onClick: () => void; horizontal?: boolean }) {
  return <button type="button" aria-pressed={checked} onClick={onClick} className={'tm-choice '+(checked ? 'selected' : '')+(horizontal ? ' horizontal' : '')}><span className="tm-radio">{checked ? <Icon name="check" size={21}/> : null}</span><span>{label}</span></button>;
}
export function MobileRegistration({ initialStatus = '未回答', initialCarpool = '不要', initialComment = '', saved = false }: MobileRegistrationProps) {
  const [status,setStatus] = useState<AttendanceChoice>(initialStatus);
  const [carpool,setCarpool] = useState<CarpoolChoice>(initialCarpool);
  const [comment,setComment] = useState(initialComment);
  const [registered,setRegistered] = useState(saved);
  const [tab,setTab] = useState<'home'|'practice'|'register'|'members'>('register');
  return <div className="tm-stage"><div className="tm-phone" lang="ja">
    <header className="tm-header"><button type="button" className="tm-back" aria-label="戻る（プレビュー）" onClick={() => setTab('home')}><Icon name="back" size={28}/></button><h1>参加登録</h1><span className="tm-header-space"/></header>
    {tab === 'register' ? <main className="tm-content">
      <article className="tm-practice tm-card" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.91) 44%, rgba(255,255,255,.28) 100%), url('+hero+')' }}>
        <div className="tm-hero-status"><span className="tm-tennis-logo">◉</span><span className="tm-accepting">受付中</span></div>
        <h2>10/26(土) 午前練習</h2>
        <div className="tm-hero-line"><Icon name="clock"/><span>10:00 – 12:00</span></div>
        <div className="tm-hero-line"><Icon name="pin"/><span>市営テニスコート A/B</span></div>
        <div className="tm-hero-line tm-hero-detail"><Icon name="note"/><span>基礎練習とゲームを行います。<br/>初参加の方もお気軽にご参加ください。</span></div>
      </article>
      <Section title="参加予定" icon="users" badge="必須"><div className="tm-choice-group">{(['参加','不参加','未回答'] as const).map(c=><Choice key={c} label={c === '未回答' ? '未定' : c} checked={status===c} onClick={()=>{setStatus(c);setRegistered(false);}}/>)}</div></Section>
      {status==='参加' && <Section title="配車の希望" icon="car" badge="必須"><div className="tm-choice-group"><Choice label="配車必要" horizontal checked={carpool==='必要'} onClick={()=>{setCarpool('必要');setRegistered(false);}}/><Choice label="不要" horizontal checked={carpool==='不要'} onClick={()=>{setCarpool('不要');setRegistered(false);}}/></div></Section>}
      <Section title="コメント" icon="message" badge="任意"><div className="tm-textarea-wrap"><textarea maxLength={200} aria-label="コメント" placeholder="コメントがあれば入力してください。" value={comment} onChange={e=>{setComment(e.target.value);setRegistered(false);}}/><span>{comment.length} / 200</span></div></Section>
      {registered && <div className="tm-success" role="status">✓ 回答を保存しました（プレビューのみ）</div>}
      <button className="tm-submit" onClick={()=>setRegistered(true)}>{registered ? '内容を変更して登録' : 'この内容で登録'} <span aria-hidden="true">›</span></button>
      <p className="tm-demo-note">Storybookプレビューです。実際の出欠データは更新しません。</p>
    </main> : <main className="tm-content"><div className="tm-placeholder tm-card"><h2>{({home:'ホーム',practice:'練習',members:'メンバー'} as const)[tab]}</h2><p>この画面は今後のデザイン検討で追加します。</p><button onClick={()=>setTab('register')}>参加登録へ戻る</button></div></main>}
    <footer className="tm-bottom-nav" aria-label="画面切り替え">
      {([{key:'home',label:'ホーム',icon:'home'},{key:'practice',label:'練習',icon:'calendar'},{key:'register',label:'登録',icon:'clipboard'},{key:'members',label:'メンバー',icon:'people'}] as const).map(item=><button key={item.key} type="button" className={tab===item.key ? 'active':''} onClick={()=>setTab(item.key)}><Icon name={item.icon} size={23}/><span>{item.label}</span></button>)}
    </footer>
  </div></div>;
}
