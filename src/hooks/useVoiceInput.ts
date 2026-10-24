import { useState, useRef, useEffect, useCallback } from 'react';

export type VoiceLanguage = 'bn-BD' | 'en-US';

interface UseVoiceInputOptions {
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  onSendVoiceCommand?: (finalText: string) => void;
  onClearVoiceCommand?: () => void;
  defaultLang?: VoiceLanguage;
}

export function useVoiceInput({
  onTranscriptUpdate,
  onSendVoiceCommand,
  onClearVoiceCommand,
  defaultLang = 'bn-BD',
}: UseVoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguageState] = useState<VoiceLanguage>(defaultLang);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  const [interimText, setInterimText] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const currentLanguageRef = useRef<VoiceLanguage>(defaultLang);
  const basePrefixTextRef = useRef<string>('');

  // Keep ref in sync
  currentLanguageRef.current = language;

  // Check Web Speech API support
  const isSupported = typeof window !== 'undefined' && 
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // Setup optional audio level analyzer for reactive visual feedback
  const setupAudioAnalyzer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.65;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        const bands = 24;
        const freqs: number[] = [];
        const step = Math.max(1, Math.floor(dataArray.length / bands));

        for (let i = 0; i < bands; i++) {
          const idx = Math.min(dataArray.length - 1, i * step);
          const val = dataArray[idx] || 0;
          freqs.push(Math.round((val / 255) * 100));
          sum += val;
        }

        const average = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(normalized);
        setFrequencyData(freqs);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn('Audio analyzer could not be initialized:', err);
    }
  };

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setFrequencyData([]);
    setInterimText('');
  };

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    cleanupAudio();
    setIsListening(false);
  }, []);

  const startListening = useCallback(async (existingText: string = '') => {
    setErrorMessage(null);
    isManuallyStoppedRef.current = false;
    basePrefixTextRef.current = existingText ? existingText.trim() + ' ' : '';
    setInterimText('');

    if (!isSupported) {
      setErrorMessage(
        'আপনার ব্রাউজারে Web Speech API সরাসরি সমর্থিত নয়। দয়া করে Google Chrome, Microsoft Edge বা Safari ব্রাউজার ব্যবহার করুন।'
      );
      setIsListening(false);
      return;
    }

    // Try optional audio analyzer (non-blocking)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setHasPermission(true);
        setupAudioAnalyzer(stream);
      }
    } catch (err: any) {
      console.warn('Non-blocking mic stream notice:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setHasPermission(false);
      }
    }

    // Initialize Web Speech API SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = currentLanguageRef.current;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('মাইক্রোফোন ব্যবহারের অনুমতি পাওয়া যায়নি। ব্রাউজার অ্যাড্রেসবারে তালা (Lock) আইকনে ক্লিক করে মাইক্রোফোন Allow করুন।');
          stopListening();
        } else if (event.error === 'no-speech') {
          // Normal pause in speaking, stay active
        } else if (event.error === 'network') {
          setErrorMessage('ভয়েস রিকগনিশন সার্ভার নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করুন।');
        } else if (event.error === 'audio-capture') {
          setErrorMessage('কোনো মাইক্রোফোন ডিভাইস পাওয়া যায়নি। হেডফোন বা মাইক চেক করুন।');
          stopListening();
        }
      };

      recognition.onend = () => {
        if (!isManuallyStoppedRef.current && recognitionRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
            cleanupAudio();
          }
        } else {
          setIsListening(false);
          cleanupAudio();
        }
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let liveInterim = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          const chunk = item[0]?.transcript || '';
          if (item.isFinal) {
            finalTranscript += chunk;
          } else {
            liveInterim += chunk;
          }
        }

        const recognizedSoFar = (finalTranscript + (liveInterim ? ' ' + liveInterim : '')).trim();
        setInterimText(recognizedSoFar);

        // Check for hands-free voice commands
        const lower = recognizedSoFar.toLowerCase();
        const sendCommandsBn = ['পাঠাও', 'সেন্ড করো', 'মেসেজ পাঠাও', 'পাঠিয়ে দাও', 'পাঠান'];
        const sendCommandsEn = ['send message', 'send', 'submit'];
        const clearCommands = ['মুছে ফেলো', 'ক্লিয়ার করো', 'clear all', 'clear input', 'মুছে দাও'];

        // Clear command check
        if (clearCommands.some((cmd) => lower.endsWith(cmd) || lower === cmd)) {
          if (onClearVoiceCommand) {
            onClearVoiceCommand();
          }
          basePrefixTextRef.current = '';
          setInterimText('');
          return;
        }

        // Send command check
        const hasSendBn = sendCommandsBn.some((cmd) => lower.endsWith(cmd) || lower === cmd);
        const hasSendEn = sendCommandsEn.some((cmd) => lower.endsWith(cmd) || lower === cmd);

        if (hasSendBn || hasSendEn) {
          let cleanedText = recognizedSoFar;
          [...sendCommandsBn, ...sendCommandsEn].forEach((cmd) => {
            const regex = new RegExp(`\\s*${cmd}\\s*$`, 'i');
            cleanedText = cleanedText.replace(regex, '');
          });

          cleanedText = cleanedText.trim();
          const fullMessageToSend = (basePrefixTextRef.current + cleanedText).trim();

          stopListening();
          if (fullMessageToSend && onSendVoiceCommand) {
            onSendVoiceCommand(fullMessageToSend);
          }
          return;
        }

        // Regular continuous dictation update
        if (recognizedSoFar) {
          const fullUpdatedText = (basePrefixTextRef.current + recognizedSoFar).trim();
          if (onTranscriptUpdate) {
            onTranscriptUpdate(fullUpdatedText, Boolean(finalTranscript));
          }
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage('ভয়েস রিকগনিশন শুরু করতে সমস্যা হয়েছে: ' + (err.message || ''));
      setIsListening(false);
      cleanupAudio();
    }
  }, [isSupported, onTranscriptUpdate, onSendVoiceCommand, onClearVoiceCommand, stopListening]);

  const toggleListening = useCallback((existingText: string = '') => {
    if (isListening) {
      stopListening();
    } else {
      startListening(existingText);
    }
  }, [isListening, startListening, stopListening]);

  // Allows switching language on the fly (Bengali <-> English)
  const setLanguage = useCallback((newLang: VoiceLanguage) => {
    setLanguageState(newLang);
    currentLanguageRef.current = newLang;

    // If currently listening, seamlessly restart recognition with the new language
    if (isListening && recognitionRef.current) {
      try {
        isManuallyStoppedRef.current = false;
        recognitionRef.current.abort();
      } catch (e) {}
    }
  }, [isListening]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      isManuallyStoppedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      cleanupAudio();
    };
  }, []);

  return {
    isListening,
    language,
    setLanguage,
    startListening,
    stopListening,
    toggleListening,
    isSupported,
    hasPermission,
    errorMessage,
    setErrorMessage,
    audioLevel,
    frequencyData,
    interimText,
  };
}
