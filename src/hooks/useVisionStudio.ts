import { useState, useCallback } from 'react';

export interface BoundingBox {
  id?: string;
  label: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized (0-1000)
  confidence?: number;
  category?: string;
  color?: string;
  attributes?: Record<string, string | number>;
}

export interface VisionAnalysisResult {
  summary: string;
  detectedObjects: BoundingBox[];
  ocrText?: string;
  structuredData?: Record<string, any>;
  generatedCode?: string;
}

export type StudioMode = 'general' | 'ocr' | 'detection' | 'wireframe-to-code';

export function useVisionStudio() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = useCallback(async (
    imageBase64: string,
    mode: StudioMode,
    customPrompt?: string
  ): Promise<VisionAnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    // Prompt engineering according to selected mode
    let systemInstruction = '';
    if (mode === 'detection') {
      systemInstruction = `You are an advanced Computer Vision Intelligence engine for AI-Vision Studio 1.0.
Analyze the provided image and detect the primary objects, items, people, and visual landmarks.
Return your response in clean JSON format matching this schema:
{
  "summary": "Short concise summary in Bengali explaining the detected objects",
  "detectedObjects": [
    {
      "label": "Name of object in English/Bengali",
      "box_2d": [ymin, xmin, ymax, xmax]
    }
  ]
}
Note: Coordinates ymin, xmin, ymax, xmax MUST be integers normalized on a scale from 0 to 1000.`;
    } else if (mode === 'ocr') {
      systemInstruction = `You are an expert Document Scanner & OCR engine for AI-Vision Studio 1.0.
Extract all visible text (printed, handwritten, signage, receipts, tables, Bengali and English) with high precision.
Return a clean JSON format:
{
  "summary": "Short summary of the document in Bengali",
  "ocrText": "Full extracted textual content preserved with layout",
  "detectedObjects": [
    { "label": "Text region / Block", "box_2d": [ymin, xmin, ymax, xmax] }
  ]
}`;
    } else if (mode === 'wireframe-to-code') {
      systemInstruction = `You are a UI/UX Wireframe-to-Code Architect for AI-Vision Studio 1.0.
Convert this hand-drawn UI sketch, wireframe, or screenshot into modern, clean, responsive React (TypeScript) and Tailwind CSS code.
Return a clean JSON format:
{
  "summary": "Brief summary of the UI design in Bengali",
  "generatedCode": "// Complete React component code using Tailwind CSS",
  "detectedObjects": [
    { "label": "UI Component (e.g. Button, Header, Card)", "box_2d": [ymin, xmin, ymax, xmax] }
  ]
}`;
    } else {
      systemInstruction = `You are a Visual Intelligence & Multimodal Inspector for AI-Vision Studio 1.0.
Perform an in-depth audit of this image including colors, context, anomalies, text, and scene understanding.
Return a JSON format:
{
  "summary": "Detailed visual audit in Bengali",
  "detectedObjects": [
    { "label": "Identified element", "box_2d": [ymin, xmin, ymax, xmax] }
  ]
}`;
    }

    try {
      // Clean base64 string
      const cleanData = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const payload = {
        prompt: customPrompt || (
          mode === 'detection' ? 'Identify and detect all key objects with bounding box coordinates.' :
          mode === 'ocr' ? 'Extract all printed and handwritten Bengali and English text from this document.' :
          mode === 'wireframe-to-code' ? 'Convert this wireframe/sketch into production-ready React Tailwind code.' :
          'Audit and describe this image in detail.'
        ),
        systemInstruction,
        messages: [
          {
            role: 'user',
            text: customPrompt || 'Analyze this image.'
          }
        ],
        contents: [
          {
            role: 'user',
            parts: [
              { text: customPrompt || 'Analyze this visual data.' },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanData
                }
              }
            ]
          }
        ],
        model: 'gemini-3.8-flash',
        enableSearch: false
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Vision API error (${response.status})`);
      }

      const resData = await response.json();
      const rawReply = resData.reply || resData.text || '';

      // Parse JSON from model output (handling code fence ```json ... ```)
      let parsed: VisionAnalysisResult = {
        summary: '',
        detectedObjects: []
      };

      try {
        const jsonMatch = rawReply.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawReply];
        const jsonStr = (jsonMatch[1] || rawReply).trim();
        const jsonObj = JSON.parse(jsonStr);

        const rawList = Array.isArray(jsonObj.detectedObjects) ? jsonObj.detectedObjects : [];
        const detectedObjects: BoundingBox[] = rawList.map((obj: any, idx: number) => ({
          id: obj.id || `obj-${idx + 1}-${Date.now().toString(36)}`,
          label: obj.label || `Object ${idx + 1}`,
          box_2d: Array.isArray(obj.box_2d) && obj.box_2d.length === 4
            ? [
                Math.max(0, Math.min(1000, Math.round(obj.box_2d[0]))),
                Math.max(0, Math.min(1000, Math.round(obj.box_2d[1]))),
                Math.max(0, Math.min(1000, Math.round(obj.box_2d[2]))),
                Math.max(0, Math.min(1000, Math.round(obj.box_2d[3]))),
              ]
            : [100, 100, 300, 300],
          confidence: typeof obj.confidence === 'number' ? obj.confidence : 0.92,
          category: obj.category || undefined,
          attributes: obj.attributes || undefined
        }));

        parsed = {
          summary: jsonObj.summary || rawReply.slice(0, 150),
          detectedObjects,
          ocrText: jsonObj.ocrText || (mode === 'ocr' ? rawReply : undefined),
          structuredData: jsonObj.structuredData,
          generatedCode: jsonObj.generatedCode || (mode === 'wireframe-to-code' ? extractCode(rawReply) : undefined)
        };
      } catch {
        // Fallback if model returned plain markdown/text
        parsed = {
          summary: rawReply.slice(0, 250),
          detectedObjects: [],
          ocrText: mode === 'ocr' ? rawReply : undefined,
          generatedCode: mode === 'wireframe-to-code' ? extractCode(rawReply) : undefined
        };
      }

      setResult(parsed);
      return parsed;
    } catch (err: any) {
      const msg = err?.message || 'ইমেজ প্রসেসিং ব্যর্থ হয়েছে';
      setError(msg);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { analyzeImage, isAnalyzing, result, error, setResult };
}

function extractCode(text: string): string {
  const match = text.match(/```(?:tsx|jsx|typescript|javascript|html)?\s*([\s\S]*?)\s*```/);
  return match ? match[1].trim() : text;
}
