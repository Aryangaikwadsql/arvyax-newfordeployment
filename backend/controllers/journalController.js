import { prisma } from '../db.js';
import { analyzeEmotion } from '../services/llm.js';

// ✅ Create entry + ALWAYS analyze
export async function createEntry(req, res) {
  try {
    const { userId, ambience, text } = req.body;

    if (!userId || !ambience || !text) {
      return res.status(400).json({ error: 'Missing userId, ambience, text' });
    }

    // 🔥 Always run analysis (no silent fail)
    const analysis = await analyzeEmotion(text);

    const entry = await prisma.entry.create({
      data: {
        userId,
        ambience,
        text,
        emotion: analysis?.emotion || "unknown",
        keywords:
          Array.isArray(analysis?.keywords) && analysis.keywords.length > 0
            ? analysis.keywords.join(', ')
            : null,
        summary: analysis?.summary || "",
      }
    });

    res.status(201).json({
      id: entry.id,
      message: 'Entry created',
      analysis
    });

  } catch (err) {
    console.error('CreateEntry Error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ✅ Get entries
export async function getEntries(req, res) {
  try {
    const { userId } = req.params || req.query;

    const entries = await prisma.entry.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' }
    });

    res.json(entries);

  } catch (err) {
    console.error('GetEntries Error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ✅ Analyze only (for button)
export async function analyze(req, res) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    const analysis = await analyzeEmotion(text);
    res.json(analysis);

  } catch (err) {
    console.error('Analyze Error:', err);
    res.status(500).json({ error: err.message });
  }
}

// ✅ Insights (fixed completely)
export async function getInsights(req, res) {
  try {
    const { userId } = req.params;

    const entries = await prisma.entry.findMany({
      where: { userId }
    });

    if (entries.length === 0) {
      return res.json({ totalEntries: 0 });
    }

    const ambienceCount = {};
    const emotionCount = {};
    const allKeywords = new Set();

    entries.forEach(entry => {
      // ambience
      ambienceCount[entry.ambience] =
        (ambienceCount[entry.ambience] || 0) + 1;

      // emotion
      if (entry.emotion && entry.emotion !== "unknown") {
        emotionCount[entry.emotion] =
          (emotionCount[entry.emotion] || 0) + 1;
      }

      // keywords (string → array)
      if (entry.keywords) {
        entry.keywords
          .split(',')
          .map(k => k.trim())
          .forEach(k => {
            if (k) allKeywords.add(k);
          });
      }
    });

    const topEmotion =
      Object.keys(emotionCount).length > 0
        ? Object.entries(emotionCount).reduce((a, b) =>
            a[1] > b[1] ? a : b
          )[0]
        : 'unknown';

    const mostUsedAmbience =
      Object.keys(ambienceCount).length > 0
        ? Object.entries(ambienceCount).reduce((a, b) =>
            a[1] > b[1] ? a : b
          )[0]
        : 'none';

    const recentKeywords = Array.from(allKeywords).slice(0, 5);

    res.json({
      totalEntries: entries.length,
      topEmotion,
      mostUsedAmbience,
      recentKeywords
    });

  } catch (err) {
    console.error('Insights Error:', err);
    res.status(500).json({ error: err.message });
  }
}