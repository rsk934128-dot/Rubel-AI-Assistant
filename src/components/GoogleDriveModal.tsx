import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Folder, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  FileCode, 
  File, 
  Image, 
  Film, 
  Music, 
  Search, 
  Upload, 
  FolderPlus, 
  Trash2, 
  ExternalLink, 
  Download, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  ArrowLeft, 
  FileUp, 
  HardDrive, 
  Sparkles,
  MessageSquarePlus,
  Eye,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  DriveFile, 
  DriveQuota,
  listDriveFiles, 
  getFileTextContent, 
  uploadLocalFileToDrive, 
  createDriveTextFile, 
  createDriveFolder, 
  deleteDriveFile, 
  getDriveAbout, 
  formatFileSize,
  getFileCategory
} from '../lib/googleDrive';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToChat?: (content: string, fileName: string) => void;
  activeSessionContent?: string;
  activeSessionTitle?: string;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  onImportToChat,
  activeSessionContent,
  activeSessionTitle,
}) => {
  const { user, accessToken, requestDriveToken } = useAuth();

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Folder navigation state
  const [currentFolder, setCurrentFolder] = useState<{ id?: string; name: string } | null>(null);
  const [folderHistory, setFolderHistory] = useState<{ id?: string; name: string }[]>([]);

  // Quota & Profile
  const [quota, setQuota] = useState<DriveQuota | null>(null);

  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // New Folder Creation
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Save Chat / Code to Drive
  const [isSavingChat, setIsSavingChat] = useState(false);
  const [saveChatSuccess, setSaveChatSuccess] = useState(false);

  // File Preview
  const [previewFile, setPreviewFile] = useState<{ file: DriveFile; text: string } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // MANDATORY per SKILL.md: Destructive Action Confirmation Dialog
  const [confirmDelete, setConfirmDelete] = useState<{
    file: DriveFile;
    isDeleting: boolean;
  } | null>(null);

  // Load files whenever modal opens, folder changes, or filter changes
  useEffect(() => {
    if (!isOpen) return;
    if (accessToken) {
      loadFiles();
      loadQuota();
    }
  }, [isOpen, accessToken, currentFolder, categoryFilter]);

  const loadQuota = async () => {
    if (!accessToken) return;
    try {
      const q = await getDriveAbout(accessToken);
      setQuota(q);
    } catch {
      // quota load is optional/non-blocking
    }
  };

  const loadFiles = async (overrideQuery?: string) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listDriveFiles(accessToken, {
        folderId: currentFolder?.id,
        searchQuery: overrideQuery !== undefined ? overrideQuery : searchQuery,
        categoryFilter,
      });
      setFiles(result);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('401') || msg.includes('token') || msg.includes('Unauthorized')) {
        setError('Google Drive এক্সেস টোকেনের মেয়াদ শেষ বা অনুমতি প্রয়োজন। অনুগ্রহ করে আবার সাইন-ইন করুন।');
      } else {
        setError(`ড্রাইভ ফাইল লোড করতে সমস্যা হয়েছে: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnectDrive = async () => {
    try {
      setLoading(true);
      setError(null);
      await requestDriveToken();
    } catch (err: any) {
      setError(err?.message || 'Google Drive সংযোগ ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFolder = (folder: DriveFile) => {
    if (currentFolder) {
      setFolderHistory((prev) => [...prev, currentFolder]);
    } else {
      setFolderHistory([{ name: 'মাই ড্রাইভ' }]);
    }
    setCurrentFolder({ id: folder.id, name: folder.name });
  };

  const handleGoBack = () => {
    if (folderHistory.length > 0) {
      const newHistory = [...folderHistory];
      const prevFolder = newHistory.pop();
      setFolderHistory(newHistory);
      if (prevFolder && prevFolder.name !== 'মাই ড্রাইভ') {
        setCurrentFolder(prevFolder);
      } else {
        setCurrentFolder(null);
      }
    } else {
      setCurrentFolder(null);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    try {
      setIsUploading(true);
      setError(null);
      const uploaded = await uploadLocalFileToDrive(accessToken, file, currentFolder?.id);
      setUploadSuccess(`"${uploaded.name}" সফলভাবে ড্রাইভে আপলোড হয়েছে!`);
      setTimeout(() => setUploadSuccess(null), 4000);
      loadFiles();
    } catch (err: any) {
      setError(`আপলোড ব্যর্থ হয়েছে: ${err?.message || err}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !accessToken) return;

    try {
      setLoading(true);
      await createDriveFolder(accessToken, newFolderName.trim(), currentFolder?.id);
      setNewFolderName('');
      setIsCreatingFolder(false);
      loadFiles();
    } catch (err: any) {
      setError(`ফোল্ডার তৈরি করতে ব্যর্থ হয়েছে: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveActiveChatToDrive = async () => {
    if (!accessToken) return;
    try {
      setIsSavingChat(true);
      setError(null);
      const title = activeSessionTitle ? `${activeSessionTitle}.md` : `AI_Chat_${new Date().toISOString().slice(0, 10)}.md`;
      const content = activeSessionContent || '# AI Assistant Chat Export\n\nকোনো সক্রিয় বার্তা পাওয়া যায়নি।';
      await createDriveTextFile(accessToken, title, content, 'text/markdown', currentFolder?.id);
      setSaveChatSuccess(true);
      setTimeout(() => setSaveChatSuccess(false), 4000);
      loadFiles();
    } catch (err: any) {
      setError(`ড্রাইভে চ্যাট সেভ করতে সমস্যা হয়েছে: ${err?.message || err}`);
    } finally {
      setIsSavingChat(false);
    }
  };

  const handlePreviewFile = async (file: DriveFile) => {
    if (!accessToken) return;
    try {
      setIsPreviewLoading(true);
      const data = await getFileTextContent(accessToken, file);
      setPreviewFile({ file, text: data.text });
    } catch (err: any) {
      setError(`ফাইল প্রিভিউ লোড করা যায়নি: ${err?.message || err}`);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleImportFileToChat = async (file: DriveFile) => {
    if (!accessToken || !onImportToChat) return;
    try {
      setLoading(true);
      const data = await getFileTextContent(accessToken, file);
      onImportToChat(data.text, file.name);
      onClose();
    } catch (err: any) {
      setError(`চ্যাটে ইম্পোর্ট করতে সমস্যা হয়েছে: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Execute deletion ONLY after explicit modal confirmation
  const handleExecuteDelete = async () => {
    if (!confirmDelete || !accessToken) return;
    try {
      setConfirmDelete((prev) => prev ? { ...prev, isDeleting: true } : null);
      await deleteDriveFile(accessToken, confirmDelete.file.id);
      setConfirmDelete(null);
      loadFiles();
    } catch (err: any) {
      setError(`মুছে ফেলা ব্যর্থ হয়েছে: ${err?.message || err}`);
      setConfirmDelete(null);
    }
  };

  const getFileIcon = (file: DriveFile) => {
    const cat = getFileCategory(file.mimeType);
    switch (cat) {
      case 'folder':
        return <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />;
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'sheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'slide':
        return <Presentation className="w-5 h-5 text-orange-500" />;
      case 'pdf':
        return <File className="w-5 h-5 text-red-500" />;
      case 'image':
        return <Image className="w-5 h-5 text-purple-500" />;
      case 'video':
        return <Film className="w-5 h-5 text-rose-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-teal-500" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-indigo-500" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border-0 sm:border border-slate-700/80 rounded-none sm:rounded-2xl w-full max-w-5xl h-full sm:h-[90vh] sm:max-h-[850px] flex flex-col shadow-2xl overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-emerald-600 to-amber-500 flex items-center justify-center p-2 shadow-lg shadow-blue-500/10 shrink-0">
              <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate">Google Drive ইন্টিগ্রেশন</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  ক্লাউড
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                আপনার গুগল ড্রাইভের ফাইল ব্রাউজ করুন ও সরাসরি চ্যাটে ইম্পোর্ট করুন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quota?.usage && (
              <div className="hidden md:flex flex-col items-end mr-3 text-right">
                <span className="text-xs text-slate-400">ব্যবহৃত স্টোরেজ</span>
                <span className="text-xs font-medium text-slate-200">{quota.usage} / {quota.limit || '15 GB'}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer shadow-xs"
              title="চ্যাটে ফিরে যান (Back)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ফিরে যান</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Barrier if No Access Token */}
        {!accessToken ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5 text-blue-400 shadow-xl shadow-blue-500/5">
              <HardDrive className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">গুগল ড্রাইভে সংযোগ স্থাপন করুন</h3>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              Google Drive এর সাথে নিরাপদ সংযোগের মাধ্যমে আপনি ড্রাইভে সংরক্ষিত ডকুমেন্টস, কোড ও ডেটা সরাসরি এআই স্টুডিওতে নিয়ে আসতে পারবেন এবং চ্যাট ও স্ক্রিপ্ট ব্যাকআপ রাখতে পারবেন।
            </p>

            {/* Official Standard Google Sign In Button per SKILL.md */}
            <button
              onClick={handleConnectDrive}
              disabled={loading}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              <span>{loading ? 'সংযোগ হচ্ছে...' : 'Sign in with Google (Connect Drive)'}</span>
            </button>

            {error && (
              <div className="mt-5 p-4 bg-rose-950/70 border border-rose-800 text-rose-200 rounded-xl text-xs max-w-md text-left space-y-2.5 shadow-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="font-semibold text-rose-100">{error}</p>
                </div>
                <div className="text-[11px] text-rose-200/90 bg-rose-900/40 p-3 rounded-lg space-y-1.5 border border-rose-800/40">
                  <p className="font-semibold text-rose-200">💡 সমাধানের উপায় (Troubleshooting):</p>
                  <ul className="list-disc list-inside space-y-1 text-stone-300">
                    <li>ব্রাউজারের অ্যাড্রেসবারে পপ-আপ (Pop-ups) ব্লক করা থাকলে তা অনুমোদন করুন।</li>
                    <li>অ্যাডব্লকার বা ব্রাউজার শিল্ড (Brave Shields/Privacy Badger) সাময়িকভাবে নিষ্ক্রিয় করুন।</li>
                    <li>ইনকগনিটো মোডে থার্ড-পার্টি কুকিজ ব্লক থাকলে সাধারণ ব্রাউজিং ট্যাবে চেষ্টা করুন।</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleConnectDrive}
                    className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>পুনরায় চেষ্টা করুন (Retry)</span>
                  </button>
                  <a
                    href={typeof window !== 'undefined' ? window.location.href : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>নতুন ট্যাবে খুলুন (Open in Tab)</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
              {/* Folder Breadcrumb / Back button */}
              <div className="flex items-center gap-2">
                {currentFolder && (
                  <button
                    onClick={handleGoBack}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs"
                    title="আগের ফোল্ডার"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>পিছনে</span>
                  </button>
                )}
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                  <Folder className="w-4 h-4 text-amber-400" />
                  <span>{currentFolder ? currentFolder.name : 'মাই ড্রাইভ (Root)'}</span>
                </div>
              </div>

              {/* Action Buttons: Upload, New Folder, Save Active Chat */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Save Active Chat to Drive */}
                {activeSessionContent && (
                  <button
                    onClick={handleSaveActiveChatToDrive}
                    disabled={isSavingChat}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
                    title="বর্তমান চ্যাট ড্রাইভে সেভ করুন"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{isSavingChat ? 'সেভ হচ্ছে...' : 'চ্যাট ড্রাইভে সেভ'}</span>
                  </button>
                )}

                {/* Upload File */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'আপলোড হচ্ছে...' : 'ফাইল আপলোড'}</span>
                </button>

                {/* New Folder Toggle */}
                <button
                  onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>নতুন ফোল্ডার</span>
                </button>

                {/* Refresh */}
                <button
                  onClick={() => loadFiles()}
                  disabled={loading}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
                  title="রিফ্রেশ"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* New Folder Form if open */}
            {isCreatingFolder && (
              <form onSubmit={handleCreateFolder} className="px-5 py-2.5 bg-slate-800/80 border-b border-slate-700 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  placeholder="ফোল্ডারের নাম লিখুন..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newFolderName.trim() || loading}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  তৈরি করুন
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Success Banners */}
            {uploadSuccess && (
              <div className="px-5 py-2 bg-emerald-950/70 border-b border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{uploadSuccess}</span>
              </div>
            )}
            {saveChatSuccess && (
              <div className="px-5 py-2 bg-blue-950/70 border-b border-blue-800/60 text-blue-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-400" />
                <span>চ্যাটটি সফলভাবে গুগল ড্রাইভে সংরক্ষণ করা হয়েছে!</span>
              </div>
            )}

            {/* Search and Filters */}
            <div className="px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ড্রাইভে ফাইল খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadFiles()}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); loadFiles(''); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
                {[
                  { id: 'all', label: 'সব' },
                  { id: 'folders', label: 'ফোল্ডার' },
                  { id: 'docs', label: 'ডকুমেন্টস' },
                  { id: 'sheets', label: 'স্প্রেডশিট' },
                  { id: 'slides', label: 'স্লাইড' },
                  { id: 'pdfs', label: 'পিডিএফ' },
                  { id: 'images', label: 'ছবি' },
                  { id: 'media', label: 'মিডিয়া' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                      categoryFilter === cat.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="m-4 p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Main File List Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                  <p className="text-sm font-medium">Google Drive থেকে ফাইল তালিকা লোড হচ্ছে...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center">
                  <Folder className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-base font-semibold text-slate-300">কোনো ফাইল পাওয়া যায়নি</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    এই ফোল্ডারে কোনো ফাইল নেই অথবা আপনার সার্চ কোয়েরির সাথে কোনো ফাইল মেলেনি।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 rounded-xl p-3.5 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Title and Icon */}
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 shrink-0 mt-0.5">
                            {getFileIcon(file)}
                          </div>
                          <div className="flex-1 min-w-0">
                            {file.isFolder ? (
                              <button
                                onClick={() => handleOpenFolder(file)}
                                className="text-left font-medium text-white hover:text-blue-400 text-xs sm:text-sm truncate block w-full transition-colors"
                                title={file.name}
                              >
                                {file.name}
                              </button>
                            ) : (
                              <span
                                className="font-medium text-slate-200 text-xs sm:text-sm truncate block"
                                title={file.name}
                              >
                                {file.name}
                              </span>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                              {file.size && <span>{formatFileSize(file.size)}</span>}
                              {file.modifiedTime && (
                                <span>• {new Date(file.modifiedTime).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* File Card Actions */}
                      <div className="mt-3 pt-2.5 border-t border-slate-700/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          {file.isFolder ? (
                            <button
                              onClick={() => handleOpenFolder(file)}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-medium transition-colors"
                            >
                              খুলুন
                            </button>
                          ) : (
                            <>
                              {/* Import to Chat */}
                              {onImportToChat && (
                                <button
                                  onClick={() => handleImportFileToChat(file)}
                                  className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                                  title="চ্যাটে ইম্পোর্ট করে আলোচনা করুন"
                                >
                                  <MessageSquarePlus className="w-3.5 h-3.5" />
                                  <span>চ্যাটে নিন</span>
                                </button>
                              )}

                              {/* Preview */}
                              <button
                                onClick={() => handlePreviewFile(file)}
                                className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                                title="প্রিভিউ দেখুন"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Open in Google Drive */}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                              title="Google Drive এ খুলুন"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {/* Delete Button (Triggers MANDATORY confirmation dialog) */}
                        <button
                          onClick={() => setConfirmDelete({ file, isDeleting: false })}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                          title="ড্রাইভ থেকে মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Text Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-sm text-white truncate max-w-md">{previewFile.file.name}</span>
                </div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {previewFile.text || '(ফাইলে কোনো টেক্সট তথ্য পাওয়া যায়নি)'}
              </div>
              <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
                <span className="text-xs text-slate-400">{formatFileSize(previewFile.file.size)}</span>
                <div className="flex items-center gap-2">
                  {onImportToChat && (
                    <button
                      onClick={() => {
                        onImportToChat(previewFile.text, previewFile.file.name);
                        setPreviewFile(null);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-colors"
                    >
                      চ্যাটে পাঠান
                    </button>
                  )}
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MANDATORY Confirmation Dialog for Destructive Operations per SKILL.md */}
        {confirmDelete && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-red-500/50 rounded-2xl w-full max-w-md p-5 shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white text-center mb-2">
                গুগল ড্রাইভ থেকে ফাইল মুছবেন?
              </h3>
              <p className="text-xs text-slate-300 text-center mb-5 leading-relaxed">
                আপনি কি নিশ্চিত যে <span className="font-semibold text-white">"{confirmDelete.file.name}"</span> ফাইলটি গুগল ড্রাইভ থেকে স্থায়ীভাবে মুছে ফেলতে চান? এই কাজটি ফিরিয়ে আনা যাবে না।
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  disabled={confirmDelete.isDeleting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={confirmDelete.isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-600/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{confirmDelete.isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
