// Utility functions for sharing content across various social media and messaging platforms

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

export const getAppShareUrl = (sessionId?: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    const url = new URL(window.location.href);
    if (sessionId) {
      url.searchParams.set('session', sessionId);
    } else {
      url.searchParams.delete('session');
    }
    return url.toString();
  } catch {
    return window.location.href;
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};

export const shareToPlatform = (
  platform: 
    | 'whatsapp'
    | 'facebook'
    | 'messenger'
    | 'twitter'
    | 'linkedin'
    | 'telegram'
    | 'reddit'
    | 'email',
  options: ShareOptions
) => {
  const url = options.url || getAppShareUrl();
  const title = options.title || 'Rubel AI Assistant & Coding Studio';
  const text = options.text || `Rubel AI Assistant & Coding Studio — বাংলা ও ইংরেজি স্মার্ট এআই অ্যাসিস্ট্যান্ট, ট্রেডিং বট ও ইউটিউব মিউজিক প্লেয়ার।`;

  let shareUrl = '';

  switch (platform) {
    case 'whatsapp':
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\n🔗 অ্যাপ লিংক:\n' + url)}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
      break;
    case 'messenger':
      shareUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(url)}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=AIAssistant,CodingStudio,BengaliAI`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      break;
    case 'telegram':
      shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      break;
    case 'reddit':
      shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title + ' - ' + text)}`;
      break;
    case 'email':
      shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\nঅ্যাপটি ব্যবহার করতে নিচের লিংকে ক্লিক করুন:\n' + url)}`;
      break;
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=620,height=560');
  }
};

export const triggerNativeShare = async (options: ShareOptions): Promise<boolean> => {
  const url = options.url || getAppShareUrl();
  const title = options.title || 'Rubel AI Assistant & Coding Studio';
  const text = options.text || `${title} — বাংলা ও ইংরেজি স্মার্ট এআই অ্যাসিস্ট্যান্ট, ট্রেডিং বট ও ইউটিউব মিউজিক প্লেয়ার`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (err) {
      // Sharing was cancelled or failed
      return false;
    }
  }
  return false;
};

export interface InboundSharedContent {
  type: 'link' | 'photo' | 'file' | 'text';
  title?: string;
  text?: string;
  url?: string;
  fileName?: string;
  fileSize?: string;
  mimeType?: string;
  fileDataUrl?: string;
  rawContent?: string;
  platform?: 'youtube' | 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'github' | 'news' | 'whatsapp' | 'general';
}

export const detectPlatformFromUrl = (url: string): {
  platform: 'youtube' | 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'github' | 'news' | 'whatsapp' | 'general';
  name: string;
  color: string;
  iconName: string;
} => {
  if (!url) {
    return { platform: 'general', name: 'Web Link', color: '#3b82f6', iconName: 'Globe' };
  }
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return { platform: 'youtube', name: 'YouTube Video', color: '#ff0000', iconName: 'Youtube' };
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) {
    return { platform: 'facebook', name: 'Facebook', color: '#1877f2', iconName: 'Facebook' };
  }
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return { platform: 'twitter', name: 'X / Twitter', color: '#0f1419', iconName: 'Twitter' };
  }
  if (lower.includes('instagram.com')) {
    return { platform: 'instagram', name: 'Instagram', color: '#e4405f', iconName: 'Instagram' };
  }
  if (lower.includes('linkedin.com')) {
    return { platform: 'linkedin', name: 'LinkedIn', color: '#0a66c2', iconName: 'Linkedin' };
  }
  if (lower.includes('github.com')) {
    return { platform: 'github', name: 'GitHub Repository', color: '#24292e', iconName: 'Github' };
  }
  if (lower.includes('whatsapp.com') || lower.includes('wa.me')) {
    return { platform: 'whatsapp', name: 'WhatsApp', color: '#25d366', iconName: 'MessageSquare' };
  }
  if (lower.includes('prothomalo.com') || lower.includes('bbc.com') || lower.includes('bdnews24.com') || lower.includes('thedailystar.net') || lower.includes('news')) {
    return { platform: 'news', name: 'News & Media', color: '#dc2626', iconName: 'Newspaper' };
  }
  return { platform: 'general', name: 'Web Link', color: '#3b82f6', iconName: 'Globe' };
};

