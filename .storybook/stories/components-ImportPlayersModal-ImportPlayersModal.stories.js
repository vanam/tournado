// @ts-check
import { fn } from 'storybook/test';
import { ImportPlayersModal } from '../../src/components/ImportPlayersModal';
/** @satisfies {import('@storybook/react-vite').Meta<typeof ImportPlayersModal>} */
const meta = {
  title: 'Dialogs/ImportPlayers',
  component: ImportPlayersModal,
  tags: ['autodocs'],
  args: { open: true, onClose: fn(), onImport: fn(), existingNames: [] },
  parameters: { sourceFiles: ['components/ImportPlayersModal.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const ExistingNames = { args: { existingNames: ['Alice', 'Boris'] } };
