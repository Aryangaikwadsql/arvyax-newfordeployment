import { prisma } from '../../../../db.js';

export async function GET(req, { params }) {
  try {
    const { userId } = params;

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    const entries = await prisma.entry.findMany({
      where: { userId }
    });

    if (entries.length === 0) {
      return Response.json({ totalEntries: 0 });
    }

    const ambienceCount = {};
    const emotionCount = {};
    const allKeywords = new Set();

    entries.forEach(entry => {
      ambienceCount[entry.ambience] = (ambienceCount[entry.ambience] || 0) + 1;

      if (entry.emotion && entry.emotion !== 'unknown') {
        emotionCount[entry.emotion] = (emotionCount[entry.emotion] || 0) + 1;
      }

      if (entry.keywords) {
        entry.keywords.split(',').map(k => k.trim()).forEach(k => {
          if (k) allKeywords.add(k);
        });
      }
    });

    const topEmotion = Object.keys(emotionCount).length > 0
      ? Object.entries(emotionCount).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'unknown';

    const mostUsedAmbience = Object.keys(ambienceCount).length > 0
      ? Object.entries(ambienceCount).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'none';

    const recentKeywords = Array.from(allKeywords).slice(0, 5);

    return Response.json({
      totalEntries: entries.length,
      topEmotion,
      mostUsedAmbience,
      recentKeywords
    });

  } catch (err) {
    console.error('Insights error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
