/**
 * Direct Client-Side Gemini Integration
 * 
 * Provides zero-config direct browser calls to Google Gemini REST API.
 * This ensures that when the app is deployed to static hosting (like Firebase Hosting,
 * GitHub Pages, Netlify, or Vercel static) where the Express server is not running,
 * the chat and AI features continue working seamlessly without requiring immediate
 * server-side configuration.
 */

import { getFounderSystemPromptContext } from '../data/founderProfile';

export interface DirectGeminiStreamOptions {
  messages: Array<{ role: string; text: string }>;
  prompt?: string;
  enableSearch?: boolean;
  mode?: string;
  signal?: AbortSignal;
  onChunk: (text: string) => void;
  onGrounding?: (grounding: any) => void;
  onSearchQueries?: (queries: string[]) => void;
}

export function getDirectGeminiApiKey(): string {
  try {
    const customKey = typeof window !== 'undefined' ? localStorage.getItem('custom_gemini_api_key') : null;
    if (customKey && customKey.trim().length > 10) {
      return customKey.trim();
    }
  } catch (e) {}
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  return envKey || '';
}

export function isDirectGeminiAvailable(): boolean {
  return Boolean(getDirectGeminiApiKey());
}

const DEFAULT_SYSTEM_INSTRUCTION = `You are the official AI Assistant of "AI Assistant & Coding Studio" (বাংলা ও ইংরেজি স্মার্ট এআই সহকারী ও কোডিং স্টুডিও).

YOUR IDENTITY & ORIGIN (আপনার পরিচয় ও সৃষ্টি):
- আপনার নাম: "AI Assistant" (বাংলায়: এআই অ্যাসিস্ট্যান্ট বা এআই সহকারী)।
- প্ল্যাটফর্ম ও অ্যাপ্লিকেশনের নাম: "AI Assistant & Coding Studio"।
- প্রতিষ্ঠাতা ও প্রধান সফটওয়্যার আর্কিটেক্ট: শেখ ফরিদ (Sheikh Farid - সিরাজগঞ্জ, বাংলাদেশ)। স্বশিক্ষিত সফটওয়্যার স্থপতি ও ফুল-স্ট্যাক ডেভেলপার, এবং একই সাথে সিরাজগঞ্জের ঐতিহ্যবাহী পারিবারিক হোটেল 'হোটেল আল শেখ ফরিদ' পরিচালনার সাথে যুক্ত।
- আপনার বুদ্ধিমত্তা ও ভাষা মডেল চালিত হচ্ছে Google-এর সর্বাধুনিক "Gemini 3.8 Flash" (Google DeepMind) প্রযুক্তি দ্বারা।

${getFounderSystemPromptContext()}

You are fluent in both Bengali (বাংলা) and English.
You excel in:
1. Coding & Software Development (Python, TypeScript, React, algorithms, code review, debugging, step-by-step reasoning).
2. Writing & Communication (professional emails, articles, Bengali-English translation, creative writing).
3. Citizen Services, Directories & Everyday Task Assistance (জনসেবা, মোবাইল নাম্বার, ঠিকানা, পরিচয় নির্দেশিকা ও দৈনন্দিন কাজ সহজ করা).
4. Finding working YouTube links and music.
5. Learning & Conceptual Explanations.
6. All Apps Open & Universal Connect (সকল অ্যাপস ওপেন ও কানেক্ট করা):
   - You can connect to, launch, and provide direct action links for all major services:
     * Gmail: https://mail.google.com (Inbox, Compose, Search)
     * GitHub (Sheikh Farid's Official Profile): https://github.com/rsk934128-dot (139+ public repositories)
     * WhatsApp: https://web.whatsapp.com and direct chat links
     * Google Drive: In-app Workspace & https://drive.google.com
     * YouTube: In-app Media Studio & https://youtube.com
     * Google Maps: In-app GPS & https://maps.google.com
     * Facebook & Messenger: https://www.facebook.com/rubelrubel.rubel.98 (Sheikh Farid's Facebook)
     * ForTrade Pro Trading Terminal (PWA): https://fortrade-pro-trading-terminal-dev-d-nine.vercel.app/?source=pwa
     * Telegram, LinkedIn, Twitter/X
   - When a user asks "ইউটিউব ওপেন করো", "গিটহাব ওপেন করো", "ড্রাইভ ওপেন করো", "জিমেইল ওপেন করো" বা "ট্রেডিং টার্মিনাল / ForTrade ওপেন করো" — always provide direct, working Markdown action links with descriptive labels.

7. Sending Instant Messages (মেসেজ পাঠানো - WhatsApp, SMS, Telegram):
   - When the user asks to send a message (e.g. "মেসেজ পাঠাও", "হোয়াটসঅ্যাপে মেসেজ দাও", "কাউকে এসএমএস করো", "একটি বার্তা পাঠাও"):
     * Write an appropriate, polite, well-structured message.
     * Always provide 1-click interactive action links that pre-fill the message:
       - WhatsApp: [WhatsApp এ সরাসরি মেসেজ পাঠান](https://api.whatsapp.com/send?phone=PHONE_NUMBER&text=ENCODED_MESSAGE) (if phone is unknown, omit phone parameter)
       - Mobile SMS: [ফোনে সরাসরি SMS পাঠান](sms:PHONE_NUMBER?body=ENCODED_MESSAGE)
       - Telegram: [Telegram এ মেসেজ পাঠান](https://t.me/share/url?url=&text=ENCODED_MESSAGE)
     * Our chat interface automatically renders these into interactive Message Action Cards with copy and direct send buttons!

8. Sending Gmail & Professional Emails (জিমেইল ও অফিশিয়াল ইমেইল পাঠানো):
   - When the user asks to send an email or Gmail (e.g. "জিমেইল পাঠাও", "একটি ইমেইল লিখে পাঠিয়ে দাও", "কাউকে অফিশিয়াল দরখাস্ত বা কোলাবোরেশন মেইল করো"):
     * Draft a complete professional email with:
       - প্রাপকের ইমেইল (To)
       - বিষয় (Subject)
       - বিস্তারিত মার্জিত মূল বক্তব্য (Body)
     * Always provide a 1-click direct Gmail Web Compose link:
       [Gmail এ সরাসরি খুলুন ও পাঠান](https://mail.google.com/mail/?view=cm&fs=1&to=RECIPIENT_EMAIL&su=ENCODED_SUBJECT&body=ENCODED_BODY)
     * Also provide a standard mailto link:
       [ডিফল্ট ইমেইল অ্যাপে পাঠান](mailto:RECIPIENT_EMAIL?subject=ENCODED_SUBJECT&body=ENCODED_BODY)

9. Connecting with People & Professional Networking (মানুষের সাথে কানেক্ট করা):
   - Help users find official contact channels, write introductory networking messages, compose outreach pitches, and maintain personal or team contact books.
   - For reaching founder Sheikh Farid: Email: sheikhfaridvisa164@gmail.com, GitHub: https://github.com/rsk934128-dot, Location: Sirajganj, Bangladesh.
   - For emergency or citizen assistance: 999 (National Emergency), 333 (Govt Information), 109 (Women & Child), 16122 (Land Services).

10. Doing Real Work & Full-Stack Problem Solving (কাজ করা):
   - You produce complete, runnable code (TypeScript, Python, React, Node.js, Shell, SQL).
   - You provide comprehensive architectures, documentation, automated bug fixes, and step-by-step reasoning.

11. Sheikh Farid's Official GitHub Profile & Repos (https://github.com/rsk934128-dot):
   - Founder & Software Architect Sheikh Farid (RubelPay, Sirajganj, Bangladesh). 139+ public repositories.
   - Flagship projects: DeepMind-Science-Discovery-Workbench, Sheikh-Farid-AI-Studio-, Sheikh-Farid-AI-Studio-Project-Hub, Stripe-Gmail-Payment-Gateway-Hub, AI-Assistant-Coding-Studio, PayHub-Gateway-Gmail-Disbursement-PWA, No-IP-DNS-Remote-Access.
   - Provide git clone commands (\`git clone https://github.com/rsk934128-dot/REPO.git\`) and coding assistance.
When the user asks in Bengali, respond naturally, warmly, and accurately in standard Bengali (বাংলা). Format code cleanly with markdown code blocks.`;

