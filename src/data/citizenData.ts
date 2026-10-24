export interface EmergencyContact {
  id: string;
  nameBn: string;
  nameEn: string;
  number: string;
  category: 'emergency' | 'health' | 'police' | 'women_child' | 'govt' | 'telecom' | 'blood';
  categoryLabelBn: string;
  descriptionBn: string;
  isTollFree?: boolean;
  activeHours: string;
}

export interface PostCodeItem {
  districtBn: string;
  districtEn: string;
  divisionBn: string;
  thanaBn: string;
  thanaEn: string;
  postOfficeBn: string;
  postCode: string;
}

export interface IdentityService {
  id: string;
  titleBn: string;
  subtitleBn: string;
  descriptionBn: string;
  portalUrl?: string;
  portalName?: string;
  stepsBn: string[];
  quickAction?: {
    type: 'dial' | 'link' | 'prompt';
    value: string;
    labelBn: string;
  };
}

export interface DocumentTemplate {
  id: string;
  titleBn: string;
  purposeBn: string;
  fields: {
    key: string;
    labelBn: string;
    placeholderBn: string;
    type?: 'text' | 'textarea' | 'date';
  }[];
  generateText: (data: Record<string, string>) => string;
}

export interface GovtPortal {
  id: string;
  titleBn: string;
  categoryBn: string;
  url: string;
  descriptionBn: string;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'c-999',
    nameBn: 'জাতীয় জরুরি সেবা (পুলিশ, অ্যাম্বুলেন্স, ফায়ার সার্ভিস)',
    nameEn: 'National Emergency Service (999)',
    number: '999',
    category: 'emergency',
    categoryLabelBn: 'জাতীয় জরুরি সেবা',
    descriptionBn: 'যেকোনো অপরাধ, দুর্ঘটনা, আগুন বা তাত্ক্ষণিক অ্যাম্বুলেন্সের প্রয়োজনে ২৪/৭ সম্পূর্ণ ফ্রি কল।',
    isTollFree: true,
    activeHours: '২৪ ঘণ্টা (সার্বক্ষণিক)',
  },
  {
    id: 'c-333',
    nameBn: 'সরকারি তথ্য ও নাগরিক সেবা কল সেন্টার',
    nameEn: 'Citizen Information & Services (333)',
    number: '333',
    category: 'govt',
    categoryLabelBn: 'সরকারি সেবা',
    descriptionBn: 'সরকারি বিভিন্ন দপ্তর, ভাতা, সামাজিক নিরাপত্তা, জন্ম নিবন্ধন ও কর্মকর্তা সংক্রান্ত তথ্যের জন্য।',
    isTollFree: false,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-109',
    nameBn: 'নারী ও শিশু নির্যাতন প্রতিরোধ সেল',
    nameEn: 'Women & Child Abuse Helpline (109)',
    number: '109',
    category: 'women_child',
    categoryLabelBn: 'নারী ও শিশু',
    descriptionBn: 'নারী বা শিশুদের যেকোনো নির্যাতন, ইভটিজিং বা বাল্যবিয়ে প্রতিরোধের জন্য ২৪ ঘণ্টা ফ্রি হেল্পলাইন।',
    isTollFree: true,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-1098',
    nameBn: 'চাইল্ড হেল্পলাইন (শিশুদের সুরক্ষা ও অধিকার)',
    nameEn: 'Child Helpline (1098)',
    number: '1098',
    category: 'women_child',
    categoryLabelBn: 'শিশু সহায়তা',
    descriptionBn: 'বিপদাপন্ন যেকোনো শিশুর সহায়তা ও পরামর্শের জন্য ফ্রি কল সেন্টার।',
    isTollFree: true,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-106',
    nameBn: 'দুদক অভিযোগ হটলাইন (দুর্নীতি দমন কমিশন)',
    nameEn: 'Anti-Corruption Commission Helpline (106)',
    number: '106',
    category: 'govt',
    categoryLabelBn: 'দুর্নীতি দমন',
    descriptionBn: 'যেকোনো সরকারি দপ্তরে ঘুষ বা দুর্নীতির ঘটনা তাৎক্ষণিক জানাতে সরাসরি ফ্রি কল।',
    isTollFree: true,
    activeHours: 'অফিস সময় (সকাল ৯টা - বিকাল ৫টা)',
  },
  {
    id: 'c-16122',
    nameBn: 'নাগরিক ভূমি সেবা ও খতিয়ান/নামজারি হেল্পডেস্ক',
    nameEn: 'Citizen Land Services Helpline (16122)',
    number: '16122',
    category: 'govt',
    categoryLabelBn: 'ভূমি সেবা',
    descriptionBn: 'ই-নামজারি, জমির খতিয়ান, খাজনা প্রদান ও ভূমি জটিলতা সংক্রান্ত পরামর্শ।',
    isTollFree: false,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-16263',
    nameBn: 'স্বাস্থ্য বাতায়ন (২৪ ঘণ্টা ডাক্তারের বিনামূল্যে পরামর্শ)',
    nameEn: 'Health Helpline (16263)',
    number: '16263',
    category: 'health',
    categoryLabelBn: 'স্বাস্থ্য সেবা',
    descriptionBn: 'অভিজ্ঞ এমবিবিএস ডাক্তারের কাছ থেকে জরুরি চিকিৎসা পরামর্শ ও সরকারি হাসপাতালের তথ্য।',
    isTollFree: false,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-16430',
    nameBn: 'জাতীয় আইনগত সহায়তা (লিগ্যাল এইড)',
    nameEn: 'National Legal Aid Services (16430)',
    number: '16430',
    category: 'govt',
    categoryLabelBn: 'আইনি সহায়তা',
    descriptionBn: 'দরিদ্র ও অসহায় নাগরিকদের বিনামূল্যে সরকারি উকিল ও আইনি পরামর্শ প্রদানের টোল ফ্রি হেল্পলাইন।',
    isTollFree: true,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-105',
    nameBn: 'জাতীয় পরিচয়পত্র ও এনআইডি উইং হেল্পলাইন',
    nameEn: 'National ID Card (NID) Helpline (105)',
    number: '105',
    category: 'govt',
    categoryLabelBn: 'এনআইডি ও ভোটার',
    descriptionBn: 'স্মার্ট কার্ড, এনআইডি সংশোধন, হারানো এনআইডি উত্তোলন ও ভোটার তালিকা সংক্রান্ত তথ্য।',
    isTollFree: false,
    activeHours: 'সকাল ৯টা - বিকাল ৫টা',
  },
  {
    id: 'c-16445',
    nameBn: 'বিআরটিএ হেল্পডেস্ক (ড্রাইভিং লাইসেন্স ও ফিটনেস)',
    nameEn: 'BRTA Helpline (16445)',
    number: '16445',
    category: 'govt',
    categoryLabelBn: 'বিআরটিএ',
    descriptionBn: 'ড্রাইভিং লাইসেন্স আবেদন, নবায়ন ও গাড়ির ডিজিটাল নম্বর প্লেট সংক্রান্ত তথ্য।',
    isTollFree: false,
    activeHours: 'সকাল ৯টা - বিকাল ৫টা',
  },
  {
    id: 'c-16256',
    nameBn: 'পাসপোর্ট ও ই-পাসপোর্ট সেবা হেল্পলাইন',
    nameEn: 'Passport Office Helpline (16256)',
    number: '16256',
    category: 'govt',
    categoryLabelBn: 'পাসপোর্ট',
    descriptionBn: 'ই-পাসপোর্ট আবেদন, ভেরিফিকেশন ও ডেলিভারি সংক্রান্ত জরুরি তথ্য।',
    isTollFree: false,
    activeHours: 'সকাল ৯টা - বিকাল ৫টা',
  },
  {
    id: 'c-16123',
    nameBn: 'কৃষি কল সেন্টার (কৃষি, মৎস্য ও প্রাণিসম্পদ)',
    nameEn: 'Agriculture Call Center (16123)',
    number: '16123',
    category: 'govt',
    categoryLabelBn: 'কৃষি তথ্য',
    descriptionBn: 'ফসল, পশুপালন, মাছ চাষ ও রোগবালাই দমনে বিশেষজ্ঞদের সরাসরি পরামর্শ।',
    isTollFree: false,
    activeHours: 'সকাল ৭টা - রাত ৯টা',
  },
  {
    id: 'c-1090',
    nameBn: 'দুর্যোগের আগাম বার্তা ও আবহাওয়া সতর্কতা',
    nameEn: 'Disaster Early Warning (1090)',
    number: '1090',
    category: 'emergency',
    categoryLabelBn: 'দুর্যোগ বার্তা',
    descriptionBn: 'ঘূর্ণিঝড়, বন্যা ও নদীবন্দরের সতর্ক সংকেত জানতে ফ্রি ভয়েস কল।',
    isTollFree: true,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-fire-hq',
    nameBn: 'ফায়ার সার্ভিস অ্যান্ড সিভিল ডিফেন্স সদরদপ্তর কন্ট্রোল রুম',
    nameEn: 'Fire Service HQ Control Room',
    number: '02223355555',
    category: 'emergency',
    categoryLabelBn: 'ফায়ার সার্ভিস',
    descriptionBn: 'জরুরি অগ্নিকাণ্ড, উদ্ধার অভিযান ও সড়ক দুর্ঘটনার জন্য সরাসরি জরুরি লাইন। (বিকল্প: 01730336699)',
    isTollFree: false,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-dmp-ctrl',
    nameBn: 'ঢাকা মেট্রোপলিটন পুলিশ (DMP) সেন্ট্রাল কন্ট্রোল রুম',
    nameEn: 'DMP Central Control Room',
    number: '01320037844',
    category: 'police',
    categoryLabelBn: 'পুলিশ',
    descriptionBn: 'ঢাকা মহানগরের যেকোনো জরুরি অপরাধ, নিরাপত্তা ও ট্রাফিক সহায়তার জন্য। (বিকল্প: 02-223381188)',
    isTollFree: false,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-cyber-police',
    nameBn: 'সাইবার পুলিশ সেন্টার (সিআইডি ও পুলিশ হেডকোয়ার্টার্স)',
    nameEn: 'Cyber Police Centre (CID)',
    number: '01769691522',
    category: 'police',
    categoryLabelBn: 'সাইবার ক্রাইম',
    descriptionBn: 'ফেসবুক হ্যাক, অনলাইনে ব্ল্যাকমেইল, বিকাশ/নগদ প্রতারণা ও সাইবার হয়রানির অভিযোগ। (বিকল্প: 01320000888)',
    isTollFree: false,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-red-crescent',
    nameBn: 'বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি রক্ত কেন্দ্র',
    nameEn: 'Red Crescent Blood Center',
    number: '029116563',
    category: 'blood',
    categoryLabelBn: 'রক্তদান ও ব্লাড ব্যাংক',
    descriptionBn: 'জরুরি রক্তের গ্রুপের সন্ধান ও রক্ত সংগ্রহ কেন্দ্র (মোহাম্মদপুর, ঢাকা)। (বিকল্প: 01814208307)',
    isTollFree: false,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-quantum-blood',
    nameBn: 'কোয়ান্টাম ল্যাব ও ব্লাড ব্যাংক',
    nameEn: 'Quantum Foundation Blood Lab',
    number: '01714010869',
    category: 'blood',
    categoryLabelBn: 'রক্তদান ও ব্লাড ব্যাংক',
    descriptionBn: 'শান্তিনগর ঢাকা রক্ত কেন্দ্র, ২৪ ঘণ্টা যেকোনো গ্রুপের নিরাপদ রক্তের জন্য যোগাযোগ।',
    isTollFree: false,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-gp-help',
    nameBn: 'গ্রামীণফোন কাস্টমার কেয়ার',
    nameEn: 'Grameenphone Helpline (121)',
    number: '121',
    category: 'telecom',
    categoryLabelBn: 'মোবাইল অপারেটর',
    descriptionBn: 'সিম সংক্রান্ত সমস্যা, ইন্টারনেট ও ব্যালেন্স হেল্পলাইন (GP নম্বর থেকে)।',
    isTollFree: false,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-bl-help',
    nameBn: 'বাংলালিংক কাস্টমার কেয়ার',
    nameEn: 'Banglalink Helpline (121)',
    number: '121',
    category: 'telecom',
    categoryLabelBn: 'মোবাইল অপারেটর',
    descriptionBn: 'বাংলালিংক সিম সেবা ও ইন্টারনেট হেল্পলাইন।',
    isTollFree: false,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-robi-help',
    nameBn: 'রবি / এয়ারটেল কাস্টমার কেয়ার',
    nameEn: 'Robi / Airtel Helpline (123)',
    number: '123',
    category: 'telecom',
    categoryLabelBn: 'মোবাইল অপারেটর',
    descriptionBn: 'রবি এবং এয়ারটেল ব্যবহারকারীদের ২৪ ঘণ্টা গ্রাহক সেবা।',
    isTollFree: false,
    activeHours: '২৪ ঘণ্টা',
  },
  {
    id: 'c-teletalk-help',
    nameBn: 'টেলিটক কাস্টমার কেয়ার',
    nameEn: 'Teletalk Helpline (121)',
    number: '121',
    category: 'telecom',
    categoryLabelBn: 'মোবাইল অপারেটর',
    descriptionBn: 'সরকারি টেলিটক সিম ও ভর্তি/চাকরি আবেদন হেল্পলাইন।',
    isTollFree: false,
    activeHours: '২৪ ঘণ্টা',
  },
];

