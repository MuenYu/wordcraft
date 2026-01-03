'use client';

import { useState, useCallback } from 'react';
import { User } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, FileText, Plus, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type VocabItem = {
  vocab: string;
  partOfSpeech: string;
  definition: string;
  sampleSentence: string;
};

type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error';
};

interface VocabImportViewProps {
  user: User;
}

const MAX_ITEMS = 1000;

const PART_OF_SPEECH_OPTIONS = [
  { value: '', label: 'Select part of speech' },
  { value: 'noun', label: 'Noun' },
  { value: 'verb', label: 'Verb' },
  { value: 'adjective', label: 'Adjective' },
  { value: 'adverb', label: 'Adverb' },
  { value: 'preposition', label: 'Preposition' },
  { value: 'conjunction', label: 'Conjunction' },
  { value: 'interjection', label: 'Interjection' },
  { value: 'pronoun', label: 'Pronoun' },
];

export function VocabImportView({ user }: VocabImportViewProps) {
  const [items, setItems] = useState<VocabItem[]>([]);
  const [mode, setMode] = useState<'manual' | 'csv'>('manual');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewItems, setPreviewItems] = useState<VocabItem[]>([]);
  const [vocab, setVocab] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [definition, setDefinition] = useState('');
  const [sampleSentence, setSampleSentence] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [vocabError, setVocabError] = useState('');
  const [csvParseError, setCsvParseError] = useState('');

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addItem = useCallback(() => {
    if (!vocab.trim()) {
      setVocabError('Vocabulary word is required');
      return;
    }
    if (!partOfSpeech) {
      setVocabError('Please select a part of speech');
      return;
    }
    if (!definition.trim()) {
      setVocabError('Definition is required');
      return;
    }
    if (items.length >= MAX_ITEMS) {
      showToast('Maximum vocabulary limit reached (1000 items)', 'error');
      return;
    }

    const newItem: VocabItem = {
      vocab: vocab.trim(),
      partOfSpeech,
      definition: definition.trim(),
      sampleSentence: sampleSentence.trim(),
    };

    setItems((prev) => [...prev, newItem]);
    setVocab('');
    setPartOfSpeech('');
    setDefinition('');
    setSampleSentence('');
    setVocabError('');
  }, [vocab, partOfSpeech, definition, sampleSentence, items.length, showToast]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setCsvParseError('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    setMode('csv');
    setCsvParseError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());

        // Skip header if present
        const startIndex = lines[0]?.toLowerCase().includes('vocab') ? 1 : 0;
        const parsedItems: VocabItem[] = [];

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Handle CSV parsing - supports both comma and tab delimited
          const parts = line.includes('\t')
            ? line.split('\t')
            : line.split(',').map((part) => part.trim().replace(/^["']|["']$/g, ''));

          if (parts.length >= 2) {
            parsedItems.push({
              vocab: parts[0],
              partOfSpeech: parts[1].toLowerCase(),
              definition: parts[2]?.replace(/^["']|["']$/g, '') || '',
              sampleSentence: parts[3]?.replace(/^["']|["']$/g, '') || '',
            });
          }
        }

        // Limit to max items
        const limitedItems = parsedItems.slice(0, MAX_ITEMS);
        setPreviewItems(limitedItems);
      } catch (err) {
        setCsvParseError('Failed to parse CSV file. Please check the format.');
        console.error('CSV parse error:', err);
      }
    };
    reader.readAsText(file);
  }, []);

  const clearCsvUpload = useCallback(() => {
    setCsvFile(null);
    setPreviewItems([]);
    setMode('manual');
    setCsvParseError('');
  }, []);

  const handleSubmit = useCallback(() => {
    const totalItems = mode === 'csv' ? previewItems.length : items.length;

    if (totalItems === 0) {
      showToast('Please add at least one vocabulary item', 'error');
      return;
    }

    // Simulate submission
    console.warn('Submitting vocabulary:', {
      mode,
      items: mode === 'csv' ? previewItems : items,
      userId: user.id,
    });

    showToast('Vocabulary import submitted successfully');

    // Reset form
    setItems([]);
    setPreviewItems([]);
    setCsvFile(null);
    setMode('manual');
  }, [mode, items, previewItems, user.id, showToast]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'submit') {
        e.preventDefault();
        addItem();
      }
    },
    [addItem],
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-5',
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white',
            )}
          >
            {toast.type === 'success' ? (
              <Check className="size-5" />
            ) : (
              <AlertCircle className="size-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 hover:opacity-70 transition-opacity"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Vocabulary</h1>
        <p className="text-gray-600">
          Add vocabulary words manually or import from a CSV file. Maximum 1000 items.
        </p>
      </div>

      <div className="lg:flex lg:w-full gap-8">
        {/* Left Column - Input Forms */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Vocabulary</CardTitle>
              <CardDescription>Choose how you want to add vocabulary words</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Button
                  variant={mode === 'manual' ? 'default' : 'outline'}
                  onClick={() => setMode('manual')}
                  className={cn(
                    'flex-1',
                    mode === 'manual' && 'bg-pink-500 hover:bg-pink-600 text-white border-pink-500',
                  )}
                >
                  <Plus className="size-4 mr-2" />
                  Manual Add
                </Button>
                <Button
                  variant={mode === 'csv' ? 'default' : 'outline'}
                  onClick={() => setMode('csv')}
                  className={cn(
                    'flex-1',
                    mode === 'csv' && 'bg-pink-500 hover:bg-pink-600 text-white border-pink-500',
                  )}
                >
                  <Upload className="size-4 mr-2" />
                  CSV Upload
                </Button>
              </div>

              {mode === 'manual' ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vocab">Vocabulary Word *</Label>
                      <Input
                        id="vocab"
                        value={vocab}
                        onChange={(e) => {
                          setVocab(e.target.value);
                          setVocabError('');
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter a word or phrase"
                        className="focus-visible:border-pink-500 focus-visible:ring-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partOfSpeech">Part of Speech *</Label>
                      <select
                        id="partOfSpeech"
                        value={partOfSpeech}
                        onChange={(e) => {
                          setPartOfSpeech(e.target.value);
                          setVocabError('');
                        }}
                        className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-pink-500 focus-visible:ring-pink-500 focus-visible:ring-[3px]"
                      >
                        {PART_OF_SPEECH_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="definition">Definition *</Label>
                    <textarea
                      id="definition"
                      value={definition}
                      onChange={(e) => {
                        setDefinition(e.target.value);
                        setVocabError('');
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter the definition of this word"
                      className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-pink-500 focus-visible:ring-pink-500 focus-visible:ring-[3px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sampleSentence">Sample Sentence (Optional)</Label>
                    <textarea
                      id="sampleSentence"
                      value={sampleSentence}
                      onChange={(e) => setSampleSentence(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter an example sentence using this word"
                      className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-pink-500 focus-visible:ring-pink-500 focus-visible:ring-[3px] resize-none"
                    />
                  </div>
                  {vocabError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="size-4" />
                      {vocabError}
                    </p>
                  )}
                  <Button
                    onClick={addItem}
                    disabled={items.length >= MAX_ITEMS}
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white border-pink-500"
                  >
                    <Plus className="size-4 mr-2" />
                    Add to List
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="csv-upload"
                      disabled={!!csvFile}
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <Upload className="size-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {csvFile ? csvFile.name : 'Click to upload CSV file'}
                      </p>
                      <p className="text-xs text-gray-500">or drag and drop CSV file here</p>
                    </label>
                  </div>
                  {csvFile && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="size-5 text-gray-500" />
                        <span className="text-sm font-medium">{csvFile.name}</span>
                        <span className="text-xs text-gray-500">({previewItems.length} items)</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearCsvUpload}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                  {csvParseError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="size-4" />
                      {csvParseError}
                    </p>
                  )}
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <p className="text-sm text-pink-800 font-medium mb-2">CSV Format</p>
                    <p className="text-xs text-pink-700">
                      Columns: vocab, part_of_speech, definition, sample_sentence (optional)
                    </p>
                    <p className="text-xs text-pink-700 mt-1">
                      Example: &quot;apple,noun,A fruit that grows on trees,The apple is red&quot;
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Section */}
          {(items.length > 0 || previewItems.length > 0) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Preview {mode === 'csv' ? '(CSV Import)' : '(Manual Entries)'}
                  </CardTitle>
                  <span
                    className={cn(
                      'text-sm font-medium px-2 py-1 rounded-full',
                      items.length + previewItems.length >= MAX_ITEMS
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700',
                    )}
                  >
                    {items.length + previewItems.length} / {MAX_ITEMS} items
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {(mode === 'csv' ? previewItems : items).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.vocab}</span>
                          <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full">
                            {item.partOfSpeech}
                          </span>
                        </div>
                        {item.definition && (
                          <p className="text-sm text-gray-600 mt-1">{item.definition}</p>
                        )}
                        {item.sampleSentence && (
                          <p className="text-sm text-gray-500 mt-1 italic">
                            &quot;{item.sampleSentence}&quot;
                          </p>
                        )}
                      </div>
                      {mode === 'manual' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary & Submit */}
        <div className="lg:w-80 shrink-0">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="text-lg">Import Summary</CardTitle>
              <CardDescription>Review your vocabulary before importing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mode</span>
                  <span className="font-medium capitalize">{mode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items to import</span>
                  <span
                    className={cn(
                      'font-medium',
                      items.length + previewItems.length >= MAX_ITEMS
                        ? 'text-red-600'
                        : 'text-gray-900',
                    )}
                  >
                    {items.length + previewItems.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-medium text-gray-900">
                    {MAX_ITEMS - (items.length + previewItems.length)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    items.length + previewItems.length === 0 ||
                    items.length + previewItems.length > MAX_ITEMS
                  }
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white border-pink-500"
                  size="lg"
                >
                  <Upload className="size-4 mr-2" />
                  Submit Import
                </Button>
                {items.length + previewItems.length === 0 && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Add items or upload a CSV to continue
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
