import { useState } from 'react';
import type { ReactNode } from 'react';
import './mobile.css';

export type AttendanceChoice = '未回答' | '参加' | '不参加';
export type CarpoolChoice = '必要' | '不要';

export type MobileRegistrationProps = {
  initialStatus?: AttendanceChoice;
  initialCarpool?: CarpoolChoice;
  initialComment?: string;
  saved?: boolean;
};

function Icon({ children }: { children: ReactNode }) {
  return <span className="tm-icon" aria-hidden="true">{children}</span>;
}
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section className="tm-section"><h2>{title}</h2>{subtitle && <p className="tm-description">{subtitle}</p>}{children}</section>;
}

export function MobileRegistration({ initialStatus = '未回答', initialCarpool = '不要', initialComment = '', saved = false }: MobileRegistrationProps) {
  const [status, setStatus] = useState<AttendanceChoice>(initialStatus);
  const [carpool, setCarpool] = useState<CarpoolChoice>(initialCarpool);
  const [comment, setComment] = useState(initialComment);
  const [registered, setRegistered] = useState(saved);
  const [tab, setTab] = useState<'register' | 'attendance' | 'admin'>('register');
  const chooseStatus = (next: AttendanceChoice) => { setStatus(next); setRegistered(false); };
  const chooseCarpool = (next: CarpoolChoice) => { setCarpool(next); setRegistered(false); };
  return (
    <div className="tm-stage">
      <div className="tm-phone" lang="ja">
        <header className="tm-header">
          <div className="tm-brand"><span className="tm-brand-badge">◎</span><div><strong>テニス部</strong><small>練習参加登録</small></div></div>
          <button className="tm-menu" type="button" aria-label="メニュー（デザイン見本）">☰</button>
        </header>
        <nav className="tm-tabs" aria-label="ページ切り替え">
          <button className={tab === 'register' ? 'current' : ''} onClick={() => setTab('register')}>参加登録</button>
          <button className={tab === 'attendance' ? 'current' : ''} onClick={() => setTab('attendance')}>出欠一覧</button>
          <button className={tab === 'admin' ? 'current' : ''} onClick={() => setTab('admin')}>お知らせ</button>
        </nav>
        {tab !== 'register' ? (
          <main className="tm-content"><div className="tm-card tm-placeholder"><h2>{tab === 'attendance' ? '出欠一覧' : 'お知らせ'}</h2><p>この画面は次のデザイン検討で追加します。</p><button onClick={() => setTab('register')}>参加登録へ戻る</button></div></main>
        ) : <main className="tm-content">
          <article className="tm-practice tm-card">
            <div className="tm-court" aria-hidden="true"><div className="tm-court-line"/><div className="tm-ball"/></div>
            <div className="tm-practice-body">
              <div className="tm-practice-date"><Icon>▣</Icon><div><strong>10月26日（土） 午前練習</strong><small>10:00〜12:00</small></div><span className="tm-chevron">›</span></div>
              <p className="tm-place"><Icon>⌖</Icon> 市営テニスコート A/B</p>
            </div>
          </article>
          <Section title="練習について">
            <p className="tm-description">基礎練習とゲーム練習を行います。<br/>初参加の方もお気軽にご参加ください！</p>
          </Section>
          <Section title="参加予定">
            <div className="tm-choice-group" role="group" aria-label="参加予定">
              {(['参加', '不参加', '未回答'] as const).map(choice => <button type="button" key={choice} aria-pressed={status === choice} onClick={() => chooseStatus(choice)} className={'tm-choice ' + (status === choice ? 'selected' : '')}><span className="tm-radio">{status === choice ? '✓' : ''}</span>{choice}</button>)}
            </div>
          </Section>
          {status === '参加' && <Section title="配車の希望" subtitle="車への同乗が必要な場合は「必要」を選択">
            <div className="tm-choice-group tm-carpool" role="group" aria-label="配車の希望">
              {(['必要', '不要'] as const).map(choice => <button key={choice} type="button" aria-pressed={carpool === choice} onClick={() => chooseCarpool(choice)} className={'tm-choice ' + (carpool === choice ? 'selected' : '')}><span className="tm-radio">{carpool === choice ? '✓' : ''}</span>{choice}</button>)}
            </div>
          </Section>}
          <Section title="コメント（任意）">
            <div className="tm-textarea-wrap"><textarea maxLength={200} aria-label="コメント" placeholder="連絡事項があれば入力してください" value={comment} onChange={e => { setComment(e.target.value); setRegistered(false); }}/><span>{comment.length}/200</span></div>
          </Section>
          {registered && <div className="tm-success" role="status">✓ 回答を保存しました（プレビューのみ）</div>}
          <button className="tm-submit" type="button" onClick={() => setRegistered(true)}>{registered ? '内容を変更して登録' : 'この内容で登録'}</button>
          <p className="tm-demo-note">※ Storybook専用の画面です。実際の出欠データは変更しません。</p>
        </main>}
        <footer className="tm-bottom-nav" aria-label="メニュー">
          <button className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}><span>▦</span>参加登録</button>
          <button className={tab === 'attendance' ? 'active' : ''} onClick={() => setTab('attendance')}><span>♟</span>出欠一覧</button>
          <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}><span>☰</span>お知らせ</button>
        </footer>
      </div>
    </div>
  );
}
