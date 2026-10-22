import { useMemo, useState } from 'react';
import hero from './assets/tennis-image.png';
import './mobile.css';
import './HomeMembers.css';

type Page = 'home' | 'practice' | 'members' | 'admin';
type Filter = '全員' | '参加予定' | '配車希望';
export type MemberEvent = {id:number;label:string;date:string;status:string};
type Member = { id:number; name:string; initials:string; attendance:'参加'|'不参加'|'未回答'; carpool:boolean; accent:string };
const members:Member[] = [
  { id:1,name:'山田 花子',initials:'山',attendance:'参加',carpool:false,accent:'#e9e5f7' },
  { id:2,name:'佐藤 太郎',initials:'佐',attendance:'参加',carpool:true,accent:'#def0df' },
  { id:3,name:'田中 美咲',initials:'田',attendance:'参加',carpool:false,accent:'#f8e8df' },
  { id:4,name:'鈴木 健',initials:'鈴',attendance:'不参加',carpool:false,accent:'#e1edf8' },
  { id:5,name:'高橋 優',initials:'高',attendance:'未回答',carpool:false,accent:'#f3eecf' },
  { id:6,name:'伊藤 葵',initials:'伊',attendance:'未回答',carpool:false,accent:'#e4ecef' },
];
const iconPaths={
 home:<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>,
 calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,
 check:<><rect x="4" y="4" width="16" height="18" rx="2"/><path d="m8 14 3 3 5-6"/></>,
 users:<><circle cx="8" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 20v-2a6 6 0 0 1 12 0v2m2-8a6 6 0 0 1 6 6v2"/></>,
 clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
 pin:<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
 arrow:<path d="m9 18 6-6-6-6"/>,
 back:<path d="m15 18-6-6 6-6"/>,
 car:<><path d="M5 11 7 5h10l2 6M4 11h16a1 1 0 0 1 1 1v6H3v-6a1 1 0 0 1 1-1Z"/><path d="M6 18v2m12-2v2"/></>,
 bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9"/><path d="M10 21h4"/></>,
 search:<><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
};
type IconName=keyof typeof iconPaths;
function Icon({name,size=21}:{name:IconName;size?:number}){return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>}
function Nav({active,onChange,isAdmin=true}:{active:Page;onChange:(page:Page)=>void;isAdmin?:boolean}){
 const links=([{page:'home',label:'ホーム',icon:'home'},{page:'practice',label:'練習',icon:'calendar'},{page:'members',label:'メンバー',icon:'users'},{page:'admin',label:'管理',icon:'check'}] as const);
 return <footer className="tm-bottom-nav" aria-label="画面切り替え">{links.filter(l=>isAdmin||l.page!=='admin').map(l=><button key={l.page} type="button" className={active===l.page?'active':''} onClick={()=>onChange(l.page)}><Icon name={l.icon} size={23}/><span>{l.label}</span></button>)}</footer>;
}
export function HomeMembers({initialPage='home',initialFilter='全員',onNavigate,isAdmin=true,events=[]}:{initialPage?:'home'|'members';initialFilter?:Filter;onNavigate?:(page:Page)=>void;isAdmin?:boolean;events?:MemberEvent[]}){
 const [page,setPage]=useState<Page>(initialPage);
 const [filter,setFilter]=useState<Filter>(initialFilter);
 const [eventId,setEventId]=useState<number|null>(null);
 const selectedEvent=events.find(e=>e.id===eventId)??events[0];
 const eventIndex=Math.max(0,events.findIndex(e=>e.id===selectedEvent?.id));
 const eventMembers=useMemo(()=>members.map((m,i)=>{if(!selectedEvent||eventIndex===0)return m;const attendance=(['参加','不参加','未回答'] as const)[(i+eventIndex)%3];return {...m,attendance,carpool:attendance==='参加'&&(i+eventIndex)%2===0};}),[selectedEvent,eventIndex]);
 const participants=eventMembers.filter(m=>m.attendance==='参加').length;
 const [selected,setSelected]=useState<Member|null>(null);
 const visible=useMemo(()=>eventMembers.filter(m=>(filter==='全員'||(filter==='参加予定'?m.attendance==='参加':m.carpool))),[eventMembers,filter]);
 const go=(p:Page)=>{if(p==='admin'&&!isAdmin)return;setSelected(null);if(onNavigate){onNavigate(p)}else{setPage(p)}};
 return <div className="tm-stage"><div className="tm-phone hm-phone" lang="ja">
  <header className="tm-header"><button className="tm-back" type="button" aria-label="ホームに戻る" onClick={()=>go('home')}><Icon name="back" size={26}/></button><h1>{selected?'メンバー詳細':page==='home'?'ホーム':page==='members'?'メンバー':'プレビュー'}</h1><span className="tm-header-space"/></header>
  {page==='home'?<main className="tm-content hm-content">
   <div className="hm-greeting"><p>おかえりなさい</p><h2>テニス部へようこそ <span aria-hidden="true">🎾</span></h2><p>次の練習を確認して、参加予定を登録しましょう。</p></div>
   <section className="tm-card hm-next"><div className="hm-next-top"><span className="hm-tag">次の練習</span><span className="hm-tag green">受付中</span></div><h2>10/26(土) 午前練習</h2><p><Icon name="clock"/>10:00 – 12:00</p><p><Icon name="pin"/>市営テニスコート A/B</p><div className="hm-next-bottom"><span>あなたの回答：<strong>未回答</strong></span><button type="button" onClick={()=>go('practice')}>参加登録 <Icon name="arrow" size={17}/></button></div></section>
   <div className="hm-heading"><h3>参加状況</h3><span>10/26(土) の練習</span></div>
   <div className="hm-counts"><div className="tm-card"><strong>3<span>人</span></strong><p>参加</p></div><div className="tm-card"><strong>1<span>人</span></strong><p>不参加</p></div><div className="tm-card"><strong>2<span>人</span></strong><p>未回答</p></div></div>
   <div className="hm-heading"><h3>クイックアクセス</h3></div>
   <div className="hm-shortcuts"><button type="button" className="tm-card" onClick={()=>go('practice')}><span className="hm-shortcut-icon"><Icon name="calendar" size={25}/></span><strong>練習予定</strong><small>今後の予定を見る</small><Icon name="arrow" size={18}/></button><button type="button" className="tm-card" onClick={()=>go('members')}><span className="hm-shortcut-icon"><Icon name="users" size={25}/></span><strong>メンバー</strong><small>出欠状況を確認</small><Icon name="arrow" size={18}/></button></div>
   <p className="tm-demo-note">Storybook用の架空データです。実際の出欠情報は取得しません。</p>
  </main>:page==='members'?<main className="tm-content hm-content">
   {selected?<><div className="tm-card hm-profile"><div className="hm-avatar large" style={{background:selected.accent}}>{selected.initials}</div><h2>{selected.name}</h2><span className="hm-person-status">{selected.attendance}</span><p>対象イベント：{selectedEvent?.label??'10月26日 午前練習'}</p>{selected.carpool&&<p><Icon name="car"/> 配車希望あり</p>}</div><button type="button" className="hm-back-list" onClick={()=>setSelected(null)}>← メンバー一覧に戻る</button></>:
   <><div className="hm-greeting"><p className="hm-eyebrow">MEMBERS</p><h2>みんなの参加状況</h2><p>イベントを選択して回答状況を確認できます。</p></div>
    <label className="hm-event-picker"><span><Icon name="calendar" size={18}/> 対象イベント</span><select aria-label="出欠を表示するイベント" value={selectedEvent?.id??'default'} onChange={e=>{setEventId(Number(e.target.value));setSelected(null)}}>{events.length?events.map(e=><option key={e.id} value={e.id}>{e.label}{e.status==='雨天中止'||e.status==='中止'?'（中止）':''}</option>):<option value="default">10月26日 午前練習</option>}</select></label>
    <div className="tm-card hm-count-banner" style={{backgroundImage:`linear-gradient(90deg,rgba(255,255,255,.98),rgba(255,255,255,.87) 55%,rgba(255,255,255,.3)),url(${hero})`,backgroundSize:"cover",backgroundPosition:"center"}}><div><small>{selectedEvent?.label??'10月26日 午前練習'}</small><strong>参加 <em>{participants}</em> / {eventMembers.length}人</strong></div><div className="hm-progress"><span style={{width:(participants/eventMembers.length*100)+'%'}}/></div></div>
    <div className="hm-filter" role="group" aria-label="メンバー絞り込み">{(['全員','参加予定','配車希望'] as const).map(f=><button key={f} className={filter===f?'active':''} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}</button>)}</div>
    <div className="hm-heading"><h3>メンバー一覧</h3><span>{visible.length}人</span></div>
    <div className="tm-card hm-members-list">{visible.map(m=><button type="button" key={m.id} onClick={()=>setSelected(m)} className="hm-member"><span className="hm-avatar" style={{background:m.accent}}>{m.initials}</span><span className="hm-member-name"><strong>{m.name}</strong>{m.carpool&&<small><Icon name="car" size={14}/> 配車希望あり</small>}</span><span className={'hm-person-status '+(m.attendance==='参加'?'going':m.attendance==='不参加'?'notgoing':'')}>{m.attendance}</span><Icon name="arrow" size={16}/></button>)}{visible.length===0&&<div className="hm-empty">該当するメンバーはいません。</div>}</div>
    <p className="tm-demo-note">表示名・回答はデザイン確認用の架空データです。</p>
   </>}
  </main>:<main className="tm-content hm-content"><section className="tm-card hm-preview"><h2>{page==='practice'?'練習予定':'管理'}</h2><p>こちらの画面は別のStorybookストーリーで確認できます。</p><button type="button" onClick={()=>go('home')}>ホームに戻る</button></section></main>}
  <Nav active={page} onChange={go} isAdmin={isAdmin}/>
 </div></div>;
}
