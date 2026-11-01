// @ts-check
import * as fixtures from '../fixtures';
import { QualifiersList } from '../../src/components/groupstage/QualifiersList';
/** @satisfies {import('@storybook/react-vite').Meta<typeof QualifiersList>} */
const meta = {
  title: 'Groups/Qualifiers',
  component: QualifiersList,
  tags: ['autodocs'],
  args: {
    qualifiers: fixtures.advancers.main,
    groupLabelById: fixtures.groupLabels,
  },
  parameters: { sourceFiles: ['components/groupstage/QualifiersList.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
