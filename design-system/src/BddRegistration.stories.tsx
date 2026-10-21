import type { Meta, StoryObj } from '@storybook/react-vite';
import { BddRegistration } from './BddPreview';

const meta = {
  title: 'BDD確認 / 参加登録',
  component: BddRegistration,
  parameters: { layout: 'fullscreen' },
  args: { initial: 'default' },
} satisfies Meta<typeof BddRegistration>;
export default meta;
type Story = StoryObj<typeof meta>;

export const 複数練習カードと回答登録: Story = { args: { initial: 'default' } };
export const 保存失敗と再試行: Story = { args: { initial: 'save-error' } };
export const 中止済み練習の閲覧: Story = { args: { initial: 'cancelled' } };
export const 過去の練習の閲覧: Story = { args: { initial: 'past' } };
export const 開催予定なし: Story = { args: { initial: 'empty' } };
export const 取得失敗: Story = { args: { initial: 'error' } };

