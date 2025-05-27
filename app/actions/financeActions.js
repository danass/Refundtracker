'use server';

import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

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

// Finance Action: Mark as Paid
export async function financeMarkPaid(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName');
  const financeNotes = formData.get('financeNotes'); // Optional notes from finance
  const actorRole = 'finance';

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.' };
    if (refund.status !== RefundStatus.APPROVED_FOR_PAYMENT && refund.status !== RefundStatus.PAYMENT_PROCESSING) { // Can mark paid if approved or processing
      return { error: 'Action not allowed for current status. Refund must be approved for payment or payment processing.' };
    }

    const previousStatus = refund.status;
    const newStatus = RefundStatus.PAID;

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: newStatus,
        financeNotes: financeNotes || refund.financeNotes,
        paidAt: new Date(), // Record payment timestamp
      },
    });

    let auditFieldChanges = financeNotes ? `Finance notes: ${financeNotes}` : 'Marked as paid';

    await createAuditLog(refundRequestId, actorRole, actorName, 'Marked as Paid by Finance', previousStatus, newStatus, auditFieldChanges);
    revalidateRelevantPaths(refundRequestId, 'finance');

    return { success: true, message: 'Refund marked as paid successfully.' };
  } catch (e) {
    console.error('Finance mark paid error:', e);
    return { error: 'Failed to mark refund as paid.' };
  }
}

// Finance Action: Trigger Payment (Simulated)
export async function financeTriggerPayment(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName');
  const financeNotes = formData.get('financeNotes');
  const actorRole = 'finance';

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.' };
    if (refund.status !== RefundStatus.APPROVED_FOR_PAYMENT) {
      return { error: 'Refund must be in APPROVED_FOR_PAYMENT status to trigger payment.' };
    }

    const previousStatus = refund.status;
    const newStatus = RefundStatus.PAYMENT_PROCESSING;

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: newStatus,
        financeNotes: financeNotes ? `${refund.financeNotes || ''} [Process Init: ${financeNotes}]` : refund.financeNotes,
      },
    });

    await createAuditLog(refundRequestId, actorRole, actorName, 'Payment Processing Initiated', previousStatus, newStatus, financeNotes ? `Finance notes: ${financeNotes}` : 'Payment processing started');
    revalidateRelevantPaths(refundRequestId, 'finance'); // Revalidate for PAYMENT_PROCESSING

    // Simulate API call and final status update (non-blocking)
    (async () => {
      await simulateApiCall(); 
      const isSuccess = Math.random() > 0.1; 

      try {
        const currentRefund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
        if (currentRefund && currentRefund.status === RefundStatus.PAYMENT_PROCESSING) {
          const prevStatusForApi = currentRefund.status;
          const finalStatus = isSuccess ? RefundStatus.PAID : RefundStatus.ERROR_PROCESSING_PAYMENT;
          const updateData = { status: finalStatus };
          if (isSuccess) {
            updateData.paidAt = new Date();
            updateData.paymentProviderTransactionId = `SIM_PAY_${uuidv4()}`;
          }

          await prisma.refundRequest.update({
            where: { id: refundRequestId },
            data: updateData,
          });
          await createAuditLog(
            refundRequestId,
            actorRole,
            `System (Simulated API)`,
            isSuccess ? 'Payment Successful (Simulated)' : 'Payment Failed (Simulated)',
            prevStatusForApi,
            finalStatus,
            isSuccess ? 'Payment completed and marked as PAID.' : 'Payment gateway reported an error.'
          );
          // Removed revalidateRelevantPaths from here
          // Manual refresh will be needed to see PAID/ERROR_PROCESSING_PAYMENT after delay
        }
      } catch (e) {
        console.error(`Error in simulated API completion for individual payment ${refundRequestId}:`, e);
      }
    })();

    return { success: true, message: 'Payment processing initiated. Status will update after simulated API call (manual refresh may be needed).' };
  } catch (e) {
    console.error('Finance trigger payment error:', e);
    return { error: 'Failed to initiate payment processing.' };
  }
}

