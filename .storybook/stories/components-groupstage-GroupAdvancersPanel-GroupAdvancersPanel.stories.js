// @ts-check
import * as fixtures from '../fixtures';
import { ScoreMode } from '../../src/types';
import { GroupAdvancersPanel } from '../../src/components/groupstage/GroupAdvancersPanel';
/** @satisfies {import('@storybook/react-vite').Meta<typeof GroupAdvancersPanel>} */
const meta = {
  title: 'Groups/Advancers',
  component: GroupAdvancersPanel,
  tags: ['autodocs'],
  args: {
    qualifiers: fixtures.advancers.main,
    luckyLosers: fixtures.advancers.luckyLosers,
    groups: fixtures.groups.groupStage.groups,
    bracketTargetSize: fixtures.advancers.bracketTargetSize,
    luckyCandidates: fixtures.advancers.luckyCandidates,
    scoringMode: ScoreMode.SETS,
  },
  parameters: {
    sourceFiles: ['components/groupstage/GroupAdvancersPanel.tsx'],
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
