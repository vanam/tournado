// @ts-check
import { TestPage } from '../../src/pages/TestPage';
/** @satisfies {import('@storybook/react-vite').Meta<typeof TestPage>} */
const meta = {
  title: 'Pages/Test',
  component: TestPage,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['pages/TestPage.tsx'], ...{ route: '/test' } },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
