// @ts-check
import { Badge } from '../../src/components/ui/Badge';
/** @satisfies {import('@storybook/react-vite').Meta<typeof Badge>} */
const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { children: 'Qualifier' },
  parameters: { sourceFiles: ['components/ui/Badge.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = { args: { variant: 'default' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Secondary = { args: { variant: 'secondary' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Accent = { args: { variant: 'accent' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Outline = { args: { variant: 'outline' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Destructive = { args: { variant: 'destructive' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Rose = { args: { variant: 'rose' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Orange = { args: { variant: 'orange' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Blue = { args: { variant: 'blue' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Purple = { args: { variant: 'purple' } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Emerald = { args: { variant: 'emerald' } };
