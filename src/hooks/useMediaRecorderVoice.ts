import { useState, useRef, useEffect, useCallback } from 'react';

export type VoiceLanguage = 'bn-BD' | 'en-US';

interface UseMediaRecorderVoiceOptions {
  language?: VoiceLanguage;
  onTranscriptSuccess?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useMediaRecorderVoice({
  language = 'bn-BD',
  onTranscriptSuccess,
  onError,
}: UseMediaRecorderVoiceOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHoldMode, setIsHoldMode] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const recordStartTimeRef = useRef<number>(0);
  const isCanceledRef = useRef<boolean>(false);
  const holdStartTimeoutRef = useRef<any>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof window.MediaRecorder !== 'undefined';

  // Cleanup all audio and analyzers
  const cleanupAudio = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setFrequencyData([]);
    setRecordingDuration(0);
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  // Audio analyser setup for live reactive visualizer
  const setupAudioAnalyzer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.65;
      analyserRef.current = analyser;

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
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn('Audio analyzer initialization skipped:', err);
    }
  };

  // Transcribe recorded audio blob via /api/transcribe
  const sendForTranscription = async (blob: Blob) => {
    if (blob.size < 500) {
      // Too small, probably silence or accidental touch
      return;
    }

    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      // Convert blob to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: base64Data,
          mimeType: blob.type || 'audio/webm',
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `সার্ভার এরর (HTTP ${response.status})`);
      }

      const result = await response.json();
      const transcribedText = result.text?.trim() || '';

      if (transcribedText) {
        if (onTranscriptSuccess) {
          onTranscriptSuccess(transcribedText);
        }
      } else {
        setErrorMessage('কোনো স্পষ্ট ভয়েস বা কথা শনাক্ত করা যায়নি। অনুগ্রহ করে পুনরায় বলুন।');
      }
    } catch (err: any) {
      console.error('Transcription failed:', err);
      const msg = err?.message || 'অডিও ট্রান্সক্রিপশন ব্যর্থ হয়েছে।';
      setErrorMessage(msg);
      if (onError) onError(msg);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Start recording
  const startRecording = async (isHold = false) => {
    if (!isSupported) {
      setErrorMessage('আপনার ব্রাউজার MediaRecorder অডিও রেকর্ডিং সাপোর্ট করে না।');
      return;
    }

    setErrorMessage(null);
    isCanceledRef.current = false;
    audioChunksRef.current = [];
    setIsHoldMode(isHold);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Select supported audio MIME type
      const possibleMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/aac',
      ];
      let selectedMime = '';
      for (const mime of possibleMimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const mediaRecorder = selectedMime
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const wasCanceled = isCanceledRef.current;
        cleanupAudio();
        setIsRecording(false);
        setIsHoldMode(false);

        if (!wasCanceled && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: selectedMime || 'audio/webm',
          });
          const elapsed = Date.now() - recordStartTimeRef.current;
          if (elapsed >= 400) {
            sendForTranscription(audioBlob);
          } else {
            setErrorMessage('খুব কম সময় চেপে ধরা হয়েছিল। কথা বলার সময় চেপে ধরে রাখুন।');
          }
        }
      };

      mediaRecorder.start(250); // Slice data every 250ms
      recordStartTimeRef.current = Date.now();
      setIsRecording(true);

      // Setup audio analyzer
      setupAudioAnalyzer(stream);

      // Duration counter
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to get audio stream:', err);
      let msg = 'মাইক্রোফোন এক্সেস পাওয়া যায়নি। অনুগ্রহ করে পারমিশন দিন।';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'মাইক্রোফোন পারমিশন ব্লক করা আছে। ব্রাউজার সেটিংসে গিয়ে অনুমতি দিন।';
      }
      setErrorMessage(msg);
      if (onError) onError(msg);
      cleanupAudio();
      setIsRecording(false);
      setIsHoldMode(false);
    }
  };

  // Stop recording and send for transcription
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Cancel recording and discard chunks
  const cancelRecording = () => {
    isCanceledRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      cleanupAudio();
      setIsRecording(false);
      setIsHoldMode(false);
    }
    setErrorMessage('রেকর্ডিং বাতিল করা হয়েছে।');
    setTimeout(() => setErrorMessage(null), 3000);
  };

  // Hold-to-record Event Handlers for UI button
  const handleHoldStart = (e?: React.SyntheticEvent) => {
    if (e) {
      // Don't trigger default context menu / selection
      if (e.type === 'touchstart') {
        // e.preventDefault() is handled carefully
      }
    }
    if (isRecording || isTranscribing) return;

    // Start recording in hold mode
    startRecording(true);
  };

  const handleHoldEnd = (e?: React.SyntheticEvent) => {
    if (!isRecording) return;
    if (isHoldMode) {
      stopRecording();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(false);
    }
  };

  return {
    isRecording,
    isTranscribing,
    recordingDuration,
    audioLevel,
    frequencyData,
    errorMessage,
    setErrorMessage,
    isHoldMode,
    startRecording,
    stopRecording,
    cancelRecording,
    handleHoldStart,
    handleHoldEnd,
    toggleRecording,
    isSupported,
  };
}
