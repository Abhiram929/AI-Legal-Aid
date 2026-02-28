import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const FALLBACK_LAWS = {
  laws: [
    {
      symbol: "📱",
      rule: "Recording Conversations Without Consent",
      description: "In many jurisdictions, it is definitively illegal to record a phone call or private conversation without the consent of all parties involved (Two-Party Consent).",
      fine: "Varies from civil fines to severe felony criminal charges depending on the jurisdiction."
    },
    {
      symbol: "📡",
      rule: "Using Another's Unsecured Wi-Fi (Piggybacking)",
      description: "Connecting to a neighbor's or business's unsecured Wi-Fi network without explicit permission is often classified as unauthorized access to a computer network.",
      fine: "Can be punished as a misdemeanor computer crime, carrying potential fines or minor jail time."
    },
    {
      symbol: "🎵",
      rule: "Copyright Infringement on Social Media",
      description: "Using copyrighted music or images in business social media posts or unauthorized videos without securing a license.",
      fine: "Civil lawsuits and account takedowns; statutory damages can reach severe monetary limits if taken to court."
    },
    {
      symbol: "🐕",
      rule: "Leash Laws & Pet Waste Violations",
      description: "Walking a dog off-leash in restricted areas or failing to clean up after them in public parks or on sidewalks.",
      fine: "Typically enforced by local animal control; citations often range from $25 to $250."
    },
    {
      symbol: "🗑️",
      rule: "Improper Electronic or Chemical Disposal",
      description: "Throwing away batteries, paint, or old electronics in the regular trash violates local environmental dumping ordinances.",
      fine: "Local municipal fines or citations from waste management."
    }
  ]
};

export async function POST(req: Request) {
  try {
    const { country } = await req.json();

    if (!country) {
      return NextResponse.json({ error: 'Country is required' }, { status: 400 });
    }

    const systemPrompt = `You are a legal awareness AI. Your task is to provide JSON data about basic, everyday laws that humans commonly neglect or are unaware of in the requested country.
Output ONLY raw JSON. Do NOT wrap it in markdown blockquotes like \`\`\`json.
The JSON must follow this array structure:
{
  "laws": [
    {
      "symbol": "Emoji representing the law/concept (e.g. 🏡, 📸, 🐕, 🗑️, 📵, 💬)",
      "rule": "Name of the commonly neglected law",
      "description": "Explanation of how this law is often unintentionally broken by everyday people",
      "fine": "Details of the specific fine/penalty for neglecting this law in that country"
    }
  ]
}
Provide exactly 6 to 8 of the most critical or surprising everyday laws that people break. Do not include basic traffic rules unless they are highly unusual. Focus on social, property, digital, or civil laws.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide commonly neglected everyday laws for ${country}.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const textResponse = response.text || "{}";

    let cleanedJson = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();

    const data = JSON.parse(cleanedJson);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Laws API Error:", error);
    console.log("Using FALLBACK_LAWS due to API limit.");
    return NextResponse.json(FALLBACK_LAWS);
  }
}
