'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { speakWord, stopSpeaking, isSpeaking, isSpeechSynthesisSupported } from '@/lib/utils';

// Mock vocabulary list for study session
const MOCK_VOCAB_LIST = [
  {
    word: 'Ephemeral',
    partOfSpeech: 'adjective',
    definition: 'lasting for a very short time',
    example: 'The ephemeral beauty of cherry blossoms reminds us to appreciate fleeting moments.',
  },
  {
    word: 'Serendipity',
    partOfSpeech: 'noun',
    definition: 'the occurrence of events by chance in a happy way',
    example: 'Finding that rare book at the yard sale was pure serendipity.',
  },
  {
    word: 'Luminous',
    partOfSpeech: 'adjective',
    definition: 'full of or shedding light; bright or shining',
    example: 'The luminous moon reflected beautifully on the calm lake.',
  },
];

// Calculate score based on sentence length (1 char = 1 point, 10+ chars = 10 points max)
function calculateScore(sentence: string): { score: number; isPassing: boolean } {
  const length = sentence.trim().length;
  const score = Math.min(length, 10);
  return { score, isPassing: length >= 10 };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function StudyView() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [sentence, setSentence] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{
    score: number;
    isPassing: boolean;
    word: string;
  } | null>(null);
  const [showDefinition, setShowDefinition] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  // Guard against rapid Enter key presses during state transition
  const justSubmitted = useRef(false);

  const currentWord = MOCK_VOCAB_LIST[currentWordIndex];
  const remainingCount = MOCK_VOCAB_LIST.length - completedWords.size;
  const isSessionComplete = completedWords.size === MOCK_VOCAB_LIST.length;

  // Speech synthesis state management
  useEffect(() => {
    if (!isSpeechSynthesisSupported()) return;

    const updateSpeakingState = () => {
      setIsPlaying(isSpeaking());
    };

    // Update speaking state periodically since Web Speech API doesn't provide precise callbacks
    const interval = setInterval(updateSpeakingState, 100);

    return () => clearInterval(interval);
  }, []);

  const handleSpeak = useCallback(() => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      speakWord(currentWord.word);
      setIsPlaying(true);
    }
  }, [isPlaying, currentWord.word]);

  // Timer effect - stops when all words are completed
  useEffect(() => {
    if (isSessionComplete) return;

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionComplete]);

  const handleSubmit = useCallback(() => {
    if (!sentence.trim()) return;

    const { score, isPassing } = calculateScore(sentence);

    setHasSubmitted(true);
    setFeedback({ score, isPassing, word: currentWord.word });

    if (isPassing) {
      setCompletedWords((prev) => new Set(prev).add(currentWordIndex));
    }
  }, [sentence, currentWord, currentWordIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    // Avoid IME composition issues
    if (e.nativeEvent.isComposing) return;

    // Prevent key repeat from triggering actions
    if (e.repeat) return;

    // Guard against double submission
    if (justSubmitted.current) return;

    if (feedback?.isPassing) {
      justSubmitted.current = true;
      handleNextWord();
      return;
    } else if (hasSubmitted && feedback && !feedback.isPassing) {
      justSubmitted.current = true;
      handleRetry();
      return;
    } else if (sentence.trim()) {
      justSubmitted.current = true;
      handleSubmit();
      return;
    }
  };

  const handleNextWord = () => {
    // Find next incomplete word
    let nextIndex = currentWordIndex + 1;
    if (nextIndex >= MOCK_VOCAB_LIST.length) {
      nextIndex = 0;
    }

    // Only mark as complete if this was the last word and user passed
    const wasLastWord = currentWordIndex === MOCK_VOCAB_LIST.length - 1;
    const passedLastWord = feedback?.isPassing;

    if (wasLastWord && passedLastWord) {
      // User passed the last word - show congratulations
      stopSpeaking();
      setIsPlaying(false);
      setSentence('');
      setHasSubmitted(false);
      setFeedback(null);
      setShowCongrats(true);
    } else {
      // Reset for next word
      setSentence('');
      setHasSubmitted(false);
      setFeedback(null);
      stopSpeaking();
      setIsPlaying(false);
      setCurrentWordIndex(nextIndex);
    }
  };

  const handleRetry = () => {
    setSentence('');
    setHasSubmitted(false);
    setFeedback(null);
    stopSpeaking();
    setIsPlaying(false);
  };

  // Clear the Enter-press guard on key release (prevents key-repeat advancing)
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        justSubmitted.current = false;
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, []);

  // Handle Enter key globally when input is disabled
  useEffect(() => {
    if (!hasSubmitted) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat) return;

      e.preventDefault();
      e.stopPropagation();

      if (justSubmitted.current) return;
      justSubmitted.current = true;

      if (feedback?.isPassing) {
        handleNextWord();
      } else {
        handleRetry();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [hasSubmitted, feedback, currentWordIndex]);

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
                <p className="text-xl font-semibold">{completedWords.size} words</p>
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

      {/* Congratulations Section - shown when all words are completed */}
      {showCongrats ? (
        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-pink-100 dark:bg-pink-900/30 p-4 rounded-full">
                <Sparkles className="w-12 h-12 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Congratulations!
            </h2>
            <p className="text-muted-foreground mb-6">
              You&apos;ve completed all {MOCK_VOCAB_LIST.length} words in this session.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
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
                <h2 className="text-3xl font-bold text-pink-500">{currentWord.word}</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 w-fit">
                  {currentWord.partOfSpeech}
                </span>
                {/* Pronunciation controls */}
                <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-auto">
                  {isSpeechSynthesisSupported() ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSpeak}
                        className="gap-1.5 border-pink-200 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-950"
                        title="Listen to pronunciation"
                      >
                        {isPlaying ? (
                          <VolumeX className="w-4 h-4 text-pink-500" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-pink-500" />
                        )}
                        <span className="text-pink-600 dark:text-pink-400">Pronunciation</span>
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Speech not supported</span>
                  )}
                </div>
              </div>
              {showDefinition && (
                <p className="text-muted-foreground mb-2">
                  <span className="font-medium text-foreground">Definition:</span>{' '}
                  {currentWord.definition}
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
                  placeholder={`Write a sentence using "${currentWord.word}"...`}
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
                    {feedback.isPassing ? (
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
                            There are some issues with your sentence. Try to make it longer (10+
                            characters).
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

                  {/* Feedback message */}
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mb-4">
                    <p className="text-sm">
                      {feedback.isPassing
                        ? `Great job using "${feedback.word}" in your sentence!`
                        : `Try adding more context to your sentence using "${feedback.word}".`}
                    </p>
                  </div>

                  {/* Next button */}
                  <div className="mt-6 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                      className="inline-flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retry
                    </Button>
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
        </>
      )}
    </section>
  );
}
