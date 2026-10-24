/**
 * Founder & Super Admin Official Profile Data
 * Software Architect: Sheikh Farid
 * Location: Sirajganj, Bangladesh
 */

export interface FounderProfile {
  personalInfo: {
    fullNameEn: string;
    fullNameBn: string;
    birthDate: string;
    approxAge: number;
    locationEn: string;
    locationBn: string;
    designationEn: string;
    designationBn: string;
    primaryRole: string;
  };
  familyInfo: {
    fatherName: string;
    motherName: string;
    spouseName: string;
    children: string;
  };
  businesses: Array<{
    name: string;
    category: string;
    description: string;
    techStack?: string[];
  }>;
  flagshipProjects: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  techStack: {
    frontend: string[];
    backend: string[];
    mobile: string[];
    database: string[];
    aiAndTools: string[];
  };
  adminIdentity: {
    owner_name: string;
    role: string;
    location: string;
    business_entity: string;
    spouse: string;
    primary_tech_stack: string[];
  };
}

export const FOUNDER_PROFILE: FounderProfile = {
  personalInfo: {
    fullNameEn: 'Sheikh Farid',
    fullNameBn: 'শেখ ফরিদ',
    birthDate: '15 June 1994',
    approxAge: 32,
    locationEn: 'Sirajganj, Bangladesh',
    locationBn: 'সিরাজগঞ্জ, বাংলাদেশ',
    designationEn: 'Self-taught Software Architect & Full-Stack Application Developer',
    designationBn: 'স্বশিক্ষিত সফটওয়্যার স্থপতি ও ফুল-স্ট্যাক অ্যাপ্লিকেশন ডেভেলপার',
    primaryRole: 'Founder & Super Admin',
  },
  familyInfo: {
    fatherName: 'মো. আব্দুল বারিক শেখ (Md. Abdul Barik Sheikh)',
    motherName: 'আম্মা (Mother)',
    spouseName: 'খুকুমণি বেগম (Khukumoni Begum)',
    children: 'এক কন্যা ও এক পুত্র সন্তান (One daughter and one son)',
  },
  businesses: [
    {
      name: 'হোটেল আল শেখ ফরিদ (Hotel Al Sheikh Farid)',
      category: 'Hospitality & Dining',
      description: 'সিরাজগঞ্জের স্থানীয় ঐতিহ্যবাহী পারিবারিক হোটেল ও রেস্তোরাঁ ব্যবসা।',
      techStack: ['Next.js', 'Tailwind CSS', 'Dexie.js', 'Offline-First PWA'],
    },
    {
      name: 'হোটেল আল শেখ ফরিদ ও মিষ্টির দোকান ম্যানেজমেন্ট',
      category: 'Enterprise POS & Inventory',
      description: 'পারিবারিক হোটেল ও মিষ্টির দোকানের দৈনন্দিন ক্যাশ রেজিস্টার, ইনভেন্টরি ও অফলাইন অর্ডার ট্র্যাকিং পিডব্লিউএ (PWA) সিস্টেম।',
      techStack: ['Next.js', 'Dexie.js', 'IndexedDB', 'Tailwind CSS'],
    },
  ],
  flagshipProjects: [
    {
      name: 'ScrollVerse',
      type: 'GovTech & Digital Bangladesh Ecosystem',
      description: 'দ্বিভাষিক গভটেক (GovTech) সফটওয়্যার ইকোসিস্টেমের প্রতিষ্ঠাতা এবং প্রোডাক্ট আর্কিটেক্ট।',
    },
    {
      name: 'Sheikh Code Exchange',
      type: 'Developer Platform',
      description: 'ডেভেলপার কোড অ্যাসেট এক্সচেঞ্জ এবং স্মার্ট সেটেলমেন্ট প্ল্যাটফর্ম (৪২তম ফ্ল্যাগশিপ প্রজেক্ট)।',
    },
    {
      name: 'RubelPay / RubelBank',
      type: 'Fintech & Core Ledger',
      description: 'ফিনটেক আর্কিটেকচার, ডাবল-এন্ট্রি অ্যাকাউন্টিং লেজার এবং পেমেন্ট গেটওয়ে ইন্টিগ্রেশন প্ল্যাটফর্ম।',
    },
    {
      name: 'Synergy BPO Hub',
      type: 'AI Sales & Open Banking',
      description: 'এআই সেলস কো-পাইলট, ওপেন ব্যাংকিং এপিআই এবং মার্চেন্ট ক্যাশ অ্যাডভান্স প্ল্যাটফর্ম।',
    },
    {
      name: 'NotorBotor & Ideation Spark',
      type: 'AI Innovation Labs',
      description: 'স্মার্ট আইডিয়া জেনারেটর এবং দ্রুত প্রোটোটাইপিং এআই ওয়ার্কফ্লো।',
    },
    {
      name: 'NoorNexus Sovereign OS v3 & NoorAI',
      type: 'Sovereign AI Pipeline',
      description: 'সার্বভৌম এআই কনটেন্ট পাইপলাইন ও এজেন্টিক অপারেটিং ওয়ার্কফ্লো।',
    },
    {
      name: 'RubelNet Firebase Manager 🛡️',
      type: 'The Sovereign Grid for Firebase (Mission-Critical Command Center)',
      description: 'Next.js 15 (App Router), Firebase Custom Claims RBAC, Realtime Database Live Log Streaming, Genkit Gemini AI, Firestore Node Manager ও Dexie.js অফলাইন সিঙ্ক সমৃদ্ধ সার্বভৌম ফায়ারবেস কমান্ড সেন্টার।',
    },
  ],
  techStack: {
    frontend: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Shadcn UI'],
    backend: ['Node.js', 'Express', 'PostgreSQL', 'Firebase Firestore / Auth'],
    mobile: ['Kotlin', 'Jetpack Compose', 'PWA (Progressive Web Apps)'],
    database: ['PostgreSQL', 'Firestore', 'Dexie.js (IndexedDB)'],
    aiAndTools: ['Google Gemini API', 'Google Genkit', 'Multi-Agent Autonomous Workflows'],
  },
  adminIdentity: {
    owner_name: 'Sheikh Farid',
    role: 'Super Admin & Founder',
    location: 'Sirajganj, Bangladesh',
    business_entity: 'Hotel Al Sheikh Farid',
    spouse: 'Khukumoni Begum',
    primary_tech_stack: ['Next.js', 'TypeScript', 'Node.js', 'Kotlin', 'Firebase'],
  },
};

