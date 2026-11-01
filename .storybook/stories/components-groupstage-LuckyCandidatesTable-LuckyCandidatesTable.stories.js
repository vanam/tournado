// @ts-check
import { fn } from 'storybook/test';
import * as fixtures from '../fixtures';
import { LuckyCandidatesTable } from '../../src/components/groupstage/LuckyCandidatesTable';
/** @satisfies {import('@storybook/react-vite').Meta<typeof LuckyCandidatesTable>} */
const meta = {
  title: 'Groups/LuckyCandidates',
  component: LuckyCandidatesTable,
  tags: ['autodocs'],
  args: {
    candidates: fixtures.advancers.luckyCandidates,
    luckyIdSet: new Set(fixtures.advancers.luckyLosers.map((p) => p.id)),
    groupLabelById: fixtures.groupLabels,
    showBalls: true,
    expandedId: null,
    onToggleExpand: fn(),
  },
  parameters: {
    sourceFiles: ['components/groupstage/LuckyCandidatesTable.tsx'],
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Collapsed = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Expanded = { args: { expandedId: fixtures.lucky.id } };
