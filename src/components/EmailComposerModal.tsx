import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Send,
  Copy,
  Check,
  Download,
  Sparkles,
  FileText,
  FileCode,
  RotateCcw,
  Languages,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  ArrowLeft,
  Share2,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { callDirectGeminiStream, isDirectGeminiAvailable } from '../lib/directGemini';

export interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecipient?: string;
  initialSubject?: string;
  initialBody?: string;
  initialLanguage?: 'bn' | 'en';
  onSendToChat?: (prompt: string) => void;
}

type EmailLanguage = 'bn' | 'en';
type EmailTone = 'formal' | 'friendly' | 'concise' | 'urgent';

interface EmailTemplate {
  id: string;
  title: string;
  lang: EmailLanguage;
  category: string;
  subject: string;
  body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  // ===================== Bengali Templates =====================
  {
    id: 'bn-job-application',
    title: '💼 চাকরির আবেদন ও সিভি প্রেরণ',
    lang: 'bn',
    category: 'ক্যারিয়ার ও চাকরি',
    subject: '[পদের নাম]-এর জন্য চাকরির আবেদন — [আপনার নাম]',
    body: `বরাবর,
হায়ারিং ম্যানেজার / মানবসম্পদ বিভাগ
[প্রতিষ্ঠানের নাম]
[প্রতিষ্ঠানের ঠিকানা]

বিষয়: [পদের নাম] পদের জন্য আবেদন।

মহোদয়,
বিনীত নিবেদন এই যে, আমি আপনার প্রতিষ্ঠানে সম্প্রতি বিজ্ঞাপিত "[পদের নাম]" পদের জন্য একজন আগ্রহী প্রার্থী হিসেবে আবেদন জানাচ্ছি। 

আমার পূর্ববর্তী [বছর]-এর অভিজ্ঞতা এবং [আপনার প্রধান দক্ষতা / যেমন: ওয়েব ডেভেলপমেন্ট, সফটওয়্যার আর্কিটেকচার, ডেটা অ্যানালাইটিক্স]-এ দক্ষতা আপনার প্রতিষ্ঠানের লক্ষ্য অর্জনে গুরুত্বপূর্ণ ভূমিকা পালন করবে বলে আমি দৃঢ়ভাবে বিশ্বাস করি। আমি প্রযুক্তিগত সমস্যা সমাধান এবং দলগত কাজে বিশেষ পারদর্শী।

আমার পূর্ণাঙ্গ জীবনবৃত্তান্ত (CV / Resume) এবং পোর্টফোলিও লিঙ্ক এই ইমেইলের সাথে সংযুক্ত করা হলো। একটি ইন্টারভিউয়ের মাধ্যমে আমার দক্ষতা বিস্তারিত উপস্থাপনের সুযোগ পেলে আমি কৃতজ্ঞ থাকব।

আপনার মূল্যবান সময়ের জন্য আন্তরিক ধন্যবাদ।

বিনীত,
[আপনার নাম]
[আপনার বর্তমান পদবি / ফোন নম্বর]
[আপনার ইমেইল ঠিকানা]
[পোর্টফোলিও / গিটহাব লিঙ্ক]`,
  },
  {
    id: 'bn-leave-request',
    title: '🏖️ অফিশিয়াল ছুটির আবেদন',
    lang: 'bn',
    category: 'অফিস ও কর্মক্ষেত্র',
    subject: 'ছুটির জন্য আবেদন — [আপনার নাম], [আপনার পদবি]',
    body: `শ্রদ্ধেয় [সুপারভাইজার / ম্যানেজারের নাম],

বিনীত নিবেদন এই যে, আমার [ব্যক্তিগত জরুরি প্রয়োজন / অসুস্থতা / পারিবারিক কারণ]-এর জন্য আগামী [শুরুর তারিখ] হতে [শেষের তারিখ] পর্যন্ত মোট [দিন সংখ্যা] দিনের নৈমিত্তিক ছুটির প্রয়োজন।

আমার অনুপস্থিতিকালীন সময়ে জরুরি কাজের সমন্বয় করতে [সহকর্মীর নাম] দায়িত্ব গ্রহণে সদয় সম্মতি দিয়েছেন। ছুটির মধ্যেও জরুরি প্রয়োজনে আমি ইমেইল বা ফোনে যোগাযোগে প্রস্তুত থাকব।

অতএব, মহোদয়ের নিকট বিনীত প্রার্থনা, উক্ত দিনগুলোর জন্য আমার ছুটি মঞ্জুর করতে আপনার সদয় মর্জি হয়।

ধন্যবাদান্তে,
[আপনার নাম]
[পদবি ও বিভাগ]
[এমপ্লয়ি আইডি / ফোন নম্বর]`,
  },
  {
    id: 'bn-business-proposal',
    title: '🤝 ব্যবসায়িক প্রস্তাবনা ও অংশীদারিত্ব',
    lang: 'bn',
    category: 'বিজনেস ও কোলাবোরেশন',
    subject: 'ব্যবসায়িক অংশীদারিত্ব ও প্রযুক্তি সমন্বয় প্রস্তাবনা — [আপনার কোম্পানি / উদ্যোগ]',
    body: `প্রিয় [প্রাপকের নাম / সম্মানীয় স্যার],

আশা করি ভালো আছেন। 

আমি [আপনার নাম], [আপনার প্রতিষ্ঠানের নাম]-এর পক্ষ থেকে লিখছি। আমরা দীর্ঘদিন ধরে [আপনার সেবার ধরন / সফটওয়্যার সমাধান ও এআই অটোমেশন] নিয়ে কাজ করছি।

আপনার স্বনামধন্য প্রতিষ্ঠান [প্রাপকের প্রতিষ্ঠানের নাম]-এর চমৎকার কাজের অগ্রগতি আমরা গভীর আগ্রহের সাথে পর্যবেক্ষণ করেছি। আমরা বিশ্বাস করি, আমাদের উদ্ভাবনী সমাধান এবং আপনার নেটওয়ার্কের যৌথ সমন্বয়ে [নির্দিষ্ট লক্ষ্য বা সুবিধা, যেমন: কার্যক্ষমতা বৃদ্ধি ও বিক্রয় প্রসার]-এ অভাবনীয় অগ্রগতি সম্ভব।

এই বিষয়ে আগামী সপ্তাহে সুবিধাজনক সময়ে ১০-১৫ মিনিটের একটি সংক্ষিপ্ত অনলাইন মিটিং বা কলের মাধ্যমে বিস্তারিত আলোচনার আমন্ত্রণ জানাচ্ছি।

আপনার মূল্যবান মতামতের অপেক্ষায় রইলাম।

শুভকামনাসহ,
[আপনার নাম]
[প্রতিষ্ঠাতা / বিজনেস ডেভেলপমেন্ট লিড]
[আপনার ওয়েবসাইট লিঙ্ক]
[ফোন নম্বর]`,
  },
  {
    id: 'bn-project-followup',
    title: '📨 কাজের অগ্রগতি ও ফলো-আপ',
    lang: 'bn',
    category: 'প্রজেক্ট ম্যানেজমেন্ট',
    subject: 'ফলো-আপ: [প্রজেক্টের নাম]-এর সর্বশেষ অগ্রগতি পর্যালোচনা',
    body: `প্রিয় [ক্লায়েন্ট / ম্যানেজারের নাম],

আশা করি আপনি সুস্থ ও নিরাপদে আছেন।

আমাদের চলমান প্রজেক্ট "[প্রজেক্টের নাম]"-এর সর্বশেষ আপডেট আপনাকে অবগত করতে এই ইমেইলটি লিখছি। বর্তমান মাইলস্টোনের কাজ সফলভাবে সম্পন্ন হয়েছে এবং প্রাথমিক পর্যালোচনা প্রস্তুত।

প্রধান অগ্রগতি সংক্ষেপে:
১. [অগ্রগতি পয়েন্ট ১]
২. [অগ্রগতি পয়েন্ট ২]
৩. [পরবর্তী ধাপ ও সময়সীমা]

অনুগ্রহ করে আপনার মূল্যবান ফিডব্যাক প্রদান করবেন। কোনো সংশোধনের প্রয়োজন হলে দ্রুত জানাবেন।

ধন্যবাদান্তে,
[আপনার নাম]
[টিম লিড / ডেভেলপার]`,
  },
  {
    id: 'bn-support-request',
    title: '⚠️ কারিগরি সহায়তা ও কাস্টমার সার্ভিস',
    lang: 'bn',
    category: 'সহায়তা ও সাপোর্ট',
    subject: 'কারিগরি সহায়তা অনুরোধ: [অ্যাকাউন্ট বা সমস্যার শিরোনাম] — টিকিট/আইডি #[আইডি]',
    body: `প্রিয় সাপোর্ট টিম,

আমি [আপনার সেবা বা প্ল্যাটফর্মের নাম]-এর একজন নিয়মিত ব্যবহারকারী। সম্প্রতি আমি নিম্নোক্ত কারিগরি সমস্যার সম্মুখীন হচ্ছি:

সমস্যার বিবরণ:
- ইস্যুর ধরন: [যেমন: লগইন সমস্যা / এপিআই এরর / পেমেন্ট গেটওয়ে এরর]
- ব্রাউজার / ডিভাইস: [যেমন: Chrome / Mobile App]
- এরর বার্তা: "[এরর টেক্সট]"

সমস্যাটির দ্রুত সমাধান বা দিকনির্দেশনা প্রদান করলে অত্যন্ত উপকৃত হব। স্ক্রিনশট এবং বিস্তারিত লগ এই ইমেইলে সংযুক্ত করা হলো।

দ্রুত প্রতিক্রিয়ার জন্য ধন্যবাদ।

বিনীত,
[আপনার নাম]
[রেজিস্টার্ড ইমেইল / অ্যাকাউন্ট আইডি]`,
  },