// Finance Action: Handle Payment Error
export async function financeHandlePaymentError(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName');
  const financeNotes = formData.get('financeNotes'); // Optional notes for handling error
  const actorRole = 'finance';

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.' };
    if (refund.status !== RefundStatus.ERROR_PROCESSING_PAYMENT) {
      return { error: 'Action only allowed for refunds with payment processing errors.' };
    }

    const previousStatus = refund.status;
    // For now, the action is to reset to APPROVED_FOR_PAYMENT for a retry.
    // Could be extended to escalate or take other actions.
    const newStatus = RefundStatus.APPROVED_FOR_PAYMENT;

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: newStatus,
        financeNotes: financeNotes ? `${refund.financeNotes || ''} [Error Handled: ${financeNotes}]` : refund.financeNotes,
      },
    });

    await createAuditLog(
      refundRequestId, 
      actorRole, 
      actorName, 
      'Payment Error Handled: Reset for Retry', 
      previousStatus, 
      newStatus, 
      financeNotes ? `Finance notes: ${financeNotes}` : 'Resetting for payment retry.'
    );
    revalidateRelevantPaths(refundRequestId, 'finance');

    return { success: true, message: 'Refund status reset to Approved for Payment for retry.' };
  } catch (e) {
    console.error('Finance handle payment error:', e);
    return { error: 'Failed to handle payment error.' };
  }
}

export async function financeBulkMarkPaid(prevState, formData) {
  const selectedIdsString = formData.get('selectedIds');
  const actorName = formData.get('actorName') || 'Finance User';
  const financeNotes = formData.get('financeNotes');
  const actorRole = 'finance';

  if (!selectedIdsString) {
    return { message: "No requests selected.", error: "No requests were selected for bulk update.", successCount: 0, failureCount: 0 };
  }
  const selectedIds = selectedIdsString.split(',');
  
  let successCount = 0;
  let failureCount = 0;
  const errors = [];

  for (const refundRequestId of selectedIds) {
    try {
      const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
      if (!refund) {
        errors.push(`Request ID ${refundRequestId} not found.`);
        failureCount++;
        continue;
      }

      if (refund.status !== RefundStatus.APPROVED_FOR_PAYMENT && refund.status !== RefundStatus.PAYMENT_PROCESSING) {
        errors.push(`Request ID ${refundRequestId} is not in a status eligible for marking as paid (current: ${refund.status}).`);
        failureCount++;
        continue;
      }

      const previousStatus = refund.status;
      const newStatus = RefundStatus.PAID;

      await prisma.refundRequest.update({
        where: { id: refundRequestId },
        data: {
          status: newStatus,
          financeNotes: financeNotes ? `${refund.financeNotes || ''} [Bulk Paid: ${financeNotes}]` : refund.financeNotes,
          paidAt: new Date(),
        },
      });

      await createAuditLog(refundRequestId, actorRole, actorName, 'Bulk Marked as Paid by Finance', previousStatus, newStatus, financeNotes ? `Bulk finance notes: ${financeNotes}` : 'Bulk marked as paid');
      successCount++;
    } catch (e) {
      console.error(`Error processing request ID ${refundRequestId} for bulk mark paid:`, e);
      errors.push(`Request ID ${refundRequestId}: ${e.message}`);
      failureCount++;
    }
  }

  if (successCount > 0) {
    revalidatePath('/'); // Overview
    revalidatePath('/finance');
    // Could revalidate individual paths too, but might be too many for bulk
  }

  let message = '';
  if (successCount > 0) message += `${successCount} request(s) successfully marked as paid. `;
  if (failureCount > 0) message += `${failureCount} request(s) failed. ${errors.join('; ')} `;
  if (successCount === 0 && failureCount === 0) message = 'No requests were processed.';

  return { message, successCount, failureCount, error: failureCount > 0 ? errors.join('; ') : null };
}

// Simulate a delay for API calls
const simulateApiCall = (duration = 4000) => new Promise(resolve => setTimeout(resolve, duration));

