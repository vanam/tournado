// @ts-check
import { ProgressBar } from '../../src/components/common/ProgressBar';
/** @satisfies {import('@storybook/react-vite').Meta<typeof ProgressBar>} */
const meta = {
  title: 'Common/Progress',
  component: ProgressBar,
  tags: ['autodocs'],
  args: { value: 3, max: 8 },
  parameters: { sourceFiles: ['components/common/ProgressBar.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: { value: 0 } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Partial = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Complete = { args: { value: 8 } };
