// @ts-check
import * as fixtures from '../fixtures';
import { RoundRobinView } from '../../src/components/roundrobin/RoundRobinView';
/** @satisfies {import('@storybook/react-vite').Meta<typeof RoundRobinView>} */
const meta = {
  title: 'Formats/RoundRobin',
  component: RoundRobinView,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['components/roundrobin/RoundRobinView.tsx'],
    ...{ tournament: fixtures.robin },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Robin = { args: {}, parameters: { tournament: fixtures.robin } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const RobinPlaying = {
  args: {},
  parameters: { tournament: fixtures.robinPlaying },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const RobinCompleted = {
  args: {},
  parameters: { tournament: fixtures.robinCompleted },
};
