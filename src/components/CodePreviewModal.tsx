import React, { useState } from 'react';
import { X, Play, Code, Copy, Check, ExternalLink, RefreshCw, ArrowLeft } from 'lucide-react';

interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Prepare HTML document for preview if language is html/svg/javascript
  const getRenderableHtml = () => {
    if (language === 'html' || code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('<div')) {
      return code;
    }
    if (language === 'javascript' || language === 'js') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; }
    #console { background: #1e293b; padding: 15px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; font-size: 13px; min-height: 200px; border: 1px solid #334155; }
    .log-line { border-bottom: 1px solid #334155; padding: 4px 0; }
  </style>
</head>
<body>
  <h3>Output Console</h3>
  <div id="console"></div>
  <script>
    const con = document.getElementById('console');
    const oldLog = console.log;
    console.log = function(...args) {
      oldLog.apply(console, args);
      const line = document.createElement('div');
      line.className = 'log-line';
      line.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
      con.appendChild(line);
    };
    window.onerror = function(msg) {
      const line = document.createElement('div');
      line.style.color = '#f87171';
      line.className = 'log-line';
      line.textContent = 'Error: ' + msg;
      con.appendChild(line);
    };
    try {
      ${code}
    } catch(err) {
      console.log('Runtime Error: ' + err.message);
    }
  </script>
</body>
</html>`;
    }
    return `<!DOCTYPE html>
<html>
<head><style>body { font-family: sans-serif; padding: 20px; }</style></head>
<body><pre>${code.replace(/</g, '&lt;')}</pre></body>
</html>`;
  };

  return (
    <div
      id="code-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        id="code-preview-modal-container"
        className="bg-stone-900 border-0 sm:border border-stone-800 rounded-none sm:rounded-2xl max-w-4xl w-full h-full sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-stone-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-stone-800 bg-stone-950/80 shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-[11px] sm:text-xs font-mono font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              {language || 'code'}
            </span>
            <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-lg">
              <button
                id="preview-tab-btn"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'preview'
                    ? 'bg-stone-700 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Live Output
              </button>
              <button
                id="raw-code-tab-btn"
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'code'
                    ? 'bg-stone-700 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Raw Source
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'preview' && (
              <button
                id="refresh-iframe-btn"
                onClick={() => setIframeKey((k) => k + 1)}
                title="Reload Sandbox"
                className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              id="copy-preview-code-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-stone-800 hover:bg-stone-700 rounded-md transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-md transition-colors cursor-pointer"
              title="চ্যাটে ফিরে যান (Back)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ফিরে যান</span>
            </button>
            <button
              id="close-preview-modal-btn"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-stone-950 relative overflow-hidden">
          {activeTab === 'preview' ? (
            <iframe
              key={iframeKey}
              id="code-sandbox-iframe"
              title="Interactive Sandbox Preview"
              srcDoc={getRenderableHtml()}
              sandbox="allow-scripts allow-modals"
              className="w-full h-full border-none bg-white dark:bg-stone-900"
            />
          ) : (
            <pre className="p-4 font-mono text-xs text-stone-300 overflow-auto h-full selection:bg-emerald-800 selection:text-white leading-relaxed">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
