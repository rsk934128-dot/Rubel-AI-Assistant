/**
 * Smart Profile ID Manager & LocalStorage Persistence
 * Founder & Super Admin: Sheikh Farid
 * Location: Sirajganj, Bangladesh
 */

export interface SmartProfileIdData {
  idCode: string;
  fullNameBn: string;
  fullNameEn: string;
  titleBn: string;
  titleEn: string;
  role: string;
  primaryEntity: string;
  secondaryEntity: string;
  locationBn: string;
  locationEn: string;
  email: string;
  phone: string;
  birthDateBn: string;
  birthDateEn: string;
  approxAge: number;
  bloodGroup: string;
  nidNo: string;
  avatarUrl: string;
  bioBn: string;
  spouseBn: string;
  fatherBn: string;
  motherBn: string;
  childrenBn: string;
  issueDate: string;
  validity: string;
  securityHash: string;
  verifiedBadge: boolean;
}

const STORAGE_KEY = 'sheikh_farid_profile_id_v2';

export const DEFAULT_PROFILE_ID: SmartProfileIdData = {
  idCode: 'SF-BD-1994-ADM01',
  fullNameBn: 'শেখ ফরিদ',
  fullNameEn: 'Sheikh Farid',
  titleBn: 'স্বশিক্ষিত সফটওয়্যার স্থপতি ও ফুল-স্ট্যাক ডেভেলপার',
  titleEn: 'Self-Taught Software Architect & Full-Stack Developer',
  role: 'Founder & Super Admin',
  primaryEntity: 'হোটেল আল শেখ ফরিদ (Hotel Al Sheikh Farid)',
  secondaryEntity: 'ScrollVerse (GovTech Ecosystem)',
  locationBn: 'সিরাজগঞ্জ, রাজশাহী বিভাগ, বাংলাদেশ 🇧🇩',
  locationEn: 'Sirajganj, Rajshahi Division, Bangladesh',
  email: 'rsk934128@gmail.com',
  phone: '+880 1700-000000',
  birthDateBn: '১৫ জুন, ১৯৯৪',
  birthDateEn: '15 June 1994',
  approxAge: 32,
  bloodGroup: 'B+ (Positive)',
  nidNo: '1994-6718-2900-8812',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  bioBn: 'সিরাজগঞ্জের স্থানীয় ঐতিহ্যবাহী হোটেল আল শেখ ফরিদ ও মিষ্টির দোকান এবং দ্বিভাষিক গভটেক সফটওয়্যার ইকোসিস্টেম ScrollVerse-এর প্রতিষ্ঠাতা ও সফটওয়্যার নির্মাতা।',
  spouseBn: 'খুকুমণি বেগম (Khukumoni Begum)',
  fatherBn: 'মো. আব্দুল বারিক শেখ (Md. Abdul Barik Sheikh)',
  motherBn: 'আম্মা (Mother)',
  childrenBn: 'এক কন্যা ও এক পুত্র সন্তান',
  issueDate: '১৫ জুন, ২০২৪',
  validity: 'LIFETIME / আজীবন স্থায়ী',
  securityHash: 'SHA256:9F8E7D6C5B4A3120E1F2',
  verifiedBadge: true,
};

// Preset Avatars for fast selection
export const AVATAR_PRESETS = [
  {
    id: 'executive_1',
    label: 'নির্বাহী প্রোফাইল',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'developer_tech',
    label: 'টেক আর্কিটেক্ট',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'founder_modern',
    label: 'মডার্ন ফাউন্ডার',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'business_leader',
    label: 'বিজনেস লিডার',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'creative_coder',
    label: 'ক্রিয়েটিভ কোডার',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
  },
];

/**
 * Get stored profile ID data from localStorage with fallback to default
 */
export function getStoredProfileId(): SmartProfileIdData {
  if (typeof window === 'undefined') return DEFAULT_PROFILE_ID;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE_ID;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE_ID, ...parsed };
  } catch (err) {
    console.warn('Failed to parse profile ID from localStorage, using default:', err);
    return DEFAULT_PROFILE_ID;
  }
}

/**
 * Save updated profile ID data to localStorage and dispatch event
 */
export function saveProfileId(data: SmartProfileIdData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('profile-id-updated', { detail: data }));
  } catch (err) {
    console.error('Failed to save profile ID to localStorage:', err);
  }
}

/**
 * Reset profile ID to master verified default
 */
export function resetProfileId(): SmartProfileIdData {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('profile-id-updated', { detail: DEFAULT_PROFILE_ID }));
    } catch (err) {
      console.warn('Error clearing profile ID storage:', err);
    }
  }
  return DEFAULT_PROFILE_ID;
}
