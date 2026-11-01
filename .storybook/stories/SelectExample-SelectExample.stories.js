// @ts-check
import { SelectExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof SelectExample>} */
const meta = {
  title: 'UI/Select',
  component: SelectExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/ui/Select.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
