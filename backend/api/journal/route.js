import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { analyzeEmotion } from '../../../services/llm.js';

const prisma = new PrismaClient();

export async function POST(req) {
  const { pathname } = req.nextUrl;
  if (pathname.includes('/analyze')) {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });
    try {
      const analysis = await analyzeEmotion(text);
      return NextResponse.json(analysis);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Create entry
  const { userId, ambience, text } = await req.json();
  if (!userId || !ambience || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  try {
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
        keywords: analysis?.keywords,
        summary: analysis?.summary,
      },
    });

    return NextResponse.json({ id: entry.id, message: 'Entry created' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { pathname } = req.nextUrl;
  const pathSegments = pathname.split('/');
  const isInsights = pathSegments.includes('insights');
  const userId = pathSegments[pathSegments.length - 1];

  try {
    if (isInsights) {
      const entries = await prisma.entry.findMany({ where: { userId } });
      if (!entries.length) return NextResponse.json({ totalEntries: 0 });

      const ambienceCount = {};
      const emotionCount = {};
      const allKeywords = new Set();

      entries.forEach(entry => {
        ambienceCount[entry.ambience] = (ambienceCount[entry.ambience] || 0) + 1;
        if (entry.emotion) emotionCount[entry.emotion] = (emotionCount[entry.emotion] || 0) + 1;
        if (entry.keywords) Array.isArray(entry.keywords) ? entry.keywords.forEach(kw => allKeywords.add(kw)) : Object.values(entry.keywords).forEach(kw => allKeywords.add(kw));
      });

      return NextResponse.json({
        totalEntries: entries.length,
        topEmotion: Object.entries(emotionCount).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'unknown',
        mostUsedAmbience: Object.entries(ambienceCount).reduce((a, b) => a[1] > b[1] ? a : b)?.[0] || 'none',
        recentKeywords: Array.from(allKeywords).slice(-5),
      });
    }

    const entries = await prisma.entry.findMany({
      orderBy: { createdAt: 'desc' },
      where: userId !== 'journal' ? { userId } : {},
    });
    return NextResponse.json(entries);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
