import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { action, actorRole, actorName, notes } = await request.json();

  // Basic validation
  if (actorRole !== 'supervisor') {
      return NextResponse.json({ error: 'Unauthorized action' }, { status: 403 });
  }

  try {
    const refundRequest = await prisma.refundRequest.findUnique({
      where: { id: id },
      include: { auditLogs: true },
    });

    if (!refundRequest) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    }

    let newStatus = refundRequest.status;
    let actionDescription = '';

    if (refundRequest.status !== 'PENDING_FINAL_APPROVAL') {
         return NextResponse.json({ error: `Cannot perform supervisor actions on requests with status ${refundRequest.status}` }, { status: 400 });
    }

    switch (action) {
        case 'approve_for_payment':
            newStatus = 'APPROVED_FOR_PAYMENT';
            actionDescription = `Supervisor approved for payment.`;
            break;
        case 'reject':
            newStatus = 'REJECTED';
            actionDescription = `Supervisor rejected the request.`;
            break;
        default:
            return NextResponse.json({ error: 'Invalid supervisor action' }, { status: 400 });
    }

    // Update refund request and create audit log
    const updatedRequest = await prisma.refundRequest.update({
      where: { id: id },
      data: {
        status: newStatus,
        supervisorNotes: notes, // Save supervisor notes
        auditLogs: {
          create: {
            actionDescription: actionDescription,
            actorRole: actorRole,
            actorName: actorName,
            previousStatus: refundRequest.status,
            newStatus: newStatus,
            notes: notes || null,
          },
        },
      },
      include: { auditLogs: true },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error handling supervisor action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 