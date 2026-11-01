// @ts-check
import { Input } from '../../src/components/ui/Input';
/** @satisfies {import('@storybook/react-vite').Meta<typeof Input>} */
const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  args: { 'aria-label': 'Player name', defaultValue: 'Alice' },
  parameters: { sourceFiles: ['components/ui/Input.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Text = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Number = { args: { type: 'number', defaultValue: 1500 } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Disabled = { args: { disabled: true } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Invalid = { args: { 'aria-invalid': true } };
