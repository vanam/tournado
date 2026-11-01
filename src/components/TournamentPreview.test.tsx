import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { LanguageProvider } from '../i18n/languageContext';
import { Format } from '../types';
import type { BaseGroup } from '../utils/groupStageUtils';
import { TournamentPreview } from './TournamentPreview';

afterEach(cleanup);

it('submits group moves to the owner and renders the assignment returned by it', () => {
  const players = [{ id: 'alice', name: 'Alice' }, { id: 'bob', name: 'Bob' }];
  const groups: BaseGroup[] = [
    { id: 'g1', name: 'Group A', playerIds: ['alice'] },
    { id: 'g2', name: 'Group B', playerIds: ['bob'] },
  ];
  const changed = vi.fn<(groups: BaseGroup[]) => void>();
  const view = render(<LanguageProvider><TournamentPreview format={Format.GROUPS_TO_BRACKET}
    players={players} groupCount={2} externalGroups={groups} onGroupsChange={changed} /></LanguageProvider>);
  const lists = screen.getAllByRole('list');
  fireEvent.dragStart(screen.getByText('Alice').closest('li')!);
  fireEvent.dragOver(lists[1]!.parentElement!);
  fireEvent.drop(lists[1]!.parentElement!);
  const updated = changed.mock.calls[0]![0];
  expect(updated.map((group) => group.playerIds)).toEqual([[], ['bob', 'alice']]);
  expect(within(lists[0]!).getByText('Alice')).toBeDefined();
  view.rerender(<LanguageProvider><TournamentPreview format={Format.GROUPS_TO_BRACKET}
    players={players} groupCount={2} externalGroups={updated} onGroupsChange={changed} /></LanguageProvider>);
  expect(within(screen.getAllByRole('list')[0]!).queryByText('Alice')).toBeNull();
  expect(within(screen.getAllByRole('list')[1]!).getByText('Alice')).toBeDefined();
});
