import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone,
  PhoneCall,
  MapPin,
  ShieldCheck,
  FileText,
  Globe,
  Search,
  Copy,
  Check,
  ExternalLink,
  Send,
  X,
  Sparkles,
  AlertCircle,
  Clock,
  Compass,
  Building,
  Navigation,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  ArrowLeft
} from 'lucide-react';
import {
  EMERGENCY_CONTACTS,
  MAJOR_POSTCODES,
  IDENTITY_SERVICES,
  DOCUMENT_TEMPLATES,
  GOVT_PORTALS,
  EmergencyContact,
  PostCodeItem,
  IdentityService,
  DocumentTemplate,
} from '../data/citizenData';

interface CitizenServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (prompt: string) => void;
  onOpenLiveLocation?: () => void;
}

type TabType = 'contacts' | 'address' | 'identity' | 'documents' | 'portals';

export const CitizenServicesModal: React.FC<CitizenServicesModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
  onOpenLiveLocation,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('contacts');

  // Contact search & filter
  const [contactSearch, setContactSearch] = useState('');
  const [contactCategory, setContactCategory] = useState<string>('all');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Address search
  const [addressSearch, setAddressSearch] = useState('');
  const [copiedPostCode, setCopiedPostCode] = useState<string | null>(null);

  // Document writer state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DOCUMENT_TEMPLATES[0].id);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [copiedDoc, setCopiedDoc] = useState(false);

  if (!isOpen) return null;

  const currentTemplate = DOCUMENT_TEMPLATES.find((t) => t.id === selectedTemplateId) || DOCUMENT_TEMPLATES[0];

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleCopyPostCode = (item: PostCodeItem) => {
    const text = `${item.districtBn} (${item.thanaBn}) - পোস্ট কোড: ${item.postCode}`;
    navigator.clipboard.writeText(text);
    setCopiedPostCode(item.postCode);
    setTimeout(() => setCopiedPostCode(null), 2000);
  };

  const handleCopyGeneratedDoc = () => {
    const generated = currentTemplate.generateText(formData);
    navigator.clipboard.writeText(generated);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  const handleSendDocToAI = () => {
    const generated = currentTemplate.generateText(formData);
    const prompt = `নিচে আমার একটি আবেদনপত্রের প্রাথমিক খসড়া দেওয়া হলো। এটিকে আরও পরিশীলিত, ব্যাকরণগতভাবে নিখুঁত ও আনুষ্ঠানিক রূপ দিয়ে পূর্ণাঙ্গ দরখাস্তটি লিখে দাও:\n\n${generated}`;
    onSendToChat(prompt);
    onClose();
  };

  // Filter contacts
  const filteredContacts = EMERGENCY_CONTACTS.filter((c) => {
    const matchesSearch =
      c.nameBn.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.nameEn.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.number.includes(contactSearch) ||
      c.descriptionBn.toLowerCase().includes(contactSearch.toLowerCase());
    const matchesCategory = contactCategory === 'all' || c.category === contactCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter postcodes
  const filteredPostcodes = MAJOR_POSTCODES.filter((p) => {
    const query = addressSearch.toLowerCase();
    return (
      p.districtBn.toLowerCase().includes(query) ||
      p.districtEn.toLowerCase().includes(query) ||
      p.thanaBn.toLowerCase().includes(query) ||
      p.thanaEn.toLowerCase().includes(query) ||
      p.postOfficeBn.toLowerCase().includes(query) ||
      p.postCode.includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-stone-900 border-0 sm:border border-stone-200 dark:border-stone-800 rounded-none sm:rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
                  মানুষের এ টু জেড জনসেবা ও তথ্য কেন্দ্র
                </h2>
                <span className="hidden md:inline px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 shrink-0">
                  Citizen Toolkit
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 truncate">
                মোবাইল নাম্বার ডিরেক্টরি • ঠিকানা ও পোস্টকোড • নাম-পরিচয় যাচাই • দরখাস্ত ও জিডি রাইটার
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-all cursor-pointer shadow-xs border border-stone-300/60 dark:border-stone-700/60 min-h-[38px]"
              title="চ্যাটে ফিরে যান (Back)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ফিরে যান</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 border-b border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-950/40 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0 py-2">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'contacts'
                ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-300 shadow-xs border border-stone-200/80 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:bg-white/50 dark:hover:bg-stone-850'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>মোবাইল ও জরুরি হটলাইন</span>
          </button>

          <button
            onClick={() => setActiveTab('address')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'address'
                ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-300 shadow-xs border border-stone-200/80 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:bg-white/50 dark:hover:bg-stone-850'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>ঠিকানা ও পোস্টকোড ফাইন্ডার</span>
          </button>

          <button
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'identity'
                ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-300 shadow-xs border border-stone-200/80 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:bg-white/50 dark:hover:bg-stone-850'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>নাম ও পরিচয় যাচাই গাইড</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'documents'
                ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-300 shadow-xs border border-stone-200/80 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:bg-white/50 dark:hover:bg-stone-850'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>দরখাস্ত ও জিডি ফরম্যাট (GD)</span>
          </button>

          <button
            onClick={() => setActiveTab('portals')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'portals'
                ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-300 shadow-xs border border-stone-200/80 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:bg-white/50 dark:hover:bg-stone-850'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-purple-500" />
            <span>সরকারি ই-সেবা পোর্টাল</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: CONTACTS & HELPLINES */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="হটলাইন বা দপ্তরের নাম / নাম্বার খুঁজুন (যেমন: 999, পুলিশ, স্বাস্থ্য, রক্ত, দুদক)..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-750 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  />
                  {contactSearch && (
                    <button
                      onClick={() => setContactSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: 'all', label: 'সকল' },
                    { id: 'emergency', label: 'জরুরি সেবা' },
                    { id: 'health', label: 'স্বাস্থ্য ও চিকিৎসা' },
                    { id: 'govt', label: 'সরকারি দপ্তর' },
                    { id: 'police', label: 'পুলিশ ও সাইবার' },
                    { id: 'blood', label: 'রক্তদান' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setContactCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                        contactCategory === cat.id
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Custom Number Finder Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      নির্দিষ্ট থানা, উপজেলা হাসপাতাল বা এসপি অফিসের মোবাইল নাম্বার দরকার?
                    </h4>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400">
                      লাইভ গুগল সার্চ ও এআই দিয়ে যেকোনো কর্মকর্তা, দফতর বা অ্যাম্বুলেন্স চালকের নম্বর খুঁজুন।
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onSendToChat(
                      'আমার জরুরি প্রয়োজনে [স্থান বা উপজেলার নাম লিখুন] এর নিকটস্থ সরকারি হাসপাতাল, ডিউটি অফিসার এবং থানার দায়িত্বপ্রাপ্ত অফিসিয়াল মোবাইল নম্বরগুলো খুঁজে দিন।'
                    );
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-xs"
                >
                  এআই দিয়ে খুঁজুন
                </button>
              </div>

              {/* Contacts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredContacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/50 hover:bg-white dark:hover:bg-stone-850 transition-all flex flex-col justify-between space-y-2.5 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 mb-1">
                            {c.categoryLabelBn}
                          </span>
                          <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">
                            {c.nameBn}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono block">
                            {c.number}
                          </span>
                          {c.isTollFree && (
                            <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase">
                              সম্পূর্ণ ফ্রি
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                        {c.descriptionBn}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-[10px] text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {c.activeHours}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyNumber(c.number)}
                          className="px-2.5 py-1 rounded-lg bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 text-[10px] font-semibold transition-colors flex items-center gap-1"
                          title="নম্বর কপি করুন"
                        >
                          {copiedNumber === c.number ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>কপি</span>
                            </>
                          )}
                        </button>
                        <a
                          href={`tel:${c.number}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Phone className="w-3 h-3" />
                          <span>কল করুন</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ADDRESS & POSTCODE FINDER */}
          {activeTab === 'address' && (
            <div className="space-y-4">
              {/* Top Banner with GPS Location */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      আপনার নিজের বর্তমান ঠিকানা ও জিপিএস অবস্থান জানতে চান?
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400">
                    এক ক্লিকে আপনার লাইভ ঠিকানা, গুগল ম্যাপস কোঅর্ডিনেট এবং আশেপাশের পোস্টকোড বের করুন।
                  </p>
                </div>
                {onOpenLiveLocation && (
                  <button
                    onClick={onOpenLiveLocation}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>লাইভ জিপিএস লোকেশন দেখুন</span>
                  </button>
                )}
              </div>

              {/* Postcode Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                  placeholder="জেলা, থানা বা পোস্ট অফিসের নাম লিখুন (যেমন: ধানমন্ডি, চট্টগ্রাম, মিরপুর, সিলেট, 1205)..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-750 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* AI Address Query Prompt helper */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                <span className="font-semibold">দ্রুত প্রশ্ন করুন:</span>
                <button
                  onClick={() => {
                    onSendToChat(
                      'আগারগাঁও পাসপোর্ট অফিস ও আঞ্চলিক পাসপোর্ট অফিসগুলোর সঠিক ঠিকানা ও পৌঁছানোর উপায় বিস্তারিত দাও।'
                    );
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors border border-stone-200/60 dark:border-stone-700"
                >
                  পাসপোর্ট অফিসের ঠিকানা
                </button>
                <button
                  onClick={() => {
                    onSendToChat(
                      'ঢাকার প্রধান ভারতীয় ভিসা আবেদন কেন্দ্র (IVAC Jamuna Future Park) এবং গুলশান এম্বাসি এলাকার সঠিক ঠিকানা ও অফিস সময় কত?'
                    );
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors border border-stone-200/60 dark:border-stone-700"
                >
                  ভারতীয় ভিসা কেন্দ্রের ঠিকানা
                </button>
                <button
                  onClick={() => {
                    onSendToChat(
                      'নির্বাচন কমিশন সচিবালয় ও এনআইডি উইংয়ের প্রধান কার্যালয়ের ঠিকানা এবং যোগাযোগের ফোন নম্বর দাও।'
                    );
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors border border-stone-200/60 dark:border-stone-700"
                >
                  এনআইডি ভবনের ঠিকানা
                </button>
              </div>

              {/* Postcodes List Table */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 dark:bg-stone-800/80 sticky top-0 text-[11px] font-bold text-stone-700 dark:text-stone-300">
                      <tr>
                        <th className="p-2.5 pl-4">বিভাগ / জেলা</th>
                        <th className="p-2.5">থানা / উপজেলা</th>
                        <th className="p-2.5">ডাকঘর</th>
                        <th className="p-2.5 text-right pr-4">পোস্ট কোড</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {filteredPostcodes.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-stone-50 dark:hover:bg-stone-850/60 transition-colors"
                        >
                          <td className="p-2.5 pl-4 font-medium text-stone-900 dark:text-stone-100">
                            {item.districtBn} ({item.divisionBn})
                          </td>
                          <td className="p-2.5 text-stone-700 dark:text-stone-300">{item.thanaBn}</td>
                          <td className="p-2.5 text-stone-600 dark:text-stone-400">{item.postOfficeBn}</td>
                          <td className="p-2.5 pr-4 text-right">
                            <button
                              onClick={() => handleCopyPostCode(item)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-xs"
                              title="কপি করতে ক্লিক করুন"
                            >
                              {copiedPostCode === item.postCode ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{item.postCode}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IDENTITY & VERIFICATION GUIDES */}
          {activeTab === 'identity' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">সতর্কতা ও তথ্যের নিরাপত্তা:</strong> বাংলাদেশ সাইবার নিরাপত্তা ও ব্যক্তিগত তথ্য সুরক্ষা আইন অনুসারে কোনো ব্যক্তির ব্যক্তিগত তথ্য বিনা অনুমতিতে সংগ্রহ বা অপব্যবহার দণ্ডনীয় অপরাধ। নিচে সরকারি বৈধ উপায়ে এনআইডি, সিম কার্ড বা জন্ম নিবন্ধন যাচাইয়ের অফিসিয়াল নিয়মাবলী দেওয়া হলো।
                </div>
              </div>

              <div className="space-y-3.5">
                {IDENTITY_SERVICES.map((serv) => (
                  <div
                    key={serv.id}
                    className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {serv.titleBn}
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {serv.subtitleBn}
                        </p>
                      </div>

                      {serv.quickAction && (
                        <div>
                          {serv.quickAction.type === 'dial' ? (
                            <a
                              href={`tel:${encodeURIComponent(serv.quickAction.value)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{serv.quickAction.labelBn}</span>
                            </a>
                          ) : serv.quickAction.type === 'link' ? (
                            <a
                              href={serv.quickAction.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{serv.quickAction.labelBn}</span>
                            </a>
                          ) : (
                            <button
                              onClick={() => {
                                onSendToChat(serv.quickAction!.value);
                                onClose();
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 text-white font-semibold text-xs shadow-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>{serv.quickAction.labelBn}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      {serv.descriptionBn}
                    </p>

                    <div className="p-3 rounded-lg bg-white dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-750 space-y-1.5">
                      <p className="text-[11px] font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                        ধাপে ধাপে যাচাই করার পদ্ধতি:
                      </p>
                      <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-400">
                        {serv.stepsBn.map((step, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {sIdx + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENTS & GD WRITER */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Template selector pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {DOCUMENT_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      setFormData({});
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${
                      selectedTemplateId === tmpl.id
                        ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {tmpl.titleBn}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Inputs side */}
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {currentTemplate.titleBn} এর তথ্য পূরণ করুন
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {currentTemplate.purposeBn}
                    </p>
                  </div>

                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {currentTemplate.fields.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 block">
                          {field.labelBn}
                        </label>
                        <input
                          type="text"
                          value={formData[field.key] || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={field.placeholderBn}
                          className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Preview Side */}
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      লাইভ দরখাস্ত প্রিভিউ
                    </h4>
                    <span className="text-[10px] text-stone-400">অফিশিয়াল ফরম্যাট</span>
                  </div>

                  <div className="flex-1 p-3 rounded-lg bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs font-mono text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto select-all">
                    {currentTemplate.generateText(formData)}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={handleCopyGeneratedDoc}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-200 dark:border-stone-700"
                    >
                      {copiedDoc ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>কপি সম্পন্ন</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>দরখাস্ত কপি করুন</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSendDocToAI}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>এআই দিয়ে কাস্টমাইজ করুন</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GOVT E-SERVICES PORTALS */}
          {activeTab === 'portals' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOVT_PORTALS.map((portal) => (
                  <a
                    key={portal.id}
                    href={portal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-850 transition-all flex flex-col justify-between space-y-2.5 shadow-2xs hover:border-emerald-400 dark:hover:border-emerald-600"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {portal.categoryBn}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {portal.titleBn}
                      </h4>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-2 mt-1">
                        {portal.descriptionBn}
                      </p>
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate flex items-center gap-1 pt-1 border-t border-stone-200/60 dark:border-stone-800">
                      <span>{portal.url}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              যে কোনো প্রশ্ন বা জরুরি ড্রাফটের জন্য এআই চ্যাটে মেসেজ দিন।
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-200 text-xs font-semibold transition-all cursor-pointer shadow-xs border border-stone-700/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>চ্যাটে ফিরে যান (Back)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
