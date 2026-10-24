import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { VisionStudioDashboard } from './VisionStudioDashboard';

interface VisionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string, title?: string) => void;
  onPreviewCode?: (code: string, language: string) => void;
}

export const VisionStudioModal: React.FC<VisionStudioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
  onPreviewCode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-7xl max-h-[96vh] overflow-y-auto rounded-3xl bg-stone-950 border border-stone-800 shadow-2xl">
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-stone-900/90 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700/80 transition-all cursor-pointer shadow-lg hover:rotate-90 active:scale-95"
          title="বন্ধ করুন (Close)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Vision Studio Dashboard */}
        <VisionStudioDashboard
          onClose={onClose}
          onSendToChat={(text, title) => {
            if (onSendToChat) {
              onSendToChat(text, title);
              onClose();
            }
          }}
          onPreviewCode={onPreviewCode}
        />
      </div>
    </div>
  );
};
