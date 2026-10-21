import { useState } from 'react';
import hero from './assets/tennis-image.png';
import { Icon as RegistrationIcon, Section, Choice } from './MobileRegistration';
import { HomeMembers } from './HomeMembers';
import './mobile.css';
import './PracticeList.css';

type Filter = 'すべて' | '受付中' | '参加予定';
type Practice = { id: number; date: string; day: string; title: string; time: string; place: string; status: '受付中' | '終了'; response: '参加' | '不参加' | '未回答'; detail: string; start: string; carpool?: '必要' | '不要'; comment?: string };
const initialPractices: Practice[] = [
  { id: 1, start: '2026-10-26T10:00', date: '10/26', day: '土', title: '午前練習', time: '10:00 – 12:00', place: '市営テニスコート A/B', status: '受付中', response: '参加', detail: '基礎練習とゲーム練習を行います。' },
  { id: 2, start: '2026-11-02T13:00', date: '11/02', day: '土', title: '午後練習', time: '13:00 – 16:00', place: '市営テニスコート C/D', status: '受付中', response: '未回答', detail: 'ラリー練習とダブルスゲームを予定しています。' },
  { id: 3, start: '2026-11-09T09:00', date: '11/09', day: '土', title: '午前練習', time: '09:00 – 12:00', place: '中央スポーツセンター', status: '受付中', response: '不参加', detail: 'サーブ・レシーブの基礎練習を行います。' },
  { id: 4, start: '2026-10-19T10:00', date: '10/19', day: '土', title: 'ゲーム練習', time: '10:00 – 12:00', place: '市営テニスコート A/B', status: '終了', response: '参加', detail: 'ダブルス中心の練習でした。' },
];
function Glyph({ name }: { name: 'back'|'calendar'|'pin'|'clock'|'chevron'|'home'|'users'|'check'|'settings' }) {
 const paths = { back:<path d="m15 18-6-6 6-6"/>,calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,pin:<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,chevron:<path d="m9 18 6-6-6-6"/>,home:<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>,users:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><circle cx="17" cy="8" r="2"/></>,settings:<><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/></>,check:<><rect x="4" y="4" width="16" height="18" rx="2"/><path d="m8 14 3 3 5-6"/></>,};
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export function PracticeList({ initialFilter = 'すべて', initialPage = 'practice', initialStatus, initialCarpool, initialComment, initialMemberFilter = '全員', isAdmin = true }: { initialFilter?: Filter; initialPage?: 'home'|'practice'|'members'|'admin'|'register'; initialStatus?: '参加'|'不参加'|'未回答'; initialCarpool?: '必要'|'不要'; initialComment?: string; initialMemberFilter?: '全員'|'参加予定'|'配車希望'; isAdmin?: boolean }) {
 const [filter,setFilter]=useState<Filter>(initialFilter);
 const [items,setItems]=useState<Practice[]>(initialPractices);
 const [selected,setSelected]=useState<Practice|null>(initialPage==='register'?initialPractices[0]:null);
 const [tab,setTab]=useState<'practice'|'home'|'members'|'admin'>(initialPage==='register'||(initialPage==='admin'&&!isAdmin)?'practice':initialPage);
 const [registering,setRegistering]=useState(initialPage==='register');
 const [answer,setAnswer]=useState<'参加'|'不参加'|'未回答'>(initialStatus??'未回答');
 const [carpool,setCarpool]=useState<'必要'|'不要'|undefined>(initialCarpool);
 const [comment,setComment]=useState(initialComment??'');
 const [title,setTitle]=useState('');
 const [date,setDate]=useState('');
 const [startTime,setStartTime]=useState('');
 const [endTime,setEndTime]=useState('');
 const [place,setPlace]=useState('');
 const [detail,setDetail]=useState('');
 const [adminError,setAdminError]=useState('');
 const [created,setCreated]=useState(false);
 const [announceTarget,setAnnounceTarget]=useState<number|null>(null);
 const [announceDone,setAnnounceDone]=useState(false);
 const sorted=[...items].sort((a,b)=>b.start.localeCompare(a.start)||b.id-a.id);
 const shown=sorted.filter(p=>filter==='すべて'||(filter==='受付中'?p.status==='受付中':p.response==='参加'));
 const openRegistration=(p:Practice)=>{setSelected(p);setAnswer(p.response);setCarpool(p.carpool);setComment(p.comment??'');setRegistering(true)};
 const backToList=()=>{setRegistering(false);setSelected(null);setTab('practice')};
 const saveAnswer=()=>{
   if(!selected||(answer==='参加'&&!carpool))return;
   setItems(prev=>prev.map(p=>p.id===selected.id?{...p,response:answer,carpool,comment}:p));
   backToList();
 };
 const openAnnouncement=(id:number)=>{if(!isAdmin)return;setAnnounceTarget(id);setAnnounceDone(false)};
 const createPractice=()=>{
   if(!title.trim()||!date||!startTime||!endTime||!place.trim()){setAdminError('タイトル・開催日・開始／終了時刻・場所を入力してください。');return}
   if(endTime<=startTime){setAdminError('終了時刻は開始時刻より後にしてください。');return}
   const dateValue=new Date(date+'T00:00:00');
   const p:Practice={id:Math.max(0,...items.map(p=>p.id))+1,start:date+'T'+startTime,date:(dateValue.getMonth()+1).toString().padStart(2,'0')+'/'+dateValue.getDate().toString().padStart(2,'0'),day:['日','月','火','水','木','金','土'][dateValue.getDay()],title:title.trim(),time:startTime+' – '+endTime,place:place.trim(),status:'受付中',response:'未回答',detail:detail.trim()};
   setItems(prev=>[...prev,p]);setAdminError('');setCreated(true);setTitle('');setDate('');setStartTime('');setEndTime('');setPlace('');setDetail('');
 };
 if(!registering&&(tab==='home'||tab==='members'))return <HomeMembers key={tab} initialPage={tab} initialFilter={initialMemberFilter} onNavigate={page=>{setTab(page);setSelected(null);setRegistering(false)}}/>;
 return <div className="tm-stage"><div className="tm-phone pl-phone" lang="ja">
  <header className="tm-header"><button className="tm-back" aria-label="戻る" onClick={()=>{if(registering){backToList()}else if(selected){setSelected(null)}else{setTab('practice')}}}><Glyph name="back"/></button><h1>{registering?'参加登録':tab==='admin'?'管理':tab==='home'?'ホーム':tab==='members'?'メンバー':selected?'練習詳細':'練習予定'}</h1><span className="tm-header-space"/></header>
  {registering&&selected?<main className="tm-content pl-content">
    <article className="tm-practice tm-card" style={{backgroundImage:'linear-gradient(90deg,rgba(255,255,255,.98),rgba(255,255,255,.89) 49%,rgba(255,255,255,.23)),url('+hero+')'}}>
      <div className="tm-hero-status"><span className="tm-tennis-logo">◉</span><span className="tm-accepting">{selected.status}</span></div>
      <h2>{selected.date}（{selected.day}）{selected.title}</h2>
      <div className="tm-hero-line"><RegistrationIcon name="clock"/><span>{selected.time}</span></div>
      <div className="tm-hero-line"><RegistrationIcon name="pin"/><span>{selected.place}</span></div>
      {selected.detail&&<div className="tm-hero-line tm-hero-detail"><RegistrationIcon name="note"/><span>{selected.detail}</span></div>}
    </article>
    {selected.status==='終了'?<section className="tm-section tm-card"><h2>終了済みの練習です</h2><p>回答の変更はできません。</p></section>:<>
      <Section title="参加予定" icon="users" badge="必須"><div className="tm-choice-group">{(['参加','不参加','未回答'] as const).map(s=><Choice key={s} label={s==='未回答'?'未定':s} checked={answer===s} onClick={()=>setAnswer(s)}/>)}</div></Section>
      {answer==='参加'&&<Section title="配車の希望" icon="car" badge="必須"><div className="tm-choice-group"><Choice label="配車必要" horizontal checked={carpool==='必要'} onClick={()=>setCarpool('必要')}/><Choice label="不要" horizontal checked={carpool==='不要'} onClick={()=>setCarpool('不要')}/></div></Section>}
      <Section title="コメント" icon="message" badge="任意"><div className="tm-textarea-wrap"><textarea maxLength={200} aria-label="コメント" placeholder="コメントがあれば入力してください。" value={comment} onChange={e=>setComment(e.target.value)}/><span>{comment.length} / 200</span></div></Section>
      <button className="tm-submit" disabled={answer==='参加'&&!carpool} onClick={saveAnswer}>この内容で登録 <span aria-hidden="true">›</span></button>
    </>}
    <button className="pl-back-list" onClick={backToList}>← 練習一覧に戻る</button>
    <p className="tm-demo-note">Storybookプレビューです。実際の出欠データは更新しません。</p>
  </main>:tab==='admin'&&isAdmin?<main className="tm-content pl-content">
    <div className="pl-intro"><span className="pl-eyebrow">MANAGEMENT</span><h2>練習を追加</h2><p>新しい練習を作成すると練習一覧に表示されます。</p></div>
    <section className="tm-card pl-admin-form">
      <label>練習タイトル <span>必須</span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="例：午前練習"/></label>
      <label>開催日 <span>必須</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <div className="pl-admin-times"><label>開始時刻 <span>必須</span><input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}/></label><label>終了時刻 <span>必須</span><input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}/></label></div>
      <label>場所 <span>必須</span><input value={place} onChange={e=>setPlace(e.target.value)} placeholder="例：市営テニスコート A/B"/></label>
      <label>練習内容 <span>任意</span><textarea value={detail} onChange={e=>setDetail(e.target.value)} placeholder="練習内容や連絡事項"/></label>
      {adminError&&<p className="pl-form-error" role="alert">{adminError}</p>}
      {created&&<p className="pl-form-success" role="status">練習を追加しました。練習一覧で確認できます。</p>}
      <button className="pl-primary" onClick={createPractice}>新しい練習を追加 <Glyph name="chevron"/></button>
      <button className="pl-back-list" onClick={()=>{setTab('practice');setSelected(null)}}>練習一覧を見る →</button>
    </section>
    <section className="tm-card pl-admin-announcements">
      <div className="pl-announcement-heading">
        <span className="pl-announcement-kicker">LINE NOTIFICATION</span>
        <h2>LINEで練習を通知</h2>
        <p>通知する練習を選択して、LINEグループへ案内します。</p>
      </div>
      <div className="pl-announcement-list">
        {sorted.filter(p=>p.status==='受付中').map(p=><div className="pl-announcement-item" key={p.id}>
          <div className="pl-announcement-date"><strong>{p.date}</strong><span>{p.day}</span></div>
          <div className="pl-announcement-info"><strong>{p.title}</strong><span><Glyph name="clock"/>{p.time}</span><span><Glyph name="pin"/>{p.place}</span></div>
          <button type="button" className="pl-line-button" onClick={()=>openAnnouncement(p.id)}>LINE送信 <Glyph name="chevron"/></button>
        </div>)}
      </div>
      {announceTarget!==null&&(()=>{
        const p=items.find(item=>item.id===announceTarget);
        return p?<div className="pl-announcement-confirm" role="group" aria-label="LINE送信の確認">
          <div className="pl-announcement-confirm-head"><span className="pl-announcement-kicker">CONFIRMATION</span><h3>LINEグループに送信しますか？</h3><p>以下の練習案内を確認してください。</p></div>
          <div className="pl-announcement-preview"><strong>{p.date}（{p.day}）{p.title}</strong><span><Glyph name="clock"/>{p.time}</span><span><Glyph name="pin"/>{p.place}</span></div>
          <div className="pl-announcement-actions"><button type="button" className="pl-primary" onClick={()=>{setAnnounceTarget(null);setAnnounceDone(true)}}>送信する（プレビュー） <Glyph name="chevron"/></button><button type="button" className="pl-announcement-cancel" onClick={()=>setAnnounceTarget(null)}>キャンセル</button></div>
        </div>:null;
      })()}
      {announceDone&&<p className="pl-form-success" role="status">送信操作のプレビューを完了しました。実際のLINEには送信していません。</p>}
    </section>
    <p className="tm-demo-note">管理者用の画面イメージです。Storybookでは実際の練習は作成しません。</p>
  </main>:tab!=='practice'?<main className="tm-content"><div className="tm-card pl-empty"><h2>{tab==='home'?'ホーム':'メンバー'}</h2><p>こちらは練習一覧のデザイン確認用です。</p><button onClick={()=>setTab('practice')}>練習予定に戻る</button></div></main>:
  selected?<main className="tm-content pl-content">
   <article className="tm-card pl-feature" style={{backgroundImage:'linear-gradient(90deg,rgba(255,255,255,.97),rgba(255,255,255,.79) 54%,rgba(255,255,255,.1)),url('+hero+')'}}>
    <span className={'pl-pill '+(selected.status==='終了'?'pl-muted':'')}>{selected.status}</span><h2>{selected.date}（{selected.day}）{selected.title}</h2>
    <p><Glyph name="clock"/>{selected.time}</p><p><Glyph name="pin"/>{selected.place}</p><p className="pl-detail-text">{selected.detail}</p>
   </article><section className="tm-card pl-detail-panel"><h2>あなたの回答</h2><span className={'pl-response '+(selected.response==='参加'?'pl-going':'')}>{items.find(p=>p.id===selected.id)?.response??selected.response}</span><p>参加登録画面で回答を確認・変更できます。</p><button className="pl-primary" onClick={()=>openRegistration(items.find(p=>p.id===selected.id)??selected)}>参加登録へ進む <Glyph name="chevron"/></button></section>
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
  <footer className="tm-bottom-nav" aria-label="画面切り替え">{([{key:'home',label:'ホーム',icon:'home'},{key:'practice',label:'練習',icon:'calendar'},{key:'members',label:'メンバー',icon:'users'},{key:'admin',label:'管理',icon:'settings'}].filter(x=>isAdmin||x.key!=='admin') as Array<{key:'home'|'practice'|'members'|'admin';label:string;icon:'home'|'calendar'|'users'|'settings'}>).map(x=><button type="button" key={x.key} className={tab===x.key?'active':''} onClick={()=>{if(x.key==='admin'&&!isAdmin)return;setTab(x.key);setSelected(null);setRegistering(false)}}><Glyph name={x.icon}/><span>{x.label}</span></button>)}</footer>
 </div></div>;
}