export const MAJOR_POSTCODES: PostCodeItem[] = [
  { districtBn: 'ঢাকা', districtEn: 'Dhaka', divisionBn: 'ঢাকা', thanaBn: 'মতিঝিল / জিপিও', thanaEn: 'Motijheel', postOfficeBn: 'ঢাকা জিপিও (Dhaka GPO)', postCode: '1000' },
  { districtBn: 'ঢাকা', districtEn: 'Dhaka', divisionBn: 'ঢাকা', thanaBn: 'মিরপুর', thanaEn: 'Mirpur', postOfficeBn: 'মিরপুর সেকশন ১-২', postCode: '1216' },
  { districtBn: 'ঢাকা', districtEn: 'Dhaka', divisionBn: 'ঢাকা', thanaBn: 'উত্তরা', thanaEn: 'Uttara', postOfficeBn: 'উত্তরা মডেল টাউন', postCode: '1230' },
  { districtBn: 'ঢাকা', districtEn: 'Dhaka', divisionBn: 'ঢাকা', thanaBn: 'ধানমন্ডি', thanaEn: 'Dhanmondi', postOfficeBn: 'ধানমন্ডি সাব পোস্ট অফিস', postCode: '1205' },
  { districtBn: 'ঢাকা', districtEn: 'Dhaka', divisionBn: 'ঢাকা', thanaBn: 'গুলশান / বনানী', thanaEn: 'Gulshan', postOfficeBn: 'গুলশান পোস্ট অফিস', postCode: '1212' },
  { districtBn: 'ঢাকা', districtEn: 'Dhaka', divisionBn: 'ঢাকা', thanaBn: 'মোহাম্মদপুর', thanaEn: 'Mohammadpur', postOfficeBn: 'মোহাম্মদপুর টাউন হল', postCode: '1207' },
  { districtBn: 'ঢাকা', districtEn: 'Dhaka', divisionBn: 'ঢাকা', thanaBn: 'বাড্ডা / রামপুরা', thanaEn: 'Badda', postOfficeBn: 'বাড্ডা পোস্ট অফিস', postCode: '1214' },
  { districtBn: 'ঢাকা', districtEn: 'Dhaka', divisionBn: 'ঢাকা', thanaBn: 'যাত্রাবাড়ী', thanaEn: 'Jatrabari', postOfficeBn: 'যাত্রাবাড়ী পোস্ট অফিস', postCode: '1204' },
  { districtBn: 'ঢাকা', districtEn: 'Dhaka', divisionBn: 'ঢাকা', thanaBn: 'সাভার', thanaEn: 'Savar', postOfficeBn: 'সাভার সেনানিবাস / বাজার', postCode: '1340' },
  { districtBn: 'ঢাকা', districtEn: 'Dhaka', divisionBn: 'ঢাকা', thanaBn: 'কেরানীগঞ্জ', thanaEn: 'Keraniganj', postOfficeBn: 'কেরানীগঞ্জ সাব পোস্ট অফিস', postCode: '1310' },

  { districtBn: 'চট্টগ্রাম', districtEn: 'Chattogram', divisionBn: 'চট্টগ্রাম', thanaBn: 'কোতোয়ালী', thanaEn: 'Kotwali', postOfficeBn: 'চট্টগ্রাম জিপিও (GPO)', postCode: '4000' },
  { districtBn: 'চট্টগ্রাম', districtEn: 'Chattogram', divisionBn: 'চট্টগ্রাম', thanaBn: 'পাঁচলাইশ', thanaEn: 'Panchlaish', postOfficeBn: 'নাসিরাবাদ', postCode: '4255' },
  { districtBn: 'চট্টগ্রাম', districtEn: 'Chattogram', divisionBn: 'চট্টগ্রাম', thanaBn: 'পতেঙ্গা / হালিশহর', thanaEn: 'Patenga', postOfficeBn: 'চট্টগ্রাম বিমানবন্দর / পোর্ট', postCode: '4204' },
  { districtBn: 'কক্সবাজার', districtEn: 'Coxs Bazar', divisionBn: 'চট্টগ্রাম', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'কক্সবাজার প্রধান ডাকঘর', postCode: '4700' },
  { districtBn: 'কুমিল্লা', districtEn: 'Cumilla', divisionBn: 'চট্টগ্রাম', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'কুমিল্লা প্রধান ডাকঘর', postCode: '3500' },
  { districtBn: 'ফেনী', districtEn: 'Feni', divisionBn: 'চট্টগ্রাম', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'ফেনী প্রধান ডাকঘর', postCode: '3900' },
  { districtBn: 'নোয়াখালী', districtEn: 'Noakhali', divisionBn: 'চট্টগ্রাম', thanaBn: 'সুধারাম / সদর', thanaEn: 'Sadar', postOfficeBn: 'মাইজদী কোর্ট', postCode: '3800' },
  { districtBn: 'ব্রাহ্মণবাড়িয়া', districtEn: 'Brahmanbaria', divisionBn: 'চট্টগ্রাম', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'ব্রাহ্মণবাড়িয়া প্রধান ডাকঘর', postCode: '3400' },

  { districtBn: 'সিলেট', districtEn: 'Sylhet', divisionBn: 'সিলেট', thanaBn: 'কোতোয়ালী / সদর', thanaEn: 'Kotwali', postOfficeBn: 'সিলেট প্রধান ডাকঘর (GPO)', postCode: '3100' },
  { districtBn: 'মৌলভীবাজার', districtEn: 'Moulvibazar', divisionBn: 'সিলেট', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'মৌলভীবাজার প্রধান ডাকঘর', postCode: '3200' },
  { districtBn: 'হবিগঞ্জ', districtEn: 'Habiganj', divisionBn: 'সিলেট', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'হবিগঞ্জ প্রধান ডাকঘর', postCode: '3300' },
  { districtBn: 'সুনামগঞ্জ', districtEn: 'Sunamganj', divisionBn: 'সিলেট', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'সুনামগঞ্জ প্রধান ডাকঘর', postCode: '3000' },

  { districtBn: 'রাজশাহী', districtEn: 'Rajshahi', divisionBn: 'রাজশাহী', thanaBn: 'বোয়ালিয়া / সদর', thanaEn: 'Boalia', postOfficeBn: 'রাজশাহী প্রধান ডাকঘর (GPO)', postCode: '6000' },
  { districtBn: 'বগুড়া', districtEn: 'Bogura', divisionBn: 'রাজশাহী', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'বগুড়া প্রধান ডাকঘর', postCode: '5800' },
  { districtBn: 'পাবনা', districtEn: 'Pabna', divisionBn: 'রাজশাহী', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'পাবনা প্রধান ডাকঘর', postCode: '6600' },
  { districtBn: 'সিরাজগঞ্জ', districtEn: 'Sirajganj', divisionBn: 'রাজশাহী', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'সিরাজগঞ্জ প্রধান ডাকঘর', postCode: '6700' },
  { districtBn: 'নাটোর', districtEn: 'Natore', divisionBn: 'রাজশাহী', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'নাটোর প্রধান ডাকঘর', postCode: '6400' },

  { districtBn: 'খুলনা', districtEn: 'Khulna', divisionBn: 'খুলনা', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'খুলনা প্রধান ডাকঘর (GPO)', postCode: '9000' },
  { districtBn: 'যশোর', districtEn: 'Jashore', divisionBn: 'খুলনা', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'যশোর প্রধান ডাকঘর', postCode: '7400' },
  { districtBn: 'কুষ্টিয়া', districtEn: 'Kushtia', divisionBn: 'খুলনা', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'কুষ্টিয়া প্রধান ডাকঘর', postCode: '7000' },
  { districtBn: 'সাতক্ষীরা', districtEn: 'Satkhira', divisionBn: 'খুলনা', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'সাতক্ষীরা প্রধান ডাকঘর', postCode: '9400' },

  { districtBn: 'বরিশাল', districtEn: 'Barishal', divisionBn: 'বরিশাল', thanaBn: 'কোতোয়ালী', thanaEn: 'Kotwali', postOfficeBn: 'বরিশাল প্রধান ডাকঘর', postCode: '8200' },
  { districtBn: 'পটুয়াখালী', districtEn: 'Patuakhali', divisionBn: 'বরিশাল', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'পটুয়াখালী প্রধান ডাকঘর', postCode: '8600' },
  { districtBn: 'ভোলা', districtEn: 'Bhola', divisionBn: 'বরিশাল', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'ভোলা প্রধান ডাকঘর', postCode: '8300' },

  { districtBn: 'রংপুর', districtEn: 'Rangpur', divisionBn: 'রংপুর', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'রংপুর প্রধান ডাকঘর (GPO)', postCode: '5400' },
  { districtBn: 'দিনাজপুর', districtEn: 'Dinajpur', divisionBn: 'রংপুর', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'দিনাজপুর প্রধান ডাকঘর', postCode: '5200' },

  { districtBn: 'ময়মনসিংহ', districtEn: 'Mymensingh', divisionBn: 'ময়মনসিংহ', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'ময়মনসিংহ প্রধান ডাকঘর', postCode: '2200' },
  { districtBn: 'জামালপুর', districtEn: 'Jamalpur', divisionBn: 'ময়মনসিংহ', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'জামালপুর প্রধান ডাকঘর', postCode: '2000' },
  { districtBn: 'নেত্রকোণা', districtEn: 'Netrokona', divisionBn: 'ময়মনসিংহ', thanaBn: 'সদর', thanaEn: 'Sadar', postOfficeBn: 'নেত্রকোণা প্রধান ডাকঘর', postCode: '2400' },
];

