// @ts-check
import { fn, expect, userEvent, within } from 'storybook/test';
import * as fixtures from '../fixtures';
import { ScoreMode } from '../../src/types';
import { ScoreModal } from '../../src/components/ScoreModal';
/** @satisfies {import('@storybook/react-vite').Meta<typeof ScoreModal>} */
const meta = {
  title: 'Dialogs/Score',
  component: ScoreModal,
  tags: ['autodocs'],
  args: {
    match: fixtures.match,
    players: fixtures.players,
    onSave: fn(),
    onClose: fn(),
    scoringMode: ScoreMode.SETS,
    maxSets: 5,
  },
  parameters: { sourceFiles: ['components/ScoreModal.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Sets = {
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);
    const inputs = body.getAllByRole('spinbutton');
    await userEvent.clear(inputs[0]);
    await userEvent.type(inputs[0], '3');
    await userEvent.clear(inputs[1]);
    await userEvent.type(inputs[1], '1');
    await userEvent.click(body.getByRole('button', { name: /save/i }));
    await expect(args.onSave).toHaveBeenCalledWith(
      fixtures.match.id,
      fixtures.match.player1Id,
      [[3, 1]],
      false,
    );
  },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Existing = { args: { match: fixtures.playedMatch } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Points = {
  args: { match: fixtures.pointsMatch, scoringMode: ScoreMode.POINTS },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Locked = {
  args: {
    match: fixtures.playedMatch,
    lockedWinnerId: fixtures.playedMatch.winnerId ?? undefined,
  },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Walkover = {
  args: { match: { ...fixtures.playedMatch, walkover: true } },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Doubles = {
  args: {
    match: fixtures.doubles.bracket.rounds[0]?.[0] ?? fixtures.match,
    players: fixtures.doubles.players,
    participants: fixtures.doubles.participants,
  },
};
