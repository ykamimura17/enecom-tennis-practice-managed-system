import hero from '../../../design-system/src/assets/tennis-image.png';
import { useCallback, useEffect, useState } from 'react';
import liff from '@line/liff';
import { api } from '../api/client';
import type { Attendance, Practice, PracticeStatus, UserInfo } from '../types';
import { CreatePracticeForm } from '../components/CreatePracticeForm';
import './AdminPage.css';

type AdminView = 'hub' | 'create' | 'edit' | 'cancel' | 'attendance' | 'announce';
const entries: {view: Exclude<AdminView,'hub'>;icon:string;title:string;description:string}[]=[
  {view:'create',icon:'＋',title:'練習を追加',description:'新しい練習予定を登録'},
  {view:'edit',icon:'✎',title:'練習を編集',description:'日時・場所・内容を変更'},
  {view:'cancel',icon:'!',title:'中止・中止解除',description:'中止理由の設定と再開'},
  {view:'attendance',icon:'✓',title:'来場実績を記録',description:'参加者の来場状況をチェック'},
  {view:'announce',icon:'↗',title:'LINEで通知',description:'練習案内をLINEに送信'},
];

export function AdminPage({userInfo,onPracticeCreated}:{userInfo:UserInfo;onPracticeCreated?:()=>void}) {
  const [view,setView]=useState<AdminView>('hub');
  const [practices,setPractices]=useState<Practice[]>([]);
  const [targetId,setTargetId]=useState('');
  const [editing,setEditing]=useState<Practice|null>(null);
  const [showCreate,setShowCreate]=useState(false);
  const [attendances,setAttendances]=useState<Attendance[]>([]);
  const [loadingAttendance,setLoadingAttendance]=useState(false);
  const [busyId,setBusyId]=useState('');
  const [reason,setReason]=useState<Exclude<PracticeStatus,'開催'>>('雨天中止');
  const [pendingMessage,setPendingMessage]=useState<Record<string,unknown>|null>(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  const load=useCallback(async()=>{
    try{const records=await api.getPractices();setPractices([...records].sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time)));}
    catch{setError('練習一覧の取得に失敗しました');}
  },[]);
  useEffect(()=>{void load()},[load]);
  const target=practices.find(p=>p.id===targetId);
  useEffect(()=>{
    if(view!=='attendance'||!targetId)return;
    let active=true;
    setLoadingAttendance(true);
    api.getAttendance(targetId).then(records=>{if(active)setAttendances(records)}).catch(()=>{if(active)setError('出欠データの取得に失敗しました')}).finally(()=>{if(active)setLoadingAttendance(false)});
    return()=>{active=false};
  },[targetId,view]);

  function open(viewName:AdminView){setView(viewName);setTargetId('');setNotice('');setError('');setPendingMessage(null);setAttendances([]);setShowCreate(false);}
  async function create(data:Omit<Practice,'id'|'createdAt'|'status'>){
    await api.createPractice(userInfo.userId,data);
    await load();onPracticeCreated?.();setNotice('練習を追加しました');setShowCreate(false);
  }
  async function update(data:Omit<Practice,'id'|'createdAt'|'status'>){
    if(!editing)return;
    await api.updatePractice(userInfo.userId,editing.id,data);
    await load();onPracticeCreated?.();setNotice('練習を更新しました');setEditing(null);
  }
  async function setStatus(status:PracticeStatus) {
    if(!target||busyId)return;
    setBusyId(target.id);setError('');
    try{await api.updatePracticeStatus(userInfo.userId,target.id,status);setPractices(prev=>prev.map(p=>p.id===target.id?{...p,status}:p));onPracticeCreated?.();setNotice(status==='開催'?'中止を解除しました':'練習を中止しました');}
    catch{setError('練習の状態を変更できませんでした');}
    finally{setBusyId('');}
  }
  async function toggleActual(record:Attendance) {
    setBusyId(record.id);setError('');
    try{const updated=await api.updateActual(userInfo.userId,record.id,!record.actual);setAttendances(prev=>prev.map(a=>a.id===updated.id?updated:a));}
    catch{setError('来場記録の更新に失敗しました');}
    finally{setBusyId('');}
  }
  async function prepareMessage() {
    if(!target)return;
    setBusyId(target.id);setError('');
    try{const result=await api.announcePractice(userInfo.userId,target.id);setPendingMessage(result.message);}
    catch{setError('LINE案内の取得に失敗しました');}
    finally{setBusyId('');}
  }
  function shareMessage(){
    if(!pendingMessage)return;
    const message=pendingMessage;
    setPendingMessage(null);
    if(import.meta.env.VITE_MOCK_MODE==='true'){setNotice('モックモードのためLINE送信は省略しました');return;}
    if(!liff.isApiAvailable('shareTargetPicker')){setError('LINEアプリ内で開いてください');return;}
    // LINEのshareTargetPickerはクリック直後に起動する必要があります。
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void liff.shareTargetPicker([message as any]).then(()=>setNotice('LINE送信操作を完了しました')).catch(()=>setError('LINE送信を実行できませんでした'));
  }

  return <section className="a-admin-page">
    {view==='hub'?<>
      <div className="a-admin-intro" style={{backgroundImage:`linear-gradient(90deg,rgba(255,255,255,.97),rgba(255,255,255,.86) 55%,rgba(255,255,255,.25)),url(${hero})`,backgroundSize:"cover",backgroundPosition:"center"}}><span>MANAGEMENT</span><h2>管理メニュー</h2><p>操作したい機能を選択してください。</p></div>
      <div className="a-admin-menu">{entries.map(item=><button type="button" key={item.view} onClick={()=>open(item.view)}><span className="a-admin-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.description}</small></span><em>›</em></button>)}</div>
    </>:<>
      <button type="button" className="a-admin-back" onClick={()=>open('hub')}>← 管理メニューに戻る</button>
      <div className="a-admin-intro" style={{backgroundImage:`linear-gradient(90deg,rgba(255,255,255,.97),rgba(255,255,255,.86) 55%,rgba(255,255,255,.25)),url(${hero})`,backgroundSize:"cover",backgroundPosition:"center"}}><span>MANAGEMENT</span><h2>{entries.find(item=>item.view===view)?.title}</h2><p>対象の練習を選んで操作してください。</p></div>
      {view!=='create'&&<label className="a-admin-selector">対象の練習
        <select aria-label="操作する練習" value={targetId} onChange={e=>{setTargetId(e.target.value);setError('');setNotice('');setPendingMessage(null)}}>
          <option value="">練習を選択してください</option>
          {practices.map(p=><option key={p.id} value={p.id}>{p.date.replace(/-/g,'/')} {p.title}（{p.status}）</option>)}
        </select>
      </label>}
      {view==='create'&&<button type="button" className="a-admin-primary" onClick={()=>setShowCreate(true)}>＋ 練習の内容を入力</button>}
      {view==='edit'&&target&&<div className="a-admin-panel"><h3>{target.title}</h3><p>{target.date} · {target.time} · {target.location}</p><button type="button" className="a-admin-primary" onClick={()=>setEditing(target)}>練習内容を編集</button></div>}
      {view==='cancel'&&target&&<div className="a-admin-panel"><h3>{target.title}</h3><p>現在の状態：{target.status}</p>{target.status!=='開催'?<button type="button" disabled={!!busyId} className="a-admin-primary" onClick={()=>void setStatus('開催')}>中止を解除する</button>:<><label>中止理由<select value={reason} onChange={e=>setReason(e.target.value as Exclude<PracticeStatus,'開催'>)}><option value="雨天中止">雨天中止</option><option value="中止">その他の理由で中止</option></select></label><button type="button" disabled={!!busyId} className="a-admin-danger" onClick={()=>void setStatus(reason)}>この練習を中止する</button></>}</div>}
      {view==='attendance'&&target&&<div className="a-admin-panel"><h3>{target.title} の来場実績</h3><p>来場者のチェックを切り替えると、その場で保存されます。</p><div className="a-admin-counter">来場 {attendances.filter(a=>a.actual).length} / {attendances.length}人</div>{loadingAttendance?<p>読み込み中...</p>:attendances.length===0?<p>出欠登録がありません</p>:attendances.map(record=><label key={record.id} className="a-admin-person"><span><strong>{record.displayName}</strong><small>{record.status}{record.carpool?' · 配車'+record.carpool:''}</small></span><span><input type="checkbox" checked={!!record.actual} disabled={!!busyId} onChange={()=>void toggleActual(record)}/> 来場</span></label>)}</div>}
      {view==='announce'&&target&&<div className="a-admin-panel"><span className="a-admin-eyebrow">LINE NOTIFICATION</span><h3>{target.title}</h3><p>{target.date} · {target.time} · {target.location}</p>{target.status!=='開催'?<p>中止中の練習は案内を送信できません。</p>:<><button type="button" className="a-admin-primary" disabled={!!busyId} onClick={()=>void prepareMessage()}>LINE送信内容を確認</button>{pendingMessage&&<div className="a-admin-confirm"><p>LINEの送信先を選択しますか？</p><button type="button" className="a-admin-primary" onClick={shareMessage}>送信先を選ぶ</button><button type="button" onClick={()=>setPendingMessage(null)}>キャンセル</button></div>}</>}</div>}
    </>}
    {error&&<p className="a-admin-error" role="alert">{error}</p>}
    {notice&&<p className="a-admin-success" role="status">{notice}</p>}
    {showCreate&&<CreatePracticeForm practices={practices} onSubmit={create} onClose={()=>setShowCreate(false)}/>}
    {editing&&<CreatePracticeForm initialValues={{title:editing.title,date:editing.date,time:editing.time,endTime:editing.endTime,location:editing.location,description:editing.description}} onSubmit={update} onClose={()=>setEditing(null)}/>}
  </section>;
}
