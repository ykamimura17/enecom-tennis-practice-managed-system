import { useState, useEffect, useCallback } from 'react';
import { useLiff } from './hooks/useLiff';
import { MemberPage } from './pages/MemberPage';
import { MembersAttendancePage } from './pages/MembersAttendancePage';
import { AdminPage } from './pages/AdminPage';
import { NotificationPanel } from './components/NotificationPanel';
import { api } from './api/client';
import type { Practice, Attendance } from './types';
import './App.css';

type Tab = 'home' | 'practice' | 'members' | 'admin';
const SEEN_KEY = 'seen_practice_ids';
function loadSeenIds(): Set<string> {
  try {const raw=localStorage.getItem(SEEN_KEY);return raw?new Set(JSON.parse(raw) as string[]):new Set();}
  catch{return new Set();}
}
function saveSeenIds(ids:Set<string>){try{localStorage.setItem(SEEN_KEY,JSON.stringify([...ids]));}catch{/* storage may be unavailable */}}
function todayLocal(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function Glyph({name}:{name:'home'|'calendar'|'users'|'settings'|'bell'|'arrow'}) {
  const path={home:<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>,calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,users:<><circle cx="8" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 20v-2a6 6 0 0 1 12 0v2m2-8a6 6 0 0 1 6 6v2"/></>,settings:<><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/></>,bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10 21h4"/></>,arrow:<path d="m9 18 6-6-6-6"/>};
  return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path[name]}</svg>;
}
const LABELS:Record<Tab,string>={home:'ホーム',practice:'練習予定',members:'メンバー',admin:'管理'};

export default function App(){
  const {userInfo,loading,error}=useLiff();
  const [tab,setTab]=useState<Tab>('home');
  const [practices,setPractices]=useState<Practice[]>([]);
  const [nextAttendance,setNextAttendance]=useState<Attendance[]>([]);
  const [seenIds,setSeenIds]=useState<Set<string>>(loadSeenIds);
  const [showNotifications,setShowNotifications]=useState(false);
  const hasUnread=practices.some(p=>!seenIds.has(p.id));
  const upcoming=[...practices].filter(p=>p.date>=todayLocal()).sort((a,b)=>a.date.localeCompare(b.date));
  const next=upcoming[0];

  const loadPractices=useCallback(async()=>{
    try{setPractices(await api.getPractices());}catch{/* list errors are shown on the target page */}
  },[]);
  useEffect(()=>{if(userInfo){void loadPractices();void api.registerMember(userInfo.displayName).catch(()=>{/* member page retries on next launch */});}},[userInfo,loadPractices]);
  useEffect(()=>{
    if(!next){setNextAttendance([]);return;}
    let active=true;
    api.getAttendance(next.id).then(list=>{if(active)setNextAttendance(list)}).catch(()=>{if(active)setNextAttendance([])});
    return()=>{active=false};
  },[next?.id,tab]);
  function toggleNotifications(){
    if(!showNotifications){
      const updated=new Set([...seenIds,...practices.map(p=>p.id)]);
      setSeenIds(updated);saveSeenIds(updated);
    }
    setShowNotifications(v=>!v);
  }
  if(loading)return <div className="a-app-center"><div className="a-app-spinner"/>読み込み中...</div>;
  if(error||!userInfo)return <div className="a-app-center" role="alert">{error??'ログインが必要です'}</div>;
  const tabs=([{id:'home',icon:'home'},{id:'practice',icon:'calendar'},{id:'members',icon:'users'},...(userInfo.isAdmin?[{id:'admin',icon:'settings'}]:[])] as {id:Tab;icon:'home'|'calendar'|'users'|'settings'}[]);
  return <div className="a-app">
    <header className="a-app-header"><div className="a-app-header-spacer"/><h1>{LABELS[tab]}</h1><button type="button" onClick={toggleNotifications} aria-label="お知らせ" aria-expanded={showNotifications} className="a-app-bell"><Glyph name="bell"/>{hasUnread&&<span className="a-app-unread"/>}</button></header>
    {showNotifications&&<div className="a-app-notifications"><NotificationPanel practices={practices} seenIds={seenIds} onClose={()=>setShowNotifications(false)}/></div>}
    <main className="a-app-main">
      {tab==='home'?<section className="a-home">
        <div className="a-home-intro"><span>WELCOME BACK</span><h2>テニス部へようこそ</h2><p>次の練習を確認して、参加予定を登録しましょう。</p></div>
        <div className="a-home-next"><div className="a-home-next-pills"><span>次の練習</span><span>{next?next.status:'予定なし'}</span></div>{next?<><h2>{next.date.replace(/-/g,'/')} {next.title}</h2><p>◷ {next.time}{next.endTime?' – '+next.endTime:''}</p><p>⌖ {next.location}</p><div className="a-home-next-bottom"><span>参加登録・確認</span><button type="button" onClick={()=>setTab('practice')}>練習を確認 <Glyph name="arrow"/></button></div></>:<><h2>今後の練習はありません</h2><p>新しい練習が登録されると表示されます。</p></>}</div>
        {next&&<><div className="a-home-heading"><h3>参加状況</h3><span>{next.date.replace(/-/g,'/')} の練習</span></div><div className="a-home-counts"><div><strong>{nextAttendance.filter(a=>a.status==='参加').length}<small>人</small></strong><span>参加</span></div><div><strong>{nextAttendance.filter(a=>a.status==='不参加').length}<small>人</small></strong><span>不参加</span></div><div><strong>{nextAttendance.filter(a=>a.status==='未回答').length}<small>人</small></strong><span>未回答（登録済）</span></div></div></>}
        <div className="a-home-heading"><h3>クイックアクセス</h3></div><div className="a-home-shortcuts"><button onClick={()=>setTab('practice')} type="button"><span><Glyph name="calendar"/></span><strong>練習予定</strong><small>今後の予定を見る</small></button><button onClick={()=>setTab('members')} type="button"><span><Glyph name="users"/></span><strong>メンバー</strong><small>出欠状況を確認</small></button></div>
        <div className="a-home-notice"><span><Glyph name="bell"/></span><div><h3>お知らせ</h3><p>{hasUnread?'新しい練習のお知らせがあります。':'練習の新着情報はこちらから確認できます。'}</p></div><button type="button" onClick={toggleNotifications}>確認</button></div>
      </section>:tab==='practice'?<MemberPage userInfo={userInfo}/>:tab==='members'?<MembersAttendancePage/>:userInfo.isAdmin?<AdminPage userInfo={userInfo} onPracticeCreated={()=>void loadPractices()}/>:<MemberPage userInfo={userInfo}/>}
    </main>
    <nav className="a-app-bottom-nav" aria-label="メインメニュー">{tabs.map(item=><button type="button" key={item.id} onClick={()=>{setTab(item.id);setShowNotifications(false)}} className={tab===item.id?'active':''} aria-current={tab===item.id?'page':undefined}><Glyph name={item.icon}/><span>{item.id==='practice'?'練習':LABELS[item.id]}</span></button>)}</nav>
  </div>;
}
