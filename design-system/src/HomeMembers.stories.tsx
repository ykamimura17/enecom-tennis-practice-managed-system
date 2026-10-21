import type { Meta, StoryObj } from '@storybook/react-vite';
import { HomeMembers } from './HomeMembers';

const meta = {
  title: 'スマホデザイン / A案・ミニマルカード型 / ホーム・メンバー',
  component: HomeMembers,
  parameters: { layout: 'fullscreen' },
  args: { initialPage: 'home', initialFilter: '全員' },
  argTypes: {
    initialPage: { control: 'radio', options: ['home', 'members'] },
    initialFilter: { control: 'radio', options: ['全員', '参加予定', '配車希望'] },
  },
} satisfies Meta<typeof HomeMembers>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ホーム: Story = { args: { initialPage: 'home' } };
export const メンバー一覧: Story = { args: { initialPage: 'members', initialFilter: '全員' } };
export const 参加予定のメンバー: Story = { args: { initialPage: 'members', initialFilter: '参加予定' } };
export const 配車希望のメンバー: Story = { args: { initialPage: 'members', initialFilter: '配車希望' } };
