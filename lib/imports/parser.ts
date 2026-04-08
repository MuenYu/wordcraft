import {
  IMPORT_DEFAULT_PART_OF_SPEECH,
  MAX_IMPORT_ROW_COUNT,
  MAX_PART_OF_SPEECH_LENGTH,
  MAX_TERM_LENGTH,
  MAX_TEXT_FIELD_LENGTH,
} from './constants';
import { normalizeTerm } from './normalize';
import { validateCsvHeaders } from './validation';

export type ImportRowError = {
  row: number;
  code: string;
  message: string;
};

export type ParsedImportRow = {
  row: number;
  term: string;
  normalizedTerm: string;
  definition: string;
  partOfSpeech: string;
  exampleSentence: string | null;
};

export type ParseCsvResult = {
  totalCount: number;
  validRows: ParsedImportRow[];
  errors: ImportRowError[];
};

export function parseCsvForImport(
  csvContent: string,
): { ok: true; value: ParseCsvResult } | { ok: false; error: ImportRowError } {
  const rows = parseCsvRows(csvContent);
  if (rows.length === 0) {
    return {
      ok: false,
      error: {
        row: 1,
        code: 'MISSING_HEADERS',
        message: 'CSV header row is required',
      },
    };
  }

  const headers = rows[0].map((value) => value.trim());
  const headerValidation = validateCsvHeaders(headers);
  if (!headerValidation.ok) {
    return {
      ok: false,
      error: {
        row: 1,
        code: headerValidation.error.code,
        message: headerValidation.error.message,
      },
    };
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_IMPORT_ROW_COUNT) {
    return {
      ok: false,
      error: {
        row: 1,
        code: 'ROW_LIMIT_EXCEEDED',
        message: `CSV row count exceeds limit (${MAX_IMPORT_ROW_COUNT})`,
      },
    };
  }

  const validRows: ParsedImportRow[] = [];
  const errors: ImportRowError[] = [];

  dataRows.forEach((record, index) => {
    const rowNumber = index + 2;

    if (record.length > headers.length) {
      errors.push({
        row: rowNumber,
        code: 'INVALID_COLUMN_COUNT',
        message: 'Row has more columns than the header',
      });
      return;
    }

    const paddedRecord = [...record];
    while (paddedRecord.length < headers.length) {
      paddedRecord.push('');
    }

    const valuesByHeader = new Map<string, string>();
    headers.forEach((header, headerIndex) => {
      valuesByHeader.set(header, (paddedRecord[headerIndex] ?? '').trim());
    });

    const term = valuesByHeader.get('term') ?? '';
    if (term.length === 0) {
      errors.push({
        row: rowNumber,
        code: 'MISSING_TERM',
        message: 'term is required',
      });
      return;
    }

    if (term.length > MAX_TERM_LENGTH) {
      errors.push({
        row: rowNumber,
        code: 'TERM_TOO_LONG',
        message: `term exceeds max length (${MAX_TERM_LENGTH})`,
      });
      return;
    }

    const partOfSpeech = valuesByHeader.get('partOfSpeech') ?? '';
    if (partOfSpeech.length > MAX_PART_OF_SPEECH_LENGTH) {
      errors.push({
        row: rowNumber,
        code: 'PART_OF_SPEECH_TOO_LONG',
        message: `partOfSpeech exceeds max length (${MAX_PART_OF_SPEECH_LENGTH})`,
      });
      return;
    }

    const definition = valuesByHeader.get('definition') ?? '';
    if (definition.length > MAX_TEXT_FIELD_LENGTH) {
      errors.push({
        row: rowNumber,
        code: 'DEFINITION_TOO_LONG',
        message: `definition exceeds max length (${MAX_TEXT_FIELD_LENGTH})`,
      });
      return;
    }

    const exampleSentence = valuesByHeader.get('exampleSentence') ?? '';
    if (exampleSentence.length > MAX_TEXT_FIELD_LENGTH) {
      errors.push({
        row: rowNumber,
        code: 'EXAMPLE_SENTENCE_TOO_LONG',
        message: `exampleSentence exceeds max length (${MAX_TEXT_FIELD_LENGTH})`,
      });
      return;
    }

    validRows.push({
      row: rowNumber,
      term,
      normalizedTerm: normalizeTerm(term),
      definition,
      partOfSpeech: partOfSpeech || IMPORT_DEFAULT_PART_OF_SPEECH,
      exampleSentence: exampleSentence.length > 0 ? exampleSentence : null,
    });
  });

  return {
    ok: true,
    value: {
      totalCount: dataRows.length,
      validRows,
      errors,
    },
  };
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === ',') {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }

      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  currentRow.push(currentValue);
  const hasAnyNonEmptyValue = currentRow.some((value) => value.length > 0);
  if (hasAnyNonEmptyValue || rows.length === 0) {
    rows.push(currentRow);
  }

  return rows;
}
