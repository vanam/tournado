// @ts-check
import * as fixtures from '../fixtures';
import { BracketRounds } from '../../src/components/common/BracketRounds';
/** @satisfies {import('@storybook/react-vite').Meta<typeof BracketRounds>} */
const meta = {
  title: 'Common/BracketRounds',
  component: BracketRounds,
  tags: ['autodocs'],
  args: { players: fixtures.players, bracket: fixtures.singlePlaying.bracket },
  parameters: { sourceFiles: ['components/common/BracketRounds.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Playing = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: { bracket: null } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Completed = {
  args: { bracket: fixtures.singleCompleted.bracket },
};
