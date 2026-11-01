// @ts-check
import { ModalShellExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof ModalShellExample>} */
const meta = {
  title: 'Dialogs/ModalShell',
  component: ModalShellExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/ModalShell.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
