import { Practice } from '../types';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function buildAnnounceMessage(practice: Practice, liffId: string): Record<string, unknown> {
  const liffUrl = `https://liff.line.me/${liffId}?practiceId=${practice.id}`;
  const date = new Date(practice.date);
  const weekday = WEEKDAYS[date.getDay()];
  const formattedDate = `${practice.date.replace(/-/g, '/')}（${weekday}）`;

  return {
    type: 'flex',
    altText: `【練習案内】${practice.title} ${formattedDate}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#06C755',
        contents: [
          { type: 'text', text: '📣 練習案内', color: '#ffffff', size: 'sm', weight: 'bold' },
          { type: 'text', text: practice.title, color: '#ffffff', size: 'xl', weight: 'bold', wrap: true },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          makeInfoRow('📅', '日時', `${formattedDate} ${practice.time}〜`),
          makeInfoRow('📍', '場所', practice.location),
          ...(practice.description
            ? [{ type: 'box', layout: 'vertical', margin: 'md', contents: [
                { type: 'text', text: practice.description, wrap: true, size: 'sm', color: '#555555' },
              ]}]
            : []),
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          style: 'primary',
          color: '#06C755',
          action: { type: 'uri', label: '参加・不参加を登録する', uri: liffUrl },
        }],
      },
    },
  };
}

function makeInfoRow(icon: string, label: string, value: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: `${icon} ${label}`, size: 'sm', color: '#888888', flex: 2 },
      { type: 'text', text: value, size: 'sm', flex: 4, wrap: true },
    ],
  };
}
