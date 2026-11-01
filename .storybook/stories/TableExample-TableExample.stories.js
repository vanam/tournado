// @ts-check
import { TableExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof TableExample>} */
const meta = {
  title: 'UI/Table',
  component: TableExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/ui/Table.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
