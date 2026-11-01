// @ts-check
import { Checkbox } from '../../src/components/ui/Checkbox';
/** @satisfies {import('@storybook/react-vite').Meta<typeof Checkbox>} */
const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: { 'aria-label': 'Include consolation' },
  parameters: { sourceFiles: ['components/ui/Checkbox.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Unchecked = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Checked = { args: { defaultChecked: true } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Indeterminate = { args: { checked: 'indeterminate' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Disabled = { args: { disabled: true } };
