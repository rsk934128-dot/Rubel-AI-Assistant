/**
 * Bulletproof Text-to-Speech (TTS) Engine for Bengali & English.
 * Solves the browser 15-second cut-off bug by using:
 * 1. Natural High-Fidelity Streaming Audio (HTML5 Audio via /api/tts)
 * 2. Smart Sentence Chunking & Pre-buffering
 * 3. Resilient Web Speech API fallback with utterance garbage-collection protection
 */

export interface TTSOptions {
  speed?: number; // 0.8, 1.0, 1.25, 1.5
  preferredMode?: 'natural' | 'browser';
  voiceURI?: string;
  onChunkStart?: (index: number, total: number, chunkText: string) => void;
  onChunkEnd?: (index: number, total: number) => void;
  onStateChange?: (isSpeaking: boolean, isPaused: boolean) => void;
  onError?: (err: string) => void;
  onComplete?: () => void;
}

export class ContinuousTTSPlayer {
  private chunks: string[] = [];
  private currentIndex = 0;
  private isSpeaking = false;
  private isPaused = false;
  private isCancelled = false;
  private speed = 0.85; // Natural, calm Bengali & English pace (never rushed)
  private options: TTSOptions = {};

  // HTML5 Audio playback state (persistent shared element unlocks mobile audio gesture)
  private sharedAudio: HTMLAudioElement | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private nextAudioPreload: HTMLAudioElement | null = null;

  // Web Speech API fallback state
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private watchdogTimer: any = null;
  private consecutiveErrorCount = 0;

  constructor(options: TTSOptions = {}) {
    this.options = options;
    this.speed = options.speed || 0.85;
    if (typeof Audio !== 'undefined') {
      try {
        this.sharedAudio = new Audio();
      } catch (_) {}
    }
  }

  public updateOptions(newOptions: Partial<TTSOptions>) {
    this.options = { ...this.options, ...newOptions };
    if (newOptions.speed !== undefined) {
      this.speed = newOptions.speed;
      if (this.currentAudio) {
        this.currentAudio.playbackRate = this.speed;
      }
      if (this.sharedAudio) {
        this.sharedAudio.playbackRate = this.speed;
      }
    }
  }

