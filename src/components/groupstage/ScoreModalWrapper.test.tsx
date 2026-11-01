import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider } from '../../i18n/languageContext';
import { MAX_POINTS } from '../../constants';
import * as MatchService from '../../services/matchService';
import { BracketType, Format, ScoreMode } from '../../types';
import type { GroupsToBracketTournament } from '../../types';
import { generateBracket } from '../../utils/bracketUtils';
import { generateDoubleElim } from '../../utils/doubleElimUtils';
import { createGroupStage } from '../../utils/groupStageUtils';
import { planMatchChange } from '../../utils/matchChanges';
import type { GroupMatchTarget } from '../../utils/matchEditing';
import { buildParticipants, getParticipantPlayers } from '../../utils/participantUtils';
import { ScoreModalWrapper } from './ScoreModalWrapper';

const { saveMatchChange } = MatchService;

vi.mock('../../services/matchService', async (importOriginal) => {
  const original = await importOriginal<typeof MatchService>();
  return { ...original, saveMatchChange: vi.fn() };
});
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); localStorage.setItem('tournado-lang', 'en'); });

function fixture(): GroupsToBracketTournament {
  const players = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, name: `Player ${i}` }));
  const participants = buildParticipants(players, 2, []);
  const entrants = getParticipantPlayers(players, participants);
  const mainBracket = generateBracket(entrants);
  const consolationBracket = generateBracket(entrants.toReversed());
  const mainDoubleElim = generateDoubleElim(entrants);
  const consolationDoubleElim = generateDoubleElim(entrants.toReversed());
  const groupStage = createGroupStage(entrants, { groupCount: 2, qualifiers: [1, 1], consolation: true });
  // Historical draws can reuse IDs. Scope, not the ID alone, must select the editor and write.
  for (const match of [mainBracket.rounds[0]![0]!, consolationBracket.rounds[0]![0]!,
    mainDoubleElim.winners.rounds[0]![0]!, consolationDoubleElim.winners.rounds[0]![0]!,
    groupStage.groups[0]!.schedule.rounds[0]!.matches[0]!]) match.id = 'shared-id';
  return { id: 'groups-editor', name: 'Groups', version: 1, createdAt: '', format: Format.GROUPS_TO_BRACKET,
    players, participants, teamSize: 2, groupStage, maxSets: 3, groupStageMaxSets: 5, bracketMaxSets: 7,
    groupStageBrackets: { bracketType: BracketType.SINGLE_ELIM, mainBracket, consolationBracket, mainDoubleElim, consolationDoubleElim },
  };
}

it.each(['group', 'mainBracket', 'consolationBracket', 'mainDoubleElim', 'consolationDoubleElim'] as const)(
  'derives a %s team editor and saves through the same scoped scoring rules', async (section) => {
    const tournament = fixture();
    const group = tournament.groupStage.groups[0]!;
    const editing: GroupMatchTarget = section === 'group'
      ? { groupId: group.id, matchId: 'shared-id' } : { section, matchId: 'shared-id' };
    const playoffs = tournament.groupStageBrackets!;
    let expectedMatch = group.schedule.rounds[0]!.matches[0]!;
    if (section === 'mainBracket' || section === 'consolationBracket') expectedMatch = playoffs[section]!.rounds[0]![0]!;
    if (section === 'mainDoubleElim' || section === 'consolationDoubleElim') expectedMatch = playoffs[section]!.winners.rounds[0]![0]!;
    const close = vi.fn();
    vi.mocked(saveMatchChange).mockImplementation((_id, change) => Promise.resolve(planMatchChange(tournament, change).tournament));
    render(<LanguageProvider><ScoreModalWrapper tournament={tournament} editing={editing} onClose={close} /></LanguageProvider>);
    const expectedName = getParticipantPlayers(tournament.players, tournament.participants!)
      .find((player) => player.id === expectedMatch.player1Id)!.name;
    expect(screen.getAllByText(expectedName).length).toBeGreaterThan(0);
    const winningScore = section === 'group' ? 3 : 4;
    const input = screen.getAllByRole('spinbutton')[0]!;
    expect(input.getAttribute('max')).toBe(section === 'group' ? '5' : '7');
    fireEvent.change(input, { target: { value: String(winningScore) } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => { expect(close).toHaveBeenCalledOnce(); });
    expect(saveMatchChange).toHaveBeenCalledOnce();
    expect(vi.mocked(saveMatchChange).mock.calls[0]![1]).toMatchObject({ ...editing,
      scores: [[winningScore, 0]], expectedPlayers: [expectedMatch.player1Id, expectedMatch.player2Id] });
  },
);

it('uses tournament scoring defaults and follows current tournament data', () => {
  const tournament = fixture();
  delete tournament.groupStageMaxSets;
  delete tournament.bracketMaxSets;
  const editing = { section: 'mainBracket', matchId: 'shared-id' } as const;
  const view = render(<LanguageProvider><ScoreModalWrapper tournament={tournament} editing={editing} onClose={vi.fn()} /></LanguageProvider>);
  expect(screen.getAllByRole('spinbutton')[0]!.getAttribute('max')).toBe('3');
  view.rerender(<LanguageProvider><ScoreModalWrapper tournament={{ ...tournament, maxSets: 9 }} editing={editing} onClose={vi.fn()} /></LanguageProvider>);
  expect(screen.getAllByRole('spinbutton')[0]!.getAttribute('max')).toBe('9');
  view.rerender(<LanguageProvider><ScoreModalWrapper tournament={{ ...tournament, scoringMode: ScoreMode.POINTS }} editing={editing} onClose={vi.fn()} /></LanguageProvider>);
  expect(screen.getAllByRole('spinbutton')[0]!.getAttribute('max')).toBe(String(MAX_POINTS));
});

it('does not open an editor for a missing target or silently fall back to another draw', () => {
  const tournament = fixture();
  tournament.groupStageBrackets!.consolationBracket = null;
  const view = render(<LanguageProvider><ScoreModalWrapper tournament={tournament}
    editing={{ section: 'consolationBracket', matchId: 'shared-id' }} onClose={vi.fn()} /></LanguageProvider>);
  expect(screen.queryByRole('dialog')).toBeNull();
  view.rerender(<LanguageProvider><ScoreModalWrapper tournament={tournament} editing={null} onClose={vi.fn()} /></LanguageProvider>);
  expect(screen.queryByRole('dialog')).toBeNull();
});
