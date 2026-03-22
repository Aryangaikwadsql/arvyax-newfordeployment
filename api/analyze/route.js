import { analyzeEmotion } from '../../../llm.js';

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text) {
      return Response.json({ error: 'Text required' }, { status: 400 });
    }

    const analysis = await analyzeEmotion(text);

    return Response.json(analysis);

  } catch (err) {
    console.error('Analyze error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
