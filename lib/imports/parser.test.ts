import { describe, expect, test } from 'bun:test';
import { parseCsvForImport } from './parser';

describe('parseCsvForImport', () => {
  test('parses valid rows and tracks invalid rows', () => {
    const csv = [
      'term,definition,partOfSpeech,exampleSentence',
      'serendipity,pleasant surprise,noun,Serendipity strikes again.',
      ',missing term,noun,This row should fail.',
      '  Resolve  ,find a solution,verb,We can resolve this quickly.',
    ].join('\n');

    const result = parseCsvForImport(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.totalCount).toBe(3);
    expect(result.value.validRows.length).toBe(2);
    expect(result.value.errors.length).toBe(1);
    expect(result.value.errors[0].code).toBe('MISSING_TERM');
    expect(result.value.validRows[1].normalizedTerm).toBe('resolve');
  });

  test('rejects unknown headers', () => {
    const csv = ['term,definition,notes', 'alpha,first,extra'].join('\n');
    const result = parseCsvForImport(csv);

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe('UNKNOWN_HEADERS');
  });
});