// New Finance Action: Bulk Process Payment (moves to PAYMENT_PROCESSING)
export async function financeBulkProcessPayment(prevState, formData) {
  const selectedIdsString = formData.get('selectedIds');
  const actorName = formData.get('actorName') || 'Finance User';
  const financeNotes = formData.get('financeNotes');
  const actorRole = 'finance';

  if (!selectedIdsString) {
    return { message: "No requests selected.", error: "No requests were selected for bulk processing.", successCount: 0, failureCount: 0 };
  }
  const selectedIds = selectedIdsString.split(',');
  
  let successCount = 0;
  let failureCount = 0;
  const errors = [];
  const processedRequests = [];

  for (const refundRequestId of selectedIds) {
    try {
      const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
      if (!refund) {
        errors.push(`Request ID ${refundRequestId} not found.`);
        failureCount++;
        continue;
      }

      if (refund.status !== RefundStatus.APPROVED_FOR_PAYMENT) {
        errors.push(`Request ID ${refundRequestId} is not in APPROVED_FOR_PAYMENT status (current: ${refund.status}).`);
        failureCount++;
        continue;
      }

      const previousStatus = refund.status;
      const newStatus = RefundStatus.PAYMENT_PROCESSING;

      await prisma.refundRequest.update({
        where: { id: refundRequestId },
        data: {
          status: newStatus,
          financeNotes: financeNotes ? `${refund.financeNotes || ''} [Bulk Process Init: ${financeNotes}]` : refund.financeNotes,
        },
      });

      await createAuditLog(refundRequestId, actorRole, actorName, 'Bulk Payment Processing Initiated', previousStatus, newStatus, financeNotes ? `Bulk finance notes: ${financeNotes}` : 'Bulk payment processing initiated');
      successCount++;
      processedRequests.push(refundRequestId); 
    } catch (e) {
      console.error(`Error processing request ID ${refundRequestId} for bulk payment initiation:`, e);
      errors.push(`Request ID ${refundRequestId}: ${e.message}`);
      failureCount++;
    }
  }

  if (successCount > 0) {
    revalidatePath('/'); 
    revalidatePath('/finance');
    // Revalidate paths for the initial change to PAYMENT_PROCESSING
  }

  // Simulate API call and final status update (non-blocking)
  if (processedRequests.length > 0) {
    (async () => {
      for (const refundRequestId of processedRequests) {
        await simulateApiCall(); 
        const isSuccess = Math.random() > 0.1; 

        try {
          const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
          if (refund && refund.status === RefundStatus.PAYMENT_PROCESSING) {
            const previousStatus = refund.status;
            const finalStatus = isSuccess ? RefundStatus.PAID : RefundStatus.ERROR_PROCESSING_PAYMENT;
            const updateData = { status: finalStatus };
            if (isSuccess) {
              updateData.paidAt = new Date();
              updateData.paymentProviderTransactionId = `SIM_PAY_${uuidv4()}`;
            }

            await prisma.refundRequest.update({
              where: { id: refundRequestId },
              data: updateData,
            });
            await createAuditLog(
              refundRequestId,
              actorRole,
              `System (Simulated API)`,
              isSuccess ? 'Payment Successful (Simulated)' : 'Payment Failed (Simulated)',
              previousStatus,
              finalStatus,
              isSuccess ? 'Payment completed and marked as PAID.' : 'Payment gateway reported an error.'
            );
            // Removed revalidateRelevantPaths from here
          }
        } catch (e) {
          console.error(`Error in simulated API completion for ${refundRequestId}:`, e);
        }
      }
      // Removed revalidatePath from here for the final status updates from IIFE
    })();
  }

  let message = '';
  if (successCount > 0) message += `${successCount} request(s) sent for payment processing. Status will update after simulated API call (manual refresh may be needed). `;
  if (failureCount > 0) message += `${failureCount} request(s) failed to initiate processing. ${errors.join('; ')} `;
  if (successCount === 0 && failureCount === 0) message = 'No requests were processed.';
  
  return { message, successCount, failureCount, error: failureCount > 0 ? errors.join('; ') : null };
} 