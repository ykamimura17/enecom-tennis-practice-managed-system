import { useState } from 'react';
import type { ReactNode } from 'react';
import './mobile.css';
import './BddPreview.css';

type Status = '参加' | '不参加' | '未定';
type Carpool = '必要' | '不要';
type Practice = { id: string; title: string; when: string; location: string; cancelled?: boolean; past?: boolean; description?: string };
type Answer = { status: Status; carpool?: Carpool; comment: string };
type Member = { id: string; name: string; status: Status; carpool?: Carpool };
const practices: Practice[] = [
  { id: 'a', title: '午前練習', when: '10月26日 10:00〜12:00', location: '市営テニスコート A/B', description: '基礎練習とゲーム練習' },
  { id: 'b', title: '午後練習', when: '11月2日 13:00〜16:00', location: '中央スポーツセンター' },
  { id: 'c', title: '合同練習', when: '11月9日 10:00〜13:00', location: '市営テニスコート C/D', cancelled: true },
  { id: 'p1', title: 'ゲーム練習', when: '10月18日 10:00〜12:00', location: '市営テニスコート A/B', past: true },
  { id: 'p2', title: '基本練習', when: '10月11日 13:00〜16:00', location: '中央スポーツセンター', past: true },
];
const baseAnswers: Record<string, Answer> = {
  a: { status: '参加', carpool: '不要', comment: '' },
  c: { status: '参加', carpool: '必要', comment: '現地集合です' },
  p1: { status: '参加', carpool: '不要', comment: '少し遅れて参加しました' },
  p2: { status: '不参加', comment: '' },
};
const groups: Record<string, Member[]> = {
  a: [
    { id: 'u1', name: '山田 花子', status: '参加', carpool: '不要' },
    { id: 'u2', name: '佐藤 太郎', status: '参加', carpool: '必要' },
    { id: 'u3', name: '田中 美咲', status: '不参加' },
    { id: 'u4', name: '高橋 優', status: '未定' },
  ],
  b: [
    { id: 'u5', name: 'たろう', status: '参加', carpool: '必要' },
    { id: 'u6', name: 'たろう', status: '不参加' },
  ],
  c: [],
  p1: [{ id: 'u2', name: '佐藤 太郎', status: '参加', carpool: '不要' }],
  p2: [],
};
const cloneAnswers = () => Object.fromEntries(Object.entries(baseAnswers).map(([k,v]) => [k,{...v}])) as Record<string,Answer>;
const label = (a?: Answer) => a ? a.status === '参加' ? '参加・配車' + (a.carpool ?? '未選択') : a.status : '未回答';
function Shell({ title, children }: {title:string;children:ReactNode}) {
  return <div className="tm-stage"><div className="tm-phone bdd-phone" lang="ja">
    <header className="tm-header"><span className="bdd-back">‹</span><h1>{title}</h1><span className="tm-header-space"/></header>
    <main className="tm-content bdd-content">{children}<p className="tm-demo-note">Storybookの操作確認用です。Google SheetsやLINEへ送信しません。</p></main>
    <footer className="tm-bottom-nav"><span>ホーム</span><span>練習</span><strong>{title === '参加登録' ? '登録' : 'メンバー'}</strong><span>メンバー</span></footer>
  </div></div>;
}
function Counter({members}:{members:Member[]}) {
  return <div className="bdd-counts"><div className="tm-card"><strong>{members.filter(m=>m.status==='参加').length}人</strong><span>参加</span></div><div className="tm-card"><strong>{members.filter(m=>m.status==='不参加').length}人</strong><span>不参加</span></div></div>;
}
export function BddRegistration({initial='default'}:{initial?:'default'|'empty'|'error'|'save-error'|'past'|'cancelled'}) {
  const [answers,setAnswers] = useState<Record<string,Answer>>(cloneAnswers);
  const [opened,setOpened] = useState<string|null>(initial==='cancelled'?'c':null);
  const [draft,setDraft] = useState<Answer | undefined>();
  const [dirty,setDirty] = useState(false);
  const [pastOpen,setPastOpen] = useState(initial==='past');
  const [visiblePast,setVisiblePast] = useState(10);
  const [switchTo,setSwitchTo] = useState<string|null|undefined>();
  const [toast,setToast] = useState('');
  const [saveError,setSaveError] = useState(false);
  const [saving,setSaving] = useState(false);
  const [simulatedError,setSimulatedError] = useState(initial==='save-error');
  const answerFor = (id:string) => answers[id];
  const change = (patch:Partial<Answer>) => {setDraft(prev => ({status:'未定',comment:'',...prev,...patch}));setDirty(true);setSaveError(false)};
  const actualOpen = (id:string|null) => {
    setOpened(id);setDraft(id ? {...(answerFor(id) ?? {status:'未定',comment:''})} : undefined);
    setDirty(false);setSaveError(false);setToast('');
  };
  const requestOpen = (id:string|null) => {
    if(saving)return;
    if(dirty){setSwitchTo(id);return}
    actualOpen(id);
  };
  const save = () => {
    if(!opened || !draft || saving || (draft.status==='参加'&&!draft.carpool))return;
    setSaving(true);setToast('');
    // 非同期通信の成否を模擬する。実際のAPIは呼ばない。
    Promise.resolve().then(()=>{
      if(simulatedError){setSaveError(true);setSaving(false);setSimulatedError(false);return}
      setAnswers(prev=>({...prev,[opened]:{...draft}}));
      setSaving(false);actualOpen(null);setToast('参加回答を登録しました');
      window.setTimeout(()=>setToast(''),3000);
    });
  };
  const card = (p:Practice) => {
    const open=opened===p.id, readOnly=!!(p.cancelled||p.past);
    const current=answerFor(p.id);
    return <article key={p.id} className={'tm-card bdd-practice '+(readOnly?'bdd-readonly':'')}>
      <button type="button" className="bdd-card-toggle" aria-expanded={open} disabled={saving}
        onClick={()=>requestOpen(open?null:p.id)}>
        <span className="bdd-card-head"><strong>{p.title}</strong><span className={'bdd-pill '+(p.cancelled?'cancel':p.past?'old':'')}>{p.cancelled?'中止':p.past?'終了済み':'受付中'}</span></span>
        <span className="bdd-muted">{p.when}</span><span className="bdd-muted">{p.location}</span>
        <span className="bdd-card-foot"><span>自分の回答：{label(current)}</span><b>{open?'⌃':'⌄'}</b></span>
      </button>
      {open && <div className="bdd-detail">
        {p.description&&<p className="bdd-muted">{p.description}</p>}
        {readOnly ? <>
          <div className="bdd-view-row"><span>参加可否</span><strong>{current?.status??'未回答'}</strong></div>
          {current?.status==='参加'&&<div className="bdd-view-row"><span>配車希望</span><strong>{current.carpool??'未選択'}</strong></div>}
          {current?.comment&&<div><small>自分のコメント</small><p>{current.comment}</p></div>}
          <p className="bdd-notice">🔒 {p.cancelled?'中止済み':'終了済み'}のため変更できません</p>
        </> : <>
          <div className="bdd-field"><strong>参加可否 <small>必須</small></strong>
            <div className="bdd-options">{(['参加','不参加','未定'] as const).map(s=><button key={s} disabled={saving} type="button" aria-pressed={draft?.status===s} onClick={()=>change({status:s})}>{s}</button>)}</div>
          </div>
          {draft?.status==='参加'&&<div className="bdd-field"><strong>配車希望 <small>必須</small></strong><div className="bdd-options">{(['必要','不要'] as const).map(c=><button key={c} disabled={saving} type="button" aria-pressed={draft.carpool===c} onClick={()=>change({carpool:c})}>{c}</button>)}</div></div>}
          <div className="bdd-field"><label htmlFor={'comment-'+p.id}><strong>コメント <small>任意</small></strong></label><textarea id={'comment-'+p.id} value={draft?.comment??''} disabled={saving} onChange={e=>change({comment:e.target.value})} placeholder="コメントがあれば入力してください"/></div>
          {saveError&&<p className="bdd-error" role="alert">登録に失敗しました。もう一度お試しください。</p>}
          {draft?.status==='参加'&&!draft.carpool&&<p className="bdd-error">配車希望を選択してください。</p>}
          <button type="button" className="bdd-save" disabled={saving || (draft?.status==='参加'&&!draft.carpool)} onClick={save}>{saving?'登録中…':'登録'}</button>
        </>}
      </div>}
    </article>;
  };
  return <Shell title="参加登録">
    {initial==='error'?<div className="tm-card bdd-state"><strong>練習情報を取得できませんでした</strong><p>別の画面に移動し、参加登録画面を開き直してください。</p></div>:<>
      {initial==='empty' ? <div className="tm-card bdd-state">現在、開催予定の練習はありません</div>:practices.filter(p=>!p.past).map(card)}
      <div className="bdd-past">
        <button type="button" className="bdd-past-toggle" onClick={()=>{setPastOpen(v=>!v);setVisiblePast(10)}} aria-expanded={pastOpen}>過去の練習 <span>{pastOpen?'⌃':'⌄'}</span></button>
        {pastOpen && <>{practices.filter(p=>p.past).length===0?<p>過去の練習はありません</p>:practices.filter(p=>p.past).slice(0,visiblePast).map(card)}
          {practices.filter(p=>p.past).length>visiblePast&&<button onClick={()=>setVisiblePast(n=>n+10)}>もっと見る</button>}
        </>}
      </div>
    </>}
    {toast&&<div role="status" className="bdd-toast">{toast}</div>}
    {switchTo!==undefined&&<div role="presentation" className="bdd-overlay"><div role="dialog" aria-modal="true" aria-label="未保存の変更を破棄" className="bdd-dialog"><h2>変更を破棄しますか？</h2><p>保存していない入力内容は失われます。</p><div><button onClick={()=>setSwitchTo(undefined)}>編集を続ける</button><button onClick={()=>{actualOpen(switchTo);setSwitchTo(undefined)}}>破棄して移動</button></div></div></div>}
  </Shell>;
}
const compareMembers=(a:Member,b:Member)=>{
  const rank=(s:Status)=>s==='参加'?0:s==='不参加'?1:2;
  return rank(a.status)-rank(b.status)||a.name.localeCompare(b.name,'ja')||a.id.localeCompare(b.id);
};
export function BddMembers({initial='default'}:{initial?:'default'|'no-upcoming'|'empty'|'error'}) {
  const [practice,setPractice] = useState(initial==='no-upcoming'?'none':'a');
  const [failed] = useState(initial==='error');
  const selected = practice==='none'?undefined:practices.find(p=>p.id===practice);
  const list = initial==='empty'?[]:[...(groups[practice]??[])].sort(compareMembers);
  return <Shell title="メンバー">
    {failed ? <div className="tm-card bdd-state" role="alert"><strong>参加状況を取得できませんでした</strong><p>別の画面に移動して、メンバー画面を開き直してください。</p></div> : <>
      <div className="tm-card bdd-picker"><label htmlFor="bdd-practice-select">対象の練習</label>
        <select id="bdd-practice-select" value={practice} onChange={e=>setPractice(e.target.value)}>
          {initial==='no-upcoming'&&<option value="none">練習を選択してください</option>}
          {practices.filter(p=>initial!=='no-upcoming'||p.past).map(p=><option value={p.id} key={p.id}>{p.title}（{p.when}）{p.cancelled?'・中止':''}</option>)}
        </select>
      </div>
      {!selected?<div className="tm-card bdd-state">開催予定の練習はありません<p>過去の練習を選択すると参加状況を確認できます。</p></div>:<>
        <h2 className="bdd-heading">{selected.title} の参加状況</h2>
        <Counter members={list}/>
        <section className="tm-card bdd-member-list"><h3>回答済みメンバー <small>{list.length}人</small></h3>
          {list.length===0?<p className="bdd-empty">まだ回答したメンバーはいません</p>:list.map(m=><div className="bdd-member" key={m.id}>
            <div><strong>{m.name}</strong>{m.status==='参加'&&m.carpool&&<small>配車：{m.carpool}</small>}</div>
            <span className={'bdd-pill '+(m.status==='参加'?'going':'')}>{m.status}</span>
          </div>)}
        </section>
      </>}
    </>}
  </Shell>;
}
