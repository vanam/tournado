// @ts-check
import { Navbar } from '../../src/components/Navbar';
/** @satisfies {import('@storybook/react-vite').Meta<typeof Navbar>} */
const meta = {
  title: 'Shell/Navbar',
  component: Navbar,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/Navbar.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
