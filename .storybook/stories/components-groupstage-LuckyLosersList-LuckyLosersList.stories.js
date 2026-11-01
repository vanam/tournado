// @ts-check
import * as fixtures from '../fixtures';
import { LuckyLosersList } from '../../src/components/groupstage/LuckyLosersList';
/** @satisfies {import('@storybook/react-vite').Meta<typeof LuckyLosersList>} */
const meta = {
  title: 'Groups/LuckyLosers',
  component: LuckyLosersList,
  tags: ['autodocs'],
  args: {
    luckyLosers: fixtures.advancers.luckyLosers,
    hasLucky: true,
    groupLabelById: fixtures.groupLabels,
  },
  parameters: { sourceFiles: ['components/groupstage/LuckyLosersList.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Selected = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: { luckyLosers: [], hasLucky: false } };
