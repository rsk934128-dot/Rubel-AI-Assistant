export type VoiceCommandId =
  | 'OPEN_TRADING_BOT'
  | 'CLOSE_TRADING_BOT'
  | 'CLEAR_CHAT'
  | 'NEW_CHAT'
  | 'EXPORT_CHAT'
  | 'SET_MODE_CODING'
  | 'SET_MODE_WRITING'
  | 'SET_MODE_RESEARCH'
  | 'SET_MODE_LEARNING'
  | 'SET_MODE_CITIZEN'
  | 'SET_MODE_GENERAL'
  | 'TOGGLE_DARK_MODE'
  | 'SET_DARK_MODE'
  | 'SET_LIGHT_MODE'
  | 'OPEN_GOOGLE_DRIVE'
  | 'OPEN_YOUTUBE'
  | 'OPEN_VISION_STUDIO'
  | 'OPEN_ARCHITECTURE'
  | 'OPEN_METRICS'
  | 'OPEN_FREELANCE_AGENT'
  | 'OPEN_CITIZEN_SERVICES'
  | 'OPEN_MOBILE_PROGRAMS'
  | 'OPEN_ANDROID_APK'
  | 'OPEN_TTS_SETTINGS'
  | 'TOGGLE_SIDEBAR'
  | 'ENABLE_SEARCH'
  | 'DISABLE_SEARCH'
  | 'SCROLL_TOP'
  | 'SCROLL_BOTTOM'
  | 'OPEN_COMMANDS_HELP';

export interface VoiceCommandDefinition {
  id: VoiceCommandId;
  nameBn: string;
  nameEn: string;
  category: 'trading' | 'chat' | 'modes' | 'system' | 'tools';
  descriptionBn: string;
  examples: string[];
  patterns: RegExp[];
  feedbackBn: string;
  feedbackEn: string;
  icon: string;
}

