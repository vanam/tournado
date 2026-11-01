// @ts-check
import { fn } from 'storybook/test';
import * as fixtures from '../fixtures';
import { DoubleElimPanel } from '../../src/components/groupstage/PlayoffPanels';
/** @satisfies {import('@storybook/react-vite').Meta<typeof DoubleElimPanel>} */
const meta = {
  title: 'Groups/DoubleElimPanel',
  component: DoubleElimPanel,
  tags: ['autodocs'],
  args: {
    title: 'Main playoff',
    doubleElim: fixtures.doublePlaying.doubleElim,
    players: fixtures.players,
    onEditMatch: fn(),
  },
  parameters: { sourceFiles: ['components/groupstage/PlayoffPanels.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Playing = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: { doubleElim: null } };
