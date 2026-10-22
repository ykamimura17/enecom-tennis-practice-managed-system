import { Practice } from '../types';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function buildAnnounceMessage(practice: Practice, liffId: string): Record<string, unknown> {
  const liffUrl = `https://liff.line.me/${liffId}?practiceId=${encodeURIComponent(practice.id)}`;
  const [year, month, day] = practice.date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
  const displayDate = `${month}/${day}（${weekday}）`;
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
          backgroundColor: '#00875A',
          paddingAll: '20px',
          spacing: 'md',
          contents: [
            { type: 'text', text: '🎾 練習案内', color: '#FFFFFF', size: 'md' },
            { type: 'text', text: displayDate, color: '#FFFFFF', size: 'xxl', weight: 'bold' },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#111111',
          paddingAll: '20px',
          spacing: 'lg',
          contents: [
            { type: 'text', text: practice.title, color: '#FFFFFF', size: 'xl', weight: 'bold', wrap: true },
            { type: 'text', text: `◷ ${practice.time}${practice.endTime ? `〜${practice.endTime}` : ''}`, color: '#FFFFFF', size: 'lg', wrap: true },
            { type: 'text', text: `📍 ${practice.location}`, color: '#FFFFFF', size: 'lg', wrap: true },
            ...(practice.description
              ? [{ type: 'text', text: practice.description, color: '#CCCCCC', size: 'sm', wrap: true }]
              : []),
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#111111',
          paddingAll: '16px',
          contents: [{
            type: 'button',
            style: 'secondary',
            height: 'md',
            action: { type: 'uri', label: '参加・不参加を登録', uri: liffUrl },
          }],
        },
        styles: { footer: { separator: false } },
      }],
    },
  };
}
