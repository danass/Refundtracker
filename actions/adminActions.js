'use server';

import { prisma } from '@/lib/prisma';
import { RefundStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/auditLog';

export async function adminUpdateStatus(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  // The adminActionConfigurations in actionConfigs.js should ensure 'targetStatus' is passed.
  const targetStatus = formData.get('targetStatus'); 
  const adminNotes = formData.get('adminNotes') || 'Status manually updated by admin.';
  const actorName = formData.get('actorName') || 'Admin';

  console.log(`[Admin Action] Request ID: ${refundRequestId}, Target Status: ${targetStatus}, Actor: ${actorName}`);

  if (!refundRequestId) {
    console.error('[Admin Action] Error: Missing refund request ID.');
    return { message: 'Error: Missing refund request ID.', status: 'error', success: false, error: 'Missing refund request ID.' };
  }
  if (!targetStatus || !Object.values(RefundStatus).includes(targetStatus)) {
    console.error(`[Admin Action] Error: Invalid target status '${targetStatus}'.`);
    return { message: `Error: Invalid target status '${targetStatus}'.`, status: 'error', success: false, error: `Invalid target status.` };
  }

  let currentRequest;
  try {
    currentRequest = await prisma.refundRequest.findUnique({
      where: { id: refundRequestId },
    });

    if (!currentRequest) {
      console.error(`[Admin Action] Error: Refund request ${refundRequestId} not found.`);
      return { message: `Error: Refund request ${refundRequestId} not found.`, status: 'error', success: false, error: 'Refund request not found.' };
    }

    console.log(`[Admin Action] Current status for ${refundRequestId}: ${currentRequest.status}`);

    const updatedRequest = await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: targetStatus,
        internalNotes: currentRequest.internalNotes 
          ? `${currentRequest.internalNotes}\n--- Admin Update to ${targetStatus} ---\n${adminNotes}` 
          : `--- Admin Update to ${targetStatus} ---\n${adminNotes}`,
        updatedAt: new Date(),
      },
    });

    await createAuditLog({
      refundRequestId,
      actorName,
      actorRole: 'admin',
      actionDescription: `Admin updated status from ${currentRequest.status} to ${targetStatus}`,
      previousStatus: currentRequest.status,
      newStatus: targetStatus,
      fieldChanges: adminNotes ? `Admin Notes: ${adminNotes}` : 'Status updated by admin.',
    });

    console.log(`[Admin Action] Successfully updated ${refundRequestId} to ${targetStatus}.`);
    revalidatePath(`/refunds/${refundRequestId}`);
    revalidatePath('/admin'); // Or any relevant admin dashboard
    revalidatePath('/overview');

    return { 
      message: `Status successfully updated to ${targetStatus}.`, 
      status: 'success', 
      success: true, 
      updatedRequest 
    };

  } catch (error) {
    console.error('[Admin Action] Error updating status:', error);
    const previousStatusOnError = currentRequest ? currentRequest.status : 'Unknown';
    await createAuditLog({
        refundRequestId,
        actorName,
        actorRole: 'admin',
        actionDescription: `Failed admin status update to ${targetStatus}`,
        previousStatus: previousStatusOnError,
        newStatus: targetStatus,
        fieldChanges: `Error: ${error.message}`,
        isError: true,
      });
    return { 
      message: `Error updating status: ${error.message}`,
      status: 'error', 
      success: false, 
      error: error.message 
    };
  }
} 