// @ts-check
import { TabsExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof TabsExample>} */
const meta = {
  title: 'UI/Tabs',
  component: TabsExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/ui/Tabs.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
