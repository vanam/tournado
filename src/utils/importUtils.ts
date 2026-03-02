const BROAD_ELO = /\(ELO([^)]*)\)\s*$/i;
const VALID_ELO_CONTENT = /^\d+$/;

export function parseBulkInput(
  text: string,
  existingNames: string[],
): { parsed: Array<{ name: string; elo?: number }>; errors: Array<{ line: number; msgKey: string }> } {
  const lines = text.split('\n');
  const parsed: Array<{ name: string; elo?: number }> = [];
  const errors: Array<{ line: number; msgKey: string }> = [];
  const seenNames: string[] = [];

  let lineNum = 0;
  for (const rawLine of lines) {
    if (rawLine.trim() === '') continue;
    lineNum += 1;

    const eloMatch = BROAD_ELO.exec(rawLine);
    let name: string;
    let elo: number | undefined;

    if (eloMatch === null) {
      name = rawLine.trim();
    } else {
      name = rawLine.slice(0, eloMatch.index).trim();
      const eloContent = (eloMatch[1] ?? '').trim();
      if (!VALID_ELO_CONTENT.test(eloContent)) {
        errors.push({ line: lineNum, msgKey: 'players.importErrorElo' });
        continue;
      }
      const eloVal = Number.parseInt(eloContent, 10);
      if (eloVal <= 0) {
        errors.push({ line: lineNum, msgKey: 'players.importErrorElo' });
        continue;
      }
      elo = eloVal;
    }

    if (name === '') {
      errors.push({ line: lineNum, msgKey: 'players.importErrorEmpty' });
      continue;
    }

    const nameLower = name.toLowerCase();
    if (seenNames.includes(nameLower)) {
      errors.push({ line: lineNum, msgKey: 'players.importErrorDuplicate' });
      continue;
    }

    if (existingNames.some((n) => n.toLowerCase() === nameLower)) {
      errors.push({ line: lineNum, msgKey: 'players.importErrorExists' });
      continue;
    }

    seenNames.push(nameLower);
    if (elo === undefined) {
      parsed.push({ name });
    } else {
      parsed.push({ name, elo });
    }
  }

  return { parsed, errors };
}
