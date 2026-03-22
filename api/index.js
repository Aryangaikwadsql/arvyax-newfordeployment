import { prisma } from '../backend/db.js';
import { analyzeEmotion } from '../backend/services/llm.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.json({ status: 'OK' });
  }

  if (req.method === 'POST') {
    try {
      const { userId, ambience, text } = req.body;

      const analysis = await analyzeEmotion(text);

      const entry = await prisma.entry.create({
        data: {
          userId,
          ambience,
          text,
          emotion: analysis?.emotion || "unknown",
          keywords: analysis?.keywords?.join(', ') || null,
          summary: analysis?.summary || ""
        }
      });

      return res.json({ success: true, entry });

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
