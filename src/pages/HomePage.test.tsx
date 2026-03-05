import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { Format } from '../types';
import type { TournamentSummary } from '../api/types';

const mockTournaments: TournamentSummary[] = [
  {
    id: 't1',
    name: 'Tournament 1',
    format: Format.SINGLE_ELIM,
    createdAt: '2024-01-01',
    completedAt: null,
    winnerId: null,
    playerCount: 0,
    teamSize: 1,
  },
  {
    id: 't2',
    name: 'Tournament 2',
    format: Format.SINGLE_ELIM,
    createdAt: '2024-01-02',
    completedAt: null,
    winnerId: null,
    playerCount: 0,
    teamSize: 1,
  },
];

const mockListTournaments = vi.fn();
const mockDeleteTournament = vi.fn();
const mockDeleteAllTournaments = vi.fn();
const mockDuplicateTournament = vi.fn();

vi.mock('../api/client', () => ({
  listTournaments: (...args: unknown[]): unknown => mockListTournaments(...args),
  deleteTournament: (...args: unknown[]): unknown => mockDeleteTournament(...args),
  deleteAllTournaments: (...args: unknown[]): unknown => mockDeleteAllTournaments(...args),
  duplicateTournament: (...args: unknown[]): unknown => mockDuplicateTournament(...args),
}));

vi.mock('../i18n/useTranslation', () => ({
  useTranslation: (): { t: (key: string, args?: Record<string, unknown>) => string } => ({
    t: (key: string, args?: Record<string, unknown>): string => {
      const count = typeof args?.['count'] === 'number' ? args['count'] : 0;
      const translations: Record<string, string> = {
        'home.title': 'Tournaments',
        'home.cta': 'Create and run table tennis tournaments.',
        'home.newTournament': 'New Tournament',
        'home.noTournaments': 'No tournaments yet',
        'home.noTournamentsDesc': 'Create your first tournament.',
        'home.deleteConfirm': 'Delete this tournament?',
        'home.deleteAll': 'Delete All',
        'home.deleteAllConfirm': 'Delete all tournaments?',
        'home.deleteAllDesc': `This will permanently delete all ${count} tournaments.`,
        'home.cancel': 'Cancel',
        'card.delete': 'Delete',
        'card.created': 'Created: {{date}}',
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock('../hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

vi.mock('../utils/analytics', () => ({
  useAnalytics: (): { tracker: { trackPageView: () => void } } => ({
    tracker: { trackPageView: vi.fn() },
  }),
}));

function renderHomePage(): ReturnType<typeof render> {
  return render(
    <HashRouter>
      <HomePage />
    </HashRouter>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTournaments.mockResolvedValue([...mockTournaments]);
    mockDeleteTournament.mockResolvedValue(null);
    mockDeleteAllTournaments.mockResolvedValue(null);
    mockDuplicateTournament.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders tournament cards', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Tournament 1')).toBeDefined();
      expect(screen.getByText('Tournament 2')).toBeDefined();
    });
  });

  it('shows delete all button when there are multiple tournaments', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Delete All')).toBeDefined();
    });
  });

  it('does not show delete all button when there is only one tournament', async () => {
    mockListTournaments.mockResolvedValue([mockTournaments[0]]);
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Tournament 1')).toBeDefined();
    });
    expect(screen.queryByText('Delete All')).toBeNull();
  });

  it('shows delete confirmation modal when delete is clicked', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Tournament 1')).toBeDefined();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    const firstDeleteButton = deleteButtons[0];
    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);
    }

    expect(screen.getByText('Delete this tournament?')).toBeDefined();
    const tournamentNamesInModal = screen.getAllByText('Tournament 1');
    expect(tournamentNamesInModal.length).toBeGreaterThan(0);
  });

  it('closes delete modal when cancel is clicked', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Tournament 1')).toBeDefined();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    const firstDeleteButton = deleteButtons[0];
    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);
    }

    expect(screen.getByText('Delete this tournament?')).toBeDefined();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Delete this tournament?')).toBeNull();
  });

  it('shows delete all confirmation modal when delete all is clicked', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Delete All')).toBeDefined();
    });

    const deleteAllButton = screen.getByText('Delete All');
    fireEvent.click(deleteAllButton);

    expect(screen.getByText('Delete all tournaments?')).toBeDefined();
    expect(screen.getByText(/This will permanently delete all 2 tournaments/)).toBeDefined();
  });

  it('closes delete all modal when cancel is clicked', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Delete All')).toBeDefined();
    });

    const deleteAllButton = screen.getByText('Delete All');
    fireEvent.click(deleteAllButton);

    expect(screen.getByText('Delete all tournaments?')).toBeDefined();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Delete all tournaments?')).toBeNull();
  });

  it('calls persistence.delete when confirming single delete', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Tournament 1')).toBeDefined();
    });

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    const firstDeleteButton = deleteButtons[0];
    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);
    }

    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    const confirmButton = confirmButtons.find(
      button => button.classList.contains('bg-[var(--color-accent)]'),
    );
    if (confirmButton) {
      fireEvent.click(confirmButton);
    }

    await waitFor(() => {
      expect(mockDeleteTournament).toHaveBeenCalled();
    });
  });

  it('calls persistence.deleteAll when confirming delete all', async () => {
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText('Delete All')).toBeDefined();
    });

    const deleteAllButton = screen.getByText('Delete All');
    fireEvent.click(deleteAllButton);

    const confirmButtons = screen.getAllByRole('button', { name: 'Delete All' });
    const confirmButton = confirmButtons.find(
      button => button.classList.contains('bg-[var(--color-accent)]'),
    );
    if (confirmButton) {
      fireEvent.click(confirmButton);
    }

    await waitFor(() => {
      expect(mockDeleteAllTournaments).toHaveBeenCalled();
    });
  });
});
