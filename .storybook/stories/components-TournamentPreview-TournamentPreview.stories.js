// @ts-check
import { fn, expect, within, fireEvent } from 'storybook/test';
import * as fixtures from '../fixtures';
import { Format } from '../../src/types';
import { TournamentPreview } from '../../src/components/TournamentPreview';
/** @satisfies {import('@storybook/react-vite').Meta<typeof TournamentPreview>} */
const meta = {
  title: 'Tournament/Preview',
  component: TournamentPreview,
  tags: ['autodocs'],
  args: {
    format: Format.SINGLE_ELIM,
    players: fixtures.players,
    groupCount: 2,
    onGroupsChange: fn(),
  },
  parameters: { sourceFiles: ['components/TournamentPreview.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Single = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Double = { args: { format: Format.DOUBLE_ELIM } };
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const Groups = {
  args: { format: Format.GROUPS_TO_BRACKET },
  play: async ({ canvasElement, args }) => {
    const player = within(canvasElement)
      .getByText('Alice')
      .closest('[draggable]');
    const target = canvasElement.querySelectorAll('ul')[1]?.parentElement;
    if (!player || !target) throw new Error('Missing group fixture');
    fireEvent.dragStart(player);
    fireEvent.dragOver(target);
    fireEvent.drop(target);
    await expect(args.onGroupsChange).toHaveBeenCalled();
  },
};