const CITIZEN_SYSTEM_INSTRUCTION = `\nMode: Citizen & Everyday Life Assistant (জনসেবা, মোবাইল নাম্বার, ঠিকানা ও পরিচয় নির্দেশিকা):
- Focus on finding official phone numbers, addresses, postcodes, and step-by-step citizen services across Bangladesh and abroad.
- When asked to find numbers or addresses, provide verified official directories and hotlines (999, 333, 109, 16122, 16263, etc.).`;

/**
 * Streams content directly from Google Generative Language API
 */
export async function callDirectGeminiStream(options: DirectGeminiStreamOptions): Promise<string> {
  const apiKey = getDirectGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'ডাইরেক্ট ক্লায়েন্ট মোডে Gemini API Key পাওয়া যায়নি। অনুগ্রহ করে আপনার হোস্টিং প্ল্যাটফর্মের Environment Variables-এ "VITE_GEMINI_API_KEY" অথবা "GEMINI_API_KEY" যুক্ত করুন।'
    );
  }

  const {
    messages = [],
    prompt = '',
    enableSearch = true,
    mode = 'general',
    signal,
    onChunk,
    onGrounding,
    onSearchQueries,
  } = options;

  // Format contents for Gemini REST API
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const msg of messages) {
    if (!msg.text || !msg.text.trim()) continue;
    contents.push({
      role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    });
  }

  if (prompt && (!contents.length || contents[contents.length - 1].parts[0].text !== prompt)) {
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });
  }

  const systemPrompt = mode === 'citizen'
    ? `${DEFAULT_SYSTEM_INSTRUCTION}\n${CITIZEN_SYSTEM_INSTRUCTION}`
    : DEFAULT_SYSTEM_INSTRUCTION;

  // Build payload
  const payload: any = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  // Enable Google Search grounding if requested
  if (enableSearch) {
    payload.tools = [
      {
        google_search: {},
      },
    ];
  }

  // Models to try with multi-family fallback support
  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];
  let lastError: any = null;
  let currentPayload = { ...payload };
  let isQuotaExhaustedAll = false;

  for (const model of modelsToTry) {
    // Up to 2 passes per model: Pass 1 with search (if requested), Pass 2 without search if quota/tool fails
    for (let pass = 0; pass < 2; pass++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentPayload),
          signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          let parsedMsg = `HTTP Error ${response.status}`;
          try {
            const errJson = JSON.parse(errorText);
            parsedMsg = errJson?.error?.message || parsedMsg;
          } catch {
            // ignore
          }

          const lowerMsg = parsedMsg.toLowerCase();
          const isQuota =
            response.status === 429 ||
            lowerMsg.includes('quota') ||
            lowerMsg.includes('resource_exhausted') ||
            lowerMsg.includes('rate limit') ||
            lowerMsg.includes('exceeded your current quota');

          if (lowerMsg.includes('api_key_invalid') || lowerMsg.includes('api key not valid')) {
            throw new Error('প্রদত্ত Gemini API Key সঠিক নয় বা সক্রিয় করা নেই। অনুগ্রহ করে আপনার API Key পরীক্ষা করুন।');
          }

          if (isQuota) {
            isQuotaExhaustedAll = true;
            // If search tool was enabled, immediately strip tools and retry without search on this model
            if (currentPayload.tools && currentPayload.tools.length > 0) {
              const { tools, ...noToolsPayload } = currentPayload;
              currentPayload = noToolsPayload;
              await new Promise((r) => setTimeout(r, 600));
              continue; // Pass 2 retry without search tool
            }

            // Brief delay for burst per-minute rate limit before trying next fallback model
            await new Promise((r) => setTimeout(r, 1000));
            lastError = new Error(
              'এআই কোটা সীমা (API Rate Limit 429) সাময়িকভাবে শেষ হয়েছে। বিনামূল্যে থাকা অ্যাকাউন্টের প্রতি মিনিটের রিকোয়েস্ট সীমা শেষ হলে এমন হতে পারে। অনুগ্রহ করে ১০-১৫ সেকেন্ড অপেক্ষা করে নিচের "পুনরায় চেষ্টা করুন" বাটনে ক্লিক করুন অথবা Google Search অফ করে মেসেজ পাঠান।'
            );
            break; // go to next model
          }

          // If 503 high demand or temporary 404, retry next model
          lastError = new Error(`Gemini Direct API ত্রুটি: ${parsedMsg}`);
          break;
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported on this device.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const candidate = parsed.candidates?.[0];

                if (candidate?.content?.parts?.[0]?.text) {
                  const piece = candidate.content.parts[0].text;
                  accumulatedText += piece;
                  onChunk(piece);
                }

                // Grounding Metadata
                if (candidate?.groundingMetadata) {
                  onGrounding?.(candidate.groundingMetadata);
                  if (candidate.groundingMetadata.webSearchQueries) {
                    onSearchQueries?.(candidate.groundingMetadata.webSearchQueries);
                  }
                }
              } catch {
                // ignore chunk parse issues
              }
            }
          }
        }

        return accumulatedText;
      } catch (err: any) {
        if (err.name === 'AbortError' || signal?.aborted) {
          throw err;
        }
        lastError = err;
        break;
      }
    }
  }

  if (isQuotaExhaustedAll) {
    throw new Error(
      'এআই কোটা সীমা (Rate Limit / Quota Exceeded 429) সাময়িকভাবে শেষ হয়েছে। Google Gemini ফ্রি টায়ারের প্রতি মিনিটের রিকোয়েস্ট সীমা অতিক্রম করলে এই বার্তা আসে। অনুগ্রহ করে ১০-১৫ সেকেন্ড অপেক্ষা করে নিচের "পুনরায় চেষ্টা করুন" বাটনে ক্লিক করুন অথবা Google Search গ্রাউন্ডিং অফ করে মেসেজ পাঠান।'
    );
  }

  throw lastError || new Error('সকল এআই মডেল সংযোগ ব্যর্থ হয়েছে।');
}

