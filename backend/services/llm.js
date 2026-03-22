import 'dotenv/config';
import CryptoJS from 'crypto-js';
import Redis from 'ioredis';

let redis = null;
const CACHE_TTL = 24 * 60 * 60;

// ✅ Init Redis (TLS for Vercel)
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    tls: {}
  });
}

export async function analyzeEmotion(text) {
  const textHash = CryptoJS.MD5(text).toString();

  // ✅ Cache check
  if (redis) {
    try {
      const cached = await redis.get(`analysis:${textHash}`);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      console.error('Redis get error:', err.message);
    }
  }

  const apiKey = process.env.GROQ_API_KEY;

  // ✅ No API key fallback
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
        ]
      })
    });

    const rawText = await response.text();

    console.log("STATUS:", response.status);
    console.log("GROQ RESPONSE:", rawText);

    // ❌ API failed
    if (!response.ok) {
      throw new Error(rawText);
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error("Invalid JSON from Groq");
    }

    const raw = data.choices?.[0]?.message?.content || "";

    let analysis;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      analysis = match ? JSON.parse(match[0]) : null;
    } catch {
      analysis = null;
    }

    // ✅ Fallback
    if (!analysis) {
      analysis = {
        emotion: "unknown",
        keywords: [],
        summary: "Parse failed"
      };
    }

    // ✅ Cache result
    if (redis) {
      try {
        await redis.set(
          `analysis:${textHash}`,
          JSON.stringify(analysis),
          'EX',
          CACHE_TTL
        );
      } catch (err) {
        console.error('Redis set error:', err.message);
      }
    }

    return analysis;

  } catch (err) {
    console.error('LLM error:', err.message);

    return {
      emotion: "unknown",
      keywords: [],
      summary: "Analysis service unavailable"
    };
  }
}