import hero from '../assets/tennis-image.png';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Attendance, AttendanceStatus, CarpoolStatus, Practice, UserInfo } from '../types';
import './MemberPage.css';

const WEEKDAYS = ['日','月','火','水','木','金','土'];
function formatDate(date: string) {
  const parts = date.split('-');
  return `${Number(parts[1])}/${parts[2]}（${WEEKDAYS[new Date(date+'T00:00:00').getDay()]}）`;
}
function localToday() {
  const d=new Date();
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
const PAGE_SIZE=10;
type Filter='すべて'|'参加予定';

export function MemberPage({userInfo,onSaved}:{userInfo:UserInfo;onSaved?:()=>void}) {
  const [practices,setPractices]=useState<Practice[]>([]);
  const [attendances,setAttendances]=useState<Record<string,Attendance>>({});
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [historyOnly,setHistoryOnly]=useState(false);
  const [filter,setFilter]=useState<Filter>('すべて');
  const [pastCount,setPastCount]=useState(PAGE_SIZE);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [answer,setAnswer]=useState<AttendanceStatus>('未回答');
  const [carpool,setCarpool]=useState<CarpoolStatus|undefined>();
  const [loaded,setLoaded]=useState(false);

  const load=useCallback(async()=>{
    setError('');
    try {
      const list=await api.getPractices();
      setPractices(list);
      const records=await Promise.all(list.map(p=>api.getAttendance(p.id)));
      const own:Record<string,Attendance>={};
      list.forEach((p,i)=>{const found=records[i].find(a=>a.lineUserId===userInfo.userId);if(found)own[p.id]=found});
      setAttendances(own);
    } catch {setError('練習・出欠情報の読み込みに失敗しました');}
    finally {setLoaded(true);}
  },[userInfo.userId]);
  useEffect(()=>{void load()},[load]);

  const sorted=useMemo(()=>[...practices].sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time)),[practices]);
  const today=localToday();
  const upcoming=sorted.filter(p=>p.date>=today);
  const past=sorted.filter(p=>p.date<today);
  const shown=upcoming.filter(p=>filter==='すべて'||attendances[p.id]?.status==='参加');
  const selected=practices.find(p=>p.id===selectedId);
  const readOnly=!!selected&&(selected.date<today||selected.status!=='開催');

  function openPractice(p:Practice) {
    setSelectedId(p.id);
    setAnswer(attendances[p.id]?.status??'未回答');
    setCarpool(attendances[p.id]?.carpool);
    setError('');
  }
  async function save() {
    if(!selected||readOnly||saving||(answer==='参加'&&!carpool))return;
    setSaving(true);setError('');
    try {
      const saved=await api.upsertAttendance(userInfo.userId,userInfo.displayName,selected.id,answer,answer==='参加'?carpool:undefined);
      setAttendances(prev=>({...prev,[selected.id]:saved}));
      onSaved?.();
      setSelectedId(null);
    } catch {setError('出欠の登録に失敗しました');}
    finally {setSaving(false);}
  }
  const renderCard=(p:Practice)=> {
    const status=attendances[p.id]?.status??'未回答';
    const finished=p.date<today;
    return <button type="button" key={p.id} className="a-practice-card" style={{backgroundImage:`linear-gradient(90deg,rgba(255,255,255,.98),rgba(255,255,255,.89) 49%,rgba(255,255,255,.23)),url(${hero})`,backgroundSize:"cover",backgroundPosition:"center"}} onClick={()=>openPractice(p)}>
      <div className="a-practice-card-top"><span className={'a-chip '+(p.status!=='開催'||finished?'muted':'')}>{p.status!=='開催'?p.status:finished?'終了':'受付中'}</span><span className={'a-chip response '+(status==='参加'?'going':status==='不参加'?'absent':'')}>{status}</span></div>
      <div className="a-practice-card-main"><span className={'a-practice-date '+(finished?'past':'')}><strong>{p.date.slice(5).replace('-','/')}</strong><small>{WEEKDAYS[new Date(p.date+'T00:00:00').getDay()]}曜日</small></span><span className="a-practice-copy"><strong>{p.title}</strong><small>◷ {p.time}{p.endTime?' – '+p.endTime:''}</small><small>⌖ {p.location}</small></span><span className="a-chevron">›</span></div>
    </button>;
  };
  return <div className="a-practice-page">
    {selected?<><button className="a-back" type="button" onClick={()=>setSelectedId(null)}>← 練習一覧に戻る</button><div className="a-practice-hero" style={{backgroundImage:`linear-gradient(90deg,rgba(255,255,255,.98),rgba(255,255,255,.89) 49%,rgba(255,255,255,.23)),url(${hero})`}}><span className={'a-chip '+(readOnly?'muted':'')}>{selected.status!=='開催'?selected.status:readOnly?'終了':'受付中'}</span><h2>{formatDate(selected.date)} {selected.title}</h2><p>◷ {selected.time}{selected.endTime?' – '+selected.endTime:''}</p><p>⌖ {selected.location}</p>{selected.description&&<p>{selected.description}</p>}</div>
      <div className="a-practice-detail"><h3>あなたの回答</h3>{readOnly?<><span className="a-chip response">{attendances[selected.id]?.status??'未回答'}</span>{attendances[selected.id]?.carpool&&<p>配車：{attendances[selected.id].carpool}</p>}<p className="a-muted-text">過去・中止済みの練習は閲覧専用です。</p></>:<>
        <fieldset className="a-choice-set"><legend>参加予定</legend>{(['参加','不参加','未回答'] as const).map(s=><label key={s} className={'a-choice '+(answer===s?'selected':'')}><input type="radio" name="attendance" checked={answer===s} onChange={()=>{setAnswer(s);if(s!=='参加')setCarpool(undefined)}}/>{s==='未回答'?'未定':s}</label>)}</fieldset>
        {answer==='参加'&&<fieldset className="a-choice-set"><legend>配車の希望</legend>{(['必要','不要'] as const).map(v=><label key={v} className={'a-choice '+(carpool===v?'selected':'')}><input type="radio" name="carpool" checked={carpool===v} onChange={()=>setCarpool(v)}/>{v==='必要'?'配車必要':'不要'}</label>)}</fieldset>}
        <button className="a-primary" type="button" disabled={saving||(answer==='参加'&&!carpool)} onClick={()=>void save()}>{saving?'保存中...':'この内容で登録する'}</button>
      </>}</div></>:
    <><div className="a-page-intro"><span>TENNIS CLUB</span><h2>{historyOnly?'過去の練習':'次の練習をチェック'}</h2><p>参加予定や練習の詳細を確認できます。</p></div>
      <button type="button" className="a-history-switch" onClick={()=>{setHistoryOnly(v=>!v);setPastCount(PAGE_SIZE)}}>{historyOnly?'← 今後の練習へ戻る':'過去の練習を見る →'}</button>
      {!historyOnly&&<><div className="a-filter">{(['すべて','参加予定'] as const).map(f=><button type="button" key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div><div className="a-list-title"><h3>今後の練習</h3><span>{shown.length}件</span></div>{shown.map(renderCard)}{!shown.length&&<p className="a-empty">該当する練習はありません</p>}</>}
      {historyOnly&&<><div className="a-list-title"><h3>過去の練習</h3><span>{past.length}件</span></div>{past.slice(0,pastCount).map(renderCard)}{!past.length&&<p className="a-empty">過去の練習はありません</p>}{pastCount<past.length&&<button type="button" className="a-more" onClick={()=>setPastCount(n=>n+PAGE_SIZE)}>もっと見る（残り{past.length-pastCount}件）</button>}</>}
    </>}
    {!loaded&&<p className="a-muted-text">読み込み中...</p>}
    {error&&<p className="a-error" role="alert">{error}</p>}
  </div>;
}
