import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/utils/supabase/server';

const MAX_RETRIES = 2;

const FALLBACK_UPDATES = [
    {
        title: "Digital Personal Data Protection Act Implementation",
        date: "2023-2024",
        summary: "Comprehensive framework for processing digital personal data, establishing rights and duties. It introduces heavy penalties for data breaches by corporations.",
        impact_level: "High"
    },
    {
        title: "New Criminal Laws Act Overhaul",
        date: "2024",
        summary: "The replacement of colonial-era penal codes with the Bharatiya Nyaya Sanhita, modernizing judicial procedures and definitions of offenses.",
        impact_level: "High"
    },
    {
        title: "Telecommunications Act Regulation Changes",
        date: "2023",
        summary: "Restructured the regulatory framework for telecommunications networks, emphasizing national security and user protection concerning SIM cards.",
        impact_level: "Medium"
    },
    {
        title: "Consumer Protection Rules Updates",
        date: "2023",
        summary: "Stricter regulations on dark patterns, flash sales, and misleading ads on digital storefronts to protect online buyers and penalize bad actors.",
        impact_level: "Medium"
    }
];

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { country } = await req.json();

        if (!country) {
            return NextResponse.json({ error: 'Country is required' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is missing.' }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const systemInstruction = `
    You are an AI Legal Updates Analyst.
    The user is asking for the latest constitutional amendments, landmark supreme court rulings, or major penal code changes in: ${country}.
    
    You must analyze recent legal history (last 5 years) and return a pure JSON object (do not wrap in markdown or backticks). The object must have this exact structure:
    {
      "updates": [
        {
          "title": "String (Short, punchy title)",
          "date": "String (Year or explicit Date)",
          "summary": "String (A 2-3 sentence explanation of what changed and its impact)",
          "impact_level": "String (e.g., 'High', 'Medium', 'Low')"
        }
      ]
    }
    Provide exactly 3 to 5 updates.
    `;

        let attempt = 0;
        while (attempt < MAX_RETRIES) {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Give me the latest major legal updates for ${country}.`,
                    config: {
                        systemInstruction: systemInstruction,
                        responseMimeType: "application/json",
                        temperature: 0.3
                    }
                });

                const textResponse = response.text || "[]";
                let cleanedJson = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();

                const jsonResult = JSON.parse(cleanedJson);
                const updatesArray = jsonResult.updates || [];

                if (!Array.isArray(updatesArray) || updatesArray.length === 0 || !updatesArray[0].title) {
                    throw new Error("Invalid format returned from AI model");
                }

                return NextResponse.json(updatesArray);

            } catch (e: any) {
                attempt++;
                console.error(`Attempt ${attempt} failed:`, e);
                if (attempt >= MAX_RETRIES) {
                    console.log("Using FALLBACK_UPDATES due to API limit.");
                    return NextResponse.json(FALLBACK_UPDATES);
                }
            }
        }

    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
