import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ScoreModal } from './ScoreModal';
import { LanguageProvider } from '../i18n/languageContext';
import * as MatchService from '../services/matchService';
import type { MatchChange } from '../utils/matchChanges';
const { HistoryConfirmationRequiredError, saveMatchChange } = MatchService;
import { planMatchChange } from '../utils/matchChanges';
import { advanceWinner, generateBracket } from '../utils/bracketUtils';
import { Format } from '../types';
import type { SingleElimTournament } from '../types';

vi.mock('../services/matchService', async (importOriginal) => {
  const original = await importOriginal<typeof MatchService>();
  return { ...original, saveMatchChange: vi.fn() };
});
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); localStorage.setItem('tournado-lang', 'en'); });

function fixture(): SingleElimTournament {
  const players = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, name: `Player ${i}` }));
  const bracket = generateBracket(players);
  for (const round of bracket.rounds) for (const match of round) advanceWinner(bracket, match.id, match.player1Id!, [[3, 0]]);
  advanceWinner(bracket, bracket.thirdPlaceMatch!.id, bracket.thirdPlaceMatch!.player1Id!, [[3, 0]]);
  return { id: 'editor', version: 1, name: 'History editor', format: Format.SINGLE_ELIM, players, bracket, createdAt: '' };
}
function editor(tournament = fixture()): { tournament: SingleElimTournament; close: ReturnType<typeof vi.fn<() => void>>; rerender: ReturnType<typeof render>['rerender'] } {
  const close = vi.fn<() => void>();
  vi.mocked(saveMatchChange).mockResolvedValue(tournament);
  const view = render(<LanguageProvider><ScoreModal match={tournament.bracket.rounds[0]![0]!} players={tournament.players}
    history={{ tournament }} onClose={close} /></LanguageProvider>);
  return { tournament, close, rerender: view.rerender };
}
function changeWinner(): void {
  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.change(inputs[0]!, { target: { value: '0' } });
  fireEvent.change(inputs[1]!, { target: { value: '3' } });
}

it('shows exact impact, preserves a cancelled draft and requires an explicit confirmation click', async () => {
  const { close } = editor();
  changeWinner();
  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.keyDown(inputs[0]!, { key: 'Enter' });
  expect(screen.getByRole('heading', { name: 'Results to clear: 3' })).toBeDefined();
  expect(screen.getByText('Third Place')).toBeDefined();
  fireEvent.keyDown(document, { key: 'Enter' });
  expect(saveMatchChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Back to editing' }));
  expect(screen.queryByRole('heading', { name: 'Results to clear: 3' })).toBeNull();
  expect((screen.getAllByRole('spinbutton')[0] as HTMLInputElement).value).toBe('0');
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Review impact' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm change and clear 3 results' }));
  await waitFor(() => { expect(close).toHaveBeenCalledOnce(); });
  expect(saveMatchChange).toHaveBeenCalledOnce();
});

it('saves score-only corrections directly without asking to discard dependent results', async () => {
  const { close } = editor();
  fireEvent.change(screen.getAllByRole('spinbutton')[1]!, { target: { value: '2' } });
  expect(screen.getByText(/winner is unchanged/i)).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => { expect(close).toHaveBeenCalledOnce(); });
  expect(screen.queryByRole('heading', { name: /clear dependent results/i })).toBeNull();
  expect(vi.mocked(saveMatchChange).mock.calls[0]![1]).toMatchObject({ scores: [[3, 2]] });
});

it('updates the impact after a concurrent result change and requires a new confirmation', async () => {
  const { tournament, close } = editor();
  changeWinner();
  const updated = structuredClone(tournament);
  updated.bracket.rounds[1]![0]!.scores = [[3, 2]];
  const change = { type: 'score', matchId: tournament.bracket.rounds[0]![0]!.id, scores: [[0, 3]], walkover: false } satisfies MatchChange;
  const impact = planMatchChange(updated, change).impact;
  vi.mocked(saveMatchChange).mockRejectedValueOnce(new HistoryConfirmationRequiredError(impact)).mockResolvedValueOnce(updated);
  fireEvent.click(screen.getByRole('button', { name: 'Review impact' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm change and clear 3 results' }));
  await screen.findByText(/tournament changed while this dialog was open/i);
  expect(saveMatchChange).toHaveBeenCalledTimes(1);
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm change and clear 3 results' }));
  await waitFor(() => { expect(close).toHaveBeenCalledOnce(); });
  expect(vi.mocked(saveMatchChange).mock.calls[1]![2]).toBe(impact.token);
});

it('keeps the editor open and shows a failed save instead of dropping the draft', async () => {
  const { close } = editor();
  vi.mocked(saveMatchChange).mockRejectedValueOnce(new Error('Write failed'));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByRole('alert');
  expect(close).not.toHaveBeenCalled();
  expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
});

it('refuses to retarget a draft when participants change while the editor is open', async () => {
  const { tournament, close, rerender } = editor();
  const updated = structuredClone(tournament);
  const match = updated.bracket.rounds[0]![0]!;
  match.player1Id = 'p2';
  rerender(<LanguageProvider><ScoreModal match={match} players={updated.players} history={{ tournament: updated }} onClose={close} /></LanguageProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByText(/participants in this match changed/i);
  expect(saveMatchChange).not.toHaveBeenCalled();
  expect(close).not.toHaveBeenCalled();
});
