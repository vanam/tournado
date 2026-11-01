// @ts-check
import * as fixtures from '../fixtures';
import { CriteriaTable } from '../../src/components/groupstage/CriteriaTable';
/** @satisfies {import('@storybook/react-vite').Meta<typeof CriteriaTable>} */
const meta = {
  title: 'Groups/Criteria',
  component: CriteriaTable,
  tags: ['autodocs'],
  args: { player: fixtures.lucky, showBalls: true },
  parameters: { sourceFiles: ['components/groupstage/CriteriaTable.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
