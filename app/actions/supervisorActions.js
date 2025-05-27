'use server';

import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Helper to create audit logs consistently
async function createAuditLog(refundRequestId, actorRole, actorName, actionDescription, previousStatus, newStatus, fieldChanges) {
  await prisma.auditLog.create({
    data: {
      refundRequestId,
      actorRole,
      actorName,
      actionDescription,
      previousStatus,
      newStatus,
      fieldChanges,
    },
  });
}

// Helper to revalidate paths
function revalidateRelevantPaths(refundRequestId, role) {
  revalidatePath(`/refunds/${refundRequestId}`);
  revalidatePath('/'); // Overview
  if (role) {
    const pathSuffix = role.toLowerCase().replace('_', '-');
    revalidatePath(`/${pathSuffix}`);
  }
}

// Action to allow a supervisor to bulk approve requests for payment
export async function supervisorBulkApprove(prevState, formData) {
  const selectedIds = formData.get('selectedIds')?.split(',').filter(id => id.trim() !== '');
  const supervisorNotes = formData.get('supervisorNotes');
  const actorName = formData.get('actorName') || 'Supervisor'; // Default actor name

  if (!selectedIds || selectedIds.length === 0) {
    return { error: 'No refund requests selected for bulk approval.', successCount: 0, failureCount: 0 };
  }

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  try {
    for (const id of selectedIds) {
      try {
        const currentRequest = await prisma.refundRequest.findUnique({ where: { id } });
        if (!currentRequest) {
          results.push({ id, status: 'Error: Not Found' });
          failureCount++;
          continue;
        }

        if (currentRequest.status !== RefundStatus.PENDING_FINAL_APPROVAL) {
          results.push({ id, status: `Error: Request not in PENDING_FINAL_APPROVAL state (is ${currentRequest.status})` });
          failureCount++;
          continue;
        }

        await prisma.refundRequest.update({
          where: { id },
          data: {
            status: RefundStatus.APPROVED_FOR_PAYMENT,
            supervisorNotes: supervisorNotes ? 
              (currentRequest.supervisorNotes ? `${currentRequest.supervisorNotes}\n[Bulk Approve Note]: ${supervisorNotes}` : `[Bulk Approve Note]: ${supervisorNotes}`) 
              : currentRequest.supervisorNotes, // Preserve existing notes if no new common note
            updatedAt: new Date(),
            // Audit Log
            auditLogs: {
              create: {
                actorRole: 'supervisor',
                actorName: actorName,
                actionDescription: 'Bulk approved for payment.',
                previousStatus: currentRequest.status,
                newStatus: RefundStatus.APPROVED_FOR_PAYMENT,
                fieldChanges: supervisorNotes ? `Common note added: "${supervisorNotes}"` : "No common note added.",
              },
            },
          },
        });
        results.push({ id, status: 'Successfully Approved' });
        successCount++;
      } catch (e) {
        console.error(`Failed to bulk approve request ${id}:`, e);
        results.push({ id, status: `Error: ${e.message}` });
        failureCount++;
      }
    }

    // Revalidate relevant paths
    revalidatePath('/supervisor');
    revalidatePath('/finance'); // Finance will see these new requests
    selectedIds.forEach(id => revalidatePath(`/refunds/${id}`));

    let message = `${successCount} request(s) approved for payment.`;
    if (failureCount > 0) {
      message += ` ${failureCount} request(s) failed.`;
    }
    return { message, successCount, failureCount, results };

  } catch (error) {
    console.error('Error in supervisorBulkApprove action:', error);
    return { error: 'An unexpected error occurred during bulk approval.', successCount, failureCount, results };
  }
}

// Supervisor Action: Final Approve (Approve for Payment)
export async function supervisorApprove(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName') || 'Supervisor';
  const supervisorNotes = formData.get('supervisorNotes');
  const actorRole = 'supervisor';

  if (!refundRequestId) {
    return { error: 'Missing refundRequestId' };
  }

  try {
    const currentRequest = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!currentRequest) return { error: 'Refund request not found' };

    if (currentRequest.status !== RefundStatus.PENDING_FINAL_APPROVAL) {
      return { error: `Request cannot be approved. Current status: ${currentRequest.status}` };
    }

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: RefundStatus.APPROVED_FOR_PAYMENT,
        supervisorNotes: supervisorNotes || currentRequest.supervisorNotes, // Keep existing if new is empty
        updatedAt: new Date(),
        auditLogs: {
          create: {
            actorRole: 'supervisor',
            actorName: actorName,
            actionDescription: 'Refund approved for payment by supervisor.',
            previousStatus: currentRequest.status,
            newStatus: RefundStatus.APPROVED_FOR_PAYMENT,
            fieldChanges: supervisorNotes ? `Supervisor notes: "${supervisorNotes}"` : "Supervisor approved."
          }
        }
      }
    });
    revalidatePath(`/refunds/${refundRequestId}`);
    revalidatePath('/supervisor');
    revalidatePath('/finance');
    return { success: true, message: 'Refund approved for payment.' };
  } catch (error) {
    console.error("Error approving refund (supervisor):", error);
    return { error: 'Failed to approve refund.' };
  }
}

// Supervisor Action: Reject
export async function supervisorReject(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const rejectionReason = formData.get('rejectionReason'); // Ensure this matches the field name in ActionButton
  const actorName = formData.get('actorName') || 'Supervisor';

  if (!refundRequestId) return { error: 'Missing refundRequestId' };
  if (!rejectionReason) return { error: 'Rejection reason is required.' };

  try {
    const currentRequest = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!currentRequest) return { error: 'Refund request not found' };

    if (currentRequest.status !== RefundStatus.PENDING_FINAL_APPROVAL) {
      return { error: `Request cannot be rejected. Current status: ${currentRequest.status}` };
    }

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: RefundStatus.REJECTED_BY_SUPERVISOR,
        supervisorNotes: rejectionReason, // Save rejection reason in notes
        updatedAt: new Date(),
        auditLogs: {
          create: {
            actorRole: 'supervisor',
            actorName: actorName,
            actionDescription: 'Refund rejected by supervisor.',
            previousStatus: currentRequest.status,
            newStatus: RefundStatus.REJECTED_BY_SUPERVISOR,
            fieldChanges: `Rejection reason: "${rejectionReason}"`
          }
        }
      }
    });
    revalidatePath(`/refunds/${refundRequestId}`);
    revalidatePath('/supervisor');
    return { success: true, message: 'Refund rejected.' };
  } catch (error) {
    console.error("Error rejecting refund (supervisor):", error);
    return { error: 'Failed to reject refund.' };
  }
} 