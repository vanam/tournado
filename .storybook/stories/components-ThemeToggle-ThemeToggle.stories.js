// @ts-check
import { expect, userEvent, within, waitFor } from 'storybook/test';
import { ThemeToggle } from '../../src/components/ThemeToggle';
/** @satisfies {import('@storybook/react-vite').Meta<typeof ThemeToggle>} */
const meta = {
  title: 'Shell/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/ThemeToggle.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {
  play: async ({ canvasElement }) => {
    const root = canvasElement.ownerDocument.documentElement;
    await waitFor(() => expect(root).toHaveClass('dark'));
    await userEvent.click(within(canvasElement).getByRole('button'));
    await expect(root).not.toHaveClass('dark');
  },
};
