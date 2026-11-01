// @ts-check
import { TabBarExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof TabBarExample>} */
const meta = {
  title: 'Common/TabBar',
  component: TabBarExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/common/TabBar.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
