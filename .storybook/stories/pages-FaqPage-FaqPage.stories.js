// @ts-check
import { FaqPage } from '../../src/pages/FaqPage';
/** @satisfies {import('@storybook/react-vite').Meta<typeof FaqPage>} */
const meta = {
  title: 'Pages/Faq',
  component: FaqPage,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['pages/FaqPage.tsx'], ...{ route: '/faq' } },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