export const VOICE_COMMANDS_REGISTRY: VoiceCommandDefinition[] = [
  // 1. Trading Bot
  {
    id: 'OPEN_TRADING_BOT',
    nameBn: 'ট্রেডিং বট খুলুন',
    nameEn: 'Open Trading Bot',
    category: 'trading',
    descriptionBn: 'লাইভ চার্ট বিশ্লেষণ ও ট্রেডিং বট মডাল চালু করে',
    examples: ['Open Trading Bot', 'ট্রেডিং বট খোলো', 'ট্রেডিং বট', 'Start Trading Bot', 'Launch Bot'],
    patterns: [
      /(?:open|start|launch|show)\s+(?:the\s+)?trading\s*bot/i,
      /trading\s*bot/i,
      /ট্রেডিং\s*বট/i,
      /বট\s*(?:চালু|ওপেন|খোলো)/i,
    ],
    feedbackBn: 'ট্রেডিং বট চালু করা হচ্ছে',
    feedbackEn: 'Opening Trading Bot',
    icon: 'TrendingUp',
  },
  {
    id: 'CLOSE_TRADING_BOT',
    nameBn: 'ট্রেডিং বট বন্ধ করুন',
    nameEn: 'Close Trading Bot',
    category: 'trading',
    descriptionBn: 'ট্রেডিং বট উইন্ডো বন্ধ করে',
    examples: ['Close Trading Bot', 'ট্রেডিং বট বন্ধ করো', 'ট্রেডিং বন্ধ'],
    patterns: [
      /(?:close|hide|exit|dismiss)\s+(?:the\s+)?trading\s*bot/i,
      /ট্রেডিং\s*বট\s*(?:বন্ধ|ক্লোজ)/i,
      /ট্রেডিং\s*বন্ধ/i,
    ],
    feedbackBn: 'ট্রেডিং বট বন্ধ করা হয়েছে',
    feedbackEn: 'Closing Trading Bot',
    icon: 'TrendingUp',
  },

  // 2. Chat Management
  {
    id: 'CLEAR_CHAT',
    nameBn: 'চ্যাট পরিষ্কার করুন',
    nameEn: 'Clear Chat',
    category: 'chat',
    descriptionBn: 'বর্তমান সেশনের সকল মেসেজ মুছে ফেলে',
    examples: ['Clear Chat', 'চ্যাট মুছো', 'Clear all messages', 'সব পরিষ্কার করো'],
    patterns: [
      /(?:clear|reset|delete)\s+(?:the\s+)?(?:chat|messages|history)/i,
      /চ্যাট\s*(?:মুছো|পরিষ্কার\s*করো|ক্লিয়ার\s*করো|ডিলিট\s*করো)/i,
      /সব\s*পরিষ্কার\s*করো/i,
    ],
    feedbackBn: 'চ্যাট পরিষ্কার করা হয়েছে',
    feedbackEn: 'Chat has been cleared',
    icon: 'Trash2',
  },
  {
    id: 'NEW_CHAT',
    nameBn: 'নতুন চ্যাট শুরু করুন',
    nameEn: 'New Chat',
    category: 'chat',
    descriptionBn: 'একটি নতুন চ্যাট সেশন চালু করে',
    examples: ['New Chat', 'নতুন চ্যাট', 'Start new conversation', 'নতুন সেশন'],
    patterns: [
      /(?:new|create|start)\s+(?:a\s+)?(?:chat|session|conversation)/i,
      /নতুন\s*চ্যাট/i,
      /নতুন\s*সেশন/i,
    ],
    feedbackBn: 'নতুন চ্যাট তৈরি করা হয়েছে',
    feedbackEn: 'Started new chat session',
    icon: 'Plus',
  },
  {
    id: 'EXPORT_CHAT',
    nameBn: 'চ্যাট এক্সপোর্ট করুন',
    nameEn: 'Export Chat',
    category: 'chat',
    descriptionBn: 'চ্যাট ইতিহাস PDF, JSON বা Markdown হিসেবে ডাউনলোড করে',
    examples: ['Export Chat', 'চ্যাট এক্সপোর্ট', 'Download conversation', 'চ্যাট ডাউনলোড'],
    patterns: [
      /(?:export|download|save)\s+(?:the\s+)?(?:chat|conversation|pdf)/i,
      /চ্যাট\s*(?:এক্সপোর্ট|ডাউনলোড)/i,
      /এক্সপোর্ট\s*করো/i,
    ],
    feedbackBn: 'চ্যাট এক্সপোর্ট উইন্ডো খোলা হচ্ছে',
    feedbackEn: 'Opening export options',
    icon: 'Download',
  },

  // 3. Assistant Modes
  {
    id: 'SET_MODE_CODING',
    nameBn: 'কোডিং মোড চালু করুন',
    nameEn: 'Coding Mode',
    category: 'modes',
    descriptionBn: 'প্রোগ্রামিং, ডিবাগিং ও সফটওয়্যার আর্কিটেকচার সহকারী মোড',
    examples: ['Coding Mode', 'কোডিং মোড', 'Switch to coding', 'কোড সহকারী'],
    patterns: [
      /(?:switch\s+to\s+)?coding\s*mode/i,
      /(?:set\s+mode\s+to\s+)?code/i,
      /কোডিং\s*মোড/i,
      /কোড\s*মোড/i,
    ],
    feedbackBn: 'কোডিং মোড সক্রিয় করা হয়েছে',
    feedbackEn: 'Coding Mode activated',
    icon: 'Code2',
  },
  {
    id: 'SET_MODE_WRITING',
    nameBn: 'রাইটিং মোড চালু করুন',
    nameEn: 'Writing Mode',
    category: 'modes',
    descriptionBn: 'লেখালেখি, প্রবন্ধ ও ভাষা রূপান্তর সহকারী',
    examples: ['Writing Mode', 'রাইটিং মোড', 'লেখক মোড', 'Switch to writing'],
    patterns: [
      /(?:switch\s+to\s+)?writing\s*mode/i,
      /রাইটিং\s*মোড/i,
      /লেখক\s*মোড/i,
      /লেখালেখি\s*মোড/i,
    ],
    feedbackBn: 'রাইটিং মোড সক্রিয় করা হয়েছে',
    feedbackEn: 'Writing Mode activated',
    icon: 'PenTool',
  },
  {
    id: 'SET_MODE_RESEARCH',
    nameBn: 'গবেষণা মোড চালু করুন',
    nameEn: 'Research Mode',
    category: 'modes',
    descriptionBn: 'তথ্য অনুসন্ধান, একাডেমিক বিশ্লেষণ ও রিসার্চ অ্যাসিস্ট্যান্ট',
    examples: ['Research Mode', 'রিসার্চ মোড', 'গবেষণা মোড'],
    patterns: [
      /(?:switch\s+to\s+)?research\s*mode/i,
      /রিসার্চ\s*মোড/i,
      /গবেষণা\s*মোড/i,
    ],
    feedbackBn: 'গবেষণা মোড সক্রিয় করা হয়েছে',
    feedbackEn: 'Research Mode activated',
    icon: 'Search',
  },
  {
    id: 'SET_MODE_LEARNING',
    nameBn: 'লার্নিং মোড চালু করুন',
    nameEn: 'Learning Mode',
    category: 'modes',
    descriptionBn: 'শিক্ষা, ক্যারিয়ার গাইডেন্স ও টিউটোরিয়াল সহকারী',
    examples: ['Learning Mode', 'লার্নিং মোড', 'শিক্ষা মোড', 'Student mode'],
    patterns: [
      /(?:switch\s+to\s+)?learning\s*mode/i,
      /লার্নিং\s*মোড/i,
      /শিক্ষা\s*মোড/i,
    ],
    feedbackBn: 'লার্নিং মোড সক্রিয় করা হয়েছে',
    feedbackEn: 'Learning Mode activated',
    icon: 'GraduationCap',
  },
  {
    id: 'SET_MODE_CITIZEN',
    nameBn: 'সিটিজেন সার্ভিসেস মোড',
    nameEn: 'Citizen Services Mode',
    category: 'modes',
    descriptionBn: 'সরকারি সেবা, পাসপোর্ট, ভিসা ও নাগরিক অধিকার নির্দেশিকা',
    examples: ['Citizen Mode', 'নাগরিক সেবা', 'সিটিজেন সার্ভিস'],
    patterns: [
      /(?:switch\s+to\s+)?citizen\s*(?:mode|services)?/i,
      /নাগরিক\s*সেবা/i,
      /সিটিজেন\s*সার্ভিস/i,
    ],
    feedbackBn: 'নাগরিক সেবা মোড সক্রিয় করা হয়েছে',
    feedbackEn: 'Citizen Services Mode activated',
    icon: 'ShieldCheck',
  },
  {
    id: 'SET_MODE_GENERAL',
    nameBn: 'সাধারণ মোড চালু করুন',
    nameEn: 'General Mode',
    category: 'modes',
    descriptionBn: 'দৈনন্দিন কথোপকথন ও সাধারণ এআই সহায়তা',
    examples: ['General Mode', 'সাধারণ মোড', 'Default mode'],
    patterns: [
      /(?:switch\s+to\s+)?(?:general|default)\s*mode/i,
      /সাধারণ\s*মোড/i,
      /ডিফল্ট\s*মোড/i,
    ],
    feedbackBn: 'সাধারণ মোড সক্রিয় করা হয়েছে',
    feedbackEn: 'General Mode activated',
    icon: 'Sparkles',
  },

  // 4. Themes
  {
    id: 'SET_DARK_MODE',
    nameBn: 'ডার্ক মোড চালু করুন',
    nameEn: 'Dark Mode',
    category: 'system',
    descriptionBn: 'কালো/নাইট থিম সক্রিয় করে',
    examples: ['Dark Mode', 'ডার্ক মোড', 'Night mode', 'কালো থিম'],
    patterns: [
      /(?:enable|switch\s+to|turn\s+on)?\s*dark\s*mode/i,
      /night\s*mode/i,
      /ডার্ক\s*মোড/i,
      /রাত\s*মোড/i,
    ],
    feedbackBn: 'ডার্ক মোড সক্রিয় করা হয়েছে',
    feedbackEn: 'Dark Mode enabled',
    icon: 'Moon',
  },
  {
    id: 'SET_LIGHT_MODE',
    nameBn: 'লাইট মোড চালু করুন',
    nameEn: 'Light Mode',
    category: 'system',
    descriptionBn: 'উজ্জ্বল/দিনের থিম সক্রিয় করে',
    examples: ['Light Mode', 'লাইট মোড', 'Day mode', 'সাদা থিম'],
    patterns: [
      /(?:enable|switch\s+to|turn\s+on)?\s*light\s*mode/i,
      /day\s*mode/i,
      /লাইট\s*মোড/i,
      /দিন\s*মোড/i,
    ],
    feedbackBn: 'লাইট মোড সক্রিয় করা হয়েছে',
    feedbackEn: 'Light Mode enabled',
    icon: 'Sun',
  },

  // 5. Tools & Modals
  {
    id: 'OPEN_GOOGLE_DRIVE',
    nameBn: 'গুগল ড্রাইভ খুলুন',
    nameEn: 'Google Drive',
    category: 'tools',
    descriptionBn: 'ক্লাউড ফাইল ড্রাইভ ও ব্যাকআপ হাব',
    examples: ['Open Google Drive', 'গুগল ড্রাইভ', 'Google Drive', 'ড্রাইভ খোলো'],
    patterns: [
      /(?:open|show)?\s*(?:google\s+)?drive/i,
      /গুগল\s*ড্রাইভ/i,
      /ড্রাইভ\s*(?:খোলো|ওপেন)/i,
    ],
    feedbackBn: 'গুগল ড্রাইভ খোলা হচ্ছে',
    feedbackEn: 'Opening Google Drive',
    icon: 'HardDrive',
  },
  {
    id: 'OPEN_YOUTUBE',
    nameBn: 'ইউটিউব ও মিউজিক প্লেয়ার',
    nameEn: 'YouTube & Music',
    category: 'tools',
    descriptionBn: 'বাংলা গান ও ব্যাকগ্রাউন্ড মিউজিক প্লেয়ার',
    examples: ['Open YouTube', 'Play Music', 'ইউটিউব', 'গান শোনাও', 'মিউজিক চালু করো'],
    patterns: [
      /(?:open|show)?\s*youtube/i,
      /(?:play|open)\s*music/i,
      /ইউটিউব/i,
      /গান\s*(?:শোনাও|বাজাও|চালু\s*করো)/i,
      /মিউজিক\s*(?:চালু\s*করো|খোলো)/i,
    ],
    feedbackBn: 'মিউজিক ও ইউটিউব খোলা হচ্ছে',
    feedbackEn: 'Opening YouTube & Music Player',
    icon: 'Youtube',
  },
  {
    id: 'OPEN_VISION_STUDIO',
    nameBn: 'ভিশন স্টুডিও খুলুন',
    nameEn: 'Vision Studio',
    category: 'tools',
    descriptionBn: 'এআই ইমেজ প্রসেসিং, এডিটিং ও ভিজ্যুয়াল অ্যানালাইসিস',
    examples: ['Open Vision Studio', 'ভিশন স্টুডিও', 'Image Studio', 'ছবি এডিট'],
    patterns: [
      /(?:open|show)?\s*vision\s*studio/i,
      /image\s*studio/i,
      /ভিশন\s*স্টুডিও/i,
      /ছবি\s*এডিটর/i,
    ],
    feedbackBn: 'ভিশন স্টুডিও খোলা হচ্ছে',
    feedbackEn: 'Opening Vision Studio',
    icon: 'Eye',
  },
  {
    id: 'OPEN_ARCHITECTURE',
    nameBn: 'সিস্টেম আর্কিটেকচার খুলুন',
    nameEn: 'Architecture Diagram',
    category: 'tools',
    descriptionBn: 'সিস্টেম মডিউল, পাইপলাইন ও সার্ভিস আর্কিটেকচার চিত্র',
    examples: ['Open Architecture', 'সিস্টেম আর্কিটেকচার', 'Show system design', 'আর্কিটেকচার'],
    patterns: [
      /(?:open|show)?\s*(?:system\s+)?architecture/i,
      /সিস্টেম\s*আর্কিটেকচার/i,
      /আর্কিটেকচার/i,
    ],
    feedbackBn: 'সিস্টেম আর্কিটেকচার ডায়াগ্রাম খোলা হচ্ছে',
    feedbackEn: 'Opening System Architecture',
    icon: 'Layers',
  },
  {
    id: 'OPEN_METRICS',
    nameBn: 'প্রজেক্ট মেট্রিক্স খুলুন',
    nameEn: 'Project Metrics',
    category: 'tools',
    descriptionBn: 'কোড সাইজ, রেসপন্স টাইম ও লাইভ এপিআই স্ট্যাটাস মেট্রিক্স',
    examples: ['Open Metrics', 'প্রজেক্ট মেট্রিক্স', 'Show analytics', 'মেট্রিক্স'],
    patterns: [
      /(?:open|show)?\s*(?:project\s+)?metrics/i,
      /(?:show\s+)?analytics/i,
      /প্রজেক্ট\s*মেট্রিক্স/i,
      /মেট্রিক্স/i,
    ],
    feedbackBn: 'প্রজেক্ট মেট্রিক্স ড্যাশবোর্ড খোলা হচ্ছে',
    feedbackEn: 'Opening Project Metrics',
    icon: 'BarChart3',
  },
  {
    id: 'OPEN_FREELANCE_AGENT',
    nameBn: 'ফ্রিল্যান্স এজেন্ট খুলুন',
    nameEn: 'Freelance Agent',
    category: 'tools',
    descriptionBn: 'অটোনোমাস ফ্রিল্যান্স প্রপোজাল ও টাস্ক সমাধানকারী এজেন্ট',
    examples: ['Open Freelance Agent', 'ফ্রিল্যান্স এজেন্ট', 'Freelance bot'],
    patterns: [
      /(?:open|show)?\s*freelance\s*agent/i,
      /ফ্রিল্যান্স\s*এজেন্ট/i,
    ],
    feedbackBn: 'ফ্রিল্যান্স এজেন্ট খোলা হচ্ছে',
    feedbackEn: 'Opening Freelance Agent',
    icon: 'Bot',
  },
  {
    id: 'OPEN_CITIZEN_SERVICES',
    nameBn: 'সিটিজেন সার্ভিসেস হাব',
    nameEn: 'Citizen Services Hub',
    category: 'tools',
    descriptionBn: 'নাগরিক সেবা ও প্রবাসী সহায়তা কেন্দ্র',
    examples: ['Citizen Services Hub', 'নাগরিক সেবা হাব', 'প্রবাসী সেবা'],
    patterns: [
      /citizen\s*services\s*hub/i,
      /নাগরিক\s*সেবা\s*হাব/i,
    ],
    feedbackBn: 'সিটিজেন সার্ভিসেস হাব খোলা হচ্ছে',
    feedbackEn: 'Opening Citizen Services Hub',
    icon: 'ShieldCheck',
  },
  {
    id: 'OPEN_MOBILE_PROGRAMS',
    nameBn: 'মোবাইল প্রোগ্রাম হাব',
    nameEn: 'Mobile Programs Hub',
    category: 'tools',
    descriptionBn: 'অ্যান্ড্রয়েড অ্যাপ্লিকেশন ও মোবাইল টুলস ডিরেক্টরি',
    examples: ['Open Mobile Programs', 'মোবাইল প্রোগ্রাম', 'Android apps hub'],
    patterns: [
      /(?:open|show)?\s*mobile\s*programs/i,
      /মোবাইল\s*প্রোগ্রাম/i,
    ],
    feedbackBn: 'মোবাইল প্রোগ্রাম হাব খোলা হচ্ছে',
    feedbackEn: 'Opening Mobile Programs Hub',
    icon: 'Smartphone',
  },
  {
    id: 'OPEN_ANDROID_APK',
    nameBn: 'অ্যান্ড্রয়েড APK রিলিজ',
    nameEn: 'Android APK Release',
    category: 'tools',
    descriptionBn: 'মোবাইল APK ডাউনলোড ও লাইভ রিলিজ পোর্টাল',
    examples: ['Download APK', 'অ্যান্ড্রয়েড অ্যাপ', 'APK Release', 'অ্যাপ ডাউনলোড'],
    patterns: [
      /(?:open|download)?\s*(?:android\s+)?apk/i,
      /অ্যান্ড্রয়েড\s*অ্যাপ/i,
      /এপিকে\s*ডাউনলোড/i,
    ],
    feedbackBn: 'অ্যান্ড্রয়েড APK রিলিজ পোর্টাল খোলা হচ্ছে',
    feedbackEn: 'Opening Android APK Release Portal',
    icon: 'Smartphone',
  },
  {
    id: 'OPEN_TTS_SETTINGS',
    nameBn: 'ভয়েস ও টেক্সট-টু-স্পিচ সেটিংস',
    nameEn: 'TTS & Voice Settings',
    category: 'tools',
    descriptionBn: 'ভয়েস অ্যাকসেন্ট, পিচ ও অটো-স্পিচ কনফিগারেশন',
    examples: ['Voice Settings', 'ভয়েস সেটিংস', 'TTS Settings', 'স্পিচ সেটিংস'],
    patterns: [
      /(?:open|show)?\s*(?:tts|voice|speech)\s*settings/i,
      /ভয়েস\s*সেটিংস/i,
      /স্পিচ\s*সেটিংস/i,
    ],
    feedbackBn: 'ভয়েস সেটিংস খোলা হচ্ছে',
    feedbackEn: 'Opening Voice & TTS Settings',
    icon: 'Volume2',
  },
  {
    id: 'TOGGLE_SIDEBAR',
    nameBn: 'সাইডবার টগল করুন',
    nameEn: 'Toggle Sidebar',
    category: 'system',
    descriptionBn: 'ইতিহাস ও নেভিগেশন সাইডবার খোলে বা বন্ধ করে',
    examples: ['Toggle Sidebar', 'সাইডবার খোলো', 'সাইডবার বন্ধ করো', 'Open Sidebar'],
    patterns: [
      /(?:toggle|open|close|show|hide)\s+sidebar/i,
      /সাইডবার\s*(?:খোলো|বন্ধ\s*করো|টগল\s*করো)/i,
    ],
    feedbackBn: 'সাইডবার পরিবর্তন করা হয়েছে',
    feedbackEn: 'Sidebar toggled',
    icon: 'Menu',
  },
  {
    id: 'ENABLE_SEARCH',
    nameBn: 'ওয়েব সার্চ চালু করুন',
    nameEn: 'Enable Web Search',
    category: 'system',
    descriptionBn: 'গুগল লাইভ সার্চ গ্রাউন্ডিং সক্রিয় করে',
    examples: ['Enable Search', 'ওয়েব সার্চ চালু করো', 'Turn on Google search'],
    patterns: [
      /(?:enable|turn\s+on|activate)\s+(?:web\s+)?search/i,
      /ওয়েব\s*সার্চ\s*(?:চালু\s*করো|অন\s*করো)/i,
      /সার্চ\s*চালু\s*করো/i,
    ],
    feedbackBn: 'লাইভ ওয়েব সার্চ চালু করা হয়েছে',
    feedbackEn: 'Web Search enabled',
    icon: 'Globe',
  },
  {
    id: 'DISABLE_SEARCH',
    nameBn: 'ওয়েব সার্চ বন্ধ করুন',
    nameEn: 'Disable Web Search',
    category: 'system',
    descriptionBn: 'গুগল লাইভ সার্চ গ্রাউন্ডিং বন্ধ করে অফলাইন মোড রাখে',
    examples: ['Disable Search', 'ওয়েব সার্চ বন্ধ করো', 'Turn off search'],
    patterns: [
      /(?:disable|turn\s+off|deactivate)\s+(?:web\s+)?search/i,
      /ওয়েব\s*সার্চ\s*(?:বন্ধ\s*করো|অফ\s*করো)/i,
      /সার্চ\s*বন্ধ\s*করো/i,
    ],
    feedbackBn: 'লাইভ ওয়েব সার্চ বন্ধ করা হয়েছে',
    feedbackEn: 'Web Search disabled',
    icon: 'Globe',
  },
  {
    id: 'SCROLL_TOP',
    nameBn: 'উপরে স্ক্রল করুন',
    nameEn: 'Scroll to Top',
    category: 'system',
    descriptionBn: 'চ্যাট পেজের শুরুতে নিয়ে যায়',
    examples: ['Scroll to top', 'উপরে যাও', 'Go to top'],
    patterns: [
      /(?:scroll|go)\s+to\s+(?:the\s+)?top/i,
      /উপরে\s*যাও/i,
      /উপরে\s*স্ক্রল/i,
    ],
    feedbackBn: 'উপরে স্ক্রল করা হচ্ছে',
    feedbackEn: 'Scrolling to top',
    icon: 'ChevronUp',
  },
  {
    id: 'SCROLL_BOTTOM',
    nameBn: 'নিচে স্ক্রল করুন',
    nameEn: 'Scroll to Bottom',
    category: 'system',
    descriptionBn: 'চ্যাট পেজের একদম সাম্প্রতিক মেসেজে নিয়ে যায়',
    examples: ['Scroll to bottom', 'নিচে যাও', 'Go to bottom'],
    patterns: [
      /(?:scroll|go)\s+to\s+(?:the\s+)?bottom/i,
      /নিচে\s*যাও/i,
      /নিচে\s*স্ক্রল/i,
    ],
    feedbackBn: 'সর্বশেষ মেসেজে স্ক্রল করা হচ্ছে',
    feedbackEn: 'Scrolling to latest message',
    icon: 'ChevronDown',
  },
  {
    id: 'OPEN_COMMANDS_HELP',
    nameBn: 'ভয়েস কমান্ড চিটশিট',
    nameEn: 'Voice Commands Help',
    category: 'tools',
    descriptionBn: 'সকল উপলভ্য ভয়েস কমান্ডের তালিকা ও উদাহরণ প্রদর্শন করে',
    examples: ['Voice Commands Help', 'কমান্ড লিস্ট', 'ভয়েস কমান্ড কী কী', 'Commands'],
    patterns: [
      /(?:voice\s+)?command(?:s)?(?:\s+list|\s+help)?/i,
      /কমান্ড\s*(?:লিস্ট|তালিকা|সাহায্য)/i,
      /ভয়েস\s*কমান্ড/i,
    ],
    feedbackBn: 'ভয়েস কমান্ড সহায়িকা খোলা হচ্ছে',
    feedbackEn: 'Opening Voice Commands Help',
    icon: 'Terminal',
  },
];

/**
 * Matches a spoken transcript against the voice command catalog.
 * Returns the matched command definition or null if no command was detected.
 */
export function matchVoiceCommand(transcript: string): VoiceCommandDefinition | null {
  if (!transcript || typeof transcript !== 'string') return null;
  const clean = transcript.trim().toLowerCase();
  if (clean.length < 2) return null;

  for (const cmd of VOICE_COMMANDS_REGISTRY) {
    for (const pattern of cmd.patterns) {
      if (pattern.test(clean)) {
        return cmd;
      }
    }
  }

  return null;
}
