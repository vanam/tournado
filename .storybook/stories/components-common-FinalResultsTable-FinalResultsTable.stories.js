// @ts-check
import * as fixtures from '../fixtures';
import { FinalResultsTable } from '../../src/components/common/FinalResultsTable';
/** @satisfies {import('@storybook/react-vite').Meta<typeof FinalResultsTable>} */
const meta = {
  title: 'Common/FinalResults',
  component: FinalResultsTable,
  tags: ['autodocs'],
  args: { results: fixtures.results },
  parameters: { sourceFiles: ['components/common/FinalResultsTable.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Podium = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: { results: [] } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Tied = {
  args: {
    results: [
      { playerId: 'p1', name: 'Alice', rankStart: 1, rankEnd: 2 },
      { playerId: 'p2', name: 'Boris', rankStart: 1, rankEnd: 2 },
    ],
  },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Undetermined = {
  args: { results: [{ playerId: 'p1', name: 'Alice' }] },
};
