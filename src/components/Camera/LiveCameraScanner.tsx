import React, { useRef, useState, useEffect } from 'react';
import { Camera, SwitchCamera, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  onCapture: (base64Image: string) => void;
  onClose?: () => void;
}

export const LiveCameraScanner: React.FC<Props> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError(null);

    // Stop existing tracks if any
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('এই ব্রাউজারে বা ডিভাইসে ক্যামেরা API সমর্থিত নয়।');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.warn('Camera stream notice:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraError('ক্যামেরা পারমিশন ডিনাই করা হয়েছে। অনুগ্রহ করে ব্রাউজার সেটিংসে ক্যামেরা পারমিশন অনুমোদন করুন।');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraError('কোনো কার্যকর ক্যামেরা ডিভাইস খুঁজে পাওয়া যায়নি।');
      } else {
        setCameraError(err?.message || 'ক্যামেরা চালু করতে সমস্যা হয়েছে।');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const snapFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Export as high quality JPEG Base64
    const base64 = canvas.toDataURL('image/jpeg', 0.9);

    // Stop camera stream tracks to conserve battery
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    onCapture(base64);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center border border-stone-800 shadow-2xl">
      {/* Video stream element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${isInitializing || cameraError ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Loading state */}
      {isInitializing && !cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-950 text-stone-300">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-xs font-mono">ক্যামেরা সংযোগ স্থাপন হচ্ছে...</span>
        </div>
      )}

      {/* Error state */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-stone-950/95 text-rose-300">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-xs max-w-sm leading-relaxed">{cameraError}</p>
          <button
            type="button"
            onClick={startCamera}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>পুনরায় চেষ্টা করুন</span>
          </button>
        </div>
      )}

      {/* Viewfinder crosshairs guide */}
      {!isInitializing && !cameraError && (
        <div className="absolute inset-6 sm:inset-10 pointer-events-none border border-emerald-500/40 rounded-2xl flex flex-col justify-between p-3">
          <div className="flex justify-between text-emerald-400/60 font-mono text-[10px]">
            <span>[AI-VISION CAM]</span>
            <span>HD LIVE</span>
          </div>
          <div className="flex justify-center text-emerald-400/80 font-mono text-[11px] bg-stone-950/60 backdrop-blur-sm self-center px-3 py-1 rounded-full border border-emerald-500/30">
            বস্তু বা ডকুমেন্ট ফ্রেমের মাঝখানে রাখুন
          </div>
        </div>
      )}

      {/* Controls Bar */}
      {!isInitializing && !cameraError && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-5 z-20">
          <button
            type="button"
            onClick={() => setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))}
            className="p-3.5 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white backdrop-blur-md border border-stone-700/60 transition-all cursor-pointer shadow-lg active:scale-95"
            title="ক্যামেরা পরিবর্তন করুন"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={snapFrame}
            className="p-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/80 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-emerald-500/20"
            title="ছবি তুলুন (Capture Frame)"
          >
            <Camera className="w-7 h-7" />
          </button>
        </div>
      )}
    </div>
  );
};
