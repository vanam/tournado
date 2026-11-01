// @ts-check
import * as fixtures from '../fixtures';
import { SwissView } from '../../src/components/swiss/SwissView';
/** @satisfies {import('@storybook/react-vite').Meta<typeof SwissView>} */
const meta = {
  title: 'Formats/Swiss',
  component: SwissView,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['components/swiss/SwissView.tsx'],
    ...{ tournament: fixtures.swiss },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Swiss = { args: {}, parameters: { tournament: fixtures.swiss } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const SwissNextRound = {
  args: {},
  parameters: { tournament: fixtures.swissNextRound },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const SwissCompleted = {
  args: {},
  parameters: { tournament: fixtures.swissCompleted },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const SwissDoubles = {
  args: {},
  parameters: { tournament: fixtures.swissDoubles },
};
