import { useState } from 'react';
import hero from './assets/tennis-image.png';
import { Icon as RegistrationIcon, Section, Choice } from './MobileRegistration';
import { HomeMembers } from './HomeMembers';
import './mobile.css';
import './PracticeList.css';

type Filter = 'すべて' | '受付中' | '参加予定';
type Practice = { id: number; date: string; day: string; title: string; time: string; place: string; status: '受付中' | '終了' | '雨天中止' | '中止'; response: '参加' | '不参加' | '未回答'; detail: string; start: string; carpool?: '必要' | '不要'; comment?: string };
const initialPractices: Practice[] = [
  { id: 1, start: '2026-10-26T10:00', date: '10/26', day: '土', title: '午前練習', time: '10:00 – 12:00', place: '市営テニスコート A/B', status: '受付中', response: '参加', detail: '基礎練習とゲーム練習を行います。' },
  { id: 2, start: '2026-11-02T13:00', date: '11/02', day: '土', title: '午後練習', time: '13:00 – 16:00', place: '市営テニスコート C/D', status: '受付中', response: '未回答', detail: 'ラリー練習とダブルスゲームを予定しています。' },
  { id: 3, start: '2026-11-09T09:00', date: '11/09', day: '土', title: '午前練習', time: '09:00 – 12:00', place: '中央スポーツセンター', status: '受付中', response: '不参加', detail: 'サーブ・レシーブの基礎練習を行います。' },
  { id: 4, start: '2026-10-19T10:00', date: '10/19', day: '土', title: 'ゲーム練習', time: '10:00 – 12:00', place: '市営テニスコート A/B', status: '終了', response: '参加', detail: 'ダブルス中心の練習でした。' },
  ...Array.from({length:12},(_,i)=>{const d=new Date(2026,9,12-i*7);const yyyy=d.getFullYear();const mm=String(d.getMonth()+1).padStart(2,'0');const dd=String(d.getDate()).padStart(2,'0');return {id:5+i,start:yyyy+'-'+mm+'-'+dd+'T10:00',date:mm+'/'+dd,day:['日','月','火','水','木','金','土'][d.getDay()],title:i%3===0?'ゲーム練習':'定期練習',time:'10:00 – 12:00',place:i%2===0?'市営テニスコート A/B':'中央スポーツセンター',status:(i===3?'雨天中止':'終了') as Practice['status'],response:(i%3===0?'参加':i%3===1?'不参加':'未回答') as Practice['response'],detail:i===3?'雨天のため中止となりました。':'ダブルスと基礎練習を行いました。'};}),
];
function Glyph({ name }: { name: 'back'|'calendar'|'pin'|'clock'|'chevron'|'home'|'users'|'check'|'settings' }) {
 const paths = { back:<path d="m15 18-6-6 6-6"/>,calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,pin:<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,chevron:<path d="m9 18 6-6-6-6"/>,home:<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>,users:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><circle cx="17" cy="8" r="2"/></>,settings:<><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/></>,check:<><rect x="4" y="4" width="16" height="18" rx="2"/><path d="m8 14 3 3 5-6"/></>,};
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export function PracticeList({ initialFilter = 'すべて', initialPage = 'practice', initialStatus, initialCarpool, initialComment, initialMemberFilter = '全員', isAdmin = true, initialHistoryOnly = false }: { initialFilter?: Filter; initialPage?: 'home'|'practice'|'members'|'admin'|'register'; initialStatus?: '参加'|'不参加'|'未回答'; initialCarpool?: '必要'|'不要'; initialComment?: string; initialMemberFilter?: '全員'|'参加予定'|'配車希望'; isAdmin?: boolean; initialHistoryOnly?: boolean }) {
 const [filter,setFilter]=useState<Filter>(initialFilter);
 const [visiblePastCount,setVisiblePastCount]=useState(10);
 const [historyOnly,setHistoryOnly]=useState(initialHistoryOnly);
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
 const [adminView,setAdminView]=useState<'hub'|'create'|'edit'|'cancel'|'attendance'|'announce'>('hub');
 const [adminTarget,setAdminTarget]=useState<number|null>(null);
 const [cancelReason,setCancelReason]=useState<'雨天中止'|'中止'>('雨天中止');
 const [actuals,setActuals]=useState<Record<number,Record<string,boolean>>>({});
 const [adminNotice,setAdminNotice]=useState('');
 const participants=[{id:'a',name:'山田 花子',status:'参加',carpool:'不要'},{id:'b',name:'佐藤 太郎',status:'参加',carpool:'必要'},{id:'c',name:'田中 美咲',status:'参加',carpool:'不要'},{id:'d',name:'鈴木 健',status:'不参加',carpool:'不要'},{id:'e',name:'高橋 葵',status:'未回答',carpool:'不要'}] as const;
 const activePractice=items.find(p=>p.id===adminTarget);
 const openAdmin=(view:typeof adminView)=>{setAdminView(view);setAdminTarget(null);setAdminError('');setAdminNotice('');setAnnounceTarget(null);setAnnounceDone(false);if(view==='create'){setTitle('');setDate('');setStartTime('');setEndTime('');setPlace('');setDetail('')}};
 const selectAdminPractice=(p:Practice)=>{setAdminTarget(p.id);setAdminError('');setAdminNotice('');if(adminView==='edit'){setTitle(p.title);setDate(p.start.slice(0,10));setStartTime(p.start.slice(11,16));setEndTime(p.time.split('–')[1]?.trim()??'');setPlace(p.place);setDetail(p.detail)}};
 const editPractice=()=>{if(!activePractice)return;if(!title.trim()||!date||!startTime||!endTime||!place.trim()){setAdminError('必須項目を入力してください。');return}if(endTime<=startTime){setAdminError('終了時刻は開始時刻より後にしてください。');return}const d=new Date(date+'T00:00:00');setItems(prev=>prev.map(p=>p.id===activePractice.id?{...p,title:title.trim(),start:date+'T'+startTime,date:String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getDate()).padStart(2,'0'),day:['日','月','火','水','木','金','土'][d.getDay()],time:startTime+' – '+endTime,place:place.trim(),detail:detail.trim()}:p));setAdminNotice('練習内容を更新しました。');setAdminTarget(null)};
 const setPracticeStatus=(status:Practice['status'])=>{if(!activePractice)return;setItems(prev=>prev.map(p=>p.id===activePractice.id?{...p,status}:p));setAdminNotice(status==='受付中'?'中止を解除しました。':'練習を中止しました。');setAdminTarget(null)};
 const goAdminHub=()=>{setAdminView('hub');setAdminTarget(null);setAdminError('');setAnnounceTarget(null)};
 const sorted=[...items].sort((a,b)=>b.start.localeCompare(a.start)||b.id-a.id);
 const now=new Date();const today=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
 const upcoming=sorted.filter(p=>p.start.slice(0,10)>=today);
 const past=sorted.filter(p=>p.start.slice(0,10)<today);
 const shown=upcoming.filter(p=>filter==='すべて'||(filter==='受付中'?p.status==='受付中':p.response==='参加'));
 const isPast=(p:Practice)=>p.start.slice(0,10)<today;
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
 if(!registering&&(tab==='home'||tab==='members'))return <HomeMembers key={tab} initialPage={tab} initialFilter={initialMemberFilter} isAdmin={isAdmin} onNavigate={page=>{setTab(page);setSelected(null);setRegistering(false);if(page==='admin')goAdminHub()}}/>;
 return <div className="tm-stage"><div className="tm-phone pl-phone" lang="ja">
  <header className="tm-header"><button className="tm-back" aria-label="戻る" onClick={()=>{if(registering){backToList()}else if(tab==='admin'&&adminView!=='hub'){goAdminHub()}else if(selected){setSelected(null)}else{setTab('practice')}}}><Glyph name="back"/></button><h1>{registering?'参加登録':tab==='admin'?(adminView==='hub'?'管理':({create:'練習を追加',edit:'練習を編集',cancel:'中止・再開',attendance:'来場実績',announce:'LINE通知'} as const)[adminView]):tab==='home'?'ホーム':tab==='members'?'メンバー':selected?'練習詳細':historyOnly?'過去の練習':'練習予定'}</h1><span className="tm-header-space"/></header>
  {registering&&selected?<main className="tm-content pl-content">
    <article className="tm-practice tm-card" style={{backgroundImage:'linear-gradient(90deg,rgba(255,255,255,.98),rgba(255,255,255,.89) 49%,rgba(255,255,255,.23)),url('+hero+')'}}>
      <div className="tm-hero-status"><span className="tm-tennis-logo">◉</span><span className="tm-accepting">{selected.status}</span></div>
      <h2>{selected.date}（{selected.day}）{selected.title}</h2>
      <div className="tm-hero-line"><RegistrationIcon name="clock"/><span>{selected.time}</span></div>
      <div className="tm-hero-line"><RegistrationIcon name="pin"/><span>{selected.place}</span></div>
      {selected.detail&&<div className="tm-hero-line tm-hero-detail"><RegistrationIcon name="note"/><span>{selected.detail}</span></div>}
    </article>
    {(selected.status==='終了'||selected.status==='雨天中止'||selected.status==='中止'||isPast(selected))?<section className="tm-section tm-card"><h2>過去または中止済みの練習です</h2><p>回答の変更はできません。</p></section>:<>
      <Section title="参加予定" icon="users" badge="必須"><div className="tm-choice-group">{(['参加','不参加','未回答'] as const).map(s=><Choice key={s} label={s==='未回答'?'未定':s} checked={answer===s} onClick={()=>setAnswer(s)}/>)}</div></Section>
      {answer==='参加'&&<Section title="配車の希望" icon="car" badge="必須"><div className="tm-choice-group"><Choice label="配車必要" horizontal checked={carpool==='必要'} onClick={()=>setCarpool('必要')}/><Choice label="不要" horizontal checked={carpool==='不要'} onClick={()=>setCarpool('不要')}/></div></Section>}
      <Section title="コメント" icon="message" badge="任意"><div className="tm-textarea-wrap"><textarea maxLength={200} aria-label="コメント" placeholder="コメントがあれば入力してください。" value={comment} onChange={e=>setComment(e.target.value)}/><span>{comment.length} / 200</span></div></Section>
      <button className="tm-submit" disabled={answer==='参加'&&!carpool} onClick={saveAnswer}>この内容で登録 <span aria-hidden="true">›</span></button>
    </>}
    <button className="pl-back-list" onClick={backToList}>← 練習一覧に戻る</button>
    <p className="tm-demo-note">Storybookプレビューです。実際の出欠データは更新しません。</p>
  </main>:tab==='admin'&&isAdmin?<main className="tm-content pl-content">
    {adminView==='hub'?<>
      <div className="pl-intro"><span className="pl-eyebrow">MANAGEMENT</span><h2>管理メニュー</h2><p>操作したい機能を選択してください。</p></div>
      <div className="pl-admin-hub">
        {([{view:'create',icon:'calendar',title:'練習を追加',desc:'新しい練習予定を登録'},{view:'edit',icon:'settings',title:'練習を編集',desc:'日時・場所・内容を変更'},{view:'cancel',icon:'check',title:'中止・中止解除',desc:'中止理由の設定と再開'},{view:'attendance',icon:'users',title:'来場実績を記録',desc:'参加者の来場状況をチェック'},{view:'announce',icon:'chevron',title:'LINEで通知',desc:'練習案内をLINEに送信'}] as const).map(item=><button type="button" className="tm-card pl-admin-menu-card" key={item.view} onClick={()=>openAdmin(item.view)}><span className="pl-admin-menu-icon"><Glyph name={item.icon}/></span><span className="pl-admin-menu-copy"><strong>{item.title}</strong><small>{item.desc}</small></span><Glyph name="chevron"/></button>)}
      </div>
    </>:<>
      <button type="button" className="pl-admin-return" onClick={goAdminHub}>← 管理メニューに戻る</button>
      <div className="pl-intro"><span className="pl-eyebrow">MANAGEMENT</span><h2>{({create:'練習を追加',edit:'練習を編集',cancel:'中止・中止解除',attendance:'来場実績を記録',announce:'LINEで練習を通知'} as const)[adminView]}</h2><p>{({create:'新しい練習の情報を入力してください。',edit:'変更する練習を選択してください。',cancel:'対象の練習を選択して状態を変更します。',attendance:'練習ごとに来場状況を記録します。',announce:'LINEグループへの案内を作成します。'} as const)[adminView]}</p></div>
      {adminNotice&&<p className="pl-form-success" role="status">{adminNotice}</p>}
      {adminView!=='create'&&<div className="pl-admin-selector" role="group" aria-label="練習を選択">{sorted.map(p=><button type="button" key={p.id} className={'tm-card pl-admin-select-item '+(adminTarget===p.id?'is-selected':'')} onClick={()=>selectAdminPractice(p)}><span><strong>{p.date}（{p.day}）{p.title}</strong><small>{p.time} · {p.place}</small></span><span className="pl-admin-select-status">{p.status}</span></button>)}</div>}
      {(adminView==='create'||(adminView==='edit'&&activePractice))&&<section className="tm-card pl-admin-form">
        <label>練習タイトル <span>必須</span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="例：午前練習"/></label>
        <label>開催日 <span>必須</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
        <div className="pl-admin-times"><label>開始時刻 <span>必須</span><input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}/></label><label>終了時刻 <span>必須</span><input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}/></label></div>
        <label>場所 <span>必須</span><input value={place} onChange={e=>setPlace(e.target.value)} placeholder="例：市営テニスコート A/B"/></label>
        <label>練習内容 <span>任意</span><textarea value={detail} onChange={e=>setDetail(e.target.value)} placeholder="練習内容や連絡事項"/></label>
        {adminError&&<p className="pl-form-error" role="alert">{adminError}</p>}
        {created&&adminView==='create'&&<p className="pl-form-success" role="status">練習を追加しました。練習一覧で確認できます。</p>}
        <button type="button" className="pl-primary" onClick={adminView==='create'?createPractice:editPractice}>{adminView==='create'?'新しい練習を追加':'変更を保存'} <Glyph name="chevron"/></button>
      </section>}
      {adminView==='cancel'&&activePractice&&<section className="tm-card pl-admin-action-panel"><h3>{activePractice.title}</h3><p>{activePractice.date} · {activePractice.time}</p>{activePractice.status==='雨天中止'||activePractice.status==='中止'?<><p>現在の状態：{activePractice.status}</p><button type="button" className="pl-primary" onClick={()=>setPracticeStatus('受付中')}>中止を解除して再開</button></>:<><label className="pl-admin-reason">中止理由<select value={cancelReason} onChange={e=>setCancelReason(e.target.value as '雨天中止'|'中止')}><option value="雨天中止">雨天中止</option><option value="中止">その他の理由で中止</option></select></label><button type="button" className="pl-admin-danger" onClick={()=>setPracticeStatus(cancelReason)}>この練習を中止する</button></>}</section>}
      {adminView==='attendance'&&activePractice&&<section className="tm-card pl-admin-action-panel"><h3>{activePractice.title} の来場記録</h3><p>来場したメンバーをチェックしてください。</p><div className="pl-admin-attendance-count">来場 {participants.filter(p=>actuals[activePractice.id]?.[p.id]).length} / {participants.length} 人</div>{participants.map(person=><label key={person.id} className="pl-admin-attendance-row"><span><strong>{person.name}</strong><small>{person.status}{person.status==='参加'&&person.carpool==='必要'?' · 配車希望':''}</small></span><span className="pl-admin-actual-control"><input type="checkbox" checked={!!actuals[activePractice.id]?.[person.id]} onChange={e=>setActuals(prev=>({...prev,[activePractice.id]:{...prev[activePractice.id],[person.id]:e.target.checked}}))}/>来場</span></label>)}<p className="pl-admin-helper">チェック内容はこのプレビュー内で保持されます。</p></section>}
      {adminView==='announce'&&activePractice&&<section className="tm-card pl-admin-announcements"><div className="pl-announcement-heading"><span className="pl-announcement-kicker">LINE NOTIFICATION</span><h2>送信内容を確認</h2><p>送信前に練習案内を確認してください。</p></div><div className="pl-announcement-preview"><strong>{activePractice.date}（{activePractice.day}）{activePractice.title}</strong><span><Glyph name="clock"/>{activePractice.time}</span><span><Glyph name="pin"/>{activePractice.place}</span></div>{activePractice.status==='雨天中止'||activePractice.status==='中止'?<p className="pl-form-error">中止中の練習は通知できません。</p>:<><button type="button" className="pl-primary pl-admin-send" onClick={()=>openAnnouncement(activePractice.id)}>LINE送信を確認 <Glyph name="chevron"/></button>{announceTarget===activePractice.id&&<div className="pl-announcement-confirm"><h3>LINEグループに送信しますか？</h3><p>この操作はプレビューです。実際には送信しません。</p><div className="pl-announcement-actions"><button type="button" className="pl-primary" onClick={()=>{setAnnounceTarget(null);setAnnounceDone(true)}}>送信する（プレビュー）</button><button type="button" className="pl-announcement-cancel" onClick={()=>setAnnounceTarget(null)}>キャンセル</button></div></div>}{announceDone&&<p className="pl-form-success" role="status">送信操作のプレビューを完了しました。</p>}</>}</section>}
    </>}
    <p className="tm-demo-note">Storybook用のモックです。実際のデータやLINEには反映しません。</p>
  </main>:tab!=='practice'?<main className="tm-content"><div className="tm-card pl-empty"><h2>{tab==='home'?'ホーム':'メンバー'}</h2><p>こちらは練習一覧のデザイン確認用です。</p><button onClick={()=>setTab('practice')}>練習予定に戻る</button></div></main>:
  selected?<main className="tm-content pl-content">
   <article className="tm-card pl-feature" style={{backgroundImage:'linear-gradient(90deg,rgba(255,255,255,.97),rgba(255,255,255,.79) 54%,rgba(255,255,255,.1)),url('+hero+')'}}>
    <span className={'pl-pill '+(isPast(selected)||selected.status!=='受付中'?'pl-muted':'')}>{isPast(selected)&&selected.status==='受付中'?'終了':selected.status}</span><h2>{selected.date}（{selected.day}）{selected.title}</h2>
    <p><Glyph name="clock"/>{selected.time}</p><p><Glyph name="pin"/>{selected.place}</p><p className="pl-detail-text">{selected.detail}</p>
   </article><section className="tm-card pl-detail-panel"><h2>あなたの回答</h2><span className={'pl-response '+(selected.response==='参加'?'pl-going':'')}>{items.find(p=>p.id===selected.id)?.response??selected.response}</span>{isPast(selected)||selected.status!=='受付中'?<p>過去・中止済みの練習は閲覧のみ可能です。出欠回答の変更はできません。</p>:<><p>参加登録画面で回答を確認・変更できます。</p><button className="pl-primary" onClick={()=>openRegistration(items.find(p=>p.id===selected.id)??selected)}>参加登録へ進む <Glyph name="chevron"/></button></>}</section>
   <button className="pl-back-list" onClick={()=>setSelected(null)}>← 練習一覧へ戻る</button>
  </main>:<main className="tm-content pl-content">
   {historyOnly?<button className="pl-admin-return" type="button" onClick={()=>setHistoryOnly(false)}>← 今後の練習に戻る</button>:<div className="pl-intro"><span className="pl-eyebrow">TENNIS CLUB</span><h2>次の練習をチェック</h2><p>参加予定や練習の詳細を確認できます。</p></div>}
   {!historyOnly&&<><div className="pl-filter" role="group" aria-label="練習予定の絞り込み">{(['すべて','受付中','参加予定'] as const).map(f=><button key={f} type="button" aria-pressed={filter===f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div>
   <div className="pl-list-heading"><h3>今後の練習</h3><span>{shown.length}件</span></div>
   {shown.map((p,i)=><button className={'tm-card pl-item '+(i===0?'pl-item-featured':'')} key={p.id} type="button" onClick={()=>setSelected(p)}>
    {i===0&&<div className="pl-image" style={{backgroundImage:'url('+hero+')'}} aria-hidden="true"/>}
    <div className="pl-item-body"><div className="pl-item-top"><span className={'pl-pill '+(p.status==='終了'?'pl-muted':'')}>{p.status}</span><span className={'pl-response '+(p.response==='参加'?'pl-going':p.response==='不参加'?'pl-notgoing':'')}>{p.response}</span></div>
    <div className="pl-item-title"><div className="pl-date"><strong>{p.date}</strong><span>{p.day}</span></div><div className="pl-name"><h4>{p.title}</h4><p><Glyph name="clock"/>{p.time}</p><p><Glyph name="pin"/>{p.place}</p></div><Glyph name="chevron"/></div></div>
   </button>)}
   {shown.length===0&&<div className="tm-card pl-empty">該当する練習はありません。</div>}</>}
   {past.length>0&&<section className="pl-past-section" aria-label="過去の練習"><div className="pl-list-heading pl-past-heading"><div><span className="pl-past-eyebrow">HISTORY</span><h3>過去の練習</h3></div><span>{past.length}件</span></div><p className="pl-past-description">これまでの練習履歴を確認できます。出欠の変更はできません。</p>
   {past.slice(0,visiblePastCount).map(p=><button className="tm-card pl-item pl-past-item" key={p.id} type="button" onClick={()=>setSelected(p)}><div className="pl-item-body"><div className="pl-item-top"><span className="pl-pill pl-muted">{p.status==='受付中'?'終了':p.status}</span><span className={'pl-response '+(p.response==='参加'?'pl-going':p.response==='不参加'?'pl-notgoing':'')}>{p.response}</span></div><div className="pl-item-title"><div className="pl-date pl-past-date"><strong>{p.date}</strong><span>{p.day}</span></div><div className="pl-name"><h4>{p.title}</h4><p><Glyph name="clock"/>{p.time}</p><p><Glyph name="pin"/>{p.place}</p></div><Glyph name="chevron"/></div></div></button>)}
   {visiblePastCount<past.length&&<button type="button" className="pl-past-more" onClick={()=>setVisiblePastCount(c=>c+10)}>もっと見る <span>（残り{past.length-visiblePastCount}件）</span><Glyph name="chevron"/></button>}
   </section>}
   <p className="tm-demo-note">Storybook用の架空データです。実際の練習情報は変更しません。</p>
  </main>}
  <footer className="tm-bottom-nav" aria-label="画面切り替え">{([{key:'home',label:'ホーム',icon:'home'},{key:'practice',label:'練習',icon:'calendar'},{key:'members',label:'メンバー',icon:'users'},{key:'admin',label:'管理',icon:'settings'}].filter(x=>isAdmin||x.key!=='admin') as Array<{key:'home'|'practice'|'members'|'admin';label:string;icon:'home'|'calendar'|'users'|'settings'}>).map(x=><button type="button" key={x.key} className={tab===x.key?'active':''} onClick={()=>{if(x.key==='admin'&&!isAdmin)return;if(x.key==='admin')goAdminHub();setTab(x.key);setSelected(null);setRegistering(false);if(x.key==='practice')setHistoryOnly(false)}}><Glyph name={x.icon}/><span>{x.label}</span></button>)}</footer>
 </div></div>;
}
