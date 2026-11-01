// @ts-check
import { PopoverExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof PopoverExample>} */
const meta = {
  title: 'UI/Popover',
  component: PopoverExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/ui/Popover.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
