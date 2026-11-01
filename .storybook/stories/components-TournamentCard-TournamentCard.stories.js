// @ts-check
import { fn, expect, userEvent, within } from 'storybook/test';
import * as fixtures from '../fixtures';
import { TournamentCard } from '../../src/components/TournamentCard';
/** @satisfies {import('@storybook/react-vite').Meta<typeof TournamentCard>} */
const meta = {
  title: 'Tournament/Card',
  component: TournamentCard,
  tags: ['autodocs'],
  args: { tournament: fixtures.summary, onDelete: fn(), onDuplicate: fn() },
  parameters: { sourceFiles: ['components/TournamentCard.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Active = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const duplicate = canvas.getByRole('button', { name: /duplicate/i });
    duplicate.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onDuplicate).toHaveBeenCalledWith(fixtures.summary.id);
    const remove = canvas.getByRole('button', { name: /delete/i });
    remove.focus();
    await userEvent.keyboard(' ');
    await expect(args.onDelete).toHaveBeenCalledWith(fixtures.summary.id);
  },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Completed = {
  args: {
    tournament: {
      ...fixtures.summary,
      winnerId: 'p1',
      completedAt: '2026-10-01T12:00:00.000Z',
    },
  },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Doubles = {
  args: { tournament: { ...fixtures.summary, teamSize: 2 } },
};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const LongTitle = {
  args: {
    tournament: {
      ...fixtures.summary,
      name: 'International club championship with a particularly long tournament title',
    },
  },
};