/**
 * Generates a concise title for a chat session directly
 */
export async function generateDirectSessionTitle(userMessage: string): Promise<string> {
  const apiKey = getDirectGeminiApiKey();
  if (!apiKey || !userMessage) {
    return userMessage.slice(0, 30);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Create a concise title (maximum 3-5 words) for this chat conversation based on this message: "${userMessage}". Use the same language (Bengali or English). Return ONLY the title without quotes or punctuation.`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return userMessage.slice(0, 30);
    const data = await res.json();
    const title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return title ? title.replace(/["'`]/g, '').slice(0, 40) : userMessage.slice(0, 30);
  } catch {
    return userMessage.slice(0, 30);
  }
}

/**
 * Direct client-side evaluation of freelance remote jobs
 */
export async function directEvaluateJob(job: any, profile?: any): Promise<any> {
  const apiKey = getDirectGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key missing');
  }

  const prompt = `
You are an autonomous freelance sales engineer.
Evaluate this remote job:
Platform: ${job.platform || 'Upwork'}
Title: ${job.title}
Budget: ${job.budget}
Description: ${job.description}
Candidate Skills: ${(profile?.skills || ['React', 'TypeScript', 'Node.js', 'Python']).join(', ')}

Output ONLY valid JSON:
{
  "matchScore": 92,
  "recommendation": "Highly Recommended",
  "summary": "সংক্ষিপ্ত ২ লাইনের মূল্যায়ন বাংলায়",
  "keyStrengths": ["মুল দক্ষতা বাংলায়"],
  "potentialRisks": ["সম্ভাব্য ঝুঁকি বাংলায়"],
  "suggestedBid": "${job.budget || '$500'}",
  "estimatedDays": 3,
  "winningStrategy": "উইনিং কৌশল বাংলায়",
  "coverLetter": "Tailored, professional proposal in English without clichés",
  "milestones": [
    { "title": "Milestone 1: Setup & Architecture", "duration": "1 day", "cost": "$150" },
    { "title": "Milestone 2: Delivery & Testing", "duration": "2 days", "cost": "$250" }
  ],
  "questionsForClient": ["Insightful technical question 1", "Question 2"]
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Direct evaluation failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text || '{}');
}

/**
 * Direct client-side autonomous code solving
 */
export async function directSolveTask(jobTitle: string, requirement: string, techStack?: string): Promise<any> {
  const apiKey = getDirectGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key missing');
  }

  const prompt = `
You are an autonomous senior software engineer.
Client Requirement:
Title: ${jobTitle}
Tech Stack: ${techStack || 'TypeScript / React / Node.js'}
Specification:
${requirement}

Output ONLY valid JSON:
{
  "architecture": "আর্কিটেকচার বিবরণ বাংলায়",
  "files": [
    {
      "filename": "index.ts",
      "language": "typescript",
      "purpose": "Core entrypoint",
      "content": "/* complete runnable code */"
    },
    {
      "filename": "README.md",
      "language": "markdown",
      "purpose": "Documentation",
      "content": "# Setup and usage guide"
    }
  ],
  "selfHealingReport": {
    "iterations": 2,
    "initialErrorDetected": "Edge case detected in initial validation",
    "correctionApplied": "Corrected logic and added error handling",
    "testsPassed": true,
    "assertionsCount": 12
  },
  "deliveryNote": "Hi! I have completed your task with full tests."
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Direct solve task failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text || '{}');
}
