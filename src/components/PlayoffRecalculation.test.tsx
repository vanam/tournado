import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PlayoffRecalculation } from './PlayoffRecalculation';
import { LanguageProvider } from '../i18n/languageContext';
import * as MatchService from '../services/matchService';
import { planMatchChange } from '../utils/matchChanges';
import { buildGroupStagePlayoffs, createGroupStage } from '../utils/groupStageUtils';
import { Format } from '../types';
import type { GroupsToBracketTournament } from '../types';

vi.mock('../services/matchService', async (importOriginal) => {
  const original = await importOriginal<typeof MatchService>();
  return { ...original, saveMatchChange: vi.fn() };
});

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); localStorage.setItem('tournado-lang', 'en'); });

it('rechecks the impact of explicit reseeding after concurrent playoff edits', async () => {
  const players = Array.from({ length: 4 }, (_, i) => ({ id: `p${i}`, name: `Player ${i}` }));
  const groupStage = createGroupStage(players, { groupCount: 2, qualifiers: [1, 1], consolation: false });
  for (const group of groupStage.groups) for (const match of group.schedule.rounds.flatMap((round) => round.matches)) {
    match.winnerId = match.player1Id;
    match.scores = [[3, 0]];
  }
  const playoffs = buildGroupStagePlayoffs(groupStage, players);
  const final = playoffs.mainBracket!.rounds[0]![0]!;
  final.player1Id = players.find((player) => player.id !== final.player1Id && player.id !== final.player2Id)!.id;
  final.winnerId = final.player1Id;
  final.scores = [[3, 0]];
  const tournament: GroupsToBracketTournament = { id: 'reseed', name: 'Reseed', version: 1, createdAt: '',
    format: Format.GROUPS_TO_BRACKET, players, groupStage, groupStagePlayoffs: playoffs };
  const updated = structuredClone(tournament);
  updated.groupStagePlayoffs!.mainBracket!.rounds[0]![0]!.scores = [[3, 2]];
  const fresh = planMatchChange(updated, { type: 'reseed' }).impact;
  expect(fresh.deletedResults).toHaveLength(1);
  vi.mocked(MatchService.saveMatchChange)
    .mockRejectedValueOnce(new MatchService.HistoryConfirmationRequiredError(fresh)).mockResolvedValueOnce(updated);
  render(<LanguageProvider><PlayoffRecalculation tournament={tournament} /></LanguageProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Review playoff recalculation' }));
  expect(MatchService.saveMatchChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm change and clear 1 results' }));
  await screen.findByText(/tournament changed while this dialog was open/i);
  expect(MatchService.saveMatchChange).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm change and clear 1 results' }));
  await waitFor(() => { expect(MatchService.saveMatchChange).toHaveBeenCalledTimes(2); });
  expect(vi.mocked(MatchService.saveMatchChange).mock.calls[1]![2]).toBe(fresh.token);
});
