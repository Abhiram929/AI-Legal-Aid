export interface LegalTopic {
    keywords: string[];
    category: string;
    applicable_sections: string;
    penalties_fines_tenure: string;
    advice: string;
    required_documents: string;
    risk_score: number;
}

export const LOCAL_LEGAL_MANUAL: LegalTopic[] = [
    {
        keywords: ['rent', 'landlord', 'tenant', 'lease', 'eviction', 'deposit'],
        category: "Property & Tenant Law",
        applicable_sections: "Varies tightly by state, but generally falls under the Rent Control Act or state Landlord-Tenant Acts.",
        penalties_fines_tenure: "Unlawful evictions or withholding of security deposits can result in civil fines or court orders commanding restitution. Tenure limits apply based on the lease agreement.",
        advice: "Never withhold rent as a retaliatory measure, as this can be grounds for immediate legal eviction. Document all communication in writing. If facing an illegal rent hike or eviction without proper notice (usually 30-60 days), remain on the property and seek local legal aid.",
        required_documents: "- Original Lease Agreement\n- Proof of all recent rent payments\n- Written communications with the landlord (emails/texts)",
        risk_score: 5
    },
    {
        keywords: ['accident', 'car', 'crash', 'insurance', 'injury', 'damage', 'traffic', 'hit'],
        category: "Traffic & Personal Injury Law",
        applicable_sections: "Motor Vehicles Act (e.g., Section 166 for compensation) and local traffic codes.",
        penalties_fines_tenure: "Fleeing the scene of an accident can result in criminal hit-and-run charges (fines and potential jail time). Traffic violations bring variable fines.",
        advice: "Do not admit fault at the scene. Ensure the police file a First Information Report (FIR) or standard collision report. Seek medical attention immediately even if injuries seem minor, as insurance claims rely heavily on early documentation.",
        required_documents: "- Police FIR / Accident Report\n- Photographs of the scene and damage\n- Medical records and bills\n- Driver's license and insurance details of all parties",
        risk_score: 6
    },
    {
        keywords: ['divorce', 'child', 'alimony', 'marriage', 'custody', 'spouse', 'abuse', 'domestic'],
        category: "Family Law & Domestic Relations",
        applicable_sections: "Hindu Marriage Act, Special Marriage Act, or Domestic Violence Act depending on jurisdiction and religion.",
        penalties_fines_tenure: "Domestic violence carries severe criminal penalties including non-bailable imprisonment. Alimony defaults can lead to asset seizure.",
        advice: "In cases of domestic violence, your safety is paramount; contact local law enforcement immediately. For divorce or custody, do NOT move out of the marital home without legal counsel, as this can be construed as abandonment. Document all finances quietly.",
        required_documents: "- Marriage certificate\n- Joint financial statements and property deeds\n- Any evidence of abuse (photos, texts, police reports)\n- Birth certificates of children",
        risk_score: 8
    },
    {
        keywords: ['salary', 'fired', 'termination', 'boss', 'harassment', 'work', 'job', 'employer'],
        category: "Employment & Labor Law",
        applicable_sections: "Industrial Disputes Act, Payment of Wages Act, and local Shops and Establishments Acts.",
        penalties_fines_tenure: "Employers withholding wages or violating termination clauses face severe labor court fines and mandates to pay wage arrears with interest.",
        advice: "Do not sign any forced resignation letters. If you are terminated without cause, collect all evidence of your employment and good standing. If you are facing workplace harassment, report it immediately to the HR or POSH (Prevention of Sexual Harassment) committee in writing.",
        required_documents: "- Offer letter and Employment Contract\n- Recent payslips and bank statements\n- Notice of termination or relevant emails\n- Employee handbook/policies",
        risk_score: 5
    },
    {
        keywords: ['police', 'arrest', 'bail', 'jail', 'fraud', 'theft', 'criminal', 'assault'],
        category: "Criminal Law",
        applicable_sections: "Bharatiya Nyaya Sanhita (BNS) / Indian Penal Code (IPC), and Code of Criminal Procedure (CrPC).",
        penalties_fines_tenure: "Punishments range from fines to life imprisonment depending heavily on whether the offense is bailable, cognizable, and compoundable.",
        advice: "EXERCISE YOUR RIGHT TO REMAIN SILENT. Do not offer explanations to the police without a lawyer present. Assert your right to legal counsel immediately. If you have been assaulted or defrauded, insist on filing an FIR immediately.",
        required_documents: "- Copy of the FIR (First Information Report)\n- Arrest memo\n- Medical report (if assault)\n- Any relevant video or textual evidence",
        risk_score: 9
    },
    {
        keywords: ['scam', 'online', 'bank', 'stolen', 'hacked', 'phishing', 'cyber'],
        category: "Cybercrime & Information Technology Law",
        applicable_sections: "Information Technology (IT) Act, 2000 (e.g., Sections 43, 66).",
        penalties_fines_tenure: "Cybercrimes often carry minimum 3-year prison sentences and massive fines for data breaches or identity theft.",
        advice: "Immediately freeze your bank accounts and credit cards. Do not delete the fraudulent emails or messages (they contain IP headers and meta-data). Report the incident immediately to the national cybercrime reporting portal and your bank.",
        required_documents: "- Screenshots of the scam or hack\n- Original digital communication\n- Bank statements showing fraudulent transactions",
        risk_score: 7
    },
    {
        keywords: ['property', 'land', 'buying', 'selling', 'deed', 'fake', 'encroachment', 'boundary'],
        category: "Real Estate & Property Law",
        applicable_sections: "Transfer of Property Act, Registration Act.",
        penalties_fines_tenure: "Fraudulent property sales or forged deeds can result in lengthy criminal prosecution for fraud and forgery.",
        advice: "Do not hand over any preliminary cash without a registered agreement to sell. Before buying any property, hire an independent advocate to conduct a 'Title Search' going back at least 30 years to ensure the land is free of disputes or bank liens.",
        required_documents: "- Sale deed or Agreement to Sell\n- Encumbrance Certificate\n- Property tax receipts\n- Approved building plan",
        risk_score: 6
    }
];

export const FALLBACK_GENERAL: LegalTopic = {
    keywords: [],
    category: "General Legal Inquiry",
    applicable_sections: "Varies depending on exact national and local jurisdictions.",
    penalties_fines_tenure: "Specific penalties can only be determined through detailed consultation.",
    advice: "Due to high network traffic, our AI triage systems are relying on our offline legal manual. Your query did not match our specific offline database keywords. However, we strongly recommend documenting everything in writing, gathering any contracts or evidence, and avoiding direct unmediated contact with the opposing party. If this is an emergency, contact local law enforcement immediately.",
    required_documents: "- Any relevant written contracts or agreements\n- Photographic or digital evidence (emails, texts)\n- Identification and timeline of events",
    risk_score: 5
};

export const findLocalAnalysis = (prompt: string): LegalTopic => {
    const lowerPrompt = prompt.toLowerCase();

    // Attempt rudimentary keyword matching to find the best local offline topic
    let bestMatch = FALLBACK_GENERAL;
    let maxMatchedKeywords = 0;

    for (const topic of LOCAL_LEGAL_MANUAL) {
        let matched = 0;
        for (const keyword of topic.keywords) {
            // Using regex for word boundary to avoid partial word matches like matching 'car' in 'care'
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(lowerPrompt)) {
                matched++;
            }
        }

        if (matched > maxMatchedKeywords) {
            maxMatchedKeywords = matched;
            bestMatch = topic;
        }
    }

    return bestMatch;
};
