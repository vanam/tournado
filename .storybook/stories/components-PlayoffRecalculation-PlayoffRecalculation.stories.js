// @ts-check
import { PlayoffRecalculation } from '../../src/components/PlayoffRecalculation';
import { groupsCompleted } from '../fixtures';
const tournament = structuredClone(groupsCompleted);
const first = tournament.groupStagePlayoffs?.mainBracket?.rounds[0]?.[0];
if (first) [first.player1Id, first.player2Id] = [first.player2Id, first.player1Id];
/** @satisfies {import('@storybook/react-vite').Meta<typeof PlayoffRecalculation>} */
const meta = {
  title: 'Formats/PlayoffRecalculation', component: PlayoffRecalculation, tags: ['autodocs'],
  args: { tournament }, parameters: { sourceFiles: ['components/PlayoffRecalculation.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const StandingsMismatch = {};
