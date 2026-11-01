// @ts-check
import { Format } from '../../src/types';
import { FormatBadge } from '../../src/components/ui/FormatBadge';
/** @satisfies {import('@storybook/react-vite').Meta<typeof FormatBadge>} */
const meta = {
  title: 'UI/FormatBadge',
  component: FormatBadge,
  tags: ['autodocs'],
  args: { format: Format.SINGLE_ELIM },
  parameters: { sourceFiles: ['components/ui/FormatBadge.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const SINGLEELIM = { args: { format: Format.SINGLE_ELIM } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const DOUBLEELIM = { args: { format: Format.DOUBLE_ELIM } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const ROUNDROBIN = { args: { format: Format.ROUND_ROBIN } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const SWISS = { args: { format: Format.SWISS } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const GROUPSTOBRACKET = { args: { format: Format.GROUPS_TO_BRACKET } };
