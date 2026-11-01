// @ts-check
import * as fixtures from '../fixtures';
import { GroupStageView } from '../../src/components/groupstage/GroupStageView';
/** @satisfies {import('@storybook/react-vite').Meta<typeof GroupStageView>} */
const meta = {
  title: 'Formats/Groups',
  component: GroupStageView,
  tags: ['autodocs'],
  args: {},
  parameters: {
    sourceFiles: ['components/groupstage/GroupStageView.tsx'],
    ...{ tournament: fixtures.groups },
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Groups = { args: {}, parameters: { tournament: fixtures.groups } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const GroupsPlayoffs = {
  args: {},
  parameters: { tournament: fixtures.groupsPlayoffs },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const GroupsCompleted = {
  args: {},
  parameters: { tournament: fixtures.groupsCompleted },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const GroupsDouble = {
  args: {},
  parameters: { tournament: fixtures.groupsDouble },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const GroupsDoubleCompleted = {
  args: {},
  parameters: { tournament: fixtures.groupsDoubleCompleted },
};
