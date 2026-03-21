require('dotenv').config();

const CryptoJS = require('crypto-js');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const CACHE_TTL = 24 * 60 * 60;

async function analyzeEmotion(text) {
  const textHash = CryptoJS.MD5(text).toString();
  let cached = await redis.get(`analysis:${textHash}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set');
  }

  const prompt = `Analyze journal: ${text}

JSON only:
{"emotion": "calm", "keywords": ["key1"], "summary": "..." }`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const analysis = JSON.parse(data.choices[0].message.content);

  await redis.set(`analysis:${textHash}`, JSON.stringify(analysis), 'EX', CACHE_TTL);

  return analysis;
}

module.exports = { analyzeEmotion };

