// @ts-check
import { Separator } from '../../src/components/ui/Separator';
/** @satisfies {import('@storybook/react-vite').Meta<typeof Separator>} */
const meta = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/ui/Separator.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Horizontal = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Vertical = {
  args: { orientation: 'vertical', style: { height: 100 } },
};
