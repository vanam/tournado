// @ts-check
import * as fixtures from '../fixtures';
import { TournamentPage } from '../../src/pages/TournamentPage';
/** @satisfies {import('@storybook/react-vite').Meta<typeof TournamentPage>} */
const meta = {
  title: 'Pages/Tournament',
  component: TournamentPage,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['pages/TournamentPage.tsx'],
    ...{ route: '/tournament/' + fixtures.single.id },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Single = {
  args: {},
  parameters: { route: '/tournament/' + fixtures.single.id },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Doubles = {
  args: {},
  parameters: { route: '/tournament/' + fixtures.doubles.id },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const DoublePlaying = {
  args: {},
  parameters: { route: '/tournament/' + fixtures.doublePlaying.id },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const ResetPending = {
  args: {},
  parameters: { route: '/tournament/' + fixtures.resetPending.id },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const RobinPlaying = {
  args: {},
  parameters: { route: '/tournament/' + fixtures.robinPlaying.id },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const SwissNextRound = {
  args: {},
  parameters: { route: '/tournament/' + fixtures.swissNextRound.id },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const SwissDoubles = {
  args: {},
  parameters: { route: '/tournament/' + fixtures.swissDoubles.id },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const GroupsPlayoffs = {
  args: {},
  parameters: { route: '/tournament/' + fixtures.groupsPlayoffs.id },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const GroupsDouble = {
  args: {},
  parameters: { route: '/tournament/' + fixtures.groupsDouble.id },
};
