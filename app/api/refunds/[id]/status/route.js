import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';

import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function PATCH(request, { params }) {
  const { id } =  await params;
  const { status, actorRole, actorName, actionDescription, notes } = await request.json();

  try {
    const existingRequest = await prisma.refundRequest.findUnique({
      where: { id: id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    }

    // Basic authorization check (can be expanded)
    // In a real app, you'd check if the actorRole is allowed to transition to the requested status
    if (!actorRole || !actorName) {
         return NextResponse.json({ error: 'Actor information is required' }, { status: 400 });
    }

    const updatedRefundRequest = await prisma.refundRequest.update({
      where: {
        id: id,
      },
      data: {
        status: status,
        // Update relevant notes based on role, e.g., agentNotes, leadComments, etc.
        ...(actorRole === 'agent' && notes && { agentNotes: notes }),
        ...(actorRole === 'team_lead' && notes && { leadComments: notes }),
        ...(actorRole === 'supervisor' && notes && { supervisorNotes: notes }),
        ...(actorRole === 'finance' && notes && { financeNotes: notes }),
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        refundRequestId: updatedRefundRequest.id,
        actorRole: actorRole,
        actorName: actorName,
        timestamp: new Date(),
        previousStatus: existingRequest.status,
        newStatus: updatedRefundRequest.status,
        actionDescription: actionDescription || `Status updated to ${status}`,
        // fieldChanges could be added here if applicable
      },
    });

    return NextResponse.json(updatedRefundRequest);
  } catch (error) {
    console.error(`Error updating refund request status ${id}:`, error);
    return NextResponse.json({ error: 'Failed to update refund request status' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 