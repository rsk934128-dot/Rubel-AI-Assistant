import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ChatSession, ChatMessage } from '../types';

/**
 * Sanitizes a title string for use in filenames
 */
export function sanitizeFilename(title: string, fallback = 'chat_session'): string {
  const clean = title
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 40);
  return clean || fallback;
}

/**
 * Exports chat session as a structured JSON file
 */
export function exportChatAsJSON(session: ChatSession): void {
  if (!session) return;

  const exportData = {
    exportedAt: new Date().toISOString(),
    exporter: 'AI Assistant & Coding Studio',
    version: '1.0',
    session: {
      id: session.id,
      title: session.title,
      mode: session.mode,
      enableSearch: session.enableSearch,
      createdAt: session.createdAt,
      createdAtFormatted: new Date(session.createdAt).toLocaleString('bn-BD', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }),
      totalMessages: session.messages.length,
      messages: session.messages.map((m: ChatMessage) => ({
        id: m.id,
        role: m.role,
        roleNameBn: m.role === 'user' ? 'ব্যবহারকারী (User)' : 'এআই অ্যাসিস্ট্যান্ট (AI Assistant)',
        text: m.text,
        timestamp: m.timestamp,
        timeFormatted: new Date(m.timestamp).toLocaleTimeString('bn-BD'),
        mode: m.mode || session.mode,
        groundingChunks: m.groundingChunks || [],
        searchQueries: m.searchQueries || [],
        error: m.error || undefined,
      })),
    },
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${sanitizeFilename(session.title)}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports chat session as a formatted Markdown file
 */
export function exportChatAsMarkdown(session: ChatSession): void {
  if (!session) return;

  let content = `# ${session.title}\n\n`;
  content += `> **তারিখ ও সময়:** ${new Date(session.createdAt).toLocaleString()}\n`;
  content += `> **মোড:** ${session.mode}\n`;
  content += `> **মোট বার্তা:** ${session.messages.length}\n`;
  content += `> **উৎস:** AI Assistant & Coding Studio\n\n`;
  content += `---\n\n`;

  session.messages.forEach((msg, idx) => {
    const isUser = msg.role === 'user';
    const sender = isUser ? '👤 ব্যবহারকারী (User)' : '🤖 এআই সহকারী (AI Assistant)';
    const timeStr = new Date(msg.timestamp).toLocaleTimeString();
    
    content += `### ${idx + 1}. ${sender} — *${timeStr}*\n\n`;
    content += `${msg.text}\n\n`;

    if (msg.groundingChunks && msg.groundingChunks.length > 0) {
      content += `#### 🔍 তথ্যসূত্র (Grounding Sources):\n`;
      msg.groundingChunks.forEach((c) => {
        if (c.web) {
          content += `- [${c.web.title || c.web.uri}](${c.web.uri})\n`;
        }
      });
      content += '\n';
    }

    if (msg.searchQueries && msg.searchQueries.length > 0) {
      content += `*অনুসন্ধান করা হয়েছে:* ${msg.searchQueries.map((q) => `\`${q}\``).join(', ')}\n\n`;
    }

    content += `---\n\n`;
  });

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${sanitizeFilename(session.title)}_${dateStr}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formats message text into clean HTML for PDF rendering, handling code blocks & formatting
 */
function formatMessageToHTML(rawText: string): string {
  if (!rawText) return '<p style="color: #64748b; font-style: italic;">(খালি বার্তা)</p>';

  // Escape basic HTML tags to prevent XSS
  const escapeHTML = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  // Split by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let html = '';
  let match;

  while ((match = codeBlockRegex.exec(rawText)) !== null) {
    // text before code block
    const textBefore = rawText.substring(lastIndex, match.index);
    if (textBefore) {
      html += formatParagraphs(textBefore);
    }

    const lang = match[1] || 'code';
    const codeContent = escapeHTML(match[2].trim());

    html += `
      <div style="margin: 12px 0; background: #0f172a; border-radius: 8px; overflow: hidden; border: 1px solid #334155; font-family: 'Fira Code', monospace;">
        <div style="background: #1e293b; padding: 6px 14px; font-size: 11px; font-weight: 600; color: #94a3b8; border-bottom: 1px solid #334155; text-transform: uppercase;">
          ${lang}
        </div>
        <pre style="margin: 0; padding: 12px 14px; font-size: 12px; line-height: 1.5; color: #e2e8f0; white-space: pre-wrap; word-break: break-word; overflow-x: auto;"><code>${codeContent}</code></pre>
      </div>
    `;

    lastIndex = codeBlockRegex.lastIndex;
  }

  // remaining text
  const textAfter = rawText.substring(lastIndex);
  if (textAfter) {
    html += formatParagraphs(textAfter);
  }

  return html;
}

function formatParagraphs(text: string): string {
  const paragraphs = text.split(/\n\n+/);
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      // convert single newlines to <br/>
      // convert bold **text** to <strong>
      let parsed = trimmed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background: #e2e8f0; color: #0f172a; padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 12px;">$1</code>')
        .replace(/\n/g, '<br/>');

      return `<p style="margin: 6px 0; line-height: 1.6; font-size: 13.5px; color: #1e293b;">${parsed}</p>`;
    })
    .join('');
}

/**
 * Exports chat session as a high-fidelity, styled PDF document
 */
export async function exportChatAsPDF(
  session: ChatSession,
  onProgress?: (msg: string) => void
): Promise<void> {
  if (!session || session.messages.length === 0) {
    throw new Error('এক্সপোর্ট করার মতো কোনো বার্তা পাওয়া যায়নি।');
  }

  onProgress?.('ডকুমেন্ট লেআউট প্রস্তুত হচ্ছে...');

  // Create temporary off-screen container with fixed width (standard desktop/A4 ratio: 800px)
  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Hind Siliguri', 'Plus Jakarta Sans', system-ui, sans-serif";
  container.style.padding = '40px 48px';
  container.style.boxSizing = 'border-box';

  const modeLabels: Record<string, string> = {
    general: 'সাধারণ মোড (General)',
    coding: 'কোডিং ও সফটওয়্যার (Coding)',
    writing: 'লেখালেখি ও অনুবাদ (Writing)',
    research: 'গবেষণা ও ফ্যাক্ট-চেক (Research)',
    learning: 'পড়াশোনা ও কনসেপ্ট (Learning)',
  };

  const modeLabel = modeLabels[session.mode] || 'সাধারণ মোড';
  const formattedDate = new Date(session.createdAt).toLocaleDateString('bn-BD', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = new Date(session.createdAt).toLocaleTimeString('bn-BD');

  // Build the complete document HTML
  let documentHTML = `
    <div style="border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <div style="width: 28px; height: 28px; background: #059669; color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px;">
              AI
            </div>
            <span style="font-size: 14px; font-weight: 700; color: #047857; letter-spacing: 0.5px;">
              AI Assistant & Coding Studio
            </span>
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;">
            ${session.title}
          </h1>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 4px 12px; font-size: 11px; font-weight: 600;">
            ${modeLabel}
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 18px; font-size: 11px; color: #64748b; font-weight: 500;">
        <span>📅 ${formattedDate}, ${formattedTime}</span>
        <span>💬 মোট বার্তা: ${session.messages.length}টি</span>
        <span>⚡ ইঞ্জিন: Google Gemini 3.8 Flash</span>
      </div>
    </div>

    <!-- Messages Container -->
    <div style="display: flex; flex-direction: column; gap: 20px;">
  `;

  session.messages.forEach((msg, index) => {
    const isUser = msg.role === 'user';
    const timeStr = new Date(msg.timestamp).toLocaleTimeString('bn-BD');

    documentHTML += `
      <div style="border-radius: 12px; border: 1px solid ${isUser ? '#cbd5e1' : '#e2e8f0'}; background: ${
      isUser ? '#f8fafc' : '#ffffff'
    }; padding: 16px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
        <!-- Sender Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px dashed ${
          isUser ? '#cbd5e1' : '#e2e8f0'
        }; padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 22px; height: 22px; border-radius: 50%; background: ${
              isUser ? '#0284c7' : '#059669'
            }; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold;">
              ${isUser ? 'U' : 'AI'}
            </div>
            <span style="font-size: 13px; font-weight: 700; color: ${isUser ? '#0369a1' : '#047857'};">
              ${isUser ? 'ব্যবহারকারী (User)' : 'এআই অ্যাসিস্ট্যান্ট (AI Assistant)'}
            </span>
            <span style="font-size: 10px; color: #94a3b8; font-weight: 500;">
              #${index + 1}
            </span>
          </div>
          <span style="font-size: 11px; color: #64748b; font-weight: 500;">
            ${timeStr}
          </span>
        </div>

        <!-- Message Body -->
        <div style="word-break: break-word;">
          ${formatMessageToHTML(msg.text)}
        </div>

        ${
          msg.groundingChunks && msg.groundingChunks.length > 0
            ? `
          <div style="margin-top: 14px; padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 11.5px;">
            <div style="font-weight: 700; color: #15803d; margin-bottom: 6px;">🌐 তথ্যসূত্র (Google Grounding Sources):</div>
            <ul style="margin: 0; padding-left: 18px; color: #166534;">
              ${msg.groundingChunks
                .map((c) =>
                  c.web
                    ? `<li style="margin: 3px 0;"><a href="${c.web.uri}" style="color: #15803d; text-decoration: underline;">${
                        c.web.title || c.web.uri
                      }</a></li>`
                    : ''
                )
                .join('')}
            </ul>
          </div>
        `
            : ''
        }
      </div>
    `;
  });

  documentHTML += `
    </div>

    <!-- Footer Stamp -->
    <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
      <span>AI Assistant & Coding Studio • https://ai.studio/build</span>
      <span>Exported on ${new Date().toLocaleDateString('bn-BD')}</span>
    </div>
  `;

  container.innerHTML = documentHTML;
  document.body.appendChild(container);

  try {
    onProgress?.('উচ্চ রেজোলিউশন ক্যানভাস রেন্ডার হচ্ছে...');
    // Give browser brief tick to layout and ensure fonts are ready
    await new Promise((res) => setTimeout(res, 200));

    const canvas = await html2canvas(container, {
      scale: 2, // Retina quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });

    onProgress?.('পিডিএফ পৃষ্ঠা তৈরি হচ্ছে...');

    // A4 specs
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const marginMm = 10;
    const usableWidthMm = pageWidthMm - 2 * marginMm; // 190mm
    const usableHeightMm = pageHeightMm - 2 * marginMm; // 277mm

    const pxPerMm = canvas.width / usableWidthMm;
    const pageHeightPx = usableHeightMm * pxPerMm;

    let remainingHeightPx = canvas.height;
    let sourceY = 0;
    let pageNum = 0;

    while (remainingHeightPx > 0) {
      const currentChunkHeightPx = Math.min(remainingHeightPx, pageHeightPx);
      const currentChunkHeightMm = currentChunkHeightPx / pxPerMm;

      // Create temporary canvas for this specific page slice
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = currentChunkHeightPx;
      const pageCtx = pageCanvas.getContext('2d');

      if (pageCtx) {
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          currentChunkHeightPx,
          0,
          0,
          canvas.width,
          currentChunkHeightPx
        );

        if (pageNum > 0) {
          pdf.addPage();
        }

        const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', marginMm, marginMm, usableWidthMm, currentChunkHeightMm);
      }

      sourceY += currentChunkHeightPx;
      remainingHeightPx -= currentChunkHeightPx;
      pageNum++;
    }

    onProgress?.('পিডিএফ ফাইল সেভ হচ্ছে...');
    const dateStr = new Date().toISOString().slice(0, 10);
    pdf.save(`${sanitizeFilename(session.title)}_${dateStr}.pdf`);
  } finally {
    // Cleanup DOM
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
