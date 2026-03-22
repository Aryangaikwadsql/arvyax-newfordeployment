import 'dotenv/config';

export async function analyzeEmotion(text) {
  const apiKey = process.env.GROQ_API_KEY;

  // ✅ fallback if no key
  if (!apiKey) {
    return {
      emotion: "unknown",
      keywords: [],
      summary: "No API key"
    };
  }

  const prompt = `Return ONLY valid JSON:
{"emotion":"happy","keywords":["nature","peace"],"summary":"..."}

Text:
${text}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });

    const rawText = await response.text();

    console.log("GROQ STATUS:", response.status);
    console.log("GROQ RESPONSE:", rawText.slice(0, 300));

    // ❌ API error
    if (!response.ok) {
      throw new Error(rawText);
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error("Invalid JSON from Groq");
    }

    const content = data.choices?.[0]?.message?.content || "";

    let analysis = null;

    try {
      // ✅ better JSON extraction (handles multiline)
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        analysis = JSON.parse(match[0]);
      }
    } catch {
      analysis = null;
    }

    // ✅ strict fallback
    if (
      !analysis ||
      typeof analysis !== "object" ||
      !analysis.emotion
    ) {
      return {
        emotion: "unknown",
        keywords: [],
        summary: "Parse failed"
      };
    }

    // ✅ normalize output
    return {
      emotion: analysis.emotion || "unknown",
      keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
      summary: analysis.summary || ""
    };

  } catch (err) {
    console.error("LLM error:", err.message);

    return {
      emotion: "unknown",
      keywords: [],
      summary: "Analysis unavailable"
    };
  }
}