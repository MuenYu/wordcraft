import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Text-to-Speech utilities using Web Speech API
export interface SpeechOptions {
  text: string;
  lang?: string;
  rate?: number; // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
}

export interface SpeechState {
  isSpeaking: boolean;
  isPaused: boolean;
}

/**
 * Check if browser supports Web Speech API
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Get available voices for speech synthesis
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Speak text using browser's native speech synthesis
 * @param options - Speech options including text and voice parameters
 * @returns SpeechSynthesisUtterance object for event handling
 */
export function speak(options: SpeechOptions): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis is not supported in this browser');
    return null;
  }

  const utterance = new SpeechSynthesisUtterance(options.text);

  // Set language (default to English)
  utterance.lang = options.lang || 'en-US';

  // Set speech rate (0.1 to 10, default 1)
  utterance.rate = options.rate ?? 0.9;

  // Set pitch (0 to 2, default 1)
  utterance.pitch = options.pitch ?? 1;

  // Set volume (0 to 1, default 1)
  utterance.volume = options.volume ?? 1;

  // Try to select an English voice for better pronunciation
  const voices = getAvailableVoices();
  const englishVoice = voices.find((voice) => voice.lang.startsWith('en'));
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Stop current speech
 */
export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Pause current speech
 */
export function pauseSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.pause();
  }
}

/**
 * Resume paused speech
 */
export function resumeSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.resume();
  }
}

/**
 * Check if speech is currently playing
 */
export function isSpeaking(): boolean {
  return isSpeechSynthesisSupported() && window.speechSynthesis.speaking;
}

/**
 * Check if speech is paused
 */
export function isPaused(): boolean {
  return isSpeechSynthesisSupported() && window.speechSynthesis.paused;
}

/**
 * Speak a word with emphasis on pronunciation (slower rate)
 */
export function speakWord(word: string): SpeechSynthesisUtterance | null {
  return speak({
    text: word,
    lang: 'en-US',
    rate: 0.7, // Slower for better pronunciation
    pitch: 1,
    volume: 1,
  });
}
