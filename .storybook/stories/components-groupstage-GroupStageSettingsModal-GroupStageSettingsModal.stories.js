// @ts-check
import { fn } from 'storybook/test';
import * as fixtures from '../fixtures';
import { BracketType } from '../../src/types';
import { GroupStageSettingsModal } from '../../src/components/groupstage/GroupStageSettingsModal';
/** @satisfies {import('@storybook/react-vite').Meta<typeof GroupStageSettingsModal>} */
const meta = {
  title: 'Dialogs/GroupSettings',
  component: GroupStageSettingsModal,
  tags: ['autodocs'],
  args: {
    open: true,
    groups: fixtures.groups.groupStage.groups,
    initialQualifiers: [1, 1, 1],
    initialBracketType: BracketType.SINGLE_ELIM,
    onSave: fn(),
    onClose: fn(),
  },
  parameters: {
    sourceFiles: ['components/groupstage/GroupStageSettingsModal.tsx'],
  },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Single = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Double = { args: { initialBracketType: BracketType.DOUBLE_ELIM } };
