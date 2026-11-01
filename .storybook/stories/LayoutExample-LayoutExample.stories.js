// @ts-check
import { LayoutExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof LayoutExample>} */
const meta = {
  title: 'Shell/Layout',
  component: LayoutExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/Layout.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