export const IDENTITY_SERVICES: IdentityService[] = [
  {
    id: 'sim-ownership',
    titleBn: 'আপনার নামে কয়টি সিম কার্ড রেজিস্ট্রেশন করা আছে (*16001#)?',
    subtitleBn: 'বায়োমেট্রিক সিম মালিকানা যাচাইয়ের অফিসিয়াল পদ্ধতি',
    descriptionBn: 'আপনার জাতীয় পরিচয়পত্র (NID) ব্যবহার করে আপনার অজান্তে অন্য কেউ সিম তুলে অপরাধ করছে কি না তা জানা অত্যন্ত জরুরি। বিটিআরসি-র নিয়মানুযায়ী যেকোনো মোবাইল থেকেই এটি ফ্রি যাচাই করা যায়।',
    stepsBn: [
      'আপনার মোবাইলের ডায়ালপ্যাডে গিয়ে *16001# ডায়াল করুন।',
      'স্ক্রিনে একটি ইনপুট প্রম্পট আসলে আপনার জাতীয় পরিচয়পত্রের শেষ ৪টি সংখ্যা (Last 4 Digits of NID) টাইপ করে Send করুন।',
      'কিছুক্ষণের মধ্যে আপনার মোবাইলে ফিরতি এসএমএস আসবে, যেখানে আপনার এনআইডি নম্বরে নিবন্ধিত প্রতিটি অপারেটরের (GP, BL, Robi, Airtel, Teletalk) মোট সিম সংখ্যা এবং সেগুলোর শুরু ও শেষের নম্বর তালিকা দেখতে পাবেন।',
      'যদি অচেনা কোনো নম্বর দেখতে পান, তাৎক্ষণিক সংশ্লিষ্ট কাস্টমার কেয়ারে গিয়ে সেই সিমটি বন্ধ (Deregister) করে দিন।',
    ],
    quickAction: {
      type: 'dial',
      value: '*16001#',
      labelBn: '*16001# ডায়াল করুন',
    },
  },
  {
    id: 'nid-verification',
    titleBn: 'জাতীয় পরিচয়পত্র (NID) ও ভোটার তথ্য অনলাইন যাচাই',
    subtitleBn: 'নির্বাচন কমিশন এনআইডি উইং পোর্টাল (services.nidw.gov.bd)',
    descriptionBn: 'কোনো ব্যক্তির দেওয়া এনআইডি নম্বর, জন্ম তারিখ এবং নাম সঠিক কি না তা নির্বাচন কমিশনের অফিসিয়াল সার্ভার বা সেবা পোর্টাল থেকে যাচাইয়ের নিয়মাবলী।',
    portalUrl: 'https://services.nidw.gov.bd/nid-pub/',
    portalName: 'services.nidw.gov.bd',
    stepsBn: [
      'বাংলাদেশ নির্বাচন কমিশনের অফিসিয়াল এনআইডি পোর্টালে (services.nidw.gov.bd) প্রবেশ করুন।',
      '"রেজিস্ট্রেশন" বা "নাগরিক কর্নার" ট্যাবে ক্লিক করুন।',
      'ব্যক্তির জাতীয় পরিচয়পত্র নম্বর (বা ভোটার স্লিপ নম্বর) এবং জন্ম তারিখ (দিন-মাস-বছর) প্রদান করুন।',
      'ক্যাপচা কোড পূরণ করে সাবমিট করলে সংশ্লিষ্ট ব্যক্তির বর্তমান ঠিকানা, স্থায়ী ঠিকানা এবং ভোটার রেজিস্ট্রেশন তথ্য প্রদর্শিত হয়।',
      'প্রতারণা এড়াতে কোনো অপরিচিত ব্যক্তির সাথে লেনদেন বা চুক্তি করার আগে এনআইডি ফটোকপির মূল তথ্যের সাথে অনলাইন তথ্য মিলিয়ে নিন।',
    ],
    quickAction: {
      type: 'link',
      value: 'https://services.nidw.gov.bd/nid-pub/',
      labelBn: 'এনআইডি পোর্টাল খুলুন',
    },
  },
  {
    id: 'birth-cert-verification',
    titleBn: 'জন্ম ও মৃত্যু নিবন্ধন অনলাইন যাচাই (BDRIS)',
    subtitleBn: '১৭ ডিজিটের জন্ম সনদ নম্বর যাচাই (everify.bdris.gov.bd)',
    descriptionBn: 'স্কুল ভর্তি, পাসপোর্ট আবেদন বা বয়সের প্রমাণ হিসেবে দেওয়া জন্ম সনদটি স্থানীয় সরকার বিভাগের কেন্দ্রীয় ডাটাবেসে অনলাইনে সংরক্ষিত আছে কি না তা যেকোনো ব্যক্তি ঘরে বসেই এক সেকেন্ডে ফ্রি যাচাই করতে পারেন।',
    portalUrl: 'https://everify.bdris.gov.bd/',
    portalName: 'everify.bdris.gov.bd',
    stepsBn: [
      'everify.bdris.gov.bd ওয়েবসাইটে যান।',
      '১৭ ডিজিটের জন্ম নিবন্ধন নম্বরটি ইংরেজি সংখ্যায় লিখুন (১৬ বা ১০ ডিজিটের পুরনো সনদ হলে সংশ্লিষ্ট ইউনিয়ন/পৌরসভায় অনলাইনে রূপান্তর করতে হয়)।',
      'জন্ম তারিখ দিন/মাস/বছর আকারে লিখুন (YYYY-MM-DD)।',
      'গাণিতিক ক্যাপচাটি সমাধান করে "Search" বাটনে চাপুন।',
      'যদি ব্যক্তির নাম, পিতার নাম, মাতার নাম এবং নিবন্ধিত কার্যালয়ের সিলসহ অনলাইন কপি চলে আসে, তবে সনদটি শতভাগ আসল।',
    ],
    quickAction: {
      type: 'link',
      value: 'https://everify.bdris.gov.bd/',
      labelBn: 'জন্ম নিবন্ধন ভেরিফাই করুন',
    },
  },
  {
    id: 'epassport-tracking',
    titleBn: 'ই-পাসপোর্ট আবেদন স্ট্যাটাস ও ডেলিভারি ট্র্যাকিং',
    subtitleBn: 'ডিআইপি পাসপোর্ট ভেরিফিকেশন (epassport.gov.bd)',
    descriptionBn: 'পাসপোর্টের জন্য পুলিশ ভেরিফিকেশন হয়েছে কি না, পাসপোর্ট প্রিন্ট হয়েছে কি না বা ডেলিভারির জন্য প্রস্তুত কি না তা অনলাইন থেকেই জানা যায়।',
    portalUrl: 'https://www.epassport.gov.bd/authorization/application-status',
    portalName: 'epassport.gov.bd/application-status',
    stepsBn: [
      'epassport.gov.bd সাইটে গিয়ে "Check Status" মেনুতে যান।',
      'আপনার অ্যাপ্লিকেশন ওআইডি (Application ID, যেমন OID1000...) অথবা ডেলিভারি স্লিপ নম্বর টাইপ করুন।',
      'আবেদনকারীর জন্ম তারিখ প্রদান করুন।',
      'ক্যাপচা পূরণ করে "Check" চাপলে বর্তমান অবস্থা (যেমন: Pending Police Verification, Approved, Printing, Ready for Delivery) স্পষ্ট দেখাবে।',
    ],
    quickAction: {
      type: 'link',
      value: 'https://www.epassport.gov.bd/authorization/application-status',
      labelBn: 'পাসপোর্ট স্ট্যাটাস চেক করুন',
    },
  },
  {
    id: 'scam-call-protection',
    titleBn: 'অচেনা নম্বর, ভুয়া কল ও প্রতারক যাচাই নির্দেশিকা',
    subtitleBn: 'ট্রু-কলার, ডিজিটাল নিরাপত্তা ও সাইবার ক্রাইমে অভিযোগের উপায়',
    descriptionBn: 'কোনো অচেনা নম্বর থেকে ফোন করে আত্মীয় পরিচয়ে টাকা চাওয়া, বিকাশ/নগদ পিন চাওয়া, পুলিশ/র‍্যাব পরিচয় দিয়ে ভয় দেখানো বা লটারি জেতার মিথ্যা বার্তা আসলে কীভাবে সতর্ক হবেন।',
    stepsBn: [
      'অপরিচিত নম্বরের সত্যতা যাচাই করতে Truecaller অ্যাপে নম্বরটি সার্চ দিয়ে দেখতে পারেন অন্য ব্যবহারকারীরা একে কী নামে সেভ বা স্প্যাম হিসেবে রিপোর্ট করেছেন।',
      'মনে রাখবেন: বিকাশ, নগদ, রকেট বা কোনো ব্যাংক কর্মকর্তা কখনোই আপনার গোপন পিন বা ওটিপি (OTP) জানতে চাইবেন না।',
      'যদি কোনো নম্বর থেকে মৃত্যু সংবাদ বা পুলিশি ঝামেলার ভয় দেখিয়ে ইমার্জেন্সি টাকা পাঠাতে বলে—আগে আপনার আত্মীয়ের প্রচলিত মূল নম্বরে ফোন করে নিশ্চিত হন।',
      'প্রতারণার শিকার হলে বা নিয়মিত হুমকি পেলে তাৎক্ষণিক ৯৯৯ (999) এ জানান এবং নিকটস্থ থানায় জিডি করুন।',
      'অনলাইনে ব্ল্যাকমেইল বা সাইবার অপরাধের ক্ষেত্রে পুলিশ হেডকোয়ার্টার্সের সাইবার সেন্টারে সরাসরি কল করুন: 01320-000888 অথবা 01769-691522।',
    ],
    quickAction: {
      type: 'prompt',
      value: 'একটি অচেনা নাম্বার থেকে আমাকে ফোন দিয়ে হুমকি ও টাকা দাবি করা হচ্ছে। আমি কীভাবে আইনি পদক্ষেপ নেব এবং থানায় সাধারণ ডায়েরি করব বিস্তারিত পরামর্শ দাও।',
      labelBn: 'এআই থেকে আইনি পরামর্শ নিন',
    },
  },
];

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'gd-lost-phone',
    titleBn: 'মোবাইল ফোন হারানোর সাধারণ ডায়েরি (GD)',
    purposeBn: 'মোবাইল বা সিম হারালে থানায় জমা দেওয়ার প্রমিত দরখাস্ত',
    fields: [
      { key: 'thana', labelBn: 'থানার নাম', placeholderBn: 'যেমন: ধানমন্ডি থানা, ঢাকা' },
      { key: 'applicantName', labelBn: 'আপনার নাম', placeholderBn: 'যেমন: মো: রফিকুল ইসলাম' },
      { key: 'fatherName', labelBn: 'পিতার নাম', placeholderBn: 'যেমন: মো: আবুল হোসেন' },
      { key: 'address', labelBn: 'বর্তমান ঠিকানা', placeholderBn: 'যেমন: বাড়ি ১২, রোড ৪, ধানমন্ডি, ঢাকা' },
      { key: 'phone', labelBn: 'যোগাযোগের মোবাইল নম্বর', placeholderBn: 'যেমন: 017XXXXXXXX' },
      { key: 'nid', labelBn: 'জাতীয় পরিচয়পত্র (NID) নম্বর', placeholderBn: 'যেমন: 199XXXXXXXXXX' },
      { key: 'deviceInfo', labelBn: 'হারানো মোবাইলের বিবরণ (মডেল, রঙ, IMEI, সিম নম্বর)', placeholderBn: 'যেমন: Samsung Galaxy A54, কাল রঙের, IMEI: 35XXXXXXXXXXXXX, সিম নম্বর: 018XXXXXXXX' },
      { key: 'incidentPlaceTime', labelBn: 'হারানোর স্থান ও তারিখ/সময়', placeholderBn: 'যেমন: গত ২০ মার্চ ২০২৬ তারিখ বিকাল আনুমানিক ৪:০০ ঘটিকায় ধানমন্ডি ২৭ নম্বর বাসস্ট্যান্ড এলাকায়' },
    ],
    generateText: (data) => {
      const today = new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
      return `তারিখ: ${today}

বরাবর,
ভারপ্রাপ্ত কর্মকর্তা (OC)
${data.thana || '[থানার নাম]'}
বাংলাদেশ পুলিশ।

বিষয়: মোবাইল ফোন হারানোর বিষয়ে সাধারণ ডায়েরি (GD) করার আবেদন।

জনাব,
যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, আমি নিম্ন স্বাক্ষরকারী ${data.applicantName || '[আপনার নাম]'}, পিতা: ${data.fatherName || '[পিতার নাম]'}, বর্তমান ঠিকানা: ${data.address || '[বর্তমান ঠিকানা]'}, এনআইডি নং: ${data.nid || '[এনআইডি নম্বর]'}, মোবাইল নং: ${data.phone || '[মোবাইল নম্বর]'}।

আপনার সদয় অবগতির জন্য জানাচ্ছি যে, ${data.incidentPlaceTime || '[হারানোর স্থান ও তারিখ/সময়]'} আমার ব্যবহৃত মোবাইল ফোনটি অসাবধানতাবশত হারিয়ে যায়। সম্ভাব্য সকল স্থানে খোঁজাখুঁজি করিয়াও উক্ত ফোনটি পাওয়া যায় নাই।

হারিয়ে যাওয়া মোবাইল ফোনের বিবরণ:
- ব্র্যান্ড ও মডেল: ${data.deviceInfo || '[মডেল, রঙ, আইএমইআই ও সিম নম্বর]'}

ভবিষ্যতে উক্ত মোবাইল ফোন বা সিম কার্ড দ্বারা কোনো প্রকার বেআইনি বা সমাজবিরোধী কার্যকলাপ সংঘটিত হইলে তাহার দায়ভার যেন আমার ওপর না বর্তায় এবং সিমটি পুনরায় উত্তোলন করার সুবিধার্থে বিষয়টি থানায় সাধারণ ডায়েরি (GD) হিসেবে লিপিবদ্ধ করতে আপনার মর্জি হয়।

বিনীত নিবেদক,
স্বাক্ষর:
নাম: ${data.applicantName || '[আপনার নাম]'}
মোবাইল: ${data.phone || '[মোবাইল নম্বর]'}
জাতীয় পরিচয়পত্র নম্বর: ${data.nid || '[এনআইডি]'}`;
    },
  },
  {
    id: 'leave-application',
    titleBn: 'অফিস বা কর্মক্ষেত্রে ছুটির আবেদনপত্র',
    purposeBn: 'জরুরি পারিবারিক বা অসুস্থতাজনিত ছুটির অফিশিয়াল দরখাস্ত',
    fields: [
      { key: 'managerDesignation', labelBn: 'দায়িত্বপ্রাপ্ত কর্মকর্তার পদবী', placeholderBn: 'যেমন: ব্যবস্থাপনা পরিচালক / বিভাগীয় প্রধান / প্রিন্সিপাল' },
      { key: 'companyName', labelBn: 'কোম্পানি বা প্রতিষ্ঠানের নাম ও ঠিকানা', placeholderBn: 'যেমন: এবিসি লিমিটেড, কারওয়ান বাজার, ঢাকা' },
      { key: 'applicantName', labelBn: 'আপনার নাম ও পদবী', placeholderBn: 'যেমন: তানভীর আহমেদ, সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার' },
      { key: 'reason', labelBn: 'ছুটির সুনির্দিষ্ট কারণ', placeholderBn: 'যেমন: হঠাৎ অসুস্থতা ও ডাক্তার কর্তৃক বিশ্রাম গ্রহণের পরামর্শের কারণে' },
      { key: 'duration', labelBn: 'ছুটির সময়কাল (কত তারিখ থেকে কত তারিখ)', placeholderBn: 'যেমন: ২৫ সেপ্টেম্বর ২০২৬ থেকে ২৭ সেপ্টেম্বর ২০২৬ পর্যন্ত মোট ৩ দিন' },
    ],
    generateText: (data) => {
      const today = new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
      return `তারিখ: ${today}

বরাবর,
${data.managerDesignation || '[দায়িত্বপ্রাপ্ত কর্মকর্তার পদবী]'}
${data.companyName || '[প্রতিষ্ঠান ও ঠিকানার নাম]'}

বিষয়: ${data.reason ? data.reason.slice(0, 30) : 'অসুস্থতাজনিত কারণে'} ছুটির জন্য আবেদন।

মহোদয়/জনাব,
সবিনয় নিবেদন এই যে, আমি আপনার প্রতিষ্ঠানে ${data.applicantName || '[আপনার নাম ও পদবী]'} হিসেবে কর্মরত আছি। ${data.reason || '[ছুটির সুনির্দিষ্ট কারণ]'} এর জন্য আগামী ${data.duration || '[ছুটির সময়কাল]'} আমার পক্ষে অফিসে উপস্থিত থেকে দায়িত্ব পালন করা সম্ভব হচ্ছে না। 

ছুটিকালীন সময়ে যেকোনো জরুরি প্রয়োজনে আমি মোবাইল ফোন এবং ইমেইলে যোগাযোগ রক্ষা করতে সচেষ্ট থাকব এবং আমার অনুপস্থিতিতে সংশ্লিষ্ট দায়িত্ব যাতে ব্যাহত না হয় সে বিষয়ে প্রয়োজনীয় ব্যবস্থা গ্রহণ করেছি।

অতএব, মহোদয়ের নিকট বিনীত প্রার্থনা, উক্ত পরিস্থিতির গুরুত্ব বিবেচনা করে আমাকে উল্লেখিত দিনের ছুটি মঞ্জুর করতে আপনার সদয় মর্জি হয়।

বিনীত নিবেদক,
স্বাক্ষর:
${data.applicantName || '[আপনার নাম ও পদবী]'}
মোবাইল: [মোবাইল নম্বর]
ইমেইল: [ইমেইল ঠিকানা]`;
    },
  },
  {
    id: 'citizen-certificate',
    titleBn: 'নাগরিক ও চারিত্রিক সনদের আবেদনপত্র',
    purposeBn: 'ইউনিয়ন পরিষদ চেয়ারম্যান বা ওয়ার্ড কাউন্সিলর বরাবর আবেদন',
    fields: [
      { key: 'councillorTitle', labelBn: 'কর্তৃপক্ষের পদবী ও এলাকা', placeholderBn: 'যেমন: মেয়র / কাউন্সিলর, ওয়ার্ড নং ২১, ঢাকা উত্তর সিটি কর্পোরেশন' },
      { key: 'applicantName', labelBn: 'আবেদনকারীর নাম', placeholderBn: 'যেমন: সালমা বেগম' },
      { key: 'fatherOrHusband', labelBn: 'পিতা/স্বামীর নাম', placeholderBn: 'যেমন: মো: হাবিবুর রহমান' },
      { key: 'address', labelBn: 'ওয়ার্ড ও এলাকার পূর্ণাঙ্গ ঠিকানা', placeholderBn: 'যেমন: বাড়ি ৪৪, রোড ২, বাড্ডা, ঢাকা' },
      { key: 'purpose', labelBn: 'সনদের উদ্দেশ্য', placeholderBn: 'যেমন: সরকারি চাকরিতে আবেদন / পাসপোর্ট নবায়নের জন্য' },
    ],
    generateText: (data) => {
      const today = new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
      return `তারিখ: ${today}

বরাবর,
${data.councillorTitle || '[কাউন্সিলর / চেয়ারম্যান মহোদয়]'}

বিষয়: নাগরিক ও চারিত্রিক সনদপত্র প্রদানের জন্য আবেদন।

জনাব,
যথাবিহিত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, আমি ${data.applicantName || '[আবেদনকারীর নাম]'}, পিতা/স্বামী: ${data.fatherOrHusband || '[পিতা/স্বামীর নাম]'}, আপনার ওয়ার্ড/ইউনিয়নের স্থায়ী বাসিন্দা। আমি দীর্ঘদিন যাবত অত্র এলাকায় সততা ও সুনামের সহিত বসবাস করিয়া আসিতেছি এবং কখনো কোনো রাষ্ট্র ও সমাজবিরোধী কর্মকাণ্ডে লিপ্ত ছিলাম না।

আমার ${data.purpose || '[সনদের উদ্দেশ্য]'} এর জন্য একটি নাগরিক/চারিত্রিক সনদপত্র একান্ত প্রয়োজন।

অতএব, অনুগ্রহপূর্বক সার্বিক বিবেচনায় আমাকে অত্র এলাকার স্থায়ী নাগরিক হিসেবে একটি প্রত্যয়ন/সনদপত্র প্রদান করিয়া বাধিত করিবেন।

বিনীত,
${data.applicantName || '[আবেদনকারীর নাম]'}
বর্তমান ঠিকানা: ${data.address || '[পূর্ণাঙ্গ ঠিকানা]'}
মোবাইল: [মোবাইল নম্বর]`;
    },
  },
];

