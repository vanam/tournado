// @ts-check
import { FormatsPage } from '../../src/pages/FormatsPage';
/** @satisfies {import('@storybook/react-vite').Meta<typeof FormatsPage>} */
const meta = {
  title: 'Pages/Formats',
  component: FormatsPage,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['pages/FormatsPage.tsx'],
    ...{ route: '/formats' },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
