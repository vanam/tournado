// @ts-check
import { DialogExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof DialogExample>} */
const meta = {
  title: 'UI/Dialog',
  component: DialogExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/ui/Dialog.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Open = { args: { initiallyOpen: true } };
