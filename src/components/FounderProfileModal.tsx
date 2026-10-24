import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft, 
  ShieldCheck, 
  UserCheck, 
  Building, 
  Heart, 
  Code2, 
  Database, 
  Copy, 
  Check, 
  Layers, 
  Sparkles, 
  Edit3,
  RotateCw,
  Printer,
  QrCode,
  BadgeCheck,
  Key,
  Save,
  RefreshCcw,
  Camera,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Crown
} from 'lucide-react';
import { FOUNDER_PROFILE } from '../data/founderProfile';
import { 
  SmartProfileIdData, 
  DEFAULT_PROFILE_ID, 
  AVATAR_PRESETS, 
  getStoredProfileId, 
  saveProfileId, 
  resetProfileId 
} from '../data/profileIdManager';

interface FounderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAIAboutAdmin?: (query: string) => void;
}

export const FounderProfileModal: React.FC<FounderProfileModalProps> = ({
  isOpen,
  onClose,
  onAskAIAboutAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'id_card' | 'edit_id' | 'projects' | 'admin_json' | 'sql_schema'>('id_card');
  const [profileData, setProfileData] = useState<SmartProfileIdData>(getStoredProfileId);
  const [formData, setFormData] = useState<SmartProfileIdData>(getStoredProfileId);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredProfileId();
      setProfileData(stored);
      setFormData(stored);
      setIsFlipped(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileId(formData);
    setProfileData(formData);
    setSaveSuccessToast(true);
    setTimeout(() => {
      setSaveSuccessToast(false);
      setActiveTab('id_card');
    }, 1200);
  };

  const handleResetToDefault = () => {
    if (window.confirm('আপনি কি মাস্টার ভেরিফাইড প্রোফাইল আইডিতে রিস্টোর করতে চান?')) {
      const def = resetProfileId();
      setProfileData(def);
      setFormData(def);
      setSaveSuccessToast(true);
      setTimeout(() => setSaveSuccessToast(false), 1500);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  // Dynamic admin JSON generated from the live profile ID
  const dynamicAdminJson = {
    identity_card: {
      profile_id: profileData.idCode,
      full_name_bn: profileData.fullNameBn,
      full_name_en: profileData.fullNameEn,
      designation: profileData.titleEn,
      role: profileData.role,
      location: profileData.locationEn,
      primary_entity: profileData.primaryEntity,
      email: profileData.email,
      phone: profileData.phone,
      blood_group: profileData.bloodGroup,
      national_id_hash: profileData.nidNo,
      verified: profileData.verifiedBadge,
      issue_date: profileData.issueDate,
      validity: profileData.validity,
      permissions: ['*'],
    },
    family_and_heritage: {
      father: profileData.fatherBn,
      mother: profileData.motherBn,
      spouse: profileData.spouseBn,
      children: profileData.childrenBn,
    },
    tech_stack: FOUNDER_PROFILE.techStack,
    security_clearance: {
      level: 'LEVEL_5_ROOT_SUPER_ADMIN',
      governance_scope: 'Global Ecosystem & Hospitality Ledger',
      signature: 'Verified Digital Cryptographic Signature (Sheikh Farid)',
    },
  };

  const adminJsonText = JSON.stringify(dynamicAdminJson, null, 2);

  const postgresSqlSchema = `-- PostgreSQL Master Schema for Verified Super Admin
-- Owner: ${profileData.fullNameEn} (${profileData.fullNameBn})
-- ID Code: ${profileData.idCode}

CREATE TABLE IF NOT EXISTS platform_administrators (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id_code VARCHAR(50) UNIQUE NOT NULL DEFAULT '${profileData.idCode}',
    full_name_en VARCHAR(150) NOT NULL DEFAULT '${profileData.fullNameEn}',
    full_name_bn VARCHAR(150) NOT NULL DEFAULT '${profileData.fullNameBn}',
    email VARCHAR(255) UNIQUE DEFAULT '${profileData.email}',
    phone VARCHAR(50) DEFAULT '${profileData.phone}',
    role VARCHAR(50) NOT NULL DEFAULT 'super_admin',
    primary_entity VARCHAR(200) NOT NULL DEFAULT '${profileData.primaryEntity}',
    location VARCHAR(150) DEFAULT '${profileData.locationEn}',
    is_verified BOOLEAN DEFAULT TRUE,
    permissions JSONB DEFAULT '["*"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO platform_administrators (profile_id_code, full_name_en, full_name_bn, role, primary_entity)
VALUES ('${profileData.idCode}', '${profileData.fullNameEn}', '${profileData.fullNameBn}', 'super_admin', '${profileData.primaryEntity}')
ON CONFLICT (profile_id_code) DO UPDATE SET full_name_en = EXCLUDED.full_name_en;
`;

  return (
    <div
      id="founder-profile-modal-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="founder-profile-modal-content"
        className="bg-white dark:bg-stone-900 border-t sm:border border-stone-200 dark:border-stone-800 rounded-t-3xl sm:rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh] text-stone-900 dark:text-stone-100 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/90 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-emerald-500/15 to-emerald-600/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs">
              <BadgeCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  স্মার্ট প্রোফাইল আইডি ও সুপার অ্যাডমিন পোর্টাল
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Official Verified
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-stone-700 dark:text-stone-300">{profileData.fullNameBn} ({profileData.fullNameEn})</span>
                <span>•</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{profileData.idCode}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-all cursor-pointer shadow-xs border border-stone-300/60 dark:border-stone-700/60"
              title="চ্যাটে ফিরে যান (Back)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ফিরে যান</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-2.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 text-xs font-medium overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('id_card')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'id_card'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>🪪 ডিজিটাল স্মার্ট আইডি কার্ড</span>
          </button>

          <button
            onClick={() => setActiveTab('edit_id')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'edit_id'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>✏️ প্রোফাইল আইডি আপডেট ও এডিটর</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>💼 প্রতিষ্ঠান ও প্রজেক্ট ইকোসিস্টেম</span>
          </button>

          <button
            onClick={() => setActiveTab('admin_json')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'admin_json'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>🛡️ অ্যাডমিন আইডেন্টিটি JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('sql_schema')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'sql_schema'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>🗄️ PostgreSQL SQL স্কিমা</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {saveSuccessToast && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 shadow-xs">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>প্রোফাইল আইডি সফলভাবে আপডেট ও লোকালস্টোরেজে সংরক্ষিত হয়েছে!</span>
            </div>
          )}

          {/* 1. DIGITAL SMART ID CARD TAB */}
          {activeTab === 'id_card' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center space-y-1">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  Verified Executive Credential
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100">
                  ডিজিটাল স্মার্ট প্রোফাইল আইডি কার্ড
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  কার্ডের উপর ক্লিক করে বা 'কার্ড উল্টান' চেপে সম্মুখ ও পেছনের অংশ দেখুন
                </p>
              </div>

              {/* Interactive Flippable ID Card */}
              <div 
                className="relative perspective-1000 cursor-pointer select-none group"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {!isFlipped ? (
                  /* CARD FRONT */
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-white p-5 sm:p-6 transition-all duration-300 hover:shadow-emerald-500/10 hover:border-emerald-400/60 min-h-[340px] flex flex-col justify-between">
                    {/* Background Security Pattern & Watermark */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                    <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

                    {/* Card Header */}
                    <div className="relative z-10 flex items-center justify-between pb-3 border-b border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 p-0.5 shadow-md">
                          <div className="w-full h-full rounded-full bg-stone-950 flex items-center justify-center font-bold text-xs text-amber-400">
                            BD
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-extrabold tracking-wider text-emerald-400 uppercase leading-none">
                            GOVERNMENT & TECH SOVEREIGN ID
                          </div>
                          <div className="text-[9px] text-stone-400 uppercase tracking-widest mt-0.5">
                            FOUNDER & SUPER ADMIN CREDENTIAL
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[10px] font-bold text-emerald-300 shadow-xs">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>VERIFIED</span>
                      </div>
                    </div>

                    {/* Card Middle: Photo, Chip, Details */}
                    <div className="relative z-10 grid grid-cols-12 gap-4 items-center my-3">
                      {/* Photo + Chip Column */}
                      <div className="col-span-4 sm:col-span-4 flex flex-col items-center gap-2">
                        <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden border-2 border-emerald-400/80 shadow-lg bg-stone-800">
                          <img
                            src={profileData.avatarUrl}
                            alt={profileData.fullNameEn}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent py-1 text-center">
                            <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                              ARCHITECT
                            </span>
                          </div>
                        </div>

                        {/* Gold Microchip SVG */}
                        <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center">
                          <div className="w-full h-full border border-amber-700/40 rounded flex flex-col justify-around py-0.5 px-1 bg-amber-400/80">
                            <div className="h-0.5 bg-amber-800/40 w-full" />
                            <div className="h-0.5 bg-amber-800/40 w-full" />
                            <div className="h-0.5 bg-amber-800/40 w-full" />
                          </div>
                        </div>
                      </div>

                      {/* Identity Credentials Column */}
                      <div className="col-span-8 sm:col-span-8 space-y-2 text-stone-200">
                        <div>
                          <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                            পূর্ণ নাম / Full Name
                          </div>
                          <div className="text-base sm:text-lg font-black text-white leading-tight">
                            {profileData.fullNameBn}
                          </div>
                          <div className="text-xs text-stone-300 font-semibold font-mono">
                            {profileData.fullNameEn}
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] text-stone-400 uppercase font-semibold">
                            পদবি ও ভূমিকা / Designation & Role
                          </div>
                          <div className="text-xs font-bold text-amber-300 leading-snug">
                            {profileData.titleBn}
                          </div>
                          <div className="text-[10px] text-emerald-300">
                            {profileData.role}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                          <div>
                            <span className="text-stone-400 block text-[9px]">প্রতিষ্ঠান / Entity</span>
                            <span className="font-semibold text-stone-200 truncate block">
                              {profileData.primaryEntity}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[9px]">অবস্থান / Location</span>
                            <span className="font-semibold text-stone-200 truncate block">
                              {profileData.locationBn}
                            </span>
                          </div>
                        </div>

                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-[9px] text-stone-400">স্মার্ট আইডি:</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/60 font-mono text-emerald-300 font-bold text-xs tracking-wider">
                            {profileData.idCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Signature & Holographic Seal */}
                    <div className="relative z-10 pt-2.5 border-t border-emerald-500/30 flex items-end justify-between">
                      <div>
                        <div className="text-[9px] text-stone-400">ডিজিটাল স্বাক্ষর (Digital Signature):</div>
                        <div className="font-serif italic font-bold text-emerald-400 text-sm tracking-wide mt-0.5">
                          Sheikh Farid
                        </div>
                      </div>

                      {/* Barcode Simulator */}
                      <div className="text-right">
                        <div className="flex items-center gap-0.5 h-6 opacity-85">
                          {[2, 4, 1, 3, 2, 5, 2, 1, 4, 2, 3, 1, 4, 2].map((w, idx) => (
                            <span key={idx} style={{ width: `${w}px` }} className="h-full bg-white rounded-2xs inline-block" />
                          ))}
                        </div>
                        <div className="font-mono text-[8px] text-stone-400 mt-0.5">
                          {profileData.securityHash}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CARD BACK */
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-white p-5 sm:p-6 transition-all duration-300 hover:shadow-amber-500/10 min-h-[340px] flex flex-col justify-between">
                    {/* Magnetic Stripe Simulator */}
                    <div className="absolute top-4 inset-x-0 h-10 bg-black/90 border-y border-stone-800" />

                    <div className="relative z-10 pt-10 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          পারিবারিক ও নিরাপত্তা ভেরিফিকেশন (OFFICIAL ARCHIVE)
                        </span>
                        <span className="text-[9px] font-mono text-stone-400">
                          VERIFIED OWNER
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300">
                        <div>
                          <span className="text-stone-400 text-[10px] block">• পিতা:</span>
                          <span className="font-semibold text-white">{profileData.fatherBn}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 text-[10px] block">• মাতা:</span>
                          <span className="font-semibold text-white">{profileData.motherBn}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 text-[10px] block">• সহধর্মিণী (Spouse):</span>
                          <span className="font-semibold text-emerald-300">{profileData.spouseBn}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 text-[10px] block">• সন্তান:</span>
                          <span className="font-semibold text-white">{profileData.childrenBn}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 text-[10px] block">• রক্তের গ্রুপ (Blood):</span>
                          <span className="font-bold text-rose-400">{profileData.bloodGroup}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 text-[10px] block">• জাতীয় পরিচয়পত্র / NID:</span>
                          <span className="font-mono text-stone-200">{profileData.nidNo}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-1">
                        <div className="text-[10px] text-emerald-400 font-bold">
                          সার্বভৌম সফটওয়্যার এক্সেস অনুমতি (System Clearance):
                        </div>
                        <div className="flex flex-wrap gap-1 font-mono text-[9px]">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">SUPER_ADMIN</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">ROOT_ACCESS</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">HOTEL_POS_LEDGER</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">SCROLLVERSE_ARCHITECT</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 pt-2 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-400">
                      <div>
                        মেয়াদ: <span className="text-emerald-400 font-bold">{profileData.validity}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Crown className="w-3.5 h-3.5" />
                        <span>হোটেল আল শেখ ফরিদ ও ScrollVerse</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar for ID Card */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 font-semibold text-xs border border-stone-300 dark:border-stone-700 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <RotateCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isFlipped ? 'সম্মুখ ভাগ দেখুন (View Front)' : 'পেছনের ভাগ দেখুন (View Back)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(
                    `[SMART PROFILE ID]\nনাম: ${profileData.fullNameBn} (${profileData.fullNameEn})\nআইডি কোড: ${profileData.idCode}\nপদবি: ${profileData.titleBn}\nপ্রতিষ্ঠান: ${profileData.primaryEntity}\nঅবস্থান: ${profileData.locationBn}\nইমেইল: ${profileData.email}\nফোন: ${profileData.phone}\nভেরিফাইড সুপার অ্যাডমিন।`,
                    'id_summary'
                  )}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-300 dark:border-emerald-800 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  {copiedKey === 'id_summary' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'id_summary' ? 'কপি সম্পন্ন!' : 'আইডি তথ্য কপি করুন'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('edit_id')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-800 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>প্রোফাইল তথ্য আপডেট করুন</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintCard}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 font-semibold text-xs border border-stone-300 dark:border-stone-700 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-500" />
                  <span>প্রিন্ট / সেভ</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. UPDATE & EDIT PROFILE ID TAB */}
          {activeTab === 'edit_id' && (
            <form onSubmit={handleSaveForm} className="space-y-5 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
                <Edit3 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    প্রোফাইল আইডি কাস্টমাইজ ও আপডেট ফর্ম
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400 text-xs mt-0.5">
                    এখানে যেকোনো তথ্য পরিবর্তন করে 'সংরক্ষণ করুন' বাটনে চাপলে আপনার স্মার্ট আইডি কার্ড স্বয়ংক্রিয়ভাবে আপডেট হবে।
                  </p>
                </div>
              </div>

              {/* Avatar Chooser */}
              <div className="space-y-2">
                <label className="font-bold text-stone-800 dark:text-stone-200 block text-xs">
                  প্রোফাইল ছবি / অবতার নির্বাচন করুন
                </label>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: preset.url }))}
                      className={`relative rounded-xl overflow-hidden p-0.5 border-2 transition-all cursor-pointer shrink-0 ${
                        formData.avatarUrl === preset.url
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105'
                          : 'border-stone-200 dark:border-stone-700 hover:border-emerald-300'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-12 h-14 object-cover rounded-lg"
                      />
                      <span className="block text-[9px] text-center font-semibold text-stone-600 dark:text-stone-300 mt-1">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <label className="text-[11px] text-stone-500 dark:text-stone-400 block mb-1">
                    অথবা নিজস্ব ছবির ওয়েব লিঙ্ক (Custom Image URL) দিন:
                  </label>
                  <input
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Core Identity Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs mb-1">
                    ইউনিক প্রোফাইল আইডি কোড (ID Code)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.idCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, idCode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs mb-1">
                    রোল / প্রশাসনিক পদমর্যাদা
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs mb-1">
                    পূর্ণ নাম (বাংলায়)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullNameBn}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullNameBn: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs mb-1">
                    Full Name (in English)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullNameEn}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullNameEn: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs mb-1">
                    পদবি / প্রফেশনাল টাইটেল
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleBn}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titleBn: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs mb-1">
                    প্রধান প্রতিষ্ঠান / ব্যবসা
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.primaryEntity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, primaryEntity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs mb-1">
                    অবস্থান / ঠিকানা (Location)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.locationBn}
                    onChange={(e) => setFormData((prev) => ({ ...prev, locationBn: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs mb-1">
                    ইমেইল ঠিকানা (Email)
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs mb-1">
                    মোবাইল নম্বর (Phone)
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs mb-1">
                    রক্তের গ্রুপ (Blood Group)
                  </label>
                  <input
                    type="text"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bloodGroup: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Bio Statement */}
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs mb-1">
                  সংক্ষিপ্ত বায়ো ও ভিশন (Bio Statement)
                </label>
                <textarea
                  rows={2}
                  value={formData.bioBn}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bioBn: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Submit / Reset Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-xs font-semibold cursor-pointer"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>ডিফল্ট তথ্য ফিরিয়ে আনুন</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('id_card')}
                    className="px-4 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>প্রোফাইল আইডি সেভ করুন</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 3. BUSINESSES & ECOSYSTEM TAB */}
          {activeTab === 'projects' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Hotel Al Sheikh Farid Highlights */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500 text-white font-bold shadow-xs">
                    <Building className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                      হোটেল আল শেখ ফরিদ (Hotel Al Sheikh Farid)
                    </h4>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      সিরাজগঞ্জ, বাংলাদেশ • ঐতিহ্যবাহী পারিবারিক হোটেল ও মিষ্টির দোকান
                    </p>
                  </div>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  পারিবারিক হোটেল ও মিষ্টির দোকানের দৈনন্দিন ক্যাশ রেজিস্টার, ইনভেন্টরি ও অফলাইন অর্ডার ট্র্যাকিং পিডব্লিউএ (Next.js + Dexie.js + Tailwind CSS) আর্কিটেকচার দ্বারা পরিচালিত।
                </p>
              </div>

              {/* Projects Grid */}
              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ফ্ল্যাগশিপ সফটওয়্যার প্রজেক্ট ইকোসিস্টেম
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FOUNDER_PROFILE.businesses.map((b, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-800 space-y-1">
                      <div className="font-bold text-stone-900 dark:text-stone-100">{b.name}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{b.category}</div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400">{b.description}</p>
                    </div>
                  ))}
                  {FOUNDER_PROFILE.flagshipProjects.map((p, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-800 space-y-1">
                      <div className="font-bold text-stone-900 dark:text-stone-100">{p.name}</div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{p.type}</div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
                  <Code2 className="w-4 h-4 text-emerald-500" />
                  প্রযুক্তিগত দক্ষতা ও মূল স্ট্যাক (Tech Stack)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ...FOUNDER_PROFILE.techStack.frontend,
                    ...FOUNDER_PROFILE.techStack.backend,
                    ...FOUNDER_PROFILE.techStack.mobile,
                    ...FOUNDER_PROFILE.techStack.database,
                    ...FOUNDER_PROFILE.techStack.aiAndTools,
                  ].map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-mono text-[10px] font-semibold"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. ADMIN JSON TAB */}
          {activeTab === 'admin_json' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-500" />
                  লাইভ অ্যাডমিন কনফিগারেশন JSON (Dynamic from Profile ID)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(adminJsonText, 'admin_json')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors cursor-pointer"
                >
                  {copiedKey === 'admin_json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'admin_json' ? 'কপি হয়েছে!' : 'JSON কপি করুন'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-stone-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-stone-800 max-h-96">
                {adminJsonText}
              </pre>
              <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                টিপস: যেকোনো সিস্টেম বা ব্যাকএন্ডের অ্যাডমিন প্যানেলে এই অবজেক্টটি ব্যবহার করে প্রতিষ্ঠাতা বা সুপার অ্যাডমিন হিসেবে স্বয়ংক্রিয় এক্সেস ও রোল নির্ধারণ করতে পারেন।
              </p>
            </div>
          )}

          {/* 5. SQL SCHEMA TAB */}
          {activeTab === 'sql_schema' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-500" />
                  PostgreSQL / Cloud SQL স্কিমা DDL
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(postgresSqlSchema, 'sql')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors cursor-pointer"
                >
                  {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'sql' ? 'কপি হয়েছে!' : 'SQL কোড কপি করুন'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-stone-950 text-blue-300 font-mono text-xs overflow-x-auto border border-stone-800 max-h-96">
                {postgresSqlSchema}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs">
            <span className="font-semibold text-stone-800 dark:text-stone-200">👑 প্রতিষ্ঠাতা ও আর্কিটেক্ট:</span>
            <span>{profileData.fullNameBn} ({profileData.locationBn})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>চ্যাটে ফিরে যান (Back)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
