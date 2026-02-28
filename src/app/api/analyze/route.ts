import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/utils/supabase/server';
import { findLocalAnalysis } from '@/utils/localLegalManual';

const MAX_RETRIES = 2;

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prompt, country } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Determine which API to use based on env vars
        // Defaulting to Gemini as it handles JSON structure well
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is missing in server environment.' }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const systemInstruction = `
    You are an AI-Powered Legal Aid Triage System.
    The user is asking a legal question under the jurisdiction of: ${country || 'General'}.
    
    You must analyze the user's situation and return a pure JSON object (do not wrap in markdown or backticks) with exactly these properties:
    {
      "category": "String (e.g., 'Employment Law', 'Family Law', 'Property Law', 'Criminal Law')",
      "applicable_sections": "String (List the exact constitutional articles, penal codes, or specific sections of law applicable to the situation)",
      "penalties_fines_tenure": "String (List the exact fines, jail/prison sentences, or administrative penalties applicable to the crime or violation, if any)",
      "advice": "String (A comprehensive, empathetic 2-3 paragraph explanation of their legal standing and next actionable steps based on their jurisdiction)",
      "required_documents": "String (A bulleted list or numbered list of documents they should gather)",
      "risk_score": Number (An integer between 1 and 10 representing the urgency and legal risk. 1=low risk, 10=seek immediate counsel)
    }
    `;

        const fewShotExamples = [
            {
                role: 'user',
                parts: [{ text: "My landlord raised my rent by 40% with no notice. Is this legal?" }]
            },
            {
                role: 'model',
                parts: [{
                    text: JSON.stringify({
                        category: "Property & Tenant Law",
                        applicable_sections: "Varies by state, often Landlord-Tenant Act.",
                        penalties_fines_tenure: "Landlord may face civil fines if rent control applies.",
                        advice: "A 40% rent increase without prior written notice is generally illegal in most jurisdictions. You should continue paying your original rent amount and immediately demand a written explanation from your landlord as a first step.",
                        required_documents: "- Original Lease Agreement\n- Proof of previous rent payments\n- Any written communication regarding the increase",
                        risk_score: 5
                    })
                }]
            },
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ];

        let attempt = 0;
        while (attempt < MAX_RETRIES) {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `User Query: ${prompt}`,
                    config: {
                        systemInstruction: systemInstruction,
                        responseMimeType: "application/json",
                        temperature: 0.2
                    }
                });

                const textResponse = response.text || "{}";
                let cleanedJson = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();

                const jsonResult = JSON.parse(cleanedJson);

                // Validate structure
                if (!jsonResult.category || !jsonResult.advice || !jsonResult.required_documents || !jsonResult.risk_score || !jsonResult.applicable_sections) {
                    throw new Error("Invalid format returned from AI model");
                }

                return NextResponse.json(jsonResult);

            } catch (e: any) {
                attempt++;
                console.error(`Attempt ${attempt} failed:`, e);
                if (attempt >= MAX_RETRIES) {
                    console.log("Using offline local legal manual due to API limit.");
                    const localMatch = findLocalAnalysis(prompt);
                    const { keywords, ...matchWithoutKeywords } = localMatch;

                    return NextResponse.json({
                        ...matchWithoutKeywords,
                        advice: `[OFFLINE ANALYSIS]: ${localMatch.advice}`
                    });
                }
            }
        }

    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
