// Vercel serverless handler for journal APIs
const prisma = require('../backend/db.js');
const { analyzeEmotion } = require('../backend/services/llm.js');

module.exports = async (req, res) => {
  const { method, url, headers, body } = req;
  const pathname = new URL(url, `http://${headers.host}`).pathname.slice(1);

  const pathParts = pathname.split('/').slice(1);

  if (method === 'POST') {
    try {
      const data = JSON.parse(body || '{}');

      if (pathParts[1] === 'analyze') {
        const { text } = data;
        if (!text) return res.status(400).json({ error: 'Missing text' });
        const analysis = await analyzeEmotion(text);
        return res.json(analysis);
      }

      const { userId, ambience, text } = data;
      if (!userId || !ambience || !text) {
        return res.status(400).json({ error: 'Missing userId, ambience, text' });
      }

      let analysis = null;
      try {
        analysis = await analyzeEmotion(text);
      } catch (err) {
        console.error('Analysis failed:', err.message);
      }

      const entry = await prisma.entry.create({
        data: {
          userId,
          ambience,
          text,
  emotion: analysis?.emotion || null,
          keywords: analysis?.keywords ? JSON.stringify(analysis.keywords) : null,
          summary: analysis?.summary || null,
        },
      });

      return res.status(201).json({ id: entry.id, message: 'Entry created' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (method === 'GET') {
    try {
      if (pathParts[1] === 'insights') {
        const userId = pathParts[2];
        if (!userId) return res.status(400).json({ error: 'Missing userId' });

        const entries = await prisma.entry.findMany({ where: { userId } });
        const ambienceCount = {};
        const emotionCount = {};
        const allKeywords = new Set();

        entries.forEach(entry => {
          ambienceCount[entry.ambience] = (ambienceCount[entry.ambience] || 0) + 1;
          if (entry.emotion) emotionCount[entry.emotion] = (emotionCount[entry.emotion] || 0) + 1;
          if (entry.keywords) {
            JSON.parse(entry.keywords).forEach(kw => allKeywords.add(kw));
          }
        });

        return res.json({
          totalEntries: entries.length,
          topEmotion: Object.entries(emotionCount).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'unknown',
          mostUsedAmbience: Object.entries(ambienceCount).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'none',
          recentKeywords: Array.from(allKeywords).slice(-5),
        });
      }

      const userId = pathParts[1];
      const entries = await prisma.entry.findMany({
        where: userId ? { userId } : {},
        orderBy: { createdAt: 'desc' },
      });
      return res.json(entries);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
