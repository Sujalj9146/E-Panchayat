export const callGeminiAPI = async (
  prompt: string,
  key: string,
  isEnglish: boolean,
  isOfficer: boolean = false
): Promise<string> => {
  const systemContext = isOfficer
    ? `You are the official Gram Panchayat Officer AI Assistant for Loni Kalbhor (लोणी काळभोर) village, Pune, Maharashtra.
Panchayat Core Metrics:
- Active Citizens: 10
- Logged Grievances: 5 (1 Critical in Ward 3, 2 High)
- Capital Infrastructure Projects: 4 (Concrete Road construction is Delayed at 65% progress, Budget 18 Lakhs; Digital Center Setup is Completed at 100% progress, Budget 3 Lakhs)
- Next Sabha Meeting: August 20, 2026, at ZP School Ground.
User query: "${prompt}"
Language: ${isEnglish ? 'English' : 'Marathi'}.
Please formulate a highly helpful, concise, and professional answer for the Panchayat Officer in the requested language. Keep it under 4 sentences. Use markdown bold where appropriate.`
    : `You are the official E-Panchayat GraphRAG AI Assistant for Loni Kalbhor (लोणी काळभोर) village, Pune, Maharashtra.
Panchayat Status:
- Citizens Registered: 10 (including Savita Patil, Amit Shinde, Anandrao Patil)
- Infrastructure Projects: 4 (Concrete Road Construction in Ward 3 is Delayed at 65% progress, Budget 18 Lakhs; Digital Center Setup is Completed at 100% progress, Budget 3 Lakhs)
- Unresolved Grievances: 5 (Water pipeline leakage near Maruti Temple, drainage clogging)
- Next Sabha Meeting: August 20, 2026, at ZP School Ground.
User query: "${prompt}"
Language: ${isEnglish ? 'English' : 'Marathi'}.
Please formulate a highly helpful, brief, and professional response in the requested language. Keep it under 4 sentences. Use markdown bold where appropriate.`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemContext }] }]
      })
    });
    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (err) {
    console.error("Gemini API call failed:", err);
    throw err;
  }
};
