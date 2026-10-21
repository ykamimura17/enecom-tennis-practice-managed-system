import type { Meta, StoryObj } from '@storybook/react-vite';
import { BddMembers } from './BddPreview';

const meta = {
  title: 'BDD確認 / メンバー',
  component: BddMembers,
  parameters: { layout: 'fullscreen' },
  args: { initial: 'default' },
} satisfies Meta<typeof BddMembers>;
export default meta;
type Story = StoryObj<typeof meta>;

export const 回答者一覧と練習切り替え: Story = { args: { initial: 'default' } };
export const 開催予定なしと過去の練習選択: Story = { args: { initial: 'no-upcoming' } };
export const 回答者ゼロ: Story = { args: { initial: 'empty' } };
export const 取得失敗: Story = { args: { initial: 'error' } };