  // ===================== English Templates =====================
  {
    id: 'en-job-application',
    title: '💼 Professional Job Application & Cover Letter',
    lang: 'en',
    category: 'Career & Employment',
    subject: 'Application for [Job Title] Role — [Your Name]',
    body: `Dear Hiring Team / [Hiring Manager's Name],

I am writing to express my strong interest in the [Job Title] position recently advertised at [Company Name]. With over [Number] years of hands-on experience in [Key Domain, e.g. Full-Stack Development, AI Engineering, Project Management], I am confident in my ability to make an immediate, positive impact on your team.

Throughout my career, I have successfully [mention 1-2 major achievements, e.g., architected scalable web applications, reduced API latency by 40%, and led cross-functional engineering teams]. I have consistently demonstrated a track record of driving innovation, writing maintainable code, and solving complex business challenges.

Attached please find my resume and portfolio for your review. I welcome the opportunity to discuss how my background and skills align with [Company Name]'s vision and technical goals.

Thank you for your time and consideration.

Warm regards,

[Your Name]
[Your Professional Title]
[Phone Number] | [Email Address]
[LinkedIn / GitHub Portfolio URL]`,
  },
  {
    id: 'en-leave-request',
    title: '🏖️ Formal Leave of Absence Request',
    lang: 'en',
    category: 'Workplace & HR',
    subject: 'Leave of Absence Request — [Your Name], [Your Department]',
    body: `Dear [Manager's Name],

I am writing to formally request a leave of absence from [Start Date] through [End Date] due to [personal reasons / medical emergency / family commitments]. I anticipate returning to work on [Return Date].

Prior to my departure, I will ensure that all my current tasks and deliverables are up to date. [Colleague's Name] has kindly agreed to handle urgent inquiries during my absence. In case of any critical matters, I will be reachable via email or mobile.

Thank you very much for your understanding and consideration.

Best regards,

[Your Name]
[Job Title & Department]
[Employee ID / Contact Information]`,
  },
  {
    id: 'en-business-proposal',
    title: '🤝 Business Partnership & Collaboration Pitch',
    lang: 'en',
    category: 'Business & Partnerships',
    subject: 'Collaboration Proposal: [Your Company] & [Target Company]',
    body: `Hi [Prospect's Name],

I hope this email finds you well.

I have been following [Target Company]'s remarkable growth in [Industry/Domain], particularly your recent initiatives in [Specific Initiative].

At [Your Company], we specialize in [Core Value Proposition, e.g., modern AI workflows, high-performance web applications, and automated payments]. We have helped clients achieve [Key Result, e.g., 3x operational efficiency and seamless cloud scale].

I believe there is a compelling synergy between our teams to [Mutual Opportunity, e.g., accelerate product delivery and reduce operational overhead].

Would you be open to a brief 10-minute introductory call next Tuesday or Wednesday to explore if a partnership makes sense?

Looking forward to connecting.

Sincerely,

[Your Name]
[Your Title]
[Company Name]
[Website / Contact Info]`,
  },
  {
    id: 'en-project-followup',
    title: '📨 Project Milestone Update & Follow-up',
    lang: 'en',
    category: 'Project Management',
    subject: 'Status Update & Next Steps: [Project Name]',
    body: `Dear [Client / Stakeholder Name],

I hope you are having a productive week.

I am pleased to share an update on the progress of [Project Name]. We have successfully accomplished the deliverables scheduled for Milestone [Number]:

Key Highlights:
1. [Key accomplishment 1]
2. [Key accomplishment 2]
3. [Testing & Quality Assurance status]

Next Steps:
- [Upcoming deliverable and target completion date]

Please review the attached staging link / document and let us know if you have any feedback or adjustments.

Thank you for your ongoing partnership.

Best regards,

[Your Name]
[Lead Developer / Project Manager]`,
  },
  {
    id: 'en-meeting-request',
    title: '📅 Schedule Meeting / Client Consultation',
    lang: 'en',
    category: 'Consultation & Scheduling',
    subject: 'Request for Meeting: [Topic / Purpose] — [Your Name]',
    body: `Dear [Recipient's Name],

I hope this email finds you well.

I would like to schedule a brief 20-30 minute meeting with you to discuss [specific agenda, e.g., project requirements, technical architecture review, contract terms].

Please let me know if any of the following slots work for your schedule:
- Option 1: [Date, Time, Timezone]
- Option 2: [Date, Time, Timezone]

If another time suits you better, please let me know and I will gladly accommodate your availability.

Thank you, and I look forward to speaking with you.

Sincerely,

[Your Name]
[Your Title / Contact Details]`,
  },
];

