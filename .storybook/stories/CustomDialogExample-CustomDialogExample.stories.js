// @ts-check
import { CustomDialogExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof CustomDialogExample>} */
const meta = {
  title: 'Dialogs/Custom',
  component: CustomDialogExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/CustomDialog.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
