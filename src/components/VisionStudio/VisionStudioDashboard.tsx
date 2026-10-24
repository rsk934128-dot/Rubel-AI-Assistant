import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Scan, 
  Code2, 
  FileText, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  RefreshCw, 
  Eye, 
  SlidersHorizontal,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Play
} from 'lucide-react';
import { useVisionStudio, BoundingBox, StudioMode } from '../../hooks/useVisionStudio';
import { InteractiveCanvas } from '../Canvas/InteractiveCanvas';
import { LiveCameraScanner } from '../Camera/LiveCameraScanner';

interface Props {
  onClose?: () => void;
  onSendToChat?: (text: string, title?: string) => void;
  onPreviewCode?: (code: string, language: string) => void;
}

export const VisionStudioDashboard: React.FC<Props> = ({
  onClose,
  onSendToChat,
  onPreviewCode,
}) => {
  const [activeMode, setActiveMode] = useState<StudioMode>('detection');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [selectedBox, setSelectedBox] = useState<BoundingBox | null>(null);
  const [selectedBoxes, setSelectedBoxes] = useState<BoundingBox[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { analyzeImage, isAnalyzing, result, error, setResult } = useVisionStudio();

  const handleAskAboutObject = (box: BoundingBox) => {
    const prompt = `ছবির শনাক্তকৃত [${box.label}] অবজেক্টটি (স্থানাঙ্ক: [${box.box_2d.join(', ')}]) সম্পর্কে বিস্তারিত ভিজ্যুয়াল বিশ্লেষণ প্রদান করুন: এর আকৃতি, দৃশ্যমান বৈশিষ্ট্য ও ধরন কী?`;
    if (onSendToChat) {
      onSendToChat(prompt, `Visual Q&A: ${box.label}`);
    } else {
      setCustomPrompt(prompt);
      handleRunAnalysis();
    }
  };

  // 1. File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImageSrc(base64);
        setShowCamera(false);
        setResult(null);
        setSelectedBox(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Camera Frame Capture
  const handleCameraCapture = (base64Image: string) => {
    setImageSrc(base64Image);
    setShowCamera(false);
    setResult(null);
    setSelectedBox(null);
  };

  // 3. Run AI Vision Analysis
  const handleRunAnalysis = async () => {
    if (!imageSrc) return;
    const res = await analyzeImage(imageSrc, activeMode, customPrompt);
    if (res && res.summary) {
      speakBengali(res.summary);
    }
  };

  // 4. Audio-Vision Sync (Bengali Text-to-Speech)
  const speakBengali = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // 5. Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-stone-950 text-stone-100 min-h-screen rounded-3xl border border-stone-800 shadow-2xl flex flex-col gap-6">
      
      {/* Header & Branding */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <Eye className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                  AI-Vision Studio 1.0
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5 font-mono">
                Architect: Sheikh Farid (rsk934128-dot) • Powered by Gemini Flash Engine
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-stone-900 border border-stone-800 rounded-2xl">
          {[
            { id: 'detection', label: 'অবজেক্ট ডিটেকশন', icon: Scan },
            { id: 'ocr', label: 'ডকুমেন্ট ও OCR', icon: FileText },
            { id: 'wireframe-to-code', label: 'স্কেচ টু কোড', icon: Code2 },
            { id: 'general', label: 'ভিজ্যুয়াল অডিট', icon: SlidersHorizontal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveMode(tab.id as StudioMode);
                  setSelectedBox(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Column: Canvas, Live Camera, Upload Toolbar (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative min-h-[440px] bg-stone-900/60 rounded-3xl border border-stone-800/80 p-4 flex flex-col items-center justify-center overflow-hidden">
            
            {showCamera ? (
              <LiveCameraScanner 
                onCapture={handleCameraCapture} 
                onClose={() => setShowCamera(false)}
              />
            ) : imageSrc ? (
              <InteractiveCanvas 
                imageSrc={imageSrc} 
                boxes={result?.detectedObjects || []} 
                selectedBox={selectedBox}
                selectedBoxes={selectedBoxes}
                onSelectBox={(box) => setSelectedBox(box)}
                onSelectMultipleBoxes={(boxes) => setSelectedBoxes(boxes)}
                onAskAboutObject={handleAskAboutObject}
              />
            ) : (
              <div className="text-center p-8 flex flex-col items-center select-none">
                <div className="p-4 rounded-2xl bg-stone-800/50 text-stone-400 mb-4 border border-stone-700/40">
                  <Upload className="w-10 h-10 animate-pulse text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-stone-200">কোনো ছবি লোড করা হয়নি</h3>
                <p className="text-xs text-stone-400 mt-1.5 max-w-sm leading-relaxed">
                  বিশ্লেষণের জন্য আপনার ডিভাইস থেকে ছবি আপলোড করুন অথবা লাইভ ক্যামেরা চালু করে তাৎক্ষণিক স্ন্যাপ নিন।
                </p>
              </div>
            )}

            {/* Action Bar Floating Toolbar */}
            <div className="flex items-center gap-3 mt-4 flex-wrap justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700/60 transition-all cursor-pointer shadow-sm"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>ছবি আপলোড</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCamera(!showCamera)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer shadow-sm ${
                  showCamera 
                    ? 'bg-rose-950/40 text-rose-300 border-rose-800/60' 
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700/60'
                }`}
              >
                <Camera className="w-4 h-4 text-sky-400" />
                <span>{showCamera ? 'ক্যামেরা বন্ধ করুন' : 'লাইভ ক্যামেরা'}</span>
              </button>

              {imageSrc && (
                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-800 text-white text-xs font-semibold shadow-lg shadow-emerald-950/80 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>বিশ্লেষণ চলছে...</span>
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4" />
                      <span>স্ক্যান শুরু করুন</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Custom Instruction Input */}
          <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-3 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="নির্দিষ্ট নির্দেশনা দিন (যেমন: 'লোগোটির রং এবং টেক্সট কি?', 'টেবিলটি এক্সট্রাক্ট করুন')..."
              className="flex-1 bg-transparent border-none text-xs text-stone-200 placeholder-stone-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Inspection, OCR, Code and Audio Output (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex-1 bg-stone-900/60 rounded-3xl border border-stone-800/80 p-5 flex flex-col gap-4 overflow-y-auto max-h-[600px]">
            
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h2 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                <span>অ্যানালাইসিস রেজাল্ট</span>
                {result && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    সম্পন্ন
                  </span>
                )}
              </h2>

              {/* Voice and Copy Controls */}
              <div className="flex items-center gap-2">
                {result?.summary && (
                  <button
                    type="button"
                    onClick={() => isSpeaking ? stopSpeaking() : speakBengali(result.summary)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isSpeaking 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse' 
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                    }`}
                    title={isSpeaking ? 'ভয়েস বন্ধ করুন' : 'পড়ে শোনান (Audio Feedback)'}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}

                {(result?.ocrText || result?.generatedCode || result?.summary) && (
                  <button
                    type="button"
                    onClick={() => handleCopy(result.generatedCode || result.ocrText || result.summary)}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all cursor-pointer"
                    title="কপি করুন"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}

                {onSendToChat && result && (
                  <button
                    type="button"
                    onClick={() => {
                      const text = result.generatedCode || result.ocrText || result.summary;
                      onSendToChat(text, `Vision Studio (${activeMode})`);
                    }}
                    className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                    title="চ্যাটে পাঠান"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300">
                ⚠️ {error}
              </div>
            )}

            {/* Loader State */}
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs text-stone-400 font-mono">মাল্টিমোডাল নিউরাল প্রসেসিং চলছে...</p>
              </div>
            )}

            {/* Results Output */}
            {!isAnalyzing && result && (
              <div className="flex flex-col gap-4 text-xs">
                
                {/* Summary Card */}
                {result.summary && (
                  <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                      মূল সারাংশ:
                    </span>
                    <p className="text-stone-300 leading-relaxed">{result.summary}</p>
                  </div>
                )}

                {/* Detected Objects List */}
                {result.detectedObjects && result.detectedObjects.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                      শনাক্তকৃত অবজেক্টসমূহ ({result.detectedObjects.length}):
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {result.detectedObjects.map((obj, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedBox(obj)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            selectedBox?.label === obj.label
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                              : 'bg-stone-950/40 border-stone-800/80 hover:border-stone-700 text-stone-300'
                          }`}
                        >
                          <div className="font-semibold truncate">{obj.label}</div>
                          <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                            Coords: [{obj.box_2d.join(', ')}]
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted OCR Text */}
                {result.ocrText && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                      এক্সট্রাক্ট করা টেক্সট:
                    </span>
                    <pre className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 font-mono text-stone-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {result.ocrText}
                    </pre>
                  </div>
                )}

                {/* Generated Wireframe-to-Code */}
                {result.generatedCode && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                        জেনারেটেড React/Tailwind কোড:
                      </span>
                      {onPreviewCode && (
                        <button
                          type="button"
                          onClick={() => onPreviewCode(result.generatedCode!, 'tsx')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>লাইভ রান</span>
                        </button>
                      )}
                    </div>
                    <pre className="p-3 rounded-2xl bg-stone-950 border border-stone-800 font-mono text-emerald-400 text-[11px] whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                      {result.generatedCode}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {!isAnalyzing && !result && !error && (
              <div className="text-center py-20 text-stone-500 text-xs font-mono">
                ফলাফল দেখার জন্য ইমেজ বিশ্লেষণ করুন।
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
