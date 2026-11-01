// @ts-check
import { NotFoundPage } from '../../src/pages/NotFoundPage';
/** @satisfies {import('@storybook/react-vite').Meta<typeof NotFoundPage>} */
const meta = {
  title: 'Pages/NotFound',
  component: NotFoundPage,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['pages/NotFoundPage.tsx'],
    ...{ route: '/missing' },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
