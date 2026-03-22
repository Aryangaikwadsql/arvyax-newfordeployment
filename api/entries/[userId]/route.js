import { prisma } from '../../../../db.js';

export async function GET(req, { params }) {
  try {
    const { userId } = params;

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    const entries = await prisma.entry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return Response.json(entries);

  } catch (err) {
    console.error('Get entries error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
