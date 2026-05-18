import * as line from '@line/bot-sdk';
import { Practice } from '../types';

export class LineService {
  private client: line.messagingApi.MessagingApiClient;

  constructor() {
    this.client = new line.messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    });
  }

  /** 練習案内をグループに送信（Flex Message） */
  async announceToGroup(practice: Practice, liffId: string): Promise<void> {
    const groupId = process.env.LINE_GROUP_ID!;
    const liffUrl = `https://liff.line.me/${liffId}?practiceId=${practice.id}`;

    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const date = new Date(practice.date);
    const weekday = weekdays[date.getDay()];
    const formattedDate = `${practice.date.replace(/-/g, '/')}（${weekday}）`;

    const message: line.FlexMessage = {
      type: 'flex',
      altText: `【練習案内】${practice.title} ${formattedDate}`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#06C755',
          contents: [
            {
              type: 'text',
              text: '📣 練習案内',
              color: '#ffffff',
              size: 'sm',
              weight: 'bold',
            },
            {
              type: 'text',
              text: practice.title,
              color: '#ffffff',
              size: 'xl',
              weight: 'bold',
              wrap: true,
            },
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
              ? [{
                  type: 'box' as const,
                  layout: 'vertical' as const,
                  margin: 'md' as const,
                  contents: [
                    {
                      type: 'text' as const,
                      text: practice.description,
                      wrap: true,
                      size: 'sm' as const,
                      color: '#555555',
                    },
                  ],
                }]
              : []),
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#06C755',
              action: {
                type: 'uri',
                label: '参加・不参加を登録する',
                uri: liffUrl,
              },
            },
          ],
        },
      },
    };

    await this.client.pushMessage({
      to: groupId,
      messages: [message],
    });
  }
}

function makeInfoRow(icon: string, label: string, value: string) {
  return {
    type: 'box' as const,
    layout: 'horizontal' as const,
    contents: [
      { type: 'text' as const, text: `${icon} ${label}`, size: 'sm' as const, color: '#888888', flex: 2 },
      { type: 'text' as const, text: value, size: 'sm' as const, flex: 4, wrap: true },
    ],
  };
}
