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
    editing: { type: 'group', groupId: fixtures.group.id, matchId: fixtures.group.schedule.rounds[0]?.matches[0]?.id ?? '' },
    activeMatch: fixtures.group.schedule.rounds[0]?.matches[0] ?? fixtures.match,
    activePlayers: fixtures.players,
    scoringMode: ScoreMode.SETS,
    groupStageMaxSets: 5,
    bracketMaxSets: 7,
    tournament: fixtures.groupsPlayoffs,
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
  args: { editing: { type: 'mainBracket', matchId: fixtures.groupsPlayoffs.groupStagePlayoffs?.mainBracket?.rounds[0]?.[0]?.id ?? '' }, activeMatch: fixtures.groupsPlayoffs.groupStagePlayoffs?.mainBracket?.rounds[0]?.[0] ?? fixtures.match },
};
