export const IMPORT_ALLOWED_HEADERS = [
  'term',
  'definition',
  'partOfSpeech',
  'exampleSentence',
] as const;

export const IMPORT_REQUIRED_HEADERS = ['term'] as const;

export const MAX_IMPORT_FILE_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_ROW_COUNT = 5000;
export const MAX_TERM_LENGTH = 255;
export const MAX_PART_OF_SPEECH_LENGTH = 32;
export const MAX_TEXT_FIELD_LENGTH = 2000;
export const MAX_ERROR_SAMPLE_SIZE = 20;

export const IMPORT_DEFAULT_PART_OF_SPEECH = 'unknown';
