import { useState } from 'react';
import hero from './assets/tennis-image.png';
import './mobile.css';
import './PracticeList.css';

type Filter = 'すべて' | '受付中' | '参加予定';
type Practice = { id: number; date: string; day: string; title: string; time: string; place: string; status: '受付中' | '終了'; response: '参加' | '不参加' | '未回答'; detail: string };
const practices: Practice[] = [
  { id: 1, date: '10/26', day: '土', title: '午前練習', time: '10:00 – 12:00', place: '市営テニスコート A/B', status: '受付中', response: '参加', detail: '基礎練習とゲーム練習を行います。' },
  { id: 2, date: '11/02', day: '土', title: '午後練習', time: '13:00 – 16:00', place: '市営テニスコート C/D', status: '受付中', response: '未回答', detail: 'ラリー練習とダブルスゲームを予定しています。' },
  { id: 3, date: '11/09', day: '土', title: '午前練習', time: '09:00 – 12:00', place: '中央スポーツセンター', status: '受付中', response: '不参加', detail: 'サーブ・レシーブの基礎練習を行います。' },
  { id: 4, date: '10/19', day: '土', title: 'ゲーム練習', time: '10:00 – 12:00', place: '市営テニスコート A/B', status: '終了', response: '参加', detail: 'ダブルス中心の練習でした。' },
];
function Glyph({ name }: { name: 'back'|'calendar'|'pin'|'clock'|'chevron'|'home'|'users'|'check' }) {
 const paths = { back:<path d="m15 18-6-6 6-6"/>,calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,pin:<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,chevron:<path d="m9 18 6-6-6-6"/>,home:<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>,users:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><circle cx="17" cy="8" r="2"/></>,check:<><rect x="4" y="4" width="16" height="18" rx="2"/><path d="m8 14 3 3 5-6"/></>,};
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export function PracticeList({ initialFilter = 'すべて' }: { initialFilter?: Filter }) {
 const [filter,setFilter]=useState<Filter>(initialFilter);
 const [selected,setSelected]=useState<Practice|null>(null);
 const [tab,setTab]=useState<'practice'|'home'|'register'|'members'>('practice');
 const shown=practices.filter(p=>filter==='すべて'||(filter==='受付中'?p.status==='受付中':p.response==='参加'));
 return <div className="tm-stage"><div className="tm-phone pl-phone" lang="ja">
  <header className="tm-header"><button className="tm-back" aria-label="戻る" onClick={()=>{setSelected(null);setTab('practice');}}><Glyph name="back"/></button><h1>{selected?'練習詳細':'練習予定'}</h1><span className="tm-header-space"/></header>
  {tab!=='practice'?<main className="tm-content"><div className="tm-card pl-empty"><h2>{({home:'ホーム',register:'参加登録',members:'メンバー'} as const)[tab]}</h2><p>こちらは練習一覧のデザイン確認用です。</p><button onClick={()=>setTab('practice')}>練習予定に戻る</button></div></main>:
  selected?<main className="tm-content pl-content">
   <article className="tm-card pl-feature" style={{backgroundImage:'linear-gradient(90deg,rgba(255,255,255,.97),rgba(255,255,255,.79) 54%,rgba(255,255,255,.1)),url('+hero+')'}}>
    <span className={'pl-pill '+(selected.status==='終了'?'pl-muted':'')}>{selected.status}</span><h2>{selected.date}（{selected.day}）{selected.title}</h2>
    <p><Glyph name="clock"/>{selected.time}</p><p><Glyph name="pin"/>{selected.place}</p><p className="pl-detail-text">{selected.detail}</p>
   </article><section className="tm-card pl-detail-panel"><h2>あなたの回答</h2><span className={'pl-response '+(selected.response==='参加'?'pl-going':'')}>{selected.response}</span><p>参加登録画面で回答を確認・変更できます。</p><button className="pl-primary" onClick={()=>setTab('register')}>参加登録へ進む <Glyph name="chevron"/></button></section>
   <button className="pl-back-list" onClick={()=>setSelected(null)}>← 練習一覧へ戻る</button>
  </main>:<main className="tm-content pl-content">
   <div className="pl-intro"><span className="pl-eyebrow">TENNIS CLUB</span><h2>次の練習をチェック</h2><p>参加予定や練習の詳細を確認できます。</p></div>
   <div className="pl-filter" role="group" aria-label="練習予定の絞り込み">{(['すべて','受付中','参加予定'] as const).map(f=><button key={f} type="button" aria-pressed={filter===f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div>
   <div className="pl-list-heading"><h3>練習一覧</h3><span>{shown.length}件</span></div>
   {shown.map((p,i)=><button className={'tm-card pl-item '+(i===0?'pl-item-featured':'')} key={p.id} type="button" onClick={()=>setSelected(p)}>
    {i===0&&<div className="pl-image" style={{backgroundImage:'url('+hero+')'}} aria-hidden="true"/>}
    <div className="pl-item-body"><div className="pl-item-top"><span className={'pl-pill '+(p.status==='終了'?'pl-muted':'')}>{p.status}</span><span className={'pl-response '+(p.response==='参加'?'pl-going':p.response==='不参加'?'pl-notgoing':'')}>{p.response}</span></div>
    <div className="pl-item-title"><div className="pl-date"><strong>{p.date}</strong><span>{p.day}</span></div><div className="pl-name"><h4>{p.title}</h4><p><Glyph name="clock"/>{p.time}</p><p><Glyph name="pin"/>{p.place}</p></div><Glyph name="chevron"/></div></div>
   </button>)}
   {shown.length===0&&<div className="tm-card pl-empty">該当する練習はありません。</div>}
   <p className="tm-demo-note">Storybook用の架空データです。実際の練習情報は変更しません。</p>
  </main>}
  <footer className="tm-bottom-nav" aria-label="画面切り替え">{([{key:'home',label:'ホーム',icon:'home'},{key:'practice',label:'練習',icon:'calendar'},{key:'register',label:'登録',icon:'check'},{key:'members',label:'メンバー',icon:'users'}] as const).map(x=><button type="button" key={x.key} className={tab===x.key?'active':''} onClick={()=>{setTab(x.key);setSelected(null);}}><Glyph name={x.icon}/><span>{x.label}</span></button>)}</footer>
 </div></div>;
}
