import { describe, it, expect } from 'vitest';
import { parseBulkInput } from './importUtils';

describe('parseBulkInput', () => {
  // ── Valid inputs ────────────────────────────────────────────────────────────

  it.each(['Alice (ELO 1500)', 'Alice (elo 1500)', 'Alice (ELO  1500)', 'Alice (ELO 1500)  '])("parses valid ELO input %s", (input) => {
    const { parsed, errors } = parseBulkInput(input, []);
    expect(errors).toHaveLength(0);
    expect(parsed).toEqual([{ name: 'Alice', elo: 1500 }]);
  });

  it('parses a player with no ELO annotation', () => {
    const { parsed, errors } = parseBulkInput('Bob', []);
    expect(errors).toHaveLength(0);
    expect(parsed).toEqual([{ name: 'Bob' }]);
  });







  it('parses multiple valid players', () => {
    const input = 'Alice (ELO 1500)\nBob\nCarol (ELO 1200)';
    const { parsed, errors } = parseBulkInput(input, []);
    expect(errors).toHaveLength(0);
    expect(parsed).toEqual([
      { name: 'Alice', elo: 1500 },
      { name: 'Bob' },
      { name: 'Carol', elo: 1200 },
    ]);
  });

  it('skips blank lines', () => {
    const input = 'Alice\n\n\nBob\n';
    const { parsed, errors } = parseBulkInput(input, []);
    expect(errors).toHaveLength(0);
    expect(parsed).toHaveLength(2);
  });

  // ── ELO format errors ───────────────────────────────────────────────────────

  it.each(['Petr (ELO -12.0)', 'Petr (ELO 12.0)', 'Petr (ELO)', 'Petr (ELO 0)', 'Petr (ELO -12)', 'Petr (ELO +12)', 'Petr (ELO abc)', 'Petr (ELO 1 500)', 'Petr (ELO 1.5e3)'])("parses invalid ELO input %s", (input) => {
    const { errors } = parseBulkInput(input, []);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorElo' }]);
  });

















  it('reports empty name when only ELO annotation present', () => {
    const { errors } = parseBulkInput('(ELO 100)', []);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorEmpty' }]);
  });

  // ── Other errors ────────────────────────────────────────────────────────────

  it('reports error for empty name without ELO', () => {
    const { errors } = parseBulkInput(' '.repeat(3), []);
    // blank line is skipped, so no error and no parsed
    expect(errors).toHaveLength(0);
  });

  it('reports duplicate within batch', () => {
    const input = 'Alice\nAlice';
    const { errors } = parseBulkInput(input, []);
    expect(errors).toEqual([{ line: 2, msgKey: 'players.importErrorDuplicate' }]);
  });

  it('duplicate check is case-insensitive', () => {
    const input = 'Alice\nalice';
    const { errors } = parseBulkInput(input, []);
    expect(errors).toEqual([{ line: 2, msgKey: 'players.importErrorDuplicate' }]);
  });

  it('reports error for name already in existingNames', () => {
    const { errors } = parseBulkInput('Alice', ['Alice']);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorExists' }]);
  });

  it('existingNames check is case-insensitive', () => {
    const { errors } = parseBulkInput('alice', ['Alice']);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorExists' }]);
  });
});
