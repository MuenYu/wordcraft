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

interface StudyCard {
  flashcardId: number;
  vocabItemId: number;
  word: string;
  partOfSpeech: string;
  definition: string;
  example: string | null;
  state: string;
  dueAt: string;
}

interface ReviewFeedback {
  score: number;
  isPassing: boolean;
  word: string;
}

const BATCH_SIZE = 10;
const REFILL_THRESHOLD = 5;

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

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 0) {
    return `${Math.abs(diffMins)} min overdue`;
  } else if (diffMins < 60) {
    return `in ${diffMins} min`;
  } else if (diffHours < 24) {
    return `in ${diffHours} hours`;
  } else {
    return `in ${diffDays} days`;
  }
}

export function StudyView() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [sentence, setSentence] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<ReviewFeedback | null>(null);
  const [showDefinition, setShowDefinition] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const justSubmitted = useRef(false);
  const fetchLock = useRef(false);

  const currentCard = cards[currentIndex];
  const completedCount = completedIds.size;
  const totalCards = cards.length;
  const hasMoreCards = totalCards > 0 && currentIndex < totalCards;
  const isSessionComplete = totalCards > 0 && completedCount >= totalCards;

  useEffect(() => {
    setSpeechSupported(isSpeechSynthesisSupported());
  }, []);

  useEffect(() => {
    if (!speechSupported) return;

    const updateSpeakingState = () => {
      setIsPlaying(isSpeaking());
    };

    const interval = setInterval(updateSpeakingState, 100);

    return () => clearInterval(interval);
  }, [speechSupported]);

  const handleSpeak = useCallback(() => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else if (currentCard) {
      speakWord(currentCard.word);
      setIsPlaying(true);
    }
  }, [isPlaying, currentCard]);

  const fetchMoreCards = useCallback(async () => {
    if (fetchLock.current) return;
    fetchLock.current = true;

    try {
      const excludeIds = [...completedIds, ...cards.map((c) => c.flashcardId)];
      const response = await fetch('/api/study/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: BATCH_SIZE,
          excludeFlashcardIds: excludeIds,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch cards');

      const data = await response.json();
      if (data.cards && data.cards.length > 0) {
        const newCards = data.cards.map((c: StudyCard) => ({
          ...c,
          dueAt: c.dueAt,
        }));
        setCards((prev) => {
          const existingIds = new Set(prev.map((p) => p.flashcardId));
          const filtered = newCards.filter((n: StudyCard) => !existingIds.has(n.flashcardId));
          return [...prev, ...filtered];
        });
      }
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Failed to load cards');
    } finally {
      fetchLock.current = false;
    }
  }, [completedIds, cards]);

  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/study/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: BATCH_SIZE, excludeFlashcardIds: [] }),
        });

        if (!response.ok) throw new Error('Failed to fetch cards');

        const data = await response.json();
        if (data.cards && data.cards.length > 0) {
          setCards(data.cards.map((c: StudyCard) => ({ ...c, dueAt: c.dueAt })));
        }
      } catch (err) {
        console.error('Error fetching cards:', err);
        setError('Failed to load cards. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initialFetch();
  }, []);

  useEffect(() => {
    if (isSessionComplete) return;

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionComplete]);

  const handleSubmit = useCallback(async () => {
    if (!sentence.trim() || !currentCard) return;

    const { score, isPassing } = calculateScore(sentence);

    try {
      await fetch('/api/study/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flashcardId: currentCard.flashcardId,
          result: isPassing ? 'pass' : 'fail',
          score,
          userInput: sentence,
          feedbackText: isPassing
            ? `Great job using "${currentCard.word}" in your sentence!`
            : `Try adding more context to your sentence using "${currentCard.word}".`,
        }),
      });
    } catch (err) {
      console.error('Error submitting review:', err);
    }

    setHasSubmitted(true);
    setFeedback({ score, isPassing, word: currentCard.word });

    if (isPassing) {
      setCompletedIds((prev) => new Set(prev).add(currentCard.flashcardId));
    }
  }, [sentence, currentCard]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (e.nativeEvent.isComposing) return;
    if (e.repeat) return;
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

  const handleNextWord = useCallback(() => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= totalCards) {
      stopSpeaking();
      setIsPlaying(false);
      setSentence('');
      setHasSubmitted(false);
      setFeedback(null);
      setShowCongrats(true);
    } else {
      setSentence('');
      setHasSubmitted(false);
      setFeedback(null);
      stopSpeaking();
      setIsPlaying(false);
      setCurrentIndex(nextIndex);

      if (totalCards - nextIndex <= REFILL_THRESHOLD) {
        fetchMoreCards();
      }
    }
  }, [currentIndex, totalCards, fetchMoreCards]);

  const handleRetry = () => {
    setSentence('');
    setHasSubmitted(false);
    setFeedback(null);
    stopSpeaking();
    setIsPlaying(false);
  };

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        justSubmitted.current = false;
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, []);

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
  }, [hasSubmitted, feedback, handleNextWord]);

  if (loading) {
    return (
      <section className="flex-1 px-4 lg:px-8 py-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your study session...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex-1 px-4 lg:px-8 py-8 max-w-4xl mx-auto w-full">
        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Session</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (totalCards === 0) {
    return (
      <section className="flex-1 px-4 lg:px-8 py-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Study Session</h1>
          <p className="mt-2 text-gray-600">
            Practice using words in sentences and get AI feedback
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h2>
            <p className="text-gray-600">
              No cards are due for review right now. Check back later when your cards are ready.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex-1 px-4 lg:px-8 py-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Study Session</h1>
        <p className="mt-2 text-gray-600">Practice using words in sentences and get AI feedback</p>
      </div>

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
                <p className="text-xl font-semibold">{completedCount} cards</p>
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
                <p className="text-xl font-semibold">{totalCards - completedCount} cards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              You&apos;ve completed all {totalCards} cards in this session.
            </p>
            <Button
              onClick={() => {
                setShowCongrats(false);
                setCompletedIds(new Set());
                setCurrentIndex(0);
                setElapsedTime(0);
                fetchMoreCards();
              }}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              Start New Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
                <h2 className="text-3xl font-bold text-pink-500">{currentCard.word}</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 w-fit">
                  {currentCard.partOfSpeech}
                </span>
                <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-auto">
                  {speechSupported && (
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
                  )}
                </div>
              </div>
              {showDefinition && (
                <p className="text-muted-foreground mb-2">
                  <span className="font-medium text-foreground">Definition:</span>{' '}
                  {currentCard.definition}
                </p>
              )}
              {currentCard.example && (
                <p className="text-sm text-muted-foreground italic">
                  &ldquo;{currentCard.example}&rdquo;
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Create Your Sentence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  placeholder={`Write a sentence using "${currentCard.word}"...`}
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

                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mb-4">
                    <p className="text-sm">
                      {feedback.isPassing
                        ? `Great job using "${feedback.word}" in your sentence!`
                        : `Try adding more context to your sentence using "${feedback.word}".`}
                    </p>
                  </div>

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