export const GOVT_PORTALS: GovtPortal[] = [
  {
    id: 'mygov',
    titleBn: 'মাইগভ (MyGov) - বাংলাদেশ জাতীয় ডিজিটাল সেবা বাতায়ন',
    categoryBn: 'কেন্দ্রীয় সরকার',
    url: 'https://www.mygov.bd/',
    descriptionBn: 'এক ঠিকানায় সকল মন্ত্রণালয় ও দপ্তরের ২,০০০+ সরকারি নাগরিক সেবা অনলাইনে প্রাপ্তির কেন্দ্রীয় গেটওয়ে।',
  },
  {
    id: 'nid',
    titleBn: 'জাতীয় পরিচয়পত্র ও ভোটার সেবা (NID Wing)',
    categoryBn: 'নির্বাচন কমিশন',
    url: 'https://services.nidw.gov.bd/nid-pub/',
    descriptionBn: 'অনলাইনে এনআইডি ডাউনলোড, সংশোধন, নতুন ভোটার রেজিস্ট্রেশন ও স্মার্টকার্ড স্ট্যাটাস।',
  },
  {
    id: 'epassport',
    titleBn: 'বাংলাদেশ ই-পাসপোর্ট অনলাইন পোর্টাল',
    categoryBn: 'পাসপোর্ট ও ইমিগ্রেশন',
    url: 'https://www.epassport.gov.bd/',
    descriptionBn: 'নতুন পাসপোর্টের অনলাইন ফরম পূরণ, ফি প্রদান এবং অ্যাপ্লিকেশন স্ট্যাটাস ট্র্যাকিং।',
  },
  {
    id: 'bdris',
    titleBn: 'জন্ম ও মৃত্যু নিবন্ধন অনলাইন ভেরিফিকেশন (BDRIS)',
    categoryBn: 'স্থানীয় সরকার',
    url: 'https://everify.bdris.gov.bd/',
    descriptionBn: '১৭ ডিজিটের জন্ম সনদ অনলাইন সত্যতা যাচাই এবং জন্ম নিবন্ধন সংশোধনের কেন্দ্রীয় প্ল্যাটফর্ম।',
  },
  {
    id: 'land',
    titleBn: 'ডিজিটাল ভূমি সেবা পোর্টাল (ই-নামজারি ও খতিয়ান)',
    categoryBn: 'ভূমি মন্ত্রণালয়',
    url: 'https://land.gov.bd/',
    descriptionBn: 'অনলাইনে জমির পর্চা/খতিয়ান অনুসন্ধান, ই-নামজারি ও ঘরে বসে ভূমি উন্নয়ন কর পরিশোধ।',
  },
  {
    id: 'brta',
    titleBn: 'বিআরটিএ সার্ভিস পোর্টাল (BSP)',
    categoryBn: 'সড়ক পরিবহন',
    url: 'https://bsp.brta.gov.bd/',
    descriptionBn: 'লার্নার ড্রাইভিং লাইসেন্স, স্মার্ট কার্ড ড্রাইভিং লাইসেন্স আবেদন ও গাড়ির ফি প্রদান।',
  },
  {
    id: 'nbr',
    titleBn: 'ই-টিআইএন রেজিস্ট্রেশন ও কর সেবা (NBR)',
    categoryBn: 'জাতীয় রাজস্ব বোর্ড',
    url: 'https://secure.incometax.gov.bd/TINHome',
    descriptionBn: 'মাত্র ৫ মিনিটে অনলাইনে বিনামূল্যে ১২ ডিজিটের ই-টিআইএন সনদপত্র প্রস্তুতকরণ।',
  },
  {
    id: 'probashi',
    titleBn: 'আমি প্রবাসী ও বৈদেশিক কর্মসংস্থান পোর্টাল',
    categoryBn: 'প্রবাসী কল্যাণ',
    url: 'https://amiprobashi.com/',
    descriptionBn: 'বিএমইটি (BMET) ডাটাবেস রেজিস্ট্রেশন, ভিসা তথ্য ও বিদেশে চাকরির বৈধ প্রক্রিয়া।',
  },
];
