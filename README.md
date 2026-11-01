# Tournado

**Tournament management system for table tennis — runs entirely in your browser.**

[![Live Demo](https://img.shields.io/badge/live%20demo-tournado.cz-blue)](http://tournado.cz/)
[![Build](https://github.com/vanam/tournado/actions/workflows/build.yml/badge.svg)](https://github.com/vanam/tournado/actions/workflows/build.yml)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-green)](./LICENSE)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)

---

## Overview

Tournado is a free, offline-first tournament management system designed for table tennis. It runs entirely in the browser — no account, no server, no setup required. Create and manage tournaments from player registration through final standings, with live bracket updates and full offline support.

**Try it now → [tournado.cz](http://tournado.cz/)**

---

## Features

### Tournament Formats

| Format | Description                                                                      | Best for |
|---|----------------------------------------------------------------------------------|---|
| **Round Robin** | Every player plays every other player; live standings table updates in real time | Small groups, league-style play |
| **Single Elimination** | Classic one-loss knockout bracket; with a third-place match                      | Quick tournaments, large fields |
| **Double Elimination** | Winners and losers brackets; grand final with potential reset match              | Competitive events, comeback path |
| **Swiss System** | Configurable rounds with automatic pairing based on current results              | Long events, no eliminations |
| **Group Stage → Bracket** | Round-robin groups, then top qualifiers advance to a knockout bracket            | Club championships, mixed formats |

All formats support both **singles and doubles** play.

### Player Management

- **Player Library** — reusable database of players with ELO ratings, persisted across tournaments
- **Groups** — organize players into color-coded groups for quick team selection
- **Bulk import** — paste a list of names (with optional ELO: `Player Name (ELO 1500)`)
- **Drag-and-drop** reordering of players and groups
- **Player profiles** — individual pages showing tournament history and statistics
- **Mid-tournament flexibility** — adjust rosters at any point

### Scoring

- **Games/Sets mode** — track only set wins and losses per match
- **Points mode** — record individual point scores within each game
- **Configurable max sets** — independently set for group stage and bracket stage
- **Walkover support** — mark a match as a walkover without entering scores
- **Edit at any time** — go back and correct any recorded result

### Data Portability

- **JSON export** — download a full backup of all tournaments and your player library
- **Selective export** — choose exactly which tournaments and players to include
- **Import with preview** — review what will be imported before committing
- **Version migration** — data format is versioned; older exports are automatically migrated

### UI & Accessibility

- **Dark and light mode** — toggle at any time; preference is remembered
- **Languages** — English, Czech, German, Spanish
- **Responsive design** — works on desktop, tablet, and mobile
- **Keyboard and screen-reader accessible** — built on Radix UI primitives
- **Fullscreen mode** — optimized for display or projection during live events

### Progressive Web App

- **Installable** — add to your home screen on any device for a native app feel
- **Fully offline** — all features work without an internet connection
- **Automatic updates** — the app checks for new versions in the background

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 24.15 or newer

### Install & Run

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Run tests
npm run test

# Build for production (includes lint + type-check)
npm run build

# Preview the production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

---

## Tech Stack

| Category | Technology                          |
|---|-------------------------------------|
| UI framework | React 19, TypeScript 6            |
| Build tool | Vite 8                              |
| Routing | React Router DOM 7                  |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| Local database | RxDB 17 + Dexie (IndexedDB)         |
| Forms | React Hook Form 7, AJV 8            |
| Internationalization | Custom i18n (EN, CS, DE, ES)        |
| PWA | Vite PWA Plugin + Workbox           |
| Testing | Vitest, Testing Library             |
| Security | DOMPurify, Trusted Types, CSP       |

---

## Design Trade-offs

Tournado deliberately avoids a backend. These are intentional decisions, not limitations:

- **No account required** — zero friction, start immediately
- **Device-local storage** — your tournament data stays on your device and never leaves your browser
- **No cloud sync** — use the JSON export/import feature to move data between devices or create backups
- **No multi-user collaboration** — one organizer manages the tournament from one device

---

## License

[GPL-3.0](./LICENSE)


## Storybook

```sh
npm run storybook          # Development catalog on port 6006
npm run build:storybook    # Coverage + typecheck + static catalog in storybook-static
npm run test:storybook     # Render every story and run interactions in Chromium
```

Install Chromium once with `npx playwright install chromium`. Linux CI also needs browser system dependencies (`npx playwright install --with-deps chromium`).

The catalog covers all component and page modules, with 221 stories across primitives, player entry, dialogs, tournament formats, standings, playoffs and complete pages. Theme and language toolbars use the application's real providers. Stories include singles/doubles, incomplete teams, BYEs, walkovers, shared ranks, empty data, completed tournaments and grand-final resets.

Storybook uses an isolated RxDB memory database, disabled analytics and a service-worker stub. It never opens or migrates the application's IndexedDB database. Page/service interactions share the same seeded memory database, reset before each story. Documentation examples render in separate iframes so portals and database state stay isolated. The documentation build has its own 1.6 MB chunk budget for Storybook and the lazy-loaded accessibility engine. The application retains Vite's default budget.

Autodocs combines public subcomponents where appropriate, such as the Card, Table and Select families.

CSF modules use JavaScript with checked JSDoc types, with typed TypeScript fixtures and interactive harnesses. This preserves the repository's prohibition on default exports in TypeScript while using Storybook's required CSF default export. `npm run check:storybook` fails if a component/page module has no documented story owner.

See [review corrections and dependency compatibility](docs/review-fixes.md) for the reviewed defects and tooling version constraints.
