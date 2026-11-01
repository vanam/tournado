// @ts-check
import { PlayerLibraryPage } from '../../src/pages/PlayerLibraryPage';
/** @satisfies {import('@storybook/react-vite').Meta<typeof PlayerLibraryPage>} */
const meta = {
  title: 'Pages/PlayerLibrary',
  component: PlayerLibraryPage,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['pages/PlayerLibraryPage.tsx'],
    ...{ route: '/players' },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: {}, parameters: { empty: true } };
