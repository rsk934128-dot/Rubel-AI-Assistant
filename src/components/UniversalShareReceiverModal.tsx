import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Share2,
  Link2,
  Image as ImageIcon,
  FileText,
  FileCode,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Sparkles,
  Send,
  Trash2,
  Upload,
  ArrowRight,
  Globe,
  Youtube,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  MessageSquare,
  Newspaper,
  QrCode,
  Info,
  Layers,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  InboundSharedContent,
  detectPlatformFromUrl,
  formatInboundSharedPrompt,
  buildRemoteShareUrl,
  copyToClipboard
} from '../utils/shareUtils';

export interface UniversalShareReceiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSharedItem?: InboundSharedContent | null;
  onInsertToChat: (prompt: string, autoSend?: boolean) => void;
  onOpenMusicPlayer?: (videoId: string, title?: string) => void;
  onOpenMiniBrowser?: (url: string) => void;
}

type TabType = 'link' | 'photo' | 'file' | 'text' | 'guide';

export const UniversalShareReceiverModal: React.FC<UniversalShareReceiverModalProps> = ({
  isOpen,
  onClose,
  initialSharedItem,
  onInsertToChat,
  onOpenMusicPlayer,
  onOpenMiniBrowser,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('link');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);
  const [userInstruction, setUserInstruction] = useState('');

  // Link state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  // Photos state
  interface UploadedPhoto {
    id: string;
    name: string;
    size: string;
    dataUrl: string;
    dimensions?: string;
  }
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Files state
  interface UploadedDoc {
    id: string;
    name: string;
    size: string;
    extension: string;
    contentSnippet: string;
    fullText?: string;
  }
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Text state
  const [textSnippet, setTextSnippet] = useState('');
  const [textTitle, setTextTitle] = useState('');

  // Handle initial shared payload if opened via URL share target
  useEffect(() => {
    if (!initialSharedItem) return;

    if (initialSharedItem.type === 'link') {
      setActiveTab('link');
      setLinkUrl(initialSharedItem.url || '');
      setLinkTitle(initialSharedItem.title || '');
      setLinkDescription(initialSharedItem.text || '');
    } else if (initialSharedItem.type === 'photo') {
      setActiveTab('photo');
      if (initialSharedItem.fileDataUrl) {
        setPhotos([
          {
            id: 'init-photo-1',
            name: initialSharedItem.fileName || 'শেয়ার করা ছবি.jpg',
            size: initialSharedItem.fileSize || '1 MB',
            dataUrl: initialSharedItem.fileDataUrl,
          },
        ]);
      }
    } else if (initialSharedItem.type === 'file') {
      setActiveTab('file');
      if (initialSharedItem.rawContent) {
        setDocuments([
          {
            id: 'init-file-1',
            name: initialSharedItem.fileName || 'শেয়ার করা ফাইল.txt',
            size: initialSharedItem.fileSize || 'ফাইল',
            extension: initialSharedItem.fileName?.split('.').pop() || 'txt',
            contentSnippet: initialSharedItem.rawContent.slice(0, 300),
            fullText: initialSharedItem.rawContent,
          },
        ]);
      }
    } else {
      setActiveTab('text');
      setTextSnippet(initialSharedItem.text || '');
      setTextTitle(initialSharedItem.title || '');
    }
  }, [initialSharedItem, isOpen]);

  if (!isOpen) return null;

  // Clipboard paste into Link tab
  const handlePasteClipboardToLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setLinkUrl(text.trim());
          const detected = detectPlatformFromUrl(text);
          if (detected.platform !== 'general') {
            setLinkTitle(`${detected.name} লিংক`);
          }
        }
      }
    } catch {
      // Ignore clipboard permission errors
    }
  };

  // Clipboard paste into Text tab
  const handlePasteClipboardToText = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setTextSnippet(text);
        }
      }
    } catch {}
  };

  // Clean WhatsApp timestamps
  const handleCleanWhatsAppText = () => {
    if (!textSnippet) return;
    // Pattern: [18/10/2026, 8:00 PM] Name: Message or 18/10/26, 20:00 - Name: Message
    const cleaned = textSnippet
      .replace(/\[\d{1,2}\/\d{1,2}\/\d{2,4}[^\]]*\]\s*[^:]*:\s*/gi, '')
      .replace(/\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\s*-\s*[^:]*:\s*/gi, '')
      .trim();
    setTextSnippet(cleaned);
  };

  // Convert to bullet points
  const handleFormatBulletPoints = () => {
    if (!textSnippet) return;
    const lines = textSnippet
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const bulleted = lines.map((l) => (l.startsWith('•') || l.startsWith('-') ? l : `• ${l}`)).join('\n');
    setTextSnippet(bulleted);
  };

  // Photo uploads
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const sizeFormatted =
          file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(1)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        setPhotos((prev) => [
          ...prev,
          {
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            size: sizeFormatted,
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Document uploads
  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    Array.from(files).forEach((file) => {
      const sizeFormatted =
        file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'file';

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setDocuments((prev) => [
          ...prev,
          {
            id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            size: sizeFormatted,
            extension: ext,
            contentSnippet: text.slice(0, 300),
            fullText: text,
          },
        ]);
      };

      // Read as text if code/text/csv/json/markdown
      if (
        file.type.includes('text') ||
        file.type.includes('json') ||
        ['txt', 'md', 'js', 'ts', 'tsx', 'jsx', 'py', 'html', 'css', 'json', 'csv', 'svg'].includes(ext)
      ) {
        reader.readAsText(file);
      } else {
        // Fallback for binary / pdf
        setDocuments((prev) => [
          ...prev,
          {
            id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            size: sizeFormatted,
            extension: ext,
            contentSnippet: `[বাইনারি/পিডিএফ ডকুমেন্ট: ${file.name} (${sizeFormatted})]`,
            fullText: `[ডকুমেন্ট নাম: ${file.name}, টাইপ: ${file.type || ext}, সাইজ: ${sizeFormatted}]`,
          },
        ]);
      }
    });
    e.target.value = '';
  };

  // Send Actions
  const handleSendLink = (autoSend: boolean) => {
    if (!linkUrl.trim()) return;
    const detected = detectPlatformFromUrl(linkUrl);
    const item: InboundSharedContent = {
      type: 'link',
      url: linkUrl.trim(),
      title: linkTitle.trim() || undefined,
      text: linkDescription.trim() || undefined,
      platform: detected.platform,
    };
    const prompt = formatInboundSharedPrompt(item, userInstruction);
    onInsertToChat(prompt, autoSend);
    onClose();
  };

  const handleSendPhotos = (autoSend: boolean, promptPreset?: string) => {
    if (!photos.length) return;
    const names = photos.map((p) => p.name).join(', ');
    const totalSize = photos.map((p) => p.size).join(', ');
    const item: InboundSharedContent = {
      type: 'photo',
      fileName: names,
      fileSize: totalSize,
      title: promptPreset || userInstruction || 'ছবি বিশ্লেষণ ও বিস্তারিত সারাংশ',
    };
    const prompt = formatInboundSharedPrompt(
      item,
      promptPreset || userInstruction || 'এই ছবির বিস্তারিত বিষয়বস্তু বাংলায় বিশ্লেষণ করো।'
    );
    onInsertToChat(prompt, autoSend);
    onClose();
  };

  const handleSendDocs = (autoSend: boolean) => {
    if (!documents.length) return;
    const combinedContent = documents
      .map(
        (d) =>
          `### [ফাইল: ${d.name} (${d.size})]\n\`\`\`${d.extension}\n${(d.fullText || d.contentSnippet).slice(0, 12000)}\n\`\`\``
      )
      .join('\n\n---\n\n');

    const item: InboundSharedContent = {
      type: 'file',
      fileName: documents.map((d) => d.name).join(', '),
      fileSize: documents.map((d) => d.size).join(', '),
      rawContent: combinedContent,
    };
    const prompt = formatInboundSharedPrompt(item, userInstruction);
    onInsertToChat(prompt, autoSend);
    onClose();
  };

  const handleSendText = (autoSend: boolean, promptPreset?: string) => {
    if (!textSnippet.trim()) return;
    const item: InboundSharedContent = {
      type: 'text',
      title: textTitle.trim() || undefined,
      text: textSnippet.trim(),
    };
    const prompt = formatInboundSharedPrompt(item, promptPreset || userInstruction);
    onInsertToChat(prompt, autoSend);
    onClose();
  };

  // Simulators for testing
  const handleSimulateShare = (type: 'whatsapp' | 'facebook' | 'youtube' | 'photo') => {
    if (type === 'whatsapp') {
      setActiveTab('text');
      setTextTitle('WhatsApp থেকে শেয়ার করা বার্তা');
      setTextSnippet(
        `[18/10/2026, 8:00 PM] Sheikh Farid: ভাই, আমাদের নতুন AI Assistant & Coding Studio এর প্রজেক্ট কোড এবং ডিপ্লয়মেন্ট প্রসেসটা একটু দেখে দিন। বিশেষভাবে PWA Web Share Target ও মোবাইল ভিউ যেন একদম নিখুঁত কাজ করে।`
      );
    } else if (type === 'youtube') {
      setActiveTab('link');
      setLinkUrl('https://www.youtube.com/watch?v=kJQP7kiw5Fk');
      setLinkTitle('Luis Fonsi - Despacito ft. Daddy Yankee (Official Music Video)');
      setLinkDescription('বিশ্ববিখ্যাত পপ মিউজিক ভিডিও — ইউটিউব থেকে শেয়ারকৃত।');
    } else if (type === 'facebook') {
      setActiveTab('link');
      setLinkUrl('https://www.facebook.com/rubelrubel.rubel.98');
      setLinkTitle('শেখ ফরিদ (Sheikh Farid) - অফিশিয়াল ফেসবুক প্রোফাইল ও পোস্ট');
      setLinkDescription('সিরাজগঞ্জ, বাংলাদেশ থেকে সফটওয়্যার ডেভেলপমেন্ট ও প্রযুক্তি আপডেট।');
    } else if (type === 'photo') {
      setActiveTab('photo');
      setPhotos([
        {
          id: 'sample-p1',
          name: 'স্মার্টফোন_স্ক্রিনশট_কোড.png',
          size: '840 KB',
          dataUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
        },
      ]);
    }
  };

  // Cross device inbound URL
  const remoteShareUrl = buildRemoteShareUrl({
    title: linkTitle || 'শেয়ার করা তথ্য',
    text: textSnippet || linkDescription,
    url: linkUrl || undefined,
  });

  const handleCopyRemoteLink = async () => {
    const success = await copyToClipboard(remoteShareUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-blue-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  বহিরাগত প্ল্যাটফর্ম শেয়ার হাব
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Universal Share Target
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                ফেসবুক, ইউটিউব, হোয়াটসঅ্যাপ, গ্যালারি বা যেকোনো অ্যাপ থেকে ফাইল, ছবি ও লিংক আনুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-stone-50 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-800 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'link'
                ? 'bg-white dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-stone-200 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>লিংক ও সোশ্যাল মিডিয়া</span>
          </button>

          <button
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-white dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-stone-200 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>ছবি ও ফটো {photos.length > 0 && `(${photos.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-white dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-stone-200 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>ফাইল ও ডকুমেন্টস {documents.length > 0 && `(${documents.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-stone-200 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>লেখালেখি ও নোট</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-stone-200 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>ক্রস-ডিভাইস ও PWA গাইড</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: LINKS & SOCIAL MEDIA */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>শেয়ার করা লিংক বা সোশ্যাল মিডিয়া URL:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboardToLink}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>ক্লিপবোর্ড থেকে পেস্ট করুন</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://facebook.com/..., https://youtube.com/..., https://github.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                  />
                  {linkUrl && (
                    <button
                      type="button"
                      onClick={() => setLinkUrl('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Detected Platform Card */}
              {linkUrl && (
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                        {detectPlatformFromUrl(linkUrl).name}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-[240px]">
                        {linkUrl}
                      </span>
                    </div>
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
                      title="নতুন ট্যাবে খুলুন"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Optional Title/Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="শিরোনাম বা পোস্টের নাম (ঐচ্ছিক)"
                      className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100"
                    />
                    <input
                      type="text"
                      value={linkDescription}
                      onChange={(e) => setLinkDescription(e.target.value)}
                      placeholder="সংক্ষিপ্ত মন্তব্য বা বিষয়বস্তু (ঐচ্ছিক)"
                      className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100"
                    />
                  </div>
                </div>
              )}

              {/* Quick Sample Links */}
              <div>
                <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-2">
                  ⚡ দ্রুত পরীক্ষার জন্য ডেমো প্ল্যাটফর্ম লিংক ট্রাই করুন:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSimulateShare('youtube')}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Youtube className="w-3.5 h-3.5 text-red-600" />
                    <span>ইউটিউব ভিডিও</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateShare('facebook')}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Facebook className="w-3.5 h-3.5 text-blue-600" />
                    <span>ফেসবুক পোস্ট</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkUrl('https://github.com/rsk934128-dot/AI-Assistant-Coding-Studio');
                      setLinkTitle('শেখ ফরিদ - AI-Assistant-Coding-Studio');
                      setLinkDescription('ফুল-স্ট্যাক এআই সহকারী ও কোডিং স্টুডিও গিটহাব রিপোজিটরি');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub রিপোজিটরি</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  disabled={!linkUrl.trim()}
                  onClick={() => handleSendLink(false)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  চ্যাট ইনপুটে রাখুন
                </button>
                <button
                  type="button"
                  disabled={!linkUrl.trim()}
                  onClick={() => handleSendLink(true)}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>সরাসরি এআই বিশ্লেষণ শুরু করুন</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PHOTOS & GALLERY */}
          {activeTab === 'photo' && (
            <div className="space-y-4">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />

              {/* Photo Upload Dropzone */}
              <div
                onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center bg-stone-50/50 dark:bg-stone-800/40 cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  ছবি বা ফটো সিলেক্ট করুন / এখানে টেনে এনে ছাড়ুন
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  মোবাইল গ্যালারি, ক্যামেরা, হোয়াটসঅ্যাপ বা ডাউনলোড ফোল্ডার থেকে যেকোনো ছবি (PNG, JPG, WEBP)
                </p>
                <button
                  type="button"
                  className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  ফটো ব্রাউজ করুন
                </button>
              </div>

              {/* Photo Preview Grid */}
              {photos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                    <span className="font-semibold">সংযুক্ত ছবি ({photos.length} টি):</span>
                    <button
                      type="button"
                      onClick={() => setPhotos([])}
                      className="text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>সকল ছবি মুছুন</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        className="relative group rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden bg-stone-100 dark:bg-stone-800"
                      >
                        <img
                          src={p.dataUrl}
                          alt={p.name}
                          className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => prev.filter((x) => x.id !== p.id))}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="p-1.5 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs text-[10px] truncate">
                          <p className="font-medium text-stone-800 dark:text-stone-200 truncate">{p.name}</p>
                          <p className="text-stone-500">{p.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preset Analysis Prompts */}
              {photos.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    💡 এক-ক্লিকে এআই বিশ্লেষণ প্রম্পট নির্বাচন করুন:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendPhotos(true, 'এই ছবির বিষয়বস্তু, মানুষ ও দৃশ্যপট বিস্তারিত বাংলায় বিশ্লেষণ করো।')}
                      className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-emerald-500 bg-stone-50 dark:bg-stone-800/60 text-left text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <span>🔍 সাধারণ দৃশ্যপট ও অবজেক্ট বিশ্লেষণ</span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendPhotos(true, 'এই ছবি থেকে সকল লেখা (OCR) হুবহু উদ্ধার করো এবং প্রয়োজনীয় অংশ অনুবাদ করো।')}
                      className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-emerald-500 bg-stone-50 dark:bg-stone-800/60 text-left text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <span>📝 ছবিতে থাকা লেখা (OCR) এক্সট্র্যাক্ট</span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendPhotos(true, 'এই স্ক্রিনশটের কোড, ত্রুটি বা বাগ বিশ্লেষণ করে সমাধান কোড লিখে দাও।')}
                      className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-emerald-500 bg-stone-50 dark:bg-stone-800/60 text-left text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <span>💻 কোড / এরর স্ক্রিনশট সমাধান</span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendPhotos(true, 'এই নকশা বা ডিজাইনের ইউজার এক্সপেরিয়েন্স পর্যালোচনা করে উন্নতির পরামর্শ দাও।')}
                      className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-emerald-500 bg-stone-50 dark:bg-stone-800/60 text-left text-xs font-medium text-stone-800 dark:text-stone-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <span>🎨 UI/UX ও ডিজাইন পর্যালোচনা</span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              {/* Sample Photo Button */}
              {photos.length === 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-500">টেস্ট করতে চান?</span>
                  <button
                    type="button"
                    onClick={() => handleSimulateShare('photo')}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    একটি নমুনা স্ক্রিনশট ছবি যুক্ত করুন
                  </button>
                </div>
              )}

              {/* Action */}
              <div className="pt-2 flex justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  disabled={!photos.length}
                  onClick={() => handleSendPhotos(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ইনপুটে রাখুন
                </button>
                <button
                  type="button"
                  disabled={!photos.length}
                  onClick={() => handleSendPhotos(true)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ছবিসহ চ্যাটে পাঠান</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FILES & DOCUMENTS */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <input
                ref={docInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.js,.ts,.tsx,.jsx,.py,.html,.css,.json,.csv,.doc,.docx"
                className="hidden"
                onChange={handleDocSelect}
              />

              <div
                onClick={() => docInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center bg-stone-50/50 dark:bg-stone-800/40 cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FileCode className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  ডকুমেন্ট বা কোড ফাইল সিলেক্ট করুন
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  PDF, Text, Markdown, JavaScript, Python, TypeScript, HTML, CSS, JSON, CSV
                </p>
                <button
                  type="button"
                  className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  ফাইল সিলেক্ট করুন
                </button>
              </div>

              {/* Uploaded Documents List */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                    <span className="font-semibold">সংযুক্ত ফাইল ({documents.length} টি):</span>
                    <button
                      type="button"
                      onClick={() => setDocuments([])}
                      className="text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>সব ফাইল মুছুন</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/70 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              {doc.name}
                            </p>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400">
                              {doc.size} • .{doc.extension}
                            </p>
                            {doc.contentSnippet && (
                              <p className="text-[11px] font-mono text-stone-600 dark:text-stone-300 mt-1 line-clamp-2 bg-white dark:bg-stone-900 p-1.5 rounded border border-stone-200 dark:border-stone-800">
                                {doc.contentSnippet}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
                          className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-200 dark:hover:bg-stone-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="pt-2 flex justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  disabled={!documents.length}
                  onClick={() => handleSendDocs(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ইনপুটে রাখুন
                </button>
                <button
                  type="button"
                  disabled={!documents.length}
                  onClick={() => handleSendDocs(true)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ফাইলসহ চ্যাটে পাঠান</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: TEXT & NOTES */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>অন্যান্য প্ল্যাটফর্ম থেকে কপি করা টেক্সট বা বার্তা:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboardToText}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>পেস্ট করুন</span>
                  </button>
                </div>
                <textarea
                  value={textSnippet}
                  onChange={(e) => setTextSnippet(e.target.value)}
                  placeholder="হোয়াটসঅ্যাপ চ্যাট, ফেসবুক পোস্টের লেখা, মিটিং নোট বা যেকোনো কপি করা প্যারাগ্রাফ এখানে পেস্ট করুন..."
                  rows={6}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 resize-y"
                />
              </div>

              {/* Quick Text Transformation Tools */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  🛠️ লেখার দ্রুত ফরমেটিং ও ক্লিন টুলস:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={handleCleanWhatsAppText}
                    disabled={!textSnippet}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 disabled:opacity-50 cursor-pointer"
                  >
                    WhatsApp টাইমস্ট্যাম্প ক্লিন করুন
                  </button>
                  <button
                    type="button"
                    onClick={handleFormatBulletPoints}
                    disabled={!textSnippet}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 disabled:opacity-50 cursor-pointer"
                  >
                    বুলেট পয়েন্টে সাজান
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateShare('whatsapp')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 cursor-pointer"
                  >
                    নমুনা WhatsApp চ্যাট লোড করুন
                  </button>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  disabled={!textSnippet.trim()}
                  onClick={() => handleSendText(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ইনপুটে রাখুন
                </button>
                <button
                  type="button"
                  disabled={!textSnippet.trim()}
                  onClick={() => handleSendText(true)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>সরাসরি এআই বিশ্লেষণ</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: CROSS-DEVICE & PWA GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-stone-700 dark:text-stone-300">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300/80 dark:border-emerald-800/80 space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    যেকোনো প্ল্যাটফর্ম ও মোবাইল অ্যাপ থেকে সরাসরি শেয়ার করার নিয়ম:
                  </h4>
                </div>
                <p className="text-stone-600 dark:text-stone-400">
                  আমাদের অ্যাপে <strong>Web Share Target API</strong> যুক্ত রয়েছে। ফলে অ্যাপটি ডিভাইসে ইনস্টল থাকলে অ্যান্ড্রয়েড বা কম্পিউটারের সিস্টেম শেয়ার মেনুতে সরাসরি আমাদের অ্যাপ দেখা যাবে!
                </p>
              </div>

              {/* 3 Step Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    ১
                  </span>
                  <h5 className="font-bold text-stone-900 dark:text-stone-100">অ্যাপটি ইনস্টল করুন</h5>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    ব্রাউজারের অ্যাড্রেসবার বা মেনু থেকে "Install App" বা "Add to Home Screen" দিন।
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    ২
                  </span>
                  <h5 className="font-bold text-stone-900 dark:text-stone-100">অন্য অ্যাপে 'Share' চাপুন</h5>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    গ্যালারি, হোয়াটসঅ্যাপ, ফেসবুক বা ক্রোম ব্রাউজারে যেকোনো ছবি, ভিডিও বা লেখায় Share চাপুন।
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    ৩
                  </span>
                  <h5 className="font-bold text-stone-900 dark:text-stone-100">AI Assistant সিলেক্ট করুন</h5>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    শেয়ার শিটে "AI Assistant" বেছে নিলেই সরাসরি তথ্যগুলো এই শেয়ার হাবে চলে আসবে!
                  </p>
                </div>
              </div>

              {/* Remote Direct Inbound Link */}
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>অন্য ডিভাইস থেকে এই অ্যাপে রিমোট শেয়ার লিংক:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyRemoteLink}
                    className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={remoteShareUrl}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono text-[11px] text-stone-600 dark:text-stone-300"
                />
                <p className="text-[10px] text-stone-500">
                  অন্য মোবাইল বা কম্পিউটার থেকে এই লিংকে ক্লিক করলে তাৎক্ষণিক এই সেশনে তথ্য শেয়ার করা যাবে।
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>সকল প্ল্যাটফর্ম থেকে ছবি, ফাইল, লিংক ও টেক্সট গ্রহণ করতে প্রস্তুত</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