/**
 * Returns a markdown/text representation for system instructions
 */
export function getFounderSystemPromptContext(): string {
  return `
[FOUNDER & SUPER ADMIN KNOWLEDGE CONTEXT]
The primary creator, owner, and Super Admin of this entire ecosystem is Sheikh Farid (শেখ ফরিদ):
- Name: Sheikh Farid (শেখ ফরিদ)
- Birth Date: 15 June 1994 (Age: ~32)
- Location: Sirajganj, Bangladesh (সিরাজগঞ্জ, বাংলাদেশ)
- Profession: Self-taught Software Architect & Full-Stack Developer (স্বশিক্ষিত সফটওয়্যার স্থপতি)
- Businesses & Entities:
  * Hotel Al Sheikh Farid (হোটেল আল শেখ ফরিদ) - Local family hotel & restaurant business in Sirajganj
  * Hotel Al Sheikh Farid & Sweet Shop Management System (Next.js + Dexie.js + Tailwind CSS offline-first PWA)
  * ScrollVerse (GovTech software ecosystem)
  * Sheikh Code Exchange (42nd flagship developer code asset exchange)
  * RubelPay / RubelBank (Fintech ledger & payment gateway)
  * Synergy BPO Hub (AI sales co-pilot & merchant cash advance)
  * NotorBotor, Ideation Spark, AutoPay.Ltd, NoorNexus Sovereign OS v3, NoorAI
- Family:
  * Father: Md. Abdul Barik Sheikh (মো. আব্দুল বারিক শেখ)
  * Mother: Amma (আম্মা)
  * Spouse: Khukumoni Begum (খুকুমণি বেগম)
  * Children: One daughter and one son (এক কন্যা ও এক পুত্র সন্তান)
- Super Admin Identity Credentials:
  Role: Super Admin & Founder
  Owner Name: Sheikh Farid
  Business Entity: Hotel Al Sheikh Farid
  Spouse: Khukumoni Begum
When Sheikh Farid interacts or when the platform refers to its founder/super admin, recognize and address him with highest respect as the founder, visionary creator, and owner of this platform and its businesses.
`;
}