  /**
   * Cleans markdown and formatting to prepare smooth, readable text.
   */
  public static cleanTextForSpeech(rawText: string): string {
    if (!rawText) return '';
    return rawText
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, ' । কোড ব্লক স্ক্রিনে প্রদর্শন করা হয়েছে। ')
      // Clean inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove image markdown
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // Convert links to link text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove raw URLs
      .replace(/https?:\/\/[^\s)]+/g, ' লিঙ্ক দেওয়া হয়েছে ')
      // Clean headers and formatting
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[*_~#]/g, '')
      .replace(/>\s+/gm, '')
      // Clean markdown tables
      .replace(/\|[^\n]+\|/g, ' ')
      .replace(/[-]{3,}/g, ' ')
      // Clean multiple spaces and empty lines
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{2,}/g, ' । ')
      .replace(/\n/g, ' ')
      .trim();
  }

  /**
   * Splits long text into natural, digestible sentence chunks (~100-150 characters)
   * Prevents speech synthesis engine fatigue and keeps playback responsive.
   */
  public static splitIntoSentenceChunks(text: string, maxLen = 140): string[] {
    const cleaned = ContinuousTTSPlayer.cleanTextForSpeech(text);
    if (!cleaned) return [];

    // Split on Bengali dāri (।), question mark (?), exclamation (!), semicolon (;), or period (.)
    const sentenceRegex = /[^।?!;.\n\r]+[।?!;.\n\r]*/g;
    const rawSentences = cleaned.match(sentenceRegex) || [cleaned];
    const chunks: string[] = [];
    let buffer = '';

    for (const sent of rawSentences) {
      const trimmed = sent.trim();
      if (!trimmed) continue;

      if ((buffer + ' ' + trimmed).trim().length <= maxLen) {
        buffer = buffer ? `${buffer} ${trimmed}` : trimmed;
      } else {
        if (buffer.trim()) {
          chunks.push(buffer.trim());
        }
        if (trimmed.length > maxLen) {
          // Break oversized sentences by clause or word
          const words = trimmed.split(/\s+/);
          let subBuffer = '';
          for (const word of words) {
            if ((subBuffer + ' ' + word).trim().length <= maxLen) {
              subBuffer = subBuffer ? `${subBuffer} ${word}` : word;
            } else {
              if (subBuffer.trim()) chunks.push(subBuffer.trim());
              subBuffer = word;
            }
          }
          buffer = subBuffer.trim();
        } else {
          buffer = trimmed;
        }
      }
    }

    if (buffer.trim()) {
      chunks.push(buffer.trim());
    }

    return chunks.length > 0 ? chunks : [cleaned];
  }

  public getChunks(): string[] {
    return this.chunks;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Start playback from beginning or specific chunk index.
   */
  public play(text: string, startIndex = 0) {
    this.stop();
    this.isCancelled = false;
    this.isPaused = false;
    this.chunks = ContinuousTTSPlayer.splitIntoSentenceChunks(text);

    if (this.chunks.length === 0) {
      this.options.onComplete?.();
      return;
    }

    this.currentIndex = Math.max(0, Math.min(startIndex, this.chunks.length - 1));
    this.isSpeaking = true;
    this.options.onStateChange?.(true, false);

    this.playCurrentChunk();
  }

  /**
   * Pause current playback.
   */
  public pause() {
    if (!this.isSpeaking || this.isPaused) return;
    this.isPaused = true;
    this.options.onStateChange?.(true, true);

    if (this.currentAudio) {
      this.currentAudio.pause();
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume paused playback.
   */
  public resume() {
    if (!this.isSpeaking || !this.isPaused) return;
    this.isPaused = false;
    this.options.onStateChange?.(true, false);

    if (this.currentAudio) {
      this.currentAudio.play().catch(() => {
        this.playCurrentChunk();
      });
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        this.playCurrentChunk();
      }
    }
  }

  /**
   * Stop and cancel playback completely.
   */
  public stop() {
    this.isCancelled = true;
    this.isSpeaking = false;
    this.isPaused = false;

    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.src = '';
      this.currentAudio = null;
    }

    if (this.nextAudioPreload) {
      this.nextAudioPreload.src = '';
      this.nextAudioPreload = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    this.activeUtterance = null;
    if (typeof window !== 'undefined') {
      try {
        delete (window as any).__activeSpeechUtterance;
      } catch (e) {}
    }

    this.options.onStateChange?.(false, false);
  }

  /**
   * Jump to a specific sentence chunk.
   */
  public jumpToChunk(index: number) {
    if (index < 0 || index >= this.chunks.length) return;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.onended = null;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentIndex = index;
    this.playCurrentChunk();
  }

  private getAudioUrl(chunk: string): string {
    const hasBengali = /[\u0980-\u09FF]/.test(chunk);
    const lang = hasBengali ? 'bn' : 'en';
    return `/api/tts?text=${encodeURIComponent(chunk)}&lang=${lang}`;
  }

  private preloadNextChunk(index: number) {
    if (index >= this.chunks.length) return;
    try {
      const nextChunk = this.chunks[index];
      const url = this.getAudioUrl(nextChunk);
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      this.nextAudioPreload = audio;
    } catch (e) {
      // Non-critical preload
    }
  }

  private playCurrentChunk() {
    if (this.isCancelled || this.currentIndex >= this.chunks.length) {
      this.stop();
      this.options.onComplete?.();
      return;
    }

    const chunkText = this.chunks[this.currentIndex];
    this.options.onChunkStart?.(this.currentIndex, this.chunks.length, chunkText);

    // If preferred mode is not explicitly 'browser', try natural audio first
    if (this.options.preferredMode !== 'browser') {
      this.playViaAudioElement(chunkText);
    } else {
      this.playViaSpeechSynthesis(chunkText);
    }
  }

  /**
   * Method 1: Play via natural HTML5 Audio streaming.
   * Completely immune to the browser 15s SpeechSynthesis bug.
   */
  private playViaAudioElement(chunkText: string) {
    try {
      const url = this.getAudioUrl(chunkText);
      const audio = this.sharedAudio || new Audio();
      this.sharedAudio = audio;
      this.currentAudio = audio;

      audio.src = url;
      audio.playbackRate = this.speed;

      // Preload the next chunk immediately for seamless zero-gap transitions
      this.preloadNextChunk(this.currentIndex + 1);

      audio.onplay = () => {
        this.consecutiveErrorCount = 0; // Successfully started playing
      };

      audio.onended = () => {
        if (this.isCancelled) return;
        this.consecutiveErrorCount = 0;
        this.options.onChunkEnd?.(this.currentIndex, this.chunks.length);
        this.currentIndex++;
        this.playCurrentChunk();
      };

      const handleFallbackToSpeech = () => {
        if (this.isCancelled) return;
        console.warn('Audio stream fallback to SpeechSynthesis for chunk:', this.currentIndex);
        this.playViaSpeechSynthesis(chunkText);
      };

      audio.onerror = () => {
        handleFallbackToSpeech();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play notice, switching to browser TTS:', err?.message || err);
          handleFallbackToSpeech();
        });
      }
    } catch (err) {
      this.playViaSpeechSynthesis(chunkText);
    }
  }

  /**
   * Method 2: Resilient Web Speech API fallback.
   * Fixed GC reference, watchdog timer, and anti-cascading error protection.
   */
  private playViaSpeechSynthesis(chunkText: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.options.onError?.('আপনার ডিভাইসে কোনো টেক্সট-টু-স্পিচ ইঞ্জিন পাওয়া যায়নি।');
      this.stop();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(chunkText);
      // Calm, comfortable reading pace for Bengali
      utterance.rate = Math.max(0.75, Math.min(this.speed, 1.2));
      utterance.pitch = 1.0;

      // Retain strong reference to prevent GC bug in Chromium
      this.activeUtterance = utterance;
      if (typeof window !== 'undefined') {
        (window as any).__activeSpeechUtterance = utterance;
      }

      // Voice selection
      const hasBengali = /[\u0980-\u09FF]/.test(chunkText);
      const voices = window.speechSynthesis.getVoices() || [];

      if (this.options.voiceURI && this.options.voiceURI !== 'auto') {
        const found = voices.find((v) => v.voiceURI === this.options.voiceURI || v.name === this.options.voiceURI);
        if (found) {
          utterance.voice = found;
          utterance.lang = found.lang;
        }
      } else if (hasBengali) {
        utterance.lang = 'bn-BD';
        const bnVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('bn') ||
            v.name.toLowerCase().includes('bangla') ||
            v.name.toLowerCase().includes('bengali')
        );
        if (bnVoice) {
          utterance.voice = bnVoice;
        }
      } else {
        utterance.lang = 'en-US';
        const enVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
        if (enVoice) {
          utterance.voice = enVoice;
        }
      }

      let handled = false;

      utterance.onstart = () => {
        this.consecutiveErrorCount = 0; // speech synthesis is speaking
      };

      const advance = () => {
        if (handled || this.isCancelled) return;
        handled = true;
        if (this.watchdogTimer) {
          clearTimeout(this.watchdogTimer);
          this.watchdogTimer = null;
        }
        this.options.onChunkEnd?.(this.currentIndex, this.chunks.length);
        this.currentIndex++;
        this.playCurrentChunk();
      };

      utterance.onend = () => {
        advance();
      };

      utterance.onerror = (e) => {
        if (this.isCancelled) return;
        if (e.error === 'interrupted' || e.error === 'canceled') {
          return;
        }
        console.warn('Speech synthesis chunk event:', e.error);
        this.consecutiveErrorCount++;

        // Anti-runaway guard: If 2 chunks fail consecutively, stop immediately instead of rapid skipping
        if (this.consecutiveErrorCount >= 2) {
          this.stop();
          this.options.onError?.('স্পিচ প্লেব্যাকে সাময়িক সমস্যা হয়েছে। ব্রাউজারের বাংলা ভয়েস চেক করুন।');
          return;
        }

        // Throttle fallback retry so text doesn't flash by in milliseconds
        setTimeout(() => {
          if (!this.isCancelled) {
            advance();
          }
        }, 500);
      };

      // Watchdog: If browser TTS hangs on a chunk for more than 14s, advance safely
      this.watchdogTimer = setTimeout(() => {
        if (!handled && !this.isCancelled) {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          } else {
            advance();
          }
        }
      }, 14000);

      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (err: any) {
      console.warn('Speech synthesis speak error:', err);
      this.options.onError?.('স্পিচ প্লেব্যাকে সমস্যা হয়েছে: ' + (err?.message || ''));
      this.stop();
    }
  }
}
