import type { Meta, StoryObj } from '@storybook/react-vite';
import { PracticeList } from './PracticeList';

const meta = {
  title: 'スマホデザイン / A案・ミニマルカード型 / 管理',
  component: PracticeList,
  parameters: { layout: 'fullscreen' },
  args: { initialPage: 'admin' as const, isAdmin: true },
} satisfies Meta<typeof PracticeList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const 管理トップ: Story = {};
export const 練習追加とLINE通知: Story = { args: { initialPage: 'admin', isAdmin: true } };
