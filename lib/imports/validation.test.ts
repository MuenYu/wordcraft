import { describe, expect, test } from 'bun:test';
import { validateCreateImportRequest } from './validation';

describe('validateCreateImportRequest', () => {
  test('requires exactly one target', () => {
    const formData = new FormData();
    formData.set('file', new File(['term\nvalue'], 'words.csv', { type: 'text/csv' }));

    const result = validateCreateImportRequest(formData);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe('INVALID_TARGET');
  });

  test('accepts valid listName payload', () => {
    const formData = new FormData();
    formData.set('file', new File(['term\nvalue'], 'words.csv', { type: 'text/csv' }));
    formData.set('listName', 'My New List');
    formData.set('idempotencyKey', 'abc-123');

    const result = validateCreateImportRequest(formData);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.listName).toBe('My New List');
    expect(result.value.idempotencyKey).toBe('abc-123');
  });
});
