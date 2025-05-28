'use server';

import { prisma } from '@/lib/prisma';
import { RefundStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/actions/commonActions';

export async function adminUpdateStatus(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const targetStatus = formData.get('targetStatus'); // This will be sent from the action config
  const adminNotes = formData.get('adminNotes') || 'Status updated by admin.';
  const actorName = formData.get('actorName') || 'Admin';

  if (!refundRequestId) {
    return { message: 'Error: Missing refund request ID.', status: 'error' };
  }
  if (!targetStatus || !Object.values(RefundStatus).includes(targetStatus)) {
    return { message: 'Error: Invalid target status.', status: 'error' };
  }

  try {
    const currentRequest = await prisma.refundRequest.findUnique({
      where: { id: refundRequestId },
    });

    if (!currentRequest) {
      return { message: `Error: Refund request ${refundRequestId} not found.`, status: 'error' };
    }

    const updatedRequest = await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: targetStatus,
        // Optionally, log admin notes to a specific field or a general notes field
        // For this example, let's assume there's an internalNotes field or similar
        // If not, this part might need adjustment based on schema
        internalNotes: currentRequest.internalNotes ? `${currentRequest.internalNotes}\n--- Admin Update ---\n${adminNotes}` : `--- Admin Update ---\n${adminNotes}`,
        updatedAt: new Date(), 
      },
    });

    await createAuditLog({
      refundRequestId,
      actorName,
      actionDescription: `Admin updated status to ${targetStatus}`,
      previousStatus: currentRequest.status,
      newStatus: targetStatus,
      fieldChanges: adminNotes ? `Admin Notes: ${adminNotes}` : 'Status updated by admin.',
    });

    revalidatePath(`/refunds/${refundRequestId}`);
    revalidatePath('/admin'); // Or any relevant admin dashboard

    return { message: `Status successfully updated to ${targetStatus}.`, status: 'success', updatedRequest };

  } catch (error) {
    console.error('Admin update status error:', error);
    await createAuditLog({
        refundRequestId,
        actorName,
        actionDescription: 'Failed admin status update',
        previousStatus: prevState?.currentRequest?.status || 'Unknown',
        newStatus: targetStatus,
        fieldChanges: `Error: ${error.message}`,
        isError: true,
      });
    return { message: `Error updating status: ${error.message}`, status: 'error' };
  }
} 