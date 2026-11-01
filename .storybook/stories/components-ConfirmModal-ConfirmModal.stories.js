// @ts-check
import { fn } from 'storybook/test';
import { ConfirmModal } from '../../src/components/ConfirmModal';
/** @satisfies {import('@storybook/react-vite').Meta<typeof ConfirmModal>} */
const meta = {
  title: 'Dialogs/Confirm',
  component: ConfirmModal,
  tags: ['autodocs'],
  args: {
    title: 'Delete tournament?',
    message: 'This removes the tournament from this device.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    onConfirm: fn(),
    onCancel: fn(),
  },
  parameters: { sourceFiles: ['components/ConfirmModal.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
