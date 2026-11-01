// @ts-check
import { fn } from 'storybook/test';
import * as fixtures from '../fixtures';
import { ScoreMode } from '../../src/types';
import { GroupCardExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof GroupCardExample>} */
const meta = {
  title: 'Groups/GroupCard',
  component: GroupCardExample,
  tags: ['autodocs'],
  args: {
    group: fixtures.group,
    groupIndex: 0,
    groupPlayers: fixtures.groupPlayers,
    standings: fixtures.standingsByGroup[0]?.standings ?? [],
    qualifierCount: 1,
    wildcardIds: new Set(fixtures.advancers.luckyLosers.map((p) => p.id)),
    activeTab: 'standings',
    onTabChange: fn(),
    onEditMatch: fn(),
    onPrint: fn(),
    scoringMode: ScoreMode.SETS,
    maxSets: 5,
  },
  parameters: { sourceFiles: ['components/groupstage/GroupCard.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Standings = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Matrix = { args: { activeTab: 'results' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Schedule = { args: { activeTab: 'schedule' } };
