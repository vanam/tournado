// @ts-check
import { ScoreInfo } from '../../src/components/bracket/MatchCard';
/** @satisfies {import('@storybook/react-vite').Meta<typeof ScoreInfo>} */
const meta = {
  title: 'Tournament/ScoreInfo',
  component: ScoreInfo,
  tags: ['autodocs'],
  args: {
    showPoints: true,
    setPointEntries: [{ text: '11', isWin: true }],
    isWalkover: false,
    sets: 3,
  },
  parameters: { sourceFiles: ['components/bracket/MatchCard.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Points = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Sets = { args: { showPoints: false } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Walkover = { args: { isWalkover: true } };
