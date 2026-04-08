import {
  IMPORT_ALLOWED_HEADERS,
  IMPORT_REQUIRED_HEADERS,
  MAX_IMPORT_FILE_SIZE_BYTES,
} from './constants';

type ValidationErrorCode =
  | 'MISSING_FILE'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'INVALID_TARGET'
  | 'INVALID_LIST_ID'
  | 'INVALID_LIST_NAME'
  | 'INVALID_IDEMPOTENCY_KEY'
  | 'MISSING_HEADERS'
  | 'DUPLICATE_HEADERS'
  | 'UNKNOWN_HEADERS'
  | 'MISSING_REQUIRED_HEADERS';

export type ValidationError = {
  code: ValidationErrorCode;
  message: string;
};

export type CreateImportRequest = {
  file: File;
  listId?: number;
  listName?: string;
  idempotencyKey?: string;
};

export function validateCreateImportRequest(
  formData: FormData,
): { ok: true; value: CreateImportRequest } | { ok: false; error: ValidationError } {
  const fileValue = formData.get('file');
  if (!(fileValue instanceof File)) {
    return { ok: false, error: { code: 'MISSING_FILE', message: 'CSV file is required' } };
  }

  if (!fileValue.name.toLowerCase().endsWith('.csv')) {
    return {
      ok: false,
      error: { code: 'INVALID_FILE_TYPE', message: 'Only CSV files are supported' },
    };
  }

  if (fileValue.size > MAX_IMPORT_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `CSV file exceeds max size (${MAX_IMPORT_FILE_SIZE_BYTES} bytes)`,
      },
    };
  }

  const rawListId = (formData.get('listId') ?? '').toString().trim();
  const rawListName = (formData.get('listName') ?? '').toString().trim();
  const rawIdempotencyKey = (formData.get('idempotencyKey') ?? '').toString().trim();

  const hasListId = rawListId.length > 0;
  const hasListName = rawListName.length > 0;

  if ((hasListId && hasListName) || (!hasListId && !hasListName)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TARGET',
        message: 'Provide exactly one of listId or listName',
      },
    };
  }

  let parsedListId: number | undefined;
  if (hasListId) {
    const value = Number.parseInt(rawListId, 10);
    if (!Number.isInteger(value) || value <= 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_LIST_ID',
          message: 'listId must be a positive integer',
        },
      };
    }

    parsedListId = value;
  }

  if (hasListName && rawListName.length > 120) {
    return {
      ok: false,
      error: {
        code: 'INVALID_LIST_NAME',
        message: 'listName must be 120 characters or fewer',
      },
    };
  }

  if (rawIdempotencyKey.length > 120) {
    return {
      ok: false,
      error: {
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'idempotencyKey must be 120 characters or fewer',
      },
    };
  }

  return {
    ok: true,
    value: {
      file: fileValue,
      listId: parsedListId,
      listName: hasListName ? rawListName : undefined,
      idempotencyKey: rawIdempotencyKey.length > 0 ? rawIdempotencyKey : undefined,
    },
  };
}

export function validateCsvHeaders(
  headers: string[],
): { ok: true } | { ok: false; error: ValidationError } {
  if (headers.length === 0) {
    return { ok: false, error: { code: 'MISSING_HEADERS', message: 'CSV header row is required' } };
  }

  const normalizedHeaders = headers.map((header) => header.trim());
  const uniqueHeaders = new Set(normalizedHeaders);
  if (uniqueHeaders.size !== normalizedHeaders.length) {
    return {
      ok: false,
      error: {
        code: 'DUPLICATE_HEADERS',
        message: 'CSV headers must not contain duplicates',
      },
    };
  }

  const unknownHeaders = normalizedHeaders.filter(
    (header) => !(IMPORT_ALLOWED_HEADERS as readonly string[]).includes(header),
  );
  if (unknownHeaders.length > 0) {
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_HEADERS',
        message: `Unsupported headers: ${unknownHeaders.join(', ')}`,
      },
    };
  }

  const missingRequiredHeaders = IMPORT_REQUIRED_HEADERS.filter(
    (header) => !normalizedHeaders.includes(header),
  );
  if (missingRequiredHeaders.length > 0) {
    return {
      ok: false,
      error: {
        code: 'MISSING_REQUIRED_HEADERS',
        message: `Missing required headers: ${missingRequiredHeaders.join(', ')}`,
      },
    };
  }

  return { ok: true };
}
