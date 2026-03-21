// CommonJS for Vercel
// Prisma singleton
const prisma = require('../db.js');
const { analyzeEmotion } = require('../services/llm.js');
// Fixed paths

module.exports = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.slice(1); // /api/journal/insights/123 → journal/insights/123

  if (req.method === 'POST') {
    try {
      const body = JSON.parse(req.body || '{}');

      if (path === 'journal/analyze') {
        const { text } = body;
        if (!text) return res.status(400).json({ error: 'Missing text' });
        const analysis = await analyzeEmotion(text);
        return res.json(analysis);
      }

      const { userId, ambience, text } = body;
      if (!userId || !ambience || !text) {
        return res.status(400).json({ error: 'Missing fields' });
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
          emotion: analysis?.emotion,
          keywords: JSON.stringify(analysis?.keywords || []),
          summary: analysis?.summary,
        },
      });

      return res.status(201).json({ id: entry.id, message: 'Entry created' });

      if (path === 'journal/analyze') {
        const body = JSON.parse(req.body || '{}');
        const { text } = body;
        if (!text) return res.status(400).json({ error: 'Missing text' });
        const analysis = await analyzeEmotion(text);
        return res.json(analysis);
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const pathParts = path.split('/').slice(2);
      if (pathParts[0] === 'insights') {
        const userId = pathParts[1];
        const entries = await prisma.entry.findMany({ where: { userId } });
        // insights...
        const ambienceCount = {};
        const emotionCount = {};
        const allKeywords = new Set();

        entries.forEach(entry => {
          ambienceCount[entry.ambience] = (ambienceCount[entry.ambience] || 0) + 1;
          if (entry.emotion) emotionCount[entry.emotion] = (emotionCount[entry.emotion] || 0) + 1;
          const kws = JSON.parse(entry.keywords || '[]');
          kws.forEach(kw => allKeywords.add(kw));
        });

        return res.json({
          totalEntries: entries.length,
          topEmotion: Object.entries(emotionCount).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'unknown',
          mostUsedAmbience: Object.entries(ambienceCount).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'none',
          recentKeywords: Array.from(allKeywords).slice(-5),
        });
      }

      const userId = pathParts[0];
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
