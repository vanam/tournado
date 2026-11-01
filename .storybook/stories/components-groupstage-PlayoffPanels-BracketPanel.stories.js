// @ts-check
import { fn } from 'storybook/test';
import * as fixtures from '../fixtures';
import { BracketPanel } from '../../src/components/groupstage/PlayoffPanels';
/** @satisfies {import('@storybook/react-vite').Meta<typeof BracketPanel>} */
const meta = {
  title: 'Groups/BracketPanel',
  component: BracketPanel,
  tags: ['autodocs'],
  args: {
    title: 'Main playoff',
    bracket: fixtures.singlePlaying.bracket,
    players: fixtures.players,
    onEditMatch: fn(),
  },
  parameters: { sourceFiles: ['components/groupstage/PlayoffPanels.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Playing = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: { bracket: null } };
