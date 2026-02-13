import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { HomePage } from './homePage';
import { FORMATS } from '../constants';
import type { Tournament } from '../types';

const mockTournaments: Tournament[] = [
  {
    id: 't1',
    name: 'Tournament 1',
    players: [],
    createdAt: '2024-01-01',
    format: FORMATS.SINGLE_ELIM,
    bracket: { rounds: [], thirdPlaceMatch: null },
  },
  {
    id: 't2',
    name: 'Tournament 2',
    players: [],
    createdAt: '2024-01-02',
    format: FORMATS.SINGLE_ELIM,
    bracket: { rounds: [], thirdPlaceMatch: null },
  },
];

function createLocalStorageMock(): { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> } {
  let store: string = JSON.stringify(mockTournaments);
  return {
    getItem: vi.fn((): string => store),
    setItem: vi.fn((_key: string, value: string): void => {
      store = value;
    }),
  };
}

const localStorageMock = createLocalStorageMock();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

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

vi.mock('../utils/usePageTitle', () => ({
  usePageTitle: vi.fn(),
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
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockTournaments));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders tournament cards', () => {
    renderHomePage();
    expect(screen.getByText('Tournament 1')).toBeDefined();
    expect(screen.getByText('Tournament 2')).toBeDefined();
  });

  it('shows delete all button when there are multiple tournaments', () => {
    renderHomePage();
    expect(screen.getByText('Delete All')).toBeDefined();
  });

  it('does not show delete all button when there is only one tournament', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([mockTournaments[0]]));
    renderHomePage();
    expect(screen.queryByText('Delete All')).toBeNull();
  });

  it('shows delete confirmation modal when delete is clicked', () => {
    renderHomePage();

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    const firstDeleteButton = deleteButtons[0];
    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);
    }

    expect(screen.getByText('Delete this tournament?')).toBeDefined();
    const tournamentNamesInModal = screen.getAllByText('Tournament 1');
    expect(tournamentNamesInModal.length).toBeGreaterThan(0);
  });

  it('closes delete modal when cancel is clicked', () => {
    renderHomePage();

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

  it('shows delete all confirmation modal when delete all is clicked', () => {
    renderHomePage();

    const deleteAllButton = screen.getByText('Delete All');
    fireEvent.click(deleteAllButton);

    expect(screen.getByText('Delete all tournaments?')).toBeDefined();
    expect(screen.getByText(/This will permanently delete all 2 tournaments/)).toBeDefined();
  });

  it('closes delete all modal when cancel is clicked', () => {
    renderHomePage();

    const deleteAllButton = screen.getByText('Delete All');
    fireEvent.click(deleteAllButton);

    expect(screen.getByText('Delete all tournaments?')).toBeDefined();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Delete all tournaments?')).toBeNull();
  });

  it('calls persistence.delete when confirming single delete', () => {
    renderHomePage();

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

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('calls persistence.deleteAll when confirming delete all', () => {
    renderHomePage();

    const deleteAllButton = screen.getByText('Delete All');
    fireEvent.click(deleteAllButton);

    const confirmButtons = screen.getAllByRole('button', { name: 'Delete All' });
    const confirmButton = confirmButtons.find(
      button => button.classList.contains('bg-[var(--color-accent)]'),
    );
    if (confirmButton) {
      fireEvent.click(confirmButton);
    }

    expect(localStorageMock.setItem).toHaveBeenCalledWith('tournado', '[]');
  });
});
