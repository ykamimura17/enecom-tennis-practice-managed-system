import { describe, it, expect } from 'vitest';
import { buildAnnounceMessage } from '../../services/line';
import type { Practice } from '../../types';

const basePractice: Practice = {
  id: 'p-001',
  title: 'テスト練習',
  date: '2024-06-15', // 土曜日
  time: '10:00',
  location: '○○公園',
  description: '持ち物: ラケット',
  createdAt: '2024-01-01T00:00:00.000Z',
  status: '開催',
};

describe('buildAnnounceMessage', () => {
  it('type が flex である', () => {
    const msg = buildAnnounceMessage(basePractice, 'liff-id-123');
    expect(msg.type).toBe('flex');
  });

  it('altText に練習タイトルが含まれる', () => {
    const msg = buildAnnounceMessage(basePractice, 'liff-id-123');
    expect(msg.altText as string).toContain('テスト練習');
  });

  it('altText にフォーマット済み日付が含まれる', () => {
    const msg = buildAnnounceMessage(basePractice, 'liff-id-123');
    expect(msg.altText as string).toContain('2024/06/15');
  });

  it('2024-06-15 が土曜日として認識される', () => {
    const msg = buildAnnounceMessage(basePractice, 'liff-id-123');
    expect(msg.altText as string).toContain('（土）');
  });

  it('footer ボタンの URI に liffId と practiceId が含まれる', () => {
    const msg = buildAnnounceMessage(basePractice, 'liff-id-123');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const footer = (msg.contents as any).contents[0].footer;
    const uri = footer.contents[0].action.uri as string;
    expect(uri).toBe('https://liff.line.me/liff-id-123?practiceId=p-001');
  });

  it('contents に bubble / header / body / footer が存在する', () => {
    const msg = buildAnnounceMessage(basePractice, 'liff-id-123');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contents = msg.contents as any;
    expect(contents.type).toBe('carousel');
    expect(contents.contents).toHaveLength(1);
    const bubble = contents.contents[0];
    expect(bubble.type).toBe('bubble');
    expect(bubble.header).toBeDefined();
    expect(bubble.body).toBeDefined();
    expect(bubble.footer).toBeDefined();
    expect(JSON.stringify(bubble)).not.toContain('開催');
  });

  it('日付とイベント情報が指定の順番で表示される', () => {
    const msg = buildAnnounceMessage(basePractice, 'liff-id-123');
    const bubble = (msg.contents as any).contents[0];
    expect(bubble.header.contents.map((item: any) => item.text)).toEqual(['練習案内', '6月15日（土）']);
    expect(bubble.body.contents.slice(0, 3).map((item: any) => item.text)).toEqual([
      'テスト練習', '🕘 10:00', '📍 ○○公園',
    ]);
    expect(bubble.footer.contents).toHaveLength(1);
    expect(bubble.footer.contents[0].action.label).toBe('出欠を回答する');
  });

  it('description が空の場合は備考欄を表示しない', () => {
    const practice = { ...basePractice, description: '' };
    const msg = buildAnnounceMessage(practice, 'liff-id-123');
    expect((msg.contents as any).contents[0].body.contents).toHaveLength(3);
  });

  it('description がある場合は body に含まれる', () => {
    const msg = buildAnnounceMessage(basePractice, 'liff-id-123');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bodyContents = (msg.contents as any).contents[0].body.contents as any[];
    expect(bodyContents[3].text).toBe('💬 持ち物: ラケット');
  });
  it('終了時刻がある場合は時間帯を表示する', () => {
    const msg = buildAnnounceMessage({ ...basePractice, endTime: '12:00' }, 'liff-id-123');
    expect((msg.contents as any).contents[0].body.contents[1].text).toBe('🕘 10:00〜12:00');
  });

  it('空白のみの備考は表示しない', () => {
    const msg = buildAnnounceMessage({ ...basePractice, description: '  \n  ' }, 'liff-id-123');
    expect((msg.contents as any).contents[0].body.contents).toHaveLength(3);
  });
});
