import { prisma } from '../../../db.js';
import { analyzeEmotion } from '../../../llm.js';

export async function POST(req) {
  try {
    const { userId, ambience, text } = await req.json();

    if (!userId || !ambience || !text) {
      return Response.json({ error: 'Missing userId, ambience, or text' }, { status: 400 });
    }

    const analysis = await analyzeEmotion(text);

    const entry = await prisma.entry.create({
      data: {
        userId,
        ambience,
        text,
        emotion: analysis.emotion || 'unknown',
        keywords: Array.isArray(analysis.keywords) && analysis.keywords.length > 0 
          ? analysis.keywords.join(', ') 
          : null,
        summary: analysis.summary || '',
      }
    });

    return Response.json({
      id: entry.id,
      message: 'Entry created',
      analysis
    });

  } catch (err) {
    console.error('Create entry error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
