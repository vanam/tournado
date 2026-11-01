// @ts-check
import { PlayerInputExample } from '../harnesses';
/** @satisfies {import('@storybook/react-vite').Meta<typeof PlayerInputExample>} */
const meta = {
  title: 'Players/PlayerInput',
  component: PlayerInputExample,
  tags: ['autodocs'],
  args: {},
  parameters: { sourceFiles: ['components/PlayerInput.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Populated = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Empty = { args: { empty: true } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const WithoutElo = { args: { useElo: false } };
