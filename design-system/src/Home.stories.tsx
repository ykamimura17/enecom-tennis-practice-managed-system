import type { Meta, StoryObj } from '@storybook/react-vite';
import { HomeMembers } from './HomeMembers';
import { PracticeList } from './PracticeList';

const meta = {
  title: 'スマホデザイン / A案・ミニマルカード型 / ホーム',
  component: HomeMembers,
  render: args => <PracticeList initialPage={args.initialPage} initialMemberFilter={args.initialFilter}/>,
  parameters: { layout: 'fullscreen' },
  args: { initialPage: 'home', initialFilter: '全員' },
  argTypes: {
    initialPage: { table: { disable: true } },
    initialFilter: { table: { disable: true } },
  },
} satisfies Meta<typeof HomeMembers>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ホーム画面: Story = {};
