import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
function editor(tournament = fixture(), match = tournament.bracket.rounds[0]![0]!): { tournament: SingleElimTournament; close: ReturnType<typeof vi.fn<() => void>>; rerender: ReturnType<typeof render>['rerender'] } {
  const close = vi.fn<() => void>();
  vi.mocked(saveMatchChange).mockResolvedValue(tournament);
  const view = render(<LanguageProvider><ScoreModal match={match} players={tournament.players}
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


it('confirms a terminal clear without a history warning and preserves cancellation', async () => {
  const tournament = fixture();
  const final = tournament.bracket.rounds.at(-1)![0]!;
  const { close } = editor(tournament, final);
  fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));
  let dialog = screen.getByRole('dialog', { name: 'Clear result' });
  expect(saveMatchChange).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog', { name: 'Clear result' })).toBeNull();
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));
  dialog = screen.getByRole('dialog', { name: 'Clear result' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Clear result' }));
  await waitFor(() => { expect(close).toHaveBeenCalledOnce(); });
  expect(vi.mocked(saveMatchChange).mock.calls[0]![1]).toMatchObject({
    type: 'clear', matchId: final.id, expectedPlayers: [final.player1Id, final.player2Id],
  });
});

it('routes a clear with dependencies straight to history confirmation', async () => {
  const { close } = editor();
  fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));
  expect(screen.getByRole('heading', { name: 'Results to clear: 3' })).toBeDefined();
  expect(screen.queryByRole('dialog', { name: 'Clear result' })).toBeNull();
  expect(saveMatchChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm change and clear 3 results' }));
  await waitFor(() => { expect(close).toHaveBeenCalledOnce(); });
});

it('promotes an ordinary clear to an updated history review after a concurrent edit', async () => {
  const tournament = fixture();
  const final = tournament.bracket.rounds.at(-1)![0]!;
  const { close } = editor(tournament, final);
  const updated = structuredClone(tournament);
  updated.bracket.rounds.at(-1)![0]!.scores = [[3, 2]];
  const impact = planMatchChange(updated, { type: 'clear', matchId: final.id,
    expectedPlayers: [final.player1Id, final.player2Id] }).impact;
  vi.mocked(saveMatchChange).mockRejectedValueOnce(new HistoryConfirmationRequiredError(impact)).mockResolvedValueOnce(updated);
  fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Clear result' })).getByRole('button', { name: 'Clear result' }));
  await screen.findByText(/tournament changed while this dialog was open/i);
  expect(screen.queryByRole('dialog', { name: 'Clear result' })).toBeNull();
  expect(saveMatchChange).toHaveBeenCalledOnce();
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm draw change' }));
  await waitFor(() => { expect(close).toHaveBeenCalledOnce(); });
  expect(vi.mocked(saveMatchChange).mock.calls[1]![2]).toBe(impact.token);
});

it('preserves explicit clear confirmation in callback mode', () => {
  const tournament = fixture();
  const match = tournament.bracket.rounds.at(-1)![0]!;
  const save = vi.fn();
  render(<LanguageProvider><ScoreModal match={match} players={tournament.players} onSave={save} onClose={vi.fn()} /></LanguageProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Clear result' })).getByRole('button', { name: 'Clear result' }));
  expect(save).toHaveBeenCalledWith(match.id, null, [], false);
  expect(saveMatchChange).not.toHaveBeenCalled();
});
