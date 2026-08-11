export const callGeminiAPI = async (
  prompt: string,
  _key: string, // Prefixed with underscore to declare it as intentionally unused
  isEnglish: boolean,
  isOfficer: boolean = false
): Promise<string> => {
  try {
    const res = await fetch('/api/gemini', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, isEnglish, isOfficer })
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || `Server returned status ${res.status}`);
    }

    const data = await res.json();
    return data.text || "";
  } catch (err) {
    console.error("Failed to query Gemini API via server proxy:", err);
    throw err;
  }
};