const DRAFT_STORAGE_KEY = 'ai_studio_email_composer_draft_v1';

export const EmailComposerModal: React.FC<EmailComposerModalProps> = ({
  isOpen,
  onClose,
  initialRecipient = '',
  initialSubject = '',
  initialBody = '',
  initialLanguage = 'bn',
  onSendToChat,
}) => {
  // Main form state
  const [recipient, setRecipient] = useState(initialRecipient);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [language, setLanguage] = useState<EmailLanguage>(initialLanguage);
  const [tone, setTone] = useState<EmailTone>('formal');

  // UI state
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [exportedFormat, setExportedFormat] = useState<string | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPromptInstruction, setAiPromptInstruction] = useState('');
  const [showAiPromptBox, setShowAiPromptBox] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Restore saved draft or initial props on mount / modal open
  useEffect(() => {
    if (!isOpen) return;

    if (initialRecipient || initialSubject || initialBody) {
      if (initialRecipient) setRecipient(initialRecipient);
      if (initialSubject) setSubject(initialSubject);
      if (initialBody) setBody(initialBody);
      if (initialLanguage) setLanguage(initialLanguage);
      return;
    }

    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.recipient && !recipient) setRecipient(parsed.recipient);
        if (parsed.subject && !subject) setSubject(parsed.subject);
        if (parsed.body && !body) setBody(parsed.body);
        if (parsed.cc) setCc(parsed.cc);
        if (parsed.bcc) setBcc(parsed.bcc);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.tone) setTone(parsed.tone);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, [isOpen, initialRecipient, initialSubject, initialBody, initialLanguage]);

  // Auto-save draft to localStorage (debounced)
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            recipient,
            cc,
            bcc,
            subject,
            body,
            language,
            tone,
            updatedAt: Date.now(),
          })
        );
      } catch (e) {}
    }, 600);
    return () => clearTimeout(timer);
  }, [recipient, cc, bcc, subject, body, language, tone, isOpen]);

  // Handle template selection
  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    setSubject(tmpl.subject);
    setBody(tmpl.body);
    setLanguage(tmpl.lang);
  };

  // Quick greetings and sign-offs insertion
  const handleInsertSnippet = (snippet: string) => {
    if (!bodyTextareaRef.current) {
      setBody((prev) => (prev ? `${prev}\n${snippet}` : snippet));
      return;
    }
    const textarea = bodyTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = body.substring(0, start);
    const textAfter = body.substring(end);
    const newText = `${textBefore}${snippet}${textAfter}`;
    setBody(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  // Clear / Reset draft
  const handleClearDraft = () => {
    const confirmMsg =
      language === 'bn'
        ? 'আপনি কি সম্পূর্ণ ইমেইল ড্রাফটটি মুছে ফেলে নতুন করে শুরু করতে চান?'
        : 'Are you sure you want to clear this email draft and start fresh?';
    if (window.confirm(confirmMsg)) {
      setRecipient('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setSelectedTemplateId('');
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {}
    }
  };

  // Copy full draft or body to clipboard
  const handleCopy = async (type: 'full' | 'body' | 'subject') => {
    let contentToCopy = '';
    if (type === 'full') {
      const parts: string[] = [];
      if (recipient.trim()) parts.push(`To: ${recipient.trim()}`);
      if (cc.trim()) parts.push(`CC: ${cc.trim()}`);
      if (bcc.trim()) parts.push(`BCC: ${bcc.trim()}`);
      if (subject.trim()) parts.push(`Subject: ${subject.trim()}`);
      parts.push('');
      parts.push(body);
      contentToCopy = parts.join('\n');
    } else if (type === 'body') {
      contentToCopy = body;
    } else if (type === 'subject') {
      contentToCopy = subject;
    }

    if (!contentToCopy.trim()) {
      setErrorMessage(
        language === 'bn'
          ? 'কপি করার জন্য কোনো টেক্সট নেই। অনুগ্রহ করে কিছু লিখুন।'
          : 'No content to copy. Please write your draft first.'
      );
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(contentToCopy);
      } else {
        const ta = document.createElement('textarea');
        ta.value = contentToCopy;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err: any) {
      console.error('Failed to copy to clipboard', err);
      setErrorMessage('ক্লিপবোর্ডে কপি করতে সমস্যা হয়েছে।');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Export draft as .txt, .eml, .html, or .md
  const handleExport = (format: 'txt' | 'eml' | 'html' | 'md') => {
    if (!subject.trim() && !body.trim()) {
      setErrorMessage(
        language === 'bn'
          ? 'এক্সপোর্ট করার জন্য বিষয় অথবা মূল বার্তা লিখুন।'
          : 'Please enter a subject or body before exporting.'
      );
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      const sanitizedTitle = (subject.trim() || 'email-draft')
        .replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '_')
        .substring(0, 40);
      let fileContent = '';
      let mimeType = 'text/plain;charset=utf-8';
      let extension = 'txt';

      if (format === 'txt') {
        fileContent = [
          '====================================',
          'PROFESSIONAL EMAIL DRAFT',
          '====================================',
          `Date: ${new Date().toLocaleString()}`,
          `To: ${recipient || 'N/A'}`,
          ...(cc ? [`CC: ${cc}`] : []),
          ...(bcc ? [`BCC: ${bcc}`] : []),
          `Subject: ${subject || '(No Subject)'}`,
          '------------------------------------',
          '',
          body,
          '',
          '====================================',
          'Created with AI Assistant & Coding Studio',
        ].join('\n');
        extension = 'txt';
      } else if (format === 'eml') {
        // Standard RFC 822 MIME format for Apple Mail, Thunderbird, Outlook
        fileContent = [
          `From: user@ai-studio.local`,
          `To: ${recipient || 'recipient@example.com'}`,
          ...(cc ? [`Cc: ${cc}`] : []),
          `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject || 'Draft')))}?=`,
          `Date: ${new Date().toUTCString()}`,
          'MIME-Version: 1.0',
          'Content-Type: text/plain; charset=UTF-8; format=flowed',
          'Content-Transfer-Encoding: 8bit',
          'X-Unsent: 1',
          '',
          body,
        ].join('\r\n');
        mimeType = 'message/rfc822';
        extension = 'eml';
      } else if (format === 'html') {
        // Formatted HTML email template
        const escapedBody = body
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>');

        fileContent = `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <title>${subject || 'Email Draft'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hind Siliguri", sans-serif; line-height: 1.6; color: #1c1917; max-width: 640px; margin: 40px auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; background: #ffffff; }
    .header { border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
    .meta-row { font-size: 13px; color: #57534e; margin-bottom: 4px; }
    .subject { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 8px; }
    .body { font-size: 15px; white-space: pre-wrap; margin-top: 24px; color: #292524; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e7e5e4; font-size: 11px; color: #78716c; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="meta-row"><strong>To:</strong> ${recipient || 'N/A'}</div>
    ${cc ? `<div class="meta-row"><strong>CC:</strong> ${cc}</div>` : ''}
    <div class="meta-row"><strong>Date:</strong> ${new Date().toLocaleString()}</div>
    <div class="subject">Subject: ${subject || '(No Subject)'}</div>
  </div>
  <div class="body">${escapedBody}</div>
  <div class="footer">
    Drafted via AI Assistant & Coding Studio • Professional Bengali & English Email Engine
  </div>
</body>
</html>`;
        mimeType = 'text/html;charset=utf-8';
        extension = 'html';
      } else if (format === 'md') {
        fileContent = [
          `# ${subject || 'Email Draft'}`,
          '',
          `- **To**: ${recipient || 'N/A'}`,
          ...(cc ? [`- **CC**: ${cc}`] : []),
          `- **Date**: ${new Date().toLocaleString()}`,
          '',
          '---',
          '',
          body,
          '',
          '---',
          '*Drafted with AI Assistant & Coding Studio*',
        ].join('\n');
        mimeType = 'text/markdown;charset=utf-8';
        extension = 'md';
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizedTitle}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportedFormat(format.toUpperCase());
      setTimeout(() => setExportedFormat(null), 3000);
    } catch (err: any) {
      console.error('Export failed', err);
      setErrorMessage('ফাইল ডাউনলোড করতে সমস্যা হয়েছে।');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // 1-Click Launch Email Clients
  const handleOpenInGmail = () => {
    const encTo = encodeURIComponent(recipient.trim());
    const encSu = encodeURIComponent(subject.trim());
    const encBody = encodeURIComponent(body.trim());
    const encCc = cc.trim() ? `&cc=${encodeURIComponent(cc.trim())}` : '';
    const encBcc = bcc.trim() ? `&bcc=${encodeURIComponent(bcc.trim())}` : '';
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encTo}&su=${encSu}&body=${encBody}${encCc}${encBcc}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenInDefaultClient = () => {
    const encTo = encodeURIComponent(recipient.trim());
    const encSu = encodeURIComponent(subject.trim());
    const encBody = encodeURIComponent(body.trim());
    const encCc = cc.trim() ? `&cc=${encodeURIComponent(cc.trim())}` : '';
    const mailtoUrl = `mailto:${encTo}?subject=${encSu}&body=${encBody}${encCc}`;
    window.location.href = mailtoUrl;
  };

  // AI Generation & Polish using Gemini
  const handleAiDraftOrPolish = async (action: 'generate' | 'polish' | 'translate') => {
    try {
      setIsAiGenerating(true);
      setErrorMessage(null);

      let systemPrompt = `You are a world-class executive communication specialist and professional email editor.
You write polite, clear, compelling, high-converting emails in both standard Bengali (প্রমিত ও মার্জিত বাংলা) and business English.
Follow professional email etiquette: clear salutation, well-structured paragraphs, bullet points if listing items, and professional sign-off.
Tone: ${tone}.
Language: ${language === 'bn' ? 'Bengali (বাংলা)' : 'English'}.

Respond in this exact JSON format so the app can update both Subject and Body cleanly:
{
  "subject": "Clear concise subject line here",
  "body": "Full body text with appropriate line breaks and formatting here"
}
Ensure the output is valid JSON without markdown quotes if possible, or inside standard json codeblock.`;

      let userPrompt = '';
      if (action === 'generate') {
        const inputInstructions = aiPromptInstruction.trim() || subject || 'Professional business inquiry';
        userPrompt = `Write a complete professional email based on these points / requirements:
"${inputInstructions}"
Recipient context: ${recipient || 'Hiring manager / Client'}
Tone: ${tone}
Language: ${language === 'bn' ? 'Bengali (বাংলা)' : 'English'}`;
      } else if (action === 'polish') {
        userPrompt = `Polish, enhance, and correct the grammar, tone (${tone}), and structure of this existing email draft:
Current Subject: "${subject}"
Current Body:
"""
${body}
"""
Language to output: ${language === 'bn' ? 'Bengali (বাংলা)' : 'English'}`;
      } else if (action === 'translate') {
        const targetLang = language === 'bn' ? 'Bengali (বাংলা)' : 'English';
        userPrompt = `Translate and culturally adapt this email draft into professional ${targetLang}:
Current Subject: "${subject}"
Current Body:
"""
${body}
"""`;
      }

      let fullResponse = '';

      if (isDirectGeminiAvailable()) {
        await callDirectGeminiStream({
          messages: [
            { role: 'user', text: userPrompt }
          ],
          prompt: userPrompt,
          enableSearch: false,
          mode: 'writing',
          onChunk: (chunk) => {
            fullResponse += chunk;
          },
        });
      } else {
        // Server proxy call
        const resp = await fetch('/api/gemini/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', text: userPrompt }],
            prompt: userPrompt,
            mode: 'writing',
            enableSearch: false,
          }),
        });

        if (!resp.ok) {
          throw new Error(`Server returned error code: ${resp.status}`);
        }

        const reader = resp.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const textChunk = decoder.decode(value, { stream: true });
            const lines = textChunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6);
                if (dataStr === '[DONE]') break;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) fullResponse += parsed.text;
                } catch (e) {}
              }
            }
          }
        }
      }

      // Try to parse JSON output
      let parsedSubject = '';
      let parsedBody = '';

      try {
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.subject) parsedSubject = parsed.subject;
          if (parsed.body) parsedBody = parsed.body;
        }
      } catch (e) {
        // Fallback if not valid JSON
      }

      if (parsedSubject || parsedBody) {
        if (parsedSubject) setSubject(parsedSubject);
        if (parsedBody) setBody(parsedBody);
      } else {
        // Fallback: extract subject or place entire response in body
        const lines = fullResponse.split('\n');
        const subjectLine = lines.find((l) => l.toLowerCase().startsWith('subject:') || l.startsWith('বিষয়:'));
        if (subjectLine) {
          setSubject(subjectLine.replace(/^(subject:|বিষয়:)/i, '').trim());
          setBody(lines.filter((l) => l !== subjectLine).join('\n').trim());
        } else {
          setBody(fullResponse.trim());
        }
      }

      setShowAiPromptBox(false);
      setAiPromptInstruction('');
    } catch (err: any) {
      console.error('AI Draft failed:', err);
      setErrorMessage(
        err.message ||
          (language === 'bn'
            ? 'এআই দিয়ে ড্রাফট তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট বা এপিআই কী চেক করুন।'
            : 'AI generation failed. Please check your network or API status.')
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  if (!isOpen) return null;

  // Word and character count
  const charCount = body.length;
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 180));

  const filteredTemplates = EMAIL_TEMPLATES.filter((t) => t.lang === language);

  return (
    <div
      id="email-composer-modal-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="email-composer-modal-content"
        className="relative w-full max-w-4xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col bg-white dark:bg-stone-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* ===================== Header ===================== */}
        <div className="p-3.5 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-950/40 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight truncate">
                  {language === 'bn' ? 'প্রফেশনাল ইমেইল কম্পোজার' : 'Professional Email Composer'}
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                  Email Studio
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                {language === 'bn'
                  ? 'বাংলা ও ইংরেজিতে অফিশিয়াল ইমেইল ড্রাফট, এডিটিং, এক্সপোর্ট ও কপি।'
                  : 'Draft, polish, export, and copy emails in Bengali or English.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-all cursor-pointer border border-stone-200 dark:border-stone-700 shadow-2xs min-h-[38px]"
              title="চ্যাটে ফিরে যান (Back to chat)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ফিরে যান</span>
            </button>
            <button
              id="close-email-composer-btn"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================== Control Bar: Language, Tone & Template Selector ===================== */}
        <div className="px-4 py-2.5 sm:px-5 border-b border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          {/* Language Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 dark:text-stone-400 font-semibold flex items-center gap-1">
              <Languages className="w-3.5 h-3.5" />
              <span>ভাষা:</span>
            </span>
            <div className="inline-flex p-0.5 rounded-xl bg-stone-200/80 dark:bg-stone-800 font-semibold">
              <button
                type="button"
                id="email-lang-bn-btn"
                onClick={() => setLanguage('bn')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  language === 'bn'
                    ? 'bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                🇧🇩 বাংলা
              </button>
              <button
                type="button"
                id="email-lang-en-btn"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 dark:text-stone-400 font-semibold hidden md:inline">ভঙ্গি (Tone):</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as EmailTone)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="formal">👔 Formal & Respectful (মার্জিত ও অফিশিয়াল)</option>
              <option value="concise">⚡ Concise & Direct (সংক্ষিপ্ত ও স্পষ্ট)</option>
              <option value="friendly">🤝 Friendly & Warm (বন্ধুত্বপূর্ণ)</option>
              <option value="urgent">🚨 Urgent (জরুরি পদক্ষেপ)</option>
            </select>
          </div>

          {/* Quick Professional Templates Dropdown */}
          <div className="flex items-center gap-1.5 min-w-[180px]">
            <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <select
              value={selectedTemplateId}
              onChange={(e) => handleApplyTemplate(e.target.value)}
              className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer truncate"
            >
              <option value="">
                {language === 'bn' ? '📋 তৈরি টেমপ্লেট বেছে নিন...' : '📋 Select a Ready Template...'}
              </option>
              {filteredTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ===================== Notifications / Toasts ===================== */}
        {copiedType && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {copiedType === 'full' && 'সম্পূর্ণ ইমেইল ড্রাফট (বিষয় + বিবরণ) ক্লিপবোর্ডে কপি হয়েছে!'}
                {copiedType === 'body' && 'ইমেইলের মূল বিবরণ ক্লিপবোর্ডে কপি হয়েছে!'}
                {copiedType === 'subject' && 'ইমেইলের বিষয় (Subject) ক্লিপবোর্ডে কপি হয়েছে!'}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
              Copied
            </span>
          </div>
        )}

        {exportedFormat && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs flex items-center gap-2 animate-in fade-in">
            <Download className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>
              <strong>{exportedFormat}</strong> ফাইলটি ডাউনলোড ফোল্ডারে সফলভাবে সেভ হয়েছে!
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ===================== Scrollable Form Area ===================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
          {/* Recipient (To) + CC/BCC Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="email-recipient" className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <span>প্রাপক (Recipient / To):</span>
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="text-stone-500 hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400 font-medium cursor-pointer"
                >
                  {showCcBcc ? 'CC / BCC লুকান' : '+ CC / BCC যোগ করুন'}
                </button>
                <span className="text-stone-300 dark:text-stone-700">|</span>
                <button
                  type="button"
                  onClick={() => setRecipient('sheikhfaridvisa164@gmail.com')}
                  className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-medium"
                  title="প্রতিষ্ঠাতা শেখ ফরিদের অফিসিয়াল ইমেইল বসান"
                >
                  শেখ ফরিদ (Founder)
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                id="email-recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="নাম বা ইমেইল ঠিকানা দিন (যেমন: hiring@company.com, manager@domain.com)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Expandable CC / BCC */}
          {showCcBcc && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 animate-in fade-in">
              <div>
                <label htmlFor="email-cc" className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  CC (কার্বন কপি):
                </label>
                <input
                  id="email-cc"
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="email-bcc" className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  BCC (ব্লাইন্ড কার্বন কপি):
                </label>
                <input
                  id="email-bcc"
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Subject Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="email-subject" className="font-bold text-stone-700 dark:text-stone-300">
                বিষয় (Subject):
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400">{subject.length} অক্ষর</span>
                {subject && (
                  <button
                    type="button"
                    onClick={() => handleCopy('subject')}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    বিষয় কপি
                  </button>
                )}
              </div>
            </div>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'ইমেইলের বিষয় লিখুন (যেমন: চাকরির আবেদন, জরুরি মিটিং প্রস্তাবনা)'
                  : 'Enter email subject (e.g., Application for Software Architect Role)'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* AI Assistance Toolbar & Quick Snippets */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 dark:border-emerald-500/30 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="toggle-ai-prompt-box-btn"
                onClick={() => setShowAiPromptBox(!showAiPromptBox)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{showAiPromptBox ? 'এআই প্রম্পট বন্ধ করুন' : '✨ এআই দিয়ে লিখুন / জেনারেট'}</span>
              </button>

              <button
                type="button"
                id="ai-polish-btn"
                onClick={() => handleAiDraftOrPolish('polish')}
                disabled={isAiGenerating || !body.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="বিদ্যমান ড্রাফটের ব্যাকরণ ও টোন উন্নত করুন"
              >
                {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                <span>পরিমার্জন ও পলিশ</span>
              </button>

              <button
                type="button"
                id="ai-translate-btn"
                onClick={() => handleAiDraftOrPolish('translate')}
                disabled={isAiGenerating || !body.trim()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="অন্য ভাষায় অনুবাদ করুন"
              >
                <Languages className="w-3.5 h-3.5 text-blue-500" />
                <span>{language === 'bn' ? 'ইংরেজিতে রূপান্তর' : 'বাংলায় রূপান্তর'}</span>
              </button>
            </div>

            {/* Quick Greetings / Signatures insertion */}
            <div className="flex items-center gap-1 flex-wrap text-[11px]">
              <span className="text-stone-500 dark:text-stone-400 font-medium hidden sm:inline">ইনসার্ট:</span>
              {language === 'bn' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleInsertSnippet('শ্রদ্ধেয় মহোদয়,\n\n')}
                    className="px-2 py-0.5 rounded-md bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    + জনাব
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertSnippet('\n\nধন্যবাদান্তে,\n[আপনার নাম]')}
                    className="px-2 py-0.5 rounded-md bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    + ধন্যবাদান্তে
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertSnippet('\n\nবিনীত,\n[আপনার নাম]')}
                    className="px-2 py-0.5 rounded-md bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    + বিনীত
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleInsertSnippet('Dear Sir/Madam,\n\n')}
                    className="px-2 py-0.5 rounded-md bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    + Dear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertSnippet('\n\nBest regards,\n[Your Name]')}
                    className="px-2 py-0.5 rounded-md bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    + Best regards
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertSnippet('\n\nSincerely,\n[Your Name]')}
                    className="px-2 py-0.5 rounded-md bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 cursor-pointer"
                  >
                    + Sincerely
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Optional AI Prompt Input Box */}
          {showAiPromptBox && (
            <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-emerald-500/30 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>আপনি কী বিষয়ে ইমেইল লিখতে চান তা সংক্ষেপে বলুন:</span>
                </span>
                <span className="text-[10px] text-stone-400">Gemini 3.8 Flash Engine</span>
              </div>
              <textarea
                value={aiPromptInstruction}
                onChange={(e) => setAiPromptInstruction(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'যেমন: আগামীকাল ও পরশু জ্বরের কারণে অফিসে অনুপস্থিত থাকব, ম্যানেজারের কাছে ২ দিনের ছুটির আবেদন লিখে দাও।'
                    : 'e.g., Ask project manager for 2 days extension on frontend milestone due to API backend updates.'
                }
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:border-emerald-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiPromptBox(false)}
                  className="px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  id="submit-ai-generate-email-btn"
                  onClick={() => handleAiDraftOrPolish('generate')}
                  disabled={isAiGenerating || (!aiPromptInstruction.trim() && !subject.trim())}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>লিখছে...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ইমেইল তৈরি করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Body Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="email-body" className="font-bold text-stone-700 dark:text-stone-300">
                ইমেইলের মূল বিবরণ (Body):
              </label>
              <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400">
                <span>{wordCount} শব্দ</span>
                <span>•</span>
                <span>{charCount} অক্ষর</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{estimatedReadTime} মিনিট পাঠ
                </span>
              </div>
            </div>
            <textarea
              id="email-body"
              ref={bodyTextareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'আপনার ইমেইলের মূল বক্তব্য এখানে লিখুন বা ওপরের টেমপ্লেট বেছে নিন...'
                  : 'Write your email body here or select a template from above...'
              }
              rows={11}
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs sm:text-sm leading-relaxed focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-sans transition-all resize-y min-h-[220px]"
            />
          </div>
        </div>

        {/* ===================== Actions Footer ===================== */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-950/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 text-xs">
          {/* Left Action Buttons: Clear & Copy */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="email-copy-full-btn"
              onClick={() => handleCopy('full')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 font-semibold border border-stone-200 dark:border-stone-700 shadow-2xs transition-colors cursor-pointer"
              title="সম্পূর্ণ ড্রাফট (বিষয় ও মূল বিবরণ) ক্লিপবোর্ডে কপি করুন"
            >
              {copiedType === 'full' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-stone-500" />}
              <span>কপি করুন (Copy Draft)</span>
            </button>

            <button
              type="button"
              id="email-copy-body-btn"
              onClick={() => handleCopy('body')}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 font-medium border border-stone-200 dark:border-stone-700 shadow-2xs transition-colors cursor-pointer"
              title="শুধু মূল বিবরণ কপি করুন"
            >
              <Copy className="w-3.5 h-3.5 text-stone-400" />
              <span>শুধু বডি</span>
            </button>

            {/* Clear Draft */}
            {(recipient || subject || body) && (
              <button
                type="button"
                id="email-clear-draft-btn"
                onClick={handleClearDraft}
                className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="ড্রাফট খালি করুন (Clear Draft)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Send to chat for review */}
            {onSendToChat && (
              <button
                type="button"
                onClick={() => {
                  const prompt = `অনুগ্রহ করে নিচের ইমেইল ড্রাফটটি পর্যালোচনা করে প্রফেশনাল ফিডব্যাক ও পরিমার্জিত সংস্করণ দিন:\n\nবিষয়: ${subject}\n\n${body}`;
                  onSendToChat(prompt);
                  onClose();
                }}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800/60 transition-colors cursor-pointer"
                title="এআই সহকারী চ্যাটে এই ইমেইলটি পর্যালোচনা করতে পাঠান"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>চ্যাটে রিভিউ পাঠান</span>
              </button>
            )}
          </div>

          {/* Right Action Buttons: Export formats & 1-click open in Gmail */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Export Dropdown */}
            <div className="relative group">
              <button
                type="button"
                id="email-export-dropdown-btn"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 font-semibold border border-stone-200 dark:border-stone-700 shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>এক্সপোর্ট ড্রাফট</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              <div className="absolute right-0 bottom-full mb-1.5 w-48 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl p-1.5 hidden group-hover:block group-focus-within:block z-30 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => handleExport('eml')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-stone-800 dark:text-stone-200 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-500" />
                  <span>EML ফাইল (.eml)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('txt')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-stone-800 dark:text-stone-200 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                  <span>টেক্সট ফাইল (.txt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('html')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-stone-800 dark:text-stone-200 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-500" />
                  <span>HTML ডকুমেন্ট (.html)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('md')}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-stone-800 dark:text-stone-200 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  <span>Markdown ফাইল (.md)</span>
                </button>
              </div>
            </div>

            {/* Default Mail Client */}
            <button
              type="button"
              id="email-open-default-client-btn"
              onClick={handleOpenInDefaultClient}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 font-semibold border border-stone-200 dark:border-stone-700 shadow-2xs transition-colors cursor-pointer"
              title="কম্পিউটার বা ফোনের ডিফল্ট ইমেইল অ্যাপে খুলুন"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              <span>মেইল অ্যাপ</span>
            </button>

            {/* Gmail Web 1-Click Launch */}
            <button
              type="button"
              id="email-open-gmail-btn"
              onClick={handleOpenInGmail}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-sm transition-all cursor-pointer active:scale-98"
              title="সরাসরি Gmail কম্পোজ উইন্ডোতে প্রি-ফিল করে ওপেন করুন"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gmail-এ পাঠান</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
