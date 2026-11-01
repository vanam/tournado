// @ts-check
import { fn } from 'storybook/test';
import { PlayerMoveButtons } from '../../src/components/common/PlayerMoveButtons';
/** @satisfies {import('@storybook/react-vite').Meta<typeof PlayerMoveButtons>} */
const meta = {
  title: 'Players/MoveButtons',
  component: PlayerMoveButtons,
  tags: ['autodocs'],
  args: { index: 1, total: 4, onMoveUp: fn(), onMoveDown: fn() },
  parameters: { sourceFiles: ['components/common/PlayerMoveButtons.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Middle = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const First = { args: { index: 0 } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Last = { args: { index: 3 } };
