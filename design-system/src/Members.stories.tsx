import type { Meta, StoryObj } from '@storybook/react-vite';
import { HomeMembers } from './HomeMembers';
import { PracticeList } from './PracticeList';

const meta = {
  title: 'スマホデザイン / A案・ミニマルカード型 / メンバー',
  component: HomeMembers,
  render: args => <PracticeList initialPage={args.initialPage} initialMemberFilter={args.initialFilter}/>,
  parameters: { layout: 'fullscreen' },
  args: { initialPage: 'members', initialFilter: '全員' },
  argTypes: {
    initialPage: { table: { disable: true } },
    initialFilter: { control: 'radio', options: ['全員', '参加予定', '配車希望'] },
  },
} satisfies Meta<typeof HomeMembers>;

export default meta;
type Story = StoryObj<typeof meta>;

export const メンバー一覧: Story = { args: { initialFilter: '全員' } };
export const 参加予定のメンバー: Story = { args: { initialFilter: '参加予定' } };
export const 配車希望のメンバー: Story = { args: { initialFilter: '配車希望' } };
