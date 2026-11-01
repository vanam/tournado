// @ts-check
import * as fixtures from '../fixtures';
import { ScoreMode } from '../../src/types';
import { GroupPrintView } from '../../src/components/groupstage/GroupPrintView';
/** @satisfies {import('@storybook/react-vite').Meta<typeof GroupPrintView>} */
const meta = {
  title: 'Groups/Print',
  component: GroupPrintView,
  tags: ['autodocs'],
  args: {
    groupLabel: 'A',
    players: fixtures.groupPlayers,
    schedule: fixtures.group.schedule,
    scoringMode: ScoreMode.SETS,
    maxSets: 5,
  },
  parameters: { sourceFiles: ['components/groupstage/GroupPrintView.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
