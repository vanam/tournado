// @ts-check
import * as fixtures from '../fixtures';
import { ScoreMode } from '../../src/types';
import { StandingsTable } from '../../src/components/roundrobin/StandingsTable';
/** @satisfies {import('@storybook/react-vite').Meta<typeof StandingsTable>} */
const meta = {
  title: 'Formats/Standings',
  component: StandingsTable,
  tags: ['autodocs'],
  args: {
    standings: fixtures.standings,
    highlightCount: 2,
    scoringMode: ScoreMode.SETS,
  },
  parameters: { sourceFiles: ['components/roundrobin/StandingsTable.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Wildcard = { args: { wildcardIds: new Set(['p3']) } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: { standings: [] } };
