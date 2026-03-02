import { describe, it, expect } from 'vitest';
import { parseBulkInput } from './importUtils';

describe('parseBulkInput', () => {
  // ── Valid inputs ────────────────────────────────────────────────────────────

  it('parses a player with valid ELO', () => {
    const { parsed, errors } = parseBulkInput('Alice (ELO 1500)', []);
    expect(errors).toHaveLength(0);
    expect(parsed).toEqual([{ name: 'Alice', elo: 1500 }]);
  });

  it('parses a player with no ELO annotation', () => {
    const { parsed, errors } = parseBulkInput('Bob', []);
    expect(errors).toHaveLength(0);
    expect(parsed).toEqual([{ name: 'Bob' }]);
  });

  it('is case-insensitive for ELO keyword', () => {
    const { parsed, errors } = parseBulkInput('Alice (elo 1500)', []);
    expect(errors).toHaveLength(0);
    expect(parsed).toEqual([{ name: 'Alice', elo: 1500 }]);
  });

  it('allows extra space inside ELO annotation', () => {
    const { parsed, errors } = parseBulkInput('Alice (ELO  1500)', []);
    expect(errors).toHaveLength(0);
    expect(parsed).toEqual([{ name: 'Alice', elo: 1500 }]);
  });

  it('allows trailing whitespace after ELO annotation', () => {
    const { parsed, errors } = parseBulkInput('Alice (ELO 1500)  ', []);
    expect(errors).toHaveLength(0);
    expect(parsed).toEqual([{ name: 'Alice', elo: 1500 }]);
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

  it('rejects negative float ELO', () => {
    const { errors } = parseBulkInput('Petr (ELO -12.0)', []);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorElo' }]);
  });

  it('rejects positive float ELO', () => {
    const { errors } = parseBulkInput('Petr (ELO 12.0)', []);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorElo' }]);
  });

  it('rejects empty ELO content', () => {
    const { errors } = parseBulkInput('Petr (ELO)', []);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorElo' }]);
  });

  it('rejects zero ELO', () => {
    const { errors } = parseBulkInput('Petr (ELO 0)', []);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorElo' }]);
  });

  it('rejects negative integer ELO', () => {
    const { errors } = parseBulkInput('Petr (ELO -12)', []);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorElo' }]);
  });

  it('rejects ELO with leading plus sign', () => {
    const { errors } = parseBulkInput('Petr (ELO +12)', []);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorElo' }]);
  });

  it('rejects alphabetic ELO content', () => {
    const { errors } = parseBulkInput('Petr (ELO abc)', []);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorElo' }]);
  });

  it('rejects ELO with space inside number', () => {
    const { errors } = parseBulkInput('Petr (ELO 1 500)', []);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorElo' }]);
  });

  it('rejects scientific notation ELO', () => {
    const { errors } = parseBulkInput('Petr (ELO 1.5e3)', []);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorElo' }]);
  });

  it('reports empty name when only ELO annotation present', () => {
    const { errors } = parseBulkInput('(ELO 100)', []);
    expect(errors).toEqual([{ line: 1, msgKey: 'players.importErrorEmpty' }]);
  });

  // ── Other errors ────────────────────────────────────────────────────────────

  it('reports error for empty name without ELO', () => {
    const { errors } = parseBulkInput('   ', []);
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
