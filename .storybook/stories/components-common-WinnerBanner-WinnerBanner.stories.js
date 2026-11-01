// @ts-check
import { WinnerBanner } from '../../src/components/common/WinnerBanner';
/** @satisfies {import('@storybook/react-vite').Meta<typeof WinnerBanner>} */
const meta = {
  title: 'Common/Winner',
  component: WinnerBanner,
  tags: ['autodocs'],
  args: { label: 'Alice' },
  parameters: { sourceFiles: ['components/common/WinnerBanner.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Winner = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Doubles = { args: { label: 'Alice / Boris' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Hidden = { args: { label: null } };
