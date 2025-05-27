import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

const ITEMS_PER_PAGE = 10;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE), 10);

    let whereClause = {};

    if (role === 'lead') {
      whereClause = { status: RefundStatus.PENDING_LEAD_APPROVAL };
    } else if (role === 'supervisor') {
      whereClause = { status: RefundStatus.PENDING_FINAL_APPROVAL };
    } else if (role === 'finance') {
      // Finance might see multiple statuses, e.g. APPROVED_FOR_PAYMENT, PAYMENT_PROCESSING etc.
      // This can be expanded with more specific filters if needed.
      whereClause = {
        OR: [
          { status: RefundStatus.APPROVED_FOR_PAYMENT },
          { status: RefundStatus.PAYMENT_PROCESSING },
          { status: RefundStatus.ERROR_PROCESSING_PAYMENT },
        ],
      };
    } else if (role === 'agent') {
        whereClause = {
            OR: [
                { status: RefundStatus.PENDING_AGENT_REVIEW },
                { status: RefundStatus.RETURNED_TO_AGENT_FOR_EDITS },
            ]
        }
    } else {
      // Default or if role is not specific for fetching all requests (e.g., for an admin view not yet implemented)
      // Or return an error for unsupported roles
      return NextResponse.json({ error: 'Unsupported or missing role for data fetching' }, { status: 400 });
    }

    const totalCount = await prisma.refundRequest.count({ where: whereClause });
    const requests = await prisma.refundRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({ requests, totalCount, totalPages: Math.ceil(totalCount / limit) });

  } catch (error) {
    console.error('[API_REFUNDS_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch refund requests.', details: error.message }, { status: 500 });
  }
} 