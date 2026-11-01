// @ts-check
import { CreditsPage } from '../../src/pages/CreditsPage';
/** @satisfies {import('@storybook/react-vite').Meta<typeof CreditsPage>} */
const meta = {
  title: 'Pages/Credits',
  component: CreditsPage,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['pages/CreditsPage.tsx'],
    ...{ route: '/credits' },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
