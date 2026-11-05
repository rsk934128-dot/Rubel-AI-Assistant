import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  VoiceCommandDefinition, 
  VoiceCommandId, 
  VOICE_COMMANDS_REGISTRY, 
  matchVoiceCommand 
} from '../types/voiceCommands';
import { 
  playCommandSuccessChime, 
  playListeningStartChime, 
  speakFeedback 
} from '../utils/soundEffects';

export interface UseVoiceToCommandOptions {
  onCommandExecuted?: (command: VoiceCommandDefinition, transcript: string) => void;
  enableAudioChime?: boolean;
  enableSpokenFeedback?: boolean;
  defaultLang?: 'bn-BD' | 'en-US';
}

export function useVoiceToCommand({
  onCommandExecuted,
  enableAudioChime = true,
  enableSpokenFeedback = false,
  defaultLang = 'bn-BD',
}: UseVoiceToCommandOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommandDefinition | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState<'bn-BD' | 'en-US'>(defaultLang);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const onCommandExecutedRef = useRef(onCommandExecuted);

  useEffect(() => {
    onCommandExecutedRef.current = onCommandExecuted;
  }, [onCommandExecuted]);

  const isWebSpeechSupported = typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // Setup reactive visual audio level
  const setupAudioAnalyzer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch {
      // Audio analyzer is optional
    }
  };

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setInterimTranscript('');
  };

  // Directly execute a command programmatically or via matching
  const executeCommand = useCallback((command: VoiceCommandDefinition, transcript: string = '') => {
    setLastCommand(command);
    setLastTranscript(transcript);

    if (enableAudioChime) {
      playCommandSuccessChime();
    }

    if (enableSpokenFeedback) {
      const feedback = voiceLang.startsWith('bn') ? command.feedbackBn : command.feedbackEn;
      speakFeedback(feedback, voiceLang);
    }

    if (onCommandExecutedRef.current) {
      onCommandExecutedRef.current(command, transcript);
    }
  }, [enableAudioChime, enableSpokenFeedback, voiceLang]);

  // Execute by Command ID (used by cheat-sheet & shortcuts)
  const executeCommandById = useCallback((id: VoiceCommandId) => {
    const cmd = VOICE_COMMANDS_REGISTRY.find((c) => c.id === id);
    if (cmd) {
      executeCommand(cmd, `[Manual Trigger: ${cmd.nameEn}]`);
    }
  }, [executeCommand]);

  // Evaluates transcript and executes if matched
  const processTranscriptForCommand = useCallback((transcript: string): boolean => {
    if (!transcript) return false;
    const matched = matchVoiceCommand(transcript);
    if (matched) {
      executeCommand(matched, transcript);
      return true;
    }
    return false;
  }, [executeCommand]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    cleanupAudio();
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    setVoiceError(null);
    isManuallyStoppedRef.current = false;
    setInterimTranscript('');

    if (!isWebSpeechSupported) {
      setVoiceError('Web Speech API is not supported in this browser. You can still use the Voice Commands Cheatsheet to trigger actions.');
      return;
    }

    try {
      if (enableAudioChime) {
        playListeningStartChime();
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          setupAudioAnalyzer(stream);
        } catch (e) {
          console.debug('Optional mic stream setup notice:', e);
        }
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLang;
      recognition.maxAlternatives = 2;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice command recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError('মাইক্রোফোনের অনুমতি প্রদান করা হয়নি। ব্রাউজার সেটিংসে মাইক্রোফোন Allow করুন।');
          stopListening();
        } else if (event.error === 'network') {
          setVoiceError('ভয়েস নেটওয়ার্ক সংযোগ বিচ্ছিন্ন।');
        }
      };

      recognition.onend = () => {
        if (!isManuallyStoppedRef.current && recognitionRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            cleanupAudio();
          }
        } else {
          setIsListening(false);
          cleanupAudio();
        }
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        let interim = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            fullTranscript += text;
          } else {
            interim += text;
          }
        }

        const currentSaid = (fullTranscript + (interim ? ' ' + interim : '')).trim();
        setInterimTranscript(currentSaid);

        // Check if there is a match in interim or final
        if (currentSaid) {
          const matched = matchVoiceCommand(currentSaid);
          if (matched) {
            executeCommand(matched, currentSaid);
            setInterimTranscript('');
            // Restart speech buffer
            try {
              recognition.abort();
              setTimeout(() => {
                if (!isManuallyStoppedRef.current) {
                  try { recognition.start(); } catch {}
                }
              }, 120);
            } catch {}
          }
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition for voice commands:', err);
      setVoiceError(err.message || 'ভয়েস কমান্ড সার্ভিস শুরু করতে সমস্যা হয়েছে');
      setIsListening(false);
      cleanupAudio();
    }
  }, [enableAudioChime, isWebSpeechSupported, stopListening, voiceLang, executeCommand]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isManuallyStoppedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      cleanupAudio();
    };
  }, []);

  return {
    isListening,
    lastCommand,
    lastTranscript,
    interimTranscript,
    audioLevel,
    voiceError,
    voiceLang,
    setVoiceLang,
    isWebSpeechSupported,
    startListening,
    stopListening,
    toggleListening,
    executeCommand,
    executeCommandById,
    processTranscriptForCommand,
  };
}
