'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Clock,
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

// Mock data for the study session
const MOCK_WORD = {
  word: 'Ephemeral',
  partOfSpeech: 'adjective',
  definition: 'lasting for a very short time',
  example: 'The ephemeral beauty of cherry blossoms reminds us to appreciate fleeting moments.',
};

const MOCK_FEEDBACK = {
  isCorrect: true,
  score: 9,
  feedback:
    'Great sentence! You correctly used "ephemeral" to describe something short-lived. Consider using more vivid imagery to enhance your writing.',
  suggestions: [
    'Try adding more context about what specifically was ephemeral',
    'Consider varying sentence structure for more engaging prose',
  ],
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function StudyView() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [studyCount, setStudyCount] = useState(5);
  const [remainingCount] = useState(15);
  const [sentence, setSentence] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<typeof MOCK_FEEDBACK | null>(null);
  const [showDefinition, setShowDefinition] = useState(true);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!sentence.trim()) return;

    // Simulate AI feedback (mock)
    setHasSubmitted(true);
    setFeedback(MOCK_FEEDBACK);
  }, [sentence]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleNextWord = () => {
    setSentence('');
    setHasSubmitted(false);
    setFeedback(null);
    setStudyCount((prev) => prev + 1);
  };

  return (
    <section className="flex-1 px-4 lg:px-8 py-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Study Session</h1>
        <p className="mt-2 text-gray-600">Practice using words in sentences and get AI feedback</p>
      </div>

      {/* Section 2.1: Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Elapsed</p>
                <p className="text-xl font-semibold">{formatTime(elapsedTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Studied Today</p>
                <p className="text-xl font-semibold">{studyCount} words</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg">
                <Brain className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-xl font-semibold">{remainingCount} words</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2.2: Current Word */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="text-lg">Current Word</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDefinition(!showDefinition)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showDefinition ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
            <h2 className="text-3xl font-bold text-pink-500">{MOCK_WORD.word}</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 w-fit">
              {MOCK_WORD.partOfSpeech}
            </span>
          </div>
          {showDefinition && (
            <p className="text-muted-foreground mb-2">
              <span className="font-medium text-foreground">Definition:</span>{' '}
              {MOCK_WORD.definition}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 2.3: Input Box */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Create Your Sentence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder={`Write a sentence using "${MOCK_WORD.word}"...`}
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={hasSubmitted}
              className="min-h-25 py-3 text-lg resize-none focus-visible:ring-pink-500 focus-visible:border-pink-500"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Press{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">
                Enter
              </kbd>{' '}
              to submit
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2.4: AI Feedback - min-height container prevents layout shift */}
      <div className="min-h-75">
        {feedback && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>AI Feedback</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Correctness indicator */}
              <div className="flex items-center gap-3 mb-4 p-4 rounded-lg bg-muted/50">
                {feedback.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium">Well done!</p>
                      <p className="text-sm text-muted-foreground">
                        Your sentence is grammatically correct and uses the word appropriately.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="font-medium">Needs improvement</p>
                      <p className="text-sm text-muted-foreground">
                        There are some issues with your sentence. Check the suggestions below.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Score */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Score</span>
                  <span className="text-sm font-semibold">{feedback.score}/10</span>
                </div>
                <div className="h-2 bg-pink-100 dark:bg-pink-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${feedback.score * 10}%` }}
                  />
                </div>
              </div>

              {/* AI Comment */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mb-4">
                <p className="text-sm">{feedback.feedback}</p>
              </div>

              {/* Suggestions */}
              {feedback.suggestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Suggestions for improvement:</p>
                  <ul className="space-y-2">
                    {feedback.suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next button */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleNextWord}
                  className="inline-flex items-center gap-2 bg-pink-500! text-white! hover:bg-pink-600!"
                >
                  Next Word
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
