// @ts-check
import * as fixtures from '../fixtures';
import { BracketView } from '../../src/components/bracket/BracketView';
/** @satisfies {import('@storybook/react-vite').Meta<typeof BracketView>} */
const meta = {
  title: 'Formats/SingleElimination',
  component: BracketView,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['components/bracket/BracketView.tsx'],
    ...{ tournament: fixtures.single },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Single = { args: {}, parameters: { tournament: fixtures.single } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const SinglePlaying = {
  args: {},
  parameters: { tournament: fixtures.singlePlaying },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const SingleCompleted = {
  args: {},
  parameters: { tournament: fixtures.singleCompleted },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Doubles = {
  args: {},
  parameters: { tournament: fixtures.doubles },
};
