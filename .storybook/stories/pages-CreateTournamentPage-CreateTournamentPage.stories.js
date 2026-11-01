// @ts-check
import * as fixtures from '../fixtures';
import { CreateTournamentPage } from '../../src/pages/CreateTournamentPage';
/** @satisfies {import('@storybook/react-vite').Meta<typeof CreateTournamentPage>} */
const meta = {
  title: 'Pages/CreateTournament',
  component: CreateTournamentPage,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['pages/CreateTournamentPage.tsx'],
    ...{ route: '/create' },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Single = {
  args: {},
  parameters: { routeState: { duplicate: fixtures.single } },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Doubles = {
  args: {},
  parameters: { routeState: { duplicate: fixtures.doubles } },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Double = {
  args: {},
  parameters: { routeState: { duplicate: fixtures.double } },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Robin = {
  args: {},
  parameters: { routeState: { duplicate: fixtures.robin } },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Swiss = {
  args: {},
  parameters: { routeState: { duplicate: fixtures.swiss } },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Groups = {
  args: {},
  parameters: { routeState: { duplicate: fixtures.groups } },
};
