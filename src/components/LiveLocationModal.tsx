import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Navigation,
  Compass,
  Gauge,
  Activity,
  Copy,
  Check,
  ExternalLink,
  Share2,
  RefreshCw,
  Play,
  Pause,
  X,
  AlertTriangle,
  Sparkles,
  Send,
  Building,
  Maximize2,
  Minimize2,
  ArrowLeft
} from 'lucide-react';
import { UseLiveLocationReturn } from '../hooks/useLiveLocation';

interface LiveLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationState: UseLiveLocationReturn;
  onSendToChat: (prompt: string) => void;
  onOpenShareModal?: (config: {
    title: string;
    text: string;
    url: string;
    shareType: 'app' | 'session' | 'message';
  }) => void;
}

export const LiveLocationModal: React.FC<LiveLocationModalProps> = ({
  isOpen,
  onClose,
  locationState,
  onSendToChat,
  onOpenShareModal,
}) => {
  const {
    coordinates,
    address,
    addressDetails,
    isTracking,
    isLoading,
    isResolvingAddress,
    error,
    permissionState,
    updateCount,
    lastUpdated,
    startTracking,
    stopTracking,
    refreshLocation,
    googleMapsUrl,
  } = locationState;

  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(16);

  // Auto-start tracking when modal is opened if not already tracking
  useEffect(() => {
    if (isOpen && !coordinates && !isTracking) {
      startTracking();
    }
  }, [isOpen, coordinates, isTracking, startTracking]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const lat = coordinates?.latitude ?? 23.8103;
  const lng = coordinates?.longitude ?? 90.4125;

  // Calculate bounding box for OpenStreetMap embed
  const delta = 0.005 * Math.pow(2, 16 - zoomLevel);
  const bbox = `${lng - delta * 1.5}%2C${lat - delta}%2C${lng + delta * 1.5}%2C${lat + delta}`;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  const handleCopyCoordinates = () => {
    if (!coordinates) return;
    const text = `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleCopyFullInfo = () => {
    if (!coordinates) return;
    const fullText = `📍 আমার বর্তমান লাইভ লোকেশন:\n${address || 'অজ্ঞাত ঠিকানা'}\nঅক্ষাংশ: ${coordinates.latitude.toFixed(6)}\nদ্রাঘিমাংশ: ${coordinates.longitude.toFixed(6)}\nনির্ভুলতা: ±${Math.round(coordinates.accuracy)} মিটার\nম্যাপস লিংক: ${googleMapsUrl || ''}`;
    navigator.clipboard.writeText(fullText);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleSendLocationPrompt = (customQuestion?: string) => {
    if (!coordinates) return;
    const defaultQuestion = customQuestion || 'আমার বর্তমান লোকেশন অনুযায়ী আশেপাশের গুরুত্বপূর্ণ স্থান, আকর্ষণীয় পয়েন্ট ও দরকারি তথ্যগুলো বিস্তারিত বাংলায় বলো।';
    const message = `📍 আমার বর্তমান লাইভ লোকেশন:\n${address ? `ঠিকানা: ${address}\n` : ''}অক্ষাংশ: ${coordinates.latitude.toFixed(6)}°, দ্রাঘিমাংশ: ${coordinates.longitude.toFixed(6)}° (নির্ভুলতা: ±${Math.round(coordinates.accuracy)} মিটার)\nগুগল ম্যাপস: https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}\n\n${defaultQuestion}`;
    onSendToChat(message);
    onClose();
  };

  const handleShare = () => {
    if (!coordinates) return;
    const shareText = `📍 আমার লাইভ লোকেশন: ${address || `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`}`;
    const url = googleMapsUrl || `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;

    if (onOpenShareModal) {
      onOpenShareModal({
        title: 'রিয়েল-টাইম লাইভ লোকেশন',
        text: shareText,
        url: url,
        shareType: 'message',
      });
      onClose();
    } else if (navigator.share) {
      navigator.share({
        title: 'রিয়েল-টাইম লাইভ লোকেশন',
        text: shareText,
        url: url,
      }).catch(() => {});
    } else {
      handleCopyFullInfo();
    }
  };

  const speedKmh = coordinates?.speed ? (coordinates.speed * 3.6).toFixed(1) : '০.০';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col rounded-none sm:rounded-2xl bg-white dark:bg-stone-900 border-0 sm:border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden"
        >
          {/* Mobile Drag Indicator Handle */}
          <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

          {/* Modal Header */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0 bg-stone-50/70 dark:bg-stone-900/90 gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0">
                <MapPin className="w-5 h-5" />
                {isTracking && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-stone-900" />
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    রিয়েল-টাইম লাইভ লোকেশন (GPS)
                  </h3>
                  {isTracking ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      লাইভ ট্র্যাকিং সক্রিয়
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                      পজ করা
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  ডিভাইস জিপিএস ও স্যাটেলাইট ভিত্তিক নির্ভুল রিয়েল-টাইম ভৌগোলিক অবস্থান
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="toggle-live-tracking-btn"
                onClick={isTracking ? stopTracking : startTracking}
                title={isTracking ? 'লাইভ ট্র্যাকিং পজ করুন' : 'লাইভ ট্র্যাকিং পুনরায় শুরু করুন'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isTracking
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                {isTracking ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">পজ</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">চালু করুন</span>
                  </>
                )}
              </button>

              <button
                id="refresh-live-location-btn"
                onClick={refreshLocation}
                disabled={isLoading}
                title="অবস্থান রিফ্রেশ করুন"
                className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
              </button>

              <button
                onClick={onClose}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                title="চ্যাটে ফিরে যান (Back)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ফিরে যান</span>
              </button>

              <button
                id="close-location-modal-btn"
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Error / Permission Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{error}</p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">
                    টিপস: ব্রাউজারের অ্যাড্রেস বারের বাম পাশে তালা (Lock) বা সাইট সেটিংসে ক্লিক করে Location পারমিশন "Allow" করুন।
                  </p>
                </div>
              </div>
            )}

            {/* Interactive Live Map Section */}
            <div className={`relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 transition-all ${isFullscreenMap ? 'h-96' : 'h-56 sm:h-64'}`}>
              {coordinates ? (
                <>
                  <iframe
                    title="Live Location Map"
                    src={mapEmbedUrl}
                    className="w-full h-full border-0 pointer-events-auto"
                    loading="lazy"
                  />
                  {/* Map Overlay Controls */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(z + 1, 18))}
                      title="জুম ইন"
                      className="w-8 h-8 rounded-lg bg-white/90 dark:bg-stone-800/90 text-stone-800 dark:text-stone-100 shadow-md flex items-center justify-center font-bold text-sm hover:bg-white transition-all cursor-pointer backdrop-blur-xs"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(z - 1, 12))}
                      title="জুম আউট"
                      className="w-8 h-8 rounded-lg bg-white/90 dark:bg-stone-800/90 text-stone-800 dark:text-stone-100 shadow-md flex items-center justify-center font-bold text-sm hover:bg-white transition-all cursor-pointer backdrop-blur-xs"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setIsFullscreenMap((prev) => !prev)}
                      title={isFullscreenMap ? 'ছোট করুন' : 'ম্যাপ বড় করুন'}
                      className="w-8 h-8 rounded-lg bg-white/90 dark:bg-stone-800/90 text-stone-800 dark:text-stone-100 shadow-md flex items-center justify-center hover:bg-white transition-all cursor-pointer backdrop-blur-xs"
                    >
                      {isFullscreenMap ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Live Beacon Badge on Map */}
                  <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-md bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs text-[11px] font-semibold text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700 shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>GPS অবস্থান: {coordinates.latitude.toFixed(5)}°, {coordinates.longitude.toFixed(5)}°</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center text-stone-500">
                  <Navigation className={`w-8 h-8 ${isLoading ? 'animate-spin text-emerald-500' : 'text-stone-400'}`} />
                  <p className="text-xs font-medium">
                    {isLoading ? 'GPS সিগন্যাল সংযোগ হচ্ছে...' : 'লোকেশন তথ্য লোড করা হচ্ছে'}
                  </p>
                  <button
                    onClick={startTracking}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    অবস্থান সনাক্ত করুন
                  </button>
                </div>
              )}
            </div>

            {/* Resolved Address Banner */}
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100">
                  <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>সনাক্তকৃত বর্তমান ঠিকানা (Reverse Geocoded)</span>
                </div>
                {isResolvingAddress ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> ঠিকানা খোঁজা হচ্ছে...
                  </span>
                ) : address ? (
                  <button
                    onClick={handleCopyFullInfo}
                    className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedAddress ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAddress ? 'কপি হয়েছে' : 'ঠিকানা কপি'}</span>
                  </button>
                ) : null}
              </div>

              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                {address || (isLoading ? 'ঠিকানা বিশ্লেষণ করা হচ্ছে...' : 'ঠিকানা লোড হতে একটু সময় নিতে পারে...')}
              </p>

              {addressDetails && (
                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                  {addressDetails.road && (
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium">
                      সড়ক: {addressDetails.road}
                    </span>
                  )}
                  {(addressDetails.suburb || addressDetails.neighbourhood) && (
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium">
                      এলাকা: {addressDetails.suburb || addressDetails.neighbourhood}
                    </span>
                  )}
                  {(addressDetails.city || addressDetails.town || addressDetails.district) && (
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium">
                      শহর/জেলা: {addressDetails.city || addressDetails.town || addressDetails.district}
                    </span>
                  )}
                  {addressDetails.country && (
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium">
                      দেশ: {addressDetails.country}
                    </span>
                  )}
                  {addressDetails.postcode && (
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium">
                      পোস্টকোড: {addressDetails.postcode}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* GPS Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Latitude & Longitude */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 relative group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400">
                    কোঅর্ডিনেট
                  </span>
                  <button
                    onClick={handleCopyCoordinates}
                    className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                    title="কপি করুন"
                  >
                    {copiedCoords ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100 truncate">
                  {coordinates ? `${coordinates.latitude.toFixed(5)}° N` : '—'}
                </p>
                <p className="text-[11px] font-mono text-stone-600 dark:text-stone-400 truncate">
                  {coordinates ? `${coordinates.longitude.toFixed(5)}° E` : '—'}
                </p>
              </div>

              {/* Accuracy */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 mb-1">
                  <Activity className="w-3 h-3 text-emerald-500" />
                  <span>GPS নির্ভুলতা</span>
                </div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {coordinates ? `±${Math.round(coordinates.accuracy)} মিটার` : '—'}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">
                  {coordinates && coordinates.accuracy <= 20
                    ? 'উচ্চ নির্ভুলতা (High precision)'
                    : 'সাধারণ সেলুলার/ওয়াইফাই'}
                </p>
              </div>

              {/* Speed */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 mb-1">
                  <Gauge className="w-3 h-3 text-amber-500" />
                  <span>বর্তমান গতি</span>
                </div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {speedKmh} <span className="text-[11px] font-normal text-stone-500">কিমি/ঘণ্টা</span>
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">
                  {coordinates?.altitude !== null && coordinates?.altitude !== undefined
                    ? `উচ্চতা: ${Math.round(coordinates.altitude)} মি.`
                    : 'ভূমি সমতল'}
                </p>
              </div>

              {/* Live Updates Counter */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 mb-1">
                  <Compass className="w-3 h-3 text-rose-500" />
                  <span>লাইভ ট্র্যাকিং</span>
                </div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {updateCount} বার সিঙ্কড
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                  {lastUpdated ? `${lastUpdated.toLocaleTimeString('bn-BD')}` : 'অপেক্ষমান'}
                </p>
              </div>
            </div>

            {/* AI Smart Prompt Shortcuts */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>এই লোকেশন নিয়ে এআই সহকারীকে এক ক্লিকে জিজ্ঞেস করুন:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() =>
                    handleSendLocationPrompt('আমার বর্তমান লোকেশন অনুযায়ী আশেপাশের বিখ্যাত ঐতিহাসিক স্থান, বিনোদন কেন্দ্র ও পার্কগুলোর তথ্য দাও।')
                  }
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700/80 bg-white dark:bg-stone-850 hover:border-emerald-300 dark:hover:border-emerald-700 text-left transition-all hover:shadow-xs group cursor-pointer"
                >
                  <p className="font-semibold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    🏛️ আশেপাশের দর্শনীয় স্থান
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                    পার্ক, জাদুঘর ও ঐতিহাসিক নিদর্শন
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleSendLocationPrompt('আমার এই অবস্থানের বর্তমান আবহাওয়া, তাপমাত্রা এবং পরবর্তী কয়েক ঘণ্টার পূর্বাভাস জানাও।')
                  }
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700/80 bg-white dark:bg-stone-850 hover:border-emerald-300 dark:hover:border-emerald-700 text-left transition-all hover:shadow-xs group cursor-pointer"
                >
                  <p className="font-semibold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    ⛅ বর্তমান আবহাওয়া ও পূর্বাভাস
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                    তাপমাত্রা, বৃষ্টির সম্ভাবনা ও বাতাস
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleSendLocationPrompt('আমার এই এলাকার জনপ্রিয় খাবার, রেস্তোরাঁ এবং বিখ্যাত খাবারের দোকানগুলোর তালিকা দাও।')
                  }
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700/80 bg-white dark:bg-stone-850 hover:border-emerald-300 dark:hover:border-emerald-700 text-left transition-all hover:shadow-xs group cursor-pointer"
                >
                  <p className="font-semibold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    🍽️ জনপ্রিয় রেস্তোরাঁ ও ফুড স্পট
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                    স্থানীয় সুস্বাদু খাবার ও রেস্তোরাঁ
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleSendLocationPrompt('আমার এই লোকেশনের কাছাকাছি হাসপাতাল, ফার্মেসি ও জরুরি সেবাসমূহের তালিকা দাও।')
                  }
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700/80 bg-white dark:bg-stone-850 hover:border-emerald-300 dark:hover:border-emerald-700 text-left transition-all hover:shadow-xs group cursor-pointer"
                >
                  <p className="font-semibold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    🏥 জরুরি স্বাস্থ্য ও ফার্মেসি সেবা
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                    হাসপাতাল, অ্যাম্বুলেন্স ও ফার্মেসি
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="px-5 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              {googleMapsUrl && (
                <a
                  id="open-in-google-maps-link"
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 text-xs font-semibold border border-stone-200 dark:border-stone-700 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  <span>Google Maps-এ খুলুন</span>
                </a>
              )}

              <button
                id="share-live-location-btn"
                onClick={handleShare}
                disabled={!coordinates}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 text-xs font-semibold border border-stone-200 dark:border-stone-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>সোশ্যাল মিডিয়ায় শেয়ার</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="send-location-to-chat-btn"
                onClick={() => handleSendLocationPrompt()}
                disabled={!coordinates}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>এআই চ্যাটে লোকেশন পাঠান</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
