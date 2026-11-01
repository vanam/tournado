// @ts-check
import * as fixtures from '../fixtures';
import { DoubleElimView } from '../../src/components/doubleelim/DoubleElimView';
/** @satisfies {import('@storybook/react-vite').Meta<typeof DoubleElimView>} */
const meta = {
  title: 'Formats/DoubleElimination',
  component: DoubleElimView,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['components/doubleelim/DoubleElimView.tsx'],
    ...{ tournament: fixtures.double },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Double = { args: {}, parameters: { tournament: fixtures.double } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const DoublePlaying = {
  args: {},
  parameters: { tournament: fixtures.doublePlaying },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const DoubleCompleted = {
  args: {},
  parameters: { tournament: fixtures.doubleCompleted },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const ResetPending = {
  args: {},
  parameters: { tournament: fixtures.resetPending },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const ResetCompleted = {
  args: {},
  parameters: { tournament: fixtures.resetCompleted },
};
