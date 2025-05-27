import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';

import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const AGENT_APPROVAL_THRESHOLD = 1000; // Define agent's approval threshold

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { actorRole, actorName, notes } = await request.json();

  // Basic validation
  if (actorRole !== 'agent') {
      return NextResponse.json({ error: 'Only agents can perform this action' }, { status: 403 });
  }

  try {
    const existingRequest = await prisma.refundRequest.findUnique({
      where: { id: id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    }

    // Check if the current status allows for agent approval
    const allowedStatuses = ['PENDING_AGENT_REVIEW', 'RETURNED_TO_AGENT_FOR_EDITS'];
    if (!allowedStatuses.includes(existingRequest.status)) {
         return NextResponse.json({ error: `Cannot approve from status ${existingRequest.status}` }, { status: 400 });
    }

    let newStatus = 'APPROVED_FOR_PAYMENT';
    let actionDescription = 'Approved by agent';

    // Check amount threshold for escalation
    if (existingRequest.amount > AGENT_APPROVAL_THRESHOLD) {
        newStatus = 'PENDING_LEAD_APPROVAL';
        actionDescription = 'Escalated to team lead (amount above threshold)';
    }


    const updatedRefundRequest = await prisma.refundRequest.update({
      where: {
        id: id,
      },
      data: {
        status: newStatus,
        agentNotes: notes || existingRequest.agentNotes, // Update agent notes if provided
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
        actionDescription: actionDescription,
        // fieldChanges could be added here if applicable
      },
    });

    return NextResponse.json(updatedRefundRequest);
  } catch (error) {
    console.error(`Error approving refund request ${id} by agent:`, error);
    return NextResponse.json({ error: 'Failed to approve refund request' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 