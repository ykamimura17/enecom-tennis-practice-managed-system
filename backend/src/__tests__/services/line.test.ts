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
    const footer = (msg.contents as any).footer;
    const uri = footer.contents[0].action.uri as string;
    expect(uri).toBe('https://liff.line.me/liff-id-123?practiceId=p-001');
  });

  it('contents に bubble / header / body / footer が存在する', () => {
    const msg = buildAnnounceMessage(basePractice, 'liff-id-123');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contents = msg.contents as any;
    expect(contents.type).toBe('bubble');
    expect(contents.header).toBeDefined();
    expect(contents.body).toBeDefined();
    expect(contents.footer).toBeDefined();
  });

  it('description が空でもエラーにならない', () => {
    const practice = { ...basePractice, description: '' };
    expect(() => buildAnnounceMessage(practice, 'liff-id-123')).not.toThrow();
  });

  it('description がある場合は body に含まれる', () => {
    const msg = buildAnnounceMessage(basePractice, 'liff-id-123');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bodyContents = (msg.contents as any).body.contents as any[];
    const texts = JSON.stringify(bodyContents);
    expect(texts).toContain('持ち物: ラケット');
  });
});
