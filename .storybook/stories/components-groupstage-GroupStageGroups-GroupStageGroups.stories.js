// @ts-check
import { fn } from 'storybook/test';
import * as fixtures from '../fixtures';
import { ScoreMode } from '../../src/types';
import { GroupStageGroups } from '../../src/components/groupstage/GroupStageGroups';
/** @satisfies {import('@storybook/react-vite').Meta<typeof GroupStageGroups>} */
const meta = {
  title: 'Groups/AllGroups',
  component: GroupStageGroups,
  tags: ['autodocs'],
  args: {
    groupStage: fixtures.groupsPlayoffs.groupStage,
    players: fixtures.groupsPlayoffs.players,
    standingsByGroup: fixtures.standingsByGroup,
    wildcardIds: null,
    groupTabs: {},
    onGroupTabChange: fn(),
    onEditMatch: fn(),
    scoringMode: ScoreMode.SETS,
    maxSets: 5,
  },
  parameters: { sourceFiles: ['components/groupstage/GroupStageGroups.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
