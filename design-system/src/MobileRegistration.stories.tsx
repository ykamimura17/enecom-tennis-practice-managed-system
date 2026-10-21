import type { Meta, StoryObj } from '@storybook/react-vite';
import { MobileRegistration } from './MobileRegistration';

const meta = {
  title: 'スマホデザイン / A案・ミニマルカード型 / 参加登録',
  component: MobileRegistration,
  parameters: { layout: 'fullscreen' },
  args: { initialStatus: '未回答', initialCarpool: '不要', initialComment: '', saved: false },
  argTypes: {
    initialStatus: { control: 'radio', options: ['未回答', '参加', '不参加'] },
    initialCarpool: { control: 'radio', options: ['必要', '不要'] },
    initialComment: { control: 'text' },
    saved: { control: 'boolean' },
  },
} satisfies Meta<typeof MobileRegistration>;
export default meta;
type Story = StoryObj<typeof meta>;
export const 未回答: Story = { args: { initialStatus: '未回答' } };
export const 参加予定: Story = { args: { initialStatus: '参加', initialCarpool: '不要' } };
export const 配車が必要: Story = { args: { initialStatus: '参加', initialCarpool: '必要' } };
export const 不参加: Story = { args: { initialStatus: '不参加' } };
export const 登録済み: Story = { args: { initialStatus: '参加', saved: true, initialComment: '少し遅れて参加します。' } };
