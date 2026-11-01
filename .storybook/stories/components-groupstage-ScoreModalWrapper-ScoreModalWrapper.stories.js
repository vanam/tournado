// @ts-check
import { fn } from 'storybook/test';
import * as fixtures from '../fixtures';
import { ScoreMode } from '../../src/types';
import { ScoreModalWrapper } from '../../src/components/groupstage/ScoreModalWrapper';
/** @satisfies {import('@storybook/react-vite').Meta<typeof ScoreModalWrapper>} */
const meta = {
  title: 'Dialogs/GroupScoreWrapper',
  component: ScoreModalWrapper,
  tags: ['autodocs'],
  args: {
    editing: { type: 'group', groupId: 'g1', matchId: fixtures.match.id },
    activeMatch: fixtures.match,
    activePlayers: fixtures.players,
    scoringMode: ScoreMode.SETS,
    groupStageMaxSets: 5,
    bracketMaxSets: 7,
    onSave: fn(),
    onClose: fn(),
  },
  parameters: { sourceFiles: ['components/groupstage/ScoreModalWrapper.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Group = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Hidden = { args: { editing: null, activeMatch: null } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Playoff = {
  args: { editing: { type: 'mainBracket', matchId: fixtures.match.id } },
};
