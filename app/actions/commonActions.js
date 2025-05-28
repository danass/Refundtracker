'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';


export async function createAuditLog(logData) {
  // Destructure with defaults for safety, though an error will be thrown by Prisma if required fields are missing
  const {
    refundRequestId,
    actorRole, // This is now expected directly in logData
    actorName,
    actionDescription,
    previousStatus,
    newStatus,
    fieldChanges,
    isError = false // Add default for isError if you plan to use it
  } = logData;

  const prismaCreateData = {
    refundRequestId,
    actorRole, // Ensure your Prisma schema has this field
    actorName,
    actionDescription,
    previousStatus,
    newStatus,
    fieldChanges,
    isError, // Ensure your Prisma schema has this field if used
  };

  console.log('[commonActions] Data being passed to prisma.auditLog.create:', JSON.stringify(prismaCreateData, null, 2));

  await prisma.auditLog.create({
    data: prismaCreateData,
  });
}


export async function updateRefundInternalNotes(prevState, formData) {
  const requestId = formData.get('requestId');
  const internalNotes = formData.get('internalNotes');
  // const actorName = formData.get('actorName') || 'System Update'; // If you want to log who changed it

  if (!requestId) {
    return { success: false, message: 'Request ID is missing.' };
  }

  try {
    await prisma.refundRequest.update({
      where: { id: requestId },
      data: {
        internalNotes: internalNotes,
        // updatedAt will be updated automatically by Prisma
      },
    });

    // For now, let's assume the actor name can be derived or is not strictly needed for this simple update
    // You might want to add an audit log entry here if internal note changes are critical to track with authorship
    // await prisma.auditLog.create({ ... });

    revalidatePath(`/refunds/${requestId}`);
    revalidatePath('/agent'); // Revalidate dashboards where this might be visible
    revalidatePath('/lead');
    revalidatePath('/supervisor');
    revalidatePath('/finance');

    return { success: true, message: 'Internal notes updated successfully.' };
  } catch (error) {
    console.error('Error updating internal notes:', error);
    return { success: false, message: `Failed to update internal notes: ${error.message}` };
  }
} 