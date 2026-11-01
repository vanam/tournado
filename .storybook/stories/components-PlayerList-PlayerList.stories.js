// @ts-check
import * as fixtures from '../fixtures';
import { PlayerList } from '../../src/components/PlayerList';
/** @satisfies {import('@storybook/react-vite').Meta<typeof PlayerList>} */
const meta = {
  title: 'Players/PlayerList',
  component: PlayerList,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['components/PlayerList.tsx'],
    ...{ tournament: fixtures.single },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Singles = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Doubles = {
  args: {},
  parameters: { tournament: fixtures.doubles },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Completed = {
  args: {},
  parameters: { tournament: fixtures.singleCompleted },
};
