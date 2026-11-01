// @ts-check
import { ToastExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof ToastExample>} */
const meta = {
  title: 'Shell/Toast',
  component: ToastExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/Toast.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Message = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Action = { args: { withAction: true } };
