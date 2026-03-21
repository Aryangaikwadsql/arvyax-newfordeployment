const db = require('../db');
const { analyzeEmotion } = require('../services/llm');

// Create entry + auto analyze
async function createEntry(req, res) {
  try {
    const { userId, ambience, text } = req.body;
    if (!userId || !ambience || !text) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    let analysis = null;
    try {
      analysis = await analyzeEmotion(text);
    } catch (err) {
      console.error('Analysis failed:', err.message);
      // Continue without analysis
    }

    const insert = db.prepare(`
      INSERT INTO entries (userId, ambience, text, emotion, keywords, summary)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = insert.run(userId, ambience, text, analysis?.emotion, JSON.stringify(analysis?.keywords || []), analysis?.summary);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Entry created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get entries by userId
function getEntries(req, res) {
  try {
    const { userId } = req.params || req.query;
    const query = userId 
      ? db.prepare('SELECT * FROM entries WHERE userId = ? ORDER BY createdAt DESC')
      : db.prepare('SELECT * FROM entries ORDER BY createdAt DESC');
    
    const entries = userId ? query.all(userId) : query.all();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Analyze single text (separate)
async function analyze(req, res) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    const analysis = await analyzeEmotion(text);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Insights
function getInsights(req, res) {
  try {
    const { userId } = req.params;
    const stmt = db.prepare('SELECT * FROM entries WHERE userId = ?');
    const entries = stmt.all(userId);

    if (entries.length === 0) return res.json({ totalEntries: 0 });

    // Top ambience
    const ambienceCount = {};
    // Top emotion
    const emotionCount = {};
    const allKeywords = new Set();

    entries.forEach(entry => {
      ambienceCount[entry.ambience] = (ambienceCount[entry.ambience] || 0) + 1;
      if (entry.emotion) {
        emotionCount[entry.emotion] = (emotionCount[entry.emotion] || 0) + 1;
      }
      if (entry.keywords) {
        JSON.parse(entry.keywords).forEach(kw => allKeywords.add(kw));
      }
    });

    const recentKeywords = Array.from(allKeywords).slice(-5); // last unique

    res.json({
      totalEntries: entries.length,
      topEmotion: Object.entries(emotionCount).length ? Object.entries(emotionCount).reduce((a, b) => (a[1] > b[1] ? a : b))[0] : 'unknown',
      mostUsedAmbience: Object.entries(ambienceCount).length ? Object.entries(ambienceCount).reduce((a, b) => (a[1] > b[1] ? a : b))[0] : 'none',
      recentKeywords
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createEntry,
  getEntries,
  analyze,
  getInsights
};