export const parseIncomingShareParams = (searchParams: URLSearchParams): InboundSharedContent | null => {
  const isShareTarget = searchParams.get('share_target') === '1' || searchParams.has('title') || searchParams.has('text') || searchParams.has('url');
  const title = (searchParams.get('title') || searchParams.get('share_title') || '').trim();
  const text = (searchParams.get('text') || searchParams.get('share_text') || '').trim();
  const url = (searchParams.get('url') || searchParams.get('share_url') || '').trim();

  if (!isShareTarget && !title && !text && !url) {
    return null;
  }

  // Detect whether it's primarily a link or text
  if (url || (text.startsWith('http://') || text.startsWith('https://'))) {
    const primaryUrl = url || text;
    const detected = detectPlatformFromUrl(primaryUrl);
    return {
      type: 'link',
      url: primaryUrl,
      title: title || (text !== primaryUrl ? text : undefined),
      text: text !== primaryUrl ? text : '',
      platform: detected.platform,
    };
  }

  return {
    type: 'text',
    title: title || undefined,
    text,
  };
};

export const buildRemoteShareUrl = (content: { title?: string; text?: string; url?: string }): string => {
  if (typeof window === 'undefined') return '';
  try {
    const origin = window.location.origin;
    const searchParams = new URLSearchParams();
    searchParams.set('share_target', '1');
    if (content.title) searchParams.set('title', content.title);
    if (content.text) searchParams.set('text', content.text);
    if (content.url) searchParams.set('url', content.url);
    return `${origin}/?${searchParams.toString()}`;
  } catch {
    return window.location.href;
  }
};

export const formatInboundSharedPrompt = (
  item: InboundSharedContent,
  userInstruction?: string
): string => {
  const parts: string[] = [];

  if (item.type === 'link') {
    const detected = detectPlatformFromUrl(item.url || '');
    parts.push(`[বহিরাগত প্ল্যাটফর্ম থেকে শেয়ার করা লিংক (${detected.name})]`);
    if (item.url) parts.push(`🌐 লিংক: ${item.url}`);
    if (item.title) parts.push(`📌 শিরোনাম: ${item.title}`);
    if (item.text && item.text !== item.url) parts.push(`📝 বিবরণ: ${item.text}`);
    parts.push(`\nঅনুগ্রহ করে এই লিংকের বিষয়বস্তু বিশ্লেষণ করে বিস্তারিত বাংলায় ব্যাখ্যা দাও এবং মূল পয়েন্টগুলো উপস্থাপন করো।`);
  } else if (item.type === 'photo') {
    parts.push(`[সংযুক্ত ছবি/ফটো: ${item.fileName || 'ছবি'}]`);
    if (item.fileSize) parts.push(`📁 সাইজ: ${item.fileSize}`);
    if (item.title) parts.push(`📌 বিবরণ: ${item.title}`);
    parts.push(`\nএই ছবির মূল উপাদান, টেক্সট (OCR), দৃশ্যপট ও তথ্য বিস্তারিত বাংলায় বিশ্লেষণ করো এবং দরকারী পরামর্শ দাও।`);
  } else if (item.type === 'file') {
    parts.push(`[সংযুক্ত ডকুমেন্ট/ফাইল: ${item.fileName || 'ডকুমেন্ট'}]`);
    if (item.fileSize) parts.push(`📁 সাইজ: ${item.fileSize}`);
    if (item.rawContent) {
      parts.push(`\`\`\`\n${item.rawContent.slice(0, 15000)}\n\`\`\``);
    }
    parts.push(`\nএই ফাইলের কোড/তথ্য বিস্তারিত পর্যালোচনা করো এবং প্রধান দিকগুলো বাংলায় বুঝিয়ে বলো।`);
  } else {
    parts.push(`[অন্য প্ল্যাটফর্ম থেকে শেয়ার করা লেখা/বার্তা]`);
    if (item.title) parts.push(`📌 বিষয়: ${item.title}`);
    if (item.text) parts.push(`📝 মূল টেক্সট:\n"""\n${item.text}\n"""`);
    parts.push(`\nএই লেখাটি ভালোভাবে পড়ে এর মূল বক্তব্য বিশ্লেষণ করো এবং প্রয়োজনীয় দিকনির্দেশনা প্রদান করো।`);
  }

  if (userInstruction && userInstruction.trim()) {
    parts.push(`\nঅতিরিক্ত বিশেষ নির্দেশনা:\n👉 ${userInstruction.trim()}`);
  }

  return parts.join('\n');
};

