// @ts-check
import { SetPoints } from '../../src/components/bracket/MatchCard';
/** @satisfies {import('@storybook/react-vite').Meta<typeof SetPoints>} */
const meta = {
  title: 'Tournament/SetPoints',
  component: SetPoints,
  tags: ['autodocs'],
  args: {
    entries: [
      { text: '11', isWin: true },
      { text: '8', isWin: false },
      { text: 'WO', isWin: true },
    ],
  },
  parameters: { sourceFiles: ['components/bracket/MatchCard.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Default = {};
