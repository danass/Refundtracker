import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';

import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const COMPANY_CAP_THRESHOLD = 5000; // Define company cap threshold for supervisor escalation

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { action, actorRole, actorName, notes } = await request.json(); // 'approve', 'reject', 'return_to_agent'

  // Basic validation
  if (actorRole !== 'team_lead') {
      return NextResponse.json({ error: 'Only team leads can perform this action' }, { status: 403 });
  }

  try {
    const existingRequest = await prisma.refundRequest.findUnique({
      where: { id: id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    }

    // Check if the current status allows for team lead actions
    const allowedStatuses = ['PENDING_LEAD_APPROVAL'];
    if (!allowedStatuses.includes(existingRequest.status)) {
         return NextResponse.json({ error: `Cannot perform actions from status ${existingRequest.status}` }, { status: 400 });
    }

    let newStatus = existingRequest.status;
    let actionDescription = '';

    switch (action) {
        case 'approve':
             // Check amount against company cap for supervisor escalation
            if (existingRequest.amount > COMPANY_CAP_THRESHOLD) {
                newStatus = 'PENDING_FINAL_APPROVAL';
                actionDescription = 'Approved by team lead, escalated to supervisor (amount above company cap)';
            } else {
                newStatus = 'APPROVED_FOR_PAYMENT';
                actionDescription = 'Approved by team lead';
            }
            break;
        case 'reject':
            newStatus = 'REJECTED_BY_LEAD';
            actionDescription = 'Rejected by team lead';
            if (!notes) {
                 return NextResponse.json({ error: 'Rejection notes are required' }, { status: 400 });
            }
            break;
        case 'return_to_agent':
            newStatus = 'RETURNED_TO_AGENT_FOR_EDITS';
            actionDescription = 'Returned to agent by team lead';
             if (!notes) {
                 return NextResponse.json({ error: 'Notes are required when returning to agent' }, { status: 400 });
            }
            break;
        default:
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updateData = {
        status: newStatus,
        leadComments: notes || existingRequest.leadComments, // Update lead comments if provided
    };

    const updatedRefundRequest = await prisma.refundRequest.update({
      where: {
        id: id,
      },
      data: updateData,
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
    console.error(`Error performing lead action ${action} on refund request ${id}:`, error);
    return NextResponse.json({ error: 'Failed to perform lead action' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 