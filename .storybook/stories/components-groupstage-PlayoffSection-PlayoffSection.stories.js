// @ts-check
import { fn } from 'storybook/test';
import * as fixtures from '../fixtures';
import { ScoreMode } from '../../src/types';
import { PlayoffSection } from '../../src/components/groupstage/PlayoffSection';
/** @satisfies {import('@storybook/react-vite').Meta<typeof PlayoffSection>} */
const meta = {
  title: 'Groups/PlayoffSection',
  component: PlayoffSection,
  tags: ['autodocs'],
  args: {
    playoffs: fixtures.groupsPlayoffs.groupStagePlayoffs ?? null,
    isDoubleElim: false,
    players: fixtures.groupsPlayoffs.players,
    wildcardIds: null,
    groupPlacementByPlayerId: null,
    scoringMode: ScoreMode.SETS,
    maxSets: 5,
    onEditMainBracketMatch: fn(),
    onEditConsolationBracketMatch: fn(),
    onEditMainDoubleElimMatch: fn(),
    onEditConsolationDoubleElimMatch: fn(),
  },
  parameters: { sourceFiles: ['components/groupstage/PlayoffSection.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Single = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Double = {
  args: {
    playoffs: fixtures.groupsDouble.groupStagePlayoffs ?? null,
    isDoubleElim: true,
  },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: { playoffs: null } };
