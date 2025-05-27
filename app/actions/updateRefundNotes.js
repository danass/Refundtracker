'use server';

import { prisma } from '@/lib/prisma.js';
import { revalidatePath } from 'next/cache';

export async function updateRefundNotes(formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorRole = formData.get('actorRole');
  const actorName = formData.get('actorName');
  let notes = '';
  let noteField = '';
  let actionDescription = '';

  if (!refundRequestId || !actorRole || !actorName) {
    return { error: 'Missing required fields.' };
  }

  switch (actorRole) {
    case 'agent':
      notes = formData.get('agentNotes');
      noteField = 'agentNotes';
      actionDescription = 'Agent notes updated';
      break;
    case 'team_lead':
      notes = formData.get('leadComments');
      noteField = 'leadComments';
      actionDescription = 'Team lead comments updated';
      break;
    case 'supervisor':
      notes = formData.get('supervisorNotes');
      noteField = 'supervisorNotes';
      actionDescription = 'Supervisor notes updated';
      break;
    // Finance notes are typically read-only or updated via specific actions (e.g., payment processing)
    // Add a case for finance if direct editing of financeNotes is required.
    default:
      return { error: 'Invalid role for updating notes.' };
  }

  try {
    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        [noteField]: notes,
      },
    });

    // Create Audit Log entry for note update
    await prisma.auditLog.create({
      data: {
        refundRequestId: refundRequestId,
        actorRole: actorRole,
        actorName: actorName,
        actionDescription: actionDescription,
        newStatus: (await prisma.refundRequest.findUnique({ where: { id: refundRequestId } })).status, // Get current status
        fieldChanges: `${noteField} updated: ${notes}`,
      },
    });

    revalidatePath(`/refunds/${refundRequestId}`);
    return { success: true, message: `${actionDescription} successfully.` };

  } catch (error) {
    console.error(`Error updating ${noteField}:`, error);
    return { error: `Failed to update ${noteField}. Please try again.` };
  }
} 