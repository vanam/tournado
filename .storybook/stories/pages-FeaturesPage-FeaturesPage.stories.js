// @ts-check
import { FeaturesPage } from '../../src/pages/FeaturesPage';
/** @satisfies {import('@storybook/react-vite').Meta<typeof FeaturesPage>} */
const meta = {
  title: 'Pages/Features',
  component: FeaturesPage,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['pages/FeaturesPage.tsx'],
    ...{ route: '/features' },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
