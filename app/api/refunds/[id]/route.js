import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    // In a real application, you would implement access control here
    // to ensure the user is authorized to view this request.
    const refundRequest = await prisma.refundRequest.findUnique({
      where: {
        id: id,
      },
      include: {
        auditLogs: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!refundRequest) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    }

    return NextResponse.json(refundRequest);
  } catch (error) {
    console.error(`Error fetching refund request ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch refund request' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 