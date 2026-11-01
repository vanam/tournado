// @ts-check
import * as fixtures from '../fixtures';
import { SwissStandingsTable } from '../../src/components/swiss/SwissStandingsTable';
/** @satisfies {import('@storybook/react-vite').Meta<typeof SwissStandingsTable>} */
const meta = {
  title: 'Formats/SwissStandings',
  component: SwissStandingsTable,
  tags: ['autodocs'],
  args: { standings: fixtures.swissStandings },
  parameters: { sourceFiles: ['components/swiss/SwissStandingsTable.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Standings = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Points = { args: { showPoints: true } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: { standings: [] } };
