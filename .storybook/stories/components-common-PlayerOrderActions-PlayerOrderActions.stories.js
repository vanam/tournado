// @ts-check
import { fn } from 'storybook/test';
import { PlayerOrderActions } from '../../src/components/common/PlayerOrderActions';
/** @satisfies {import('@storybook/react-vite').Meta<typeof PlayerOrderActions>} */
const meta = {
  title: 'Players/OrderActions',
  component: PlayerOrderActions,
  tags: ['autodocs'],
  args: {
    useElo: true,
    canReorder: true,
    onSortByElo: fn(),
    onShuffle: fn(),
    onImport: fn(),
  },
  parameters: { sourceFiles: ['components/common/PlayerOrderActions.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Enabled = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Disabled = { args: { canReorder: false } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const WithoutElo = { args: { useElo: false } };
