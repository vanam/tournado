// @ts-check
import { fn } from 'storybook/test';
import { HistoryConfirmation } from '../../src/components/HistoryConfirmation';
import { planMatchChange } from '../../src/utils/matchChanges';
import { singleCompleted } from '../fixtures';
const change = { type: 'score', matchId: singleCompleted.bracket.rounds[0]?.[0]?.id ?? '', scores: [[0, 3]], walkover: false };
/** @type {import('../../src/utils/matchChanges').MatchChange} */
const command = { ...change, type: 'score', scores: [[0, 3]] };
/** @satisfies {import('@storybook/react-vite').Meta<typeof HistoryConfirmation>} */
const meta = {
  title: 'Dialogs/HistoryConfirmation', component: HistoryConfirmation, tags: ['autodocs'],
  args: { tournament: singleCompleted, review: { change: command, impact: planMatchChange(singleCompleted, command).impact, stale: false },
    isSaving: false, error: null, onConfirm: fn(), onCancel: fn() },
  parameters: { sourceFiles: ['components/HistoryConfirmation.tsx'] },
};
export default meta;
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const WinnerChange = {};
/** @type {import('@storybook/react-vite').StoryObj<typeof meta>} */
export const UpdatedImpact = { args: { review: { ...meta.args.review, stale: true } } };
