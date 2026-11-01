// @ts-check
import { TooltipExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof TooltipExample>} */
const meta = {
  title: 'UI/Tooltip',
  component: TooltipExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/ui/Tooltip.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
