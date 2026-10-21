import type { Meta, StoryObj } from '@storybook/react-vite';
import { PracticeList } from './PracticeList';

const meta = {
  title: 'スマホデザイン / A案・ミニマルカード型 / 練習一覧',
  component: PracticeList,
  parameters: { layout: 'fullscreen' },
  args: { initialFilter: 'すべて' },
  argTypes: { initialFilter: { control: 'radio', options: ['すべて', '参加予定'] } },
} satisfies Meta<typeof PracticeList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const すべての練習: Story = { args: { initialFilter: 'すべて' } };
export const 参加予定の練習: Story = { args: { initialFilter: '参加予定' } };
export const 過去の練習一覧: Story = { args: { initialFilter: 'すべて', initialHistoryOnly: true } };
