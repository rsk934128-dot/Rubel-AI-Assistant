import React, { useEffect, useState } from 'react';
import { UploadCloud, Image, FileText, Globe, Sparkles } from 'lucide-react';
import { InboundSharedContent, detectPlatformFromUrl } from '../utils/shareUtils';

interface GlobalDropZoneProps {
  onDropItem: (item: InboundSharedContent) => void;
}

export const GlobalDropZone: React.FC<GlobalDropZoneProps> = ({ onDropItem }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = React.useRef(0);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer && e.dataTransfer.types.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (!isDragging) setIsDragging(true);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      if (!e.dataTransfer) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        const sizeFormatted =
          file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(1)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            onDropItem({
              type: 'photo',
              fileName: file.name,
              fileSize: sizeFormatted,
              mimeType: file.type,
              fileDataUrl: event.target?.result as string,
            });
          };
          reader.readAsDataURL(file);
          return;
        }

        // Text or code or PDF file
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = (event.target?.result as string) || '';
          onDropItem({
            type: 'file',
            fileName: file.name,
            fileSize: sizeFormatted,
            mimeType: file.type,
            rawContent: content,
          });
        };
        reader.readAsText(file);
        return;
      }

      // Check if dropped item was a URL or text string
      const droppedText = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
      if (droppedText && droppedText.trim()) {
        const clean = droppedText.trim();
        if (clean.startsWith('http://') || clean.startsWith('https://')) {
          const detected = detectPlatformFromUrl(clean);
          onDropItem({
            type: 'link',
            url: clean,
            platform: detected.platform,
            title: `${detected.name} লিংক`,
          });
        } else {
          onDropItem({
            type: 'text',
            text: clean,
            title: 'ড্রপ করা টেক্সট',
          });
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [isDragging, onDropItem]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-6 bg-emerald-950/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/95 dark:bg-stone-900/95 border-2 border-dashed border-emerald-500 shadow-2xl text-center space-y-4 pointer-events-auto transform scale-102 transition-transform">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            এখানে ড্রপ করুন!
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            যেকোনো প্ল্যাটফর্ম থেকে ছবি, ফটো, কোড, ডকুমেন্ট বা লিংক এখানে ছেড়ে দিলে তাৎক্ষণিক শেয়ার হাবে যুক্ত হবে।
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2 text-stone-500 text-xs">
          <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
            <Image className="w-4 h-4" /> ফটো
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
            <FileText className="w-4 h-4" /> ফাইল ও কোড
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
            <Globe className="w-4 h-4" /> লিংক
          </span>
        </div>
      </div>
    </div>
  );
};
