// @ts-check
import { HomePage } from '../../src/pages/HomePage';
/** @satisfies {import('@storybook/react-vite').Meta<typeof HomePage>} */
const meta = {
  title: 'Pages/Home',
  component: HomePage,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['pages/HomePage.tsx'], ...{ route: '/' } },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: {}, parameters: { empty: true } };
