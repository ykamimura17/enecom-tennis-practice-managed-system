import { Practice } from '../types';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function buildAnnounceMessage(practice: Practice, liffId: string): Record<string, unknown> {
  const liffUrl = `https://liff.line.me/${liffId}?practiceId=${encodeURIComponent(practice.id)}`;
  const [year, month, day] = practice.date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
  const displayDate = `${month}月${day}日（${weekday}）`;
  const formattedDate = `${practice.date.replace(/-/g, '/')}（${weekday}）`;

  return {
    type: 'flex',
    altText: `【練習案内】${practice.title} ${formattedDate}`,
    contents: {
      type: 'carousel',
      contents: [{
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#FFFFFF',
          paddingAll: '20px',
          spacing: 'md',
          contents: [
            { type: 'text', text: '練習案内', color: '#777777', size: 'md' },
            { type: 'text', text: displayDate, color: '#222222', size: 'xxl', weight: 'bold', wrap: true },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#FFFFFF',
          paddingAll: '20px',
          spacing: 'sm',
          contents: [
            { type: 'text', text: practice.title, color: '#222222', size: 'md', wrap: true },
            { type: 'text', text: `🕘 ${practice.time}${practice.endTime ? `〜${practice.endTime}` : ''}`, color: '#222222', size: 'md', wrap: true },
            { type: 'text', text: `📍 ${practice.location}`, color: '#222222', size: 'md', wrap: true },
            ...(practice.description?.trim()
              ? [{ type: 'text', text: `💬 ${practice.description.trim()}`, color: '#555555', size: 'md', wrap: true }]
              : []),
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#FFFFFF',
          paddingAll: '16px',
          contents: [{
            type: 'button',
            style: 'primary',
            color: '#06A94F',
            height: 'md',
            action: { type: 'uri', label: '出欠を回答する', uri: liffUrl },
          }],
        },
        styles: { footer: { separator: false } },
      }],
    },
  };
}
