// @ts-check
import { fn, expect, userEvent, within } from 'storybook/test';
import { Button } from '../../src/components/ui/Button';
/** @satisfies {import('@storybook/react-vite').Meta<typeof Button>} */
const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Create tournament', onClick: fn() },
  parameters: { sourceFiles: ['components/ui/Button.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Primary = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button'));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Secondary = { args: { variant: 'secondary' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const PrimaryOutlined = { args: { variant: 'primary-outlined' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const PrimaryGhost = { args: { variant: 'primary-ghost' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const SecondaryOutlined = { args: { variant: 'secondary-outlined' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const SecondaryGhost = { args: { variant: 'secondary-ghost' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Link = { args: { variant: 'link' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Ghost = { args: { variant: 'ghost' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Destructive = { args: { variant: 'destructive' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const SM = { args: { size: 'sm' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const LG = { args: { size: 'lg' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const ICON = { args: { size: 'icon' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Disabled = { args: { disabled: true } };
