// @ts-check
import { PlayerProfilePage } from '../../src/pages/PlayerProfilePage';
/** @satisfies {import('@storybook/react-vite').Meta<typeof PlayerProfilePage>} */
const meta = {
  title: 'Pages/PlayerProfile',
  component: PlayerProfilePage,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['pages/PlayerProfilePage.tsx'],
    ...{ route: '/players/library-1' },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const NotFound = { args: {}, parameters: { route: '/players/unknown' } };
