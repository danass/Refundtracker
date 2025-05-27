'use server';

import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// const AGENT_MAX_APPROVAL_LIMIT = 500; // No longer needed for this logic

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

function revalidateRelevantPaths(refundRequestId) {
  revalidatePath(`/refunds/${refundRequestId}`);
  revalidatePath('/agent');
  revalidatePath('/'); // Overview/main dashboard potentially
  // Add other paths if necessary, e.g., /lead if escalating
}

// Agent Action: Approve
export async function agentApprove(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName');
  const agentNotes = formData.get('agentNotes');
  const actorRole = 'agent';

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.' };

    if (refund.status !== RefundStatus.PENDING_AGENT_REVIEW && refund.status !== RefundStatus.RETURNED_TO_AGENT_FOR_EDITS) {
      return { error: 'Action not allowed for current status.' };
    }

    // Ensure originalOrderAmount is present and valid, otherwise default to a behavior (e.g., escalate)
    // For simplicity, we'll assume originalOrderAmount is always a valid number here.
    // In a real scenario, you might want to handle cases where originalOrderAmount is null or 0.
    if (typeof refund.originalOrderAmount !== 'number' || refund.originalOrderAmount === null) {
        // Default to escalation if originalOrderAmount is missing or invalid, or handle as an error
        console.warn(`originalOrderAmount is missing or invalid for refund ${refundRequestId}. Defaulting to lead escalation.`);
        // Alternatively, return { error: 'Original order amount is missing, cannot determine approval path.' };
    }

    const previousStatus = refund.status;
    let newStatus;
    let auditActionDescription;
    let successMessage;

    // New logic: Compare refund amount to original order amount
    if (refund.originalOrderAmount !== null && refund.amount > refund.originalOrderAmount) {
      newStatus = RefundStatus.PENDING_LEAD_APPROVAL;
      auditActionDescription = 'Approved by Agent (Amount > Original Payment; Escalated to Lead)';
      successMessage = 'Refund approved by agent. Amount exceeds original payment, escalated to Team Lead.';
      revalidatePath('/lead');
    } else {
      // This covers refund.amount <= refund.originalOrderAmount OR if originalOrderAmount is missing/null (falls into this path)
      newStatus = RefundStatus.APPROVED_FOR_PAYMENT;
      auditActionDescription = 'Approved by Agent (Sent to Finance)';
      successMessage = 'Refund approved by agent and sent to Finance for payment processing.';
      revalidatePath('/finance');
    }

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: newStatus,
        agentNotes: agentNotes || refund.agentNotes,
      },
    });

    await createAuditLog(refundRequestId, actorRole, actorName, auditActionDescription, previousStatus, newStatus, agentNotes ? `Agent notes: ${agentNotes}` : 'Approved');
    revalidateRelevantPaths(refundRequestId);

    return { success: true, message: successMessage };
  } catch (e) {
    console.error('Agent approve error:', e);
    return { error: 'Failed to approve refund.' };
  }
}

// Agent Action: Escalate to Team Lead
export async function agentEscalate(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName');
  const agentNotes = formData.get('agentNotes');
  const actorRole = 'agent';

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.' };

    if (refund.status !== RefundStatus.PENDING_AGENT_REVIEW && refund.status !== RefundStatus.RETURNED_TO_AGENT_FOR_EDITS) {
      return { error: 'Action not allowed for current status.' };
    }
    // No amount check here, escalation is the purpose

    const previousStatus = refund.status;
    const newStatus = RefundStatus.PENDING_LEAD_APPROVAL;

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: newStatus,
        agentNotes: agentNotes || refund.agentNotes,
      },
    });

    await createAuditLog(refundRequestId, actorRole, actorName, 'Escalated to Team Lead', previousStatus, newStatus, agentNotes ? `Agent notes: ${agentNotes}` : 'Escalated');
    revalidateRelevantPaths(refundRequestId);
    revalidatePath('/lead');

    return { success: true, message: 'Refund escalated to Team Lead.' };
  } catch (e) {
    console.error('Agent escalate error:', e);
    return { error: 'Failed to escalate refund.' };
  }
}

// Agent Action: Request More Information from Client
export async function agentRequestInfo(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName');
  const agentNotes = formData.get('agentNotes'); // This note is crucial for the client
  const actorRole = 'agent';

  if (!agentNotes) return { error: 'Please provide notes detailing the information needed from the client.' };

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.' };

    if (refund.status !== RefundStatus.PENDING_AGENT_REVIEW && refund.status !== RefundStatus.RETURNED_TO_AGENT_FOR_EDITS) {
      return { error: 'Action not allowed for current status.' };
    }

    const previousStatus = refund.status;
    const newStatus = RefundStatus.RETURNED_TO_CLIENT_FOR_INFO;

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: newStatus,
        agentNotes: agentNotes, // Overwrite/set agent notes with the request for info
      },
    });

    await createAuditLog(refundRequestId, actorRole, actorName, 'Information Requested from Client', previousStatus, newStatus, `Info request: ${agentNotes}`);
    revalidateRelevantPaths(refundRequestId);
    // Potentially revalidate client dashboard if they have one: revalidatePath('/client'); 

    return { success: true, message: 'Refund status updated. Client will be notified to provide more information.' };
  } catch (e) {
    console.error('Agent request info error:', e);
    return { error: 'Failed to request information.' };
  }
}

// Agent Action: Reject Refund
export async function agentReject(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName');
  const rejectionReason = formData.get('rejectionReason'); // Specific field for reason
  const actorRole = 'agent';

  if (!rejectionReason) return { error: 'Rejection reason is mandatory.' };

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.' };

    if (refund.status !== RefundStatus.PENDING_AGENT_REVIEW && refund.status !== RefundStatus.RETURNED_TO_AGENT_FOR_EDITS) {
      return { error: 'Action not allowed for current status.' };
    }

    const previousStatus = refund.status;
    const newStatus = RefundStatus.REJECTED_BY_AGENT;

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: newStatus,
        agentNotes: refund.agentNotes ? `${refund.agentNotes}\nREJECTION REASON: ${rejectionReason}` : `REJECTION REASON: ${rejectionReason}`, // Append reason to notes
      },
    });

    await createAuditLog(refundRequestId, actorRole, actorName, 'Rejected by Agent', previousStatus, newStatus, `Rejection reason: ${rejectionReason}`);
    revalidateRelevantPaths(refundRequestId);

    return { success: true, message: 'Refund rejected successfully.' };
  } catch (e) {
    console.error('Agent reject error:', e);
    return { error: 'Failed to reject refund.' };
  }
}

// Agent Action: Create New Refund Request
export async function createRefundRequestByAgent(prevState, formData, actorNameFromSubmission) {
  const actorName = actorNameFromSubmission || 'Agent User'; // Ensure actorName is available
  const actorRole = 'agent';

  const data = {
    clientFirstName: formData.get('clientFirstName'),
    clientLastName: formData.get('clientLastName'),
    clientEmail: formData.get('clientEmail'),
    zendeskTicketId: formData.get('zendeskTicketId') || null,
    amount: parseFloat(formData.get('amount')),
    currency: formData.get('currency'),
    reason: formData.get('reason'),
    iban: formData.get('iban') || null,
    bic: formData.get('bic') || null,
    // Default values for a new request initiated by an agent:
    status: RefundStatus.PENDING_AGENT_REVIEW, // Or DRAFT if you want a two-step creation
    paymentMethod: 'BANK_TRANSFER', // Assuming default, or could be a form field
    createdByRole: actorRole,
    // ticketId will be auto-generated by Prisma if using @default(uuid()) or similar
  };

  const errors = {};
  if (!data.clientFirstName) errors.clientFirstName = 'Client first name is required.';
  if (!data.clientLastName) errors.clientLastName = 'Client last name is required.';
  if (!data.clientEmail) errors.clientEmail = 'Client email is required.';
  else if (!/\S+@\S+\.\S+/.test(data.clientEmail)) errors.clientEmail = 'Invalid email format.';
  if (isNaN(data.amount) || data.amount <= 0) errors.amount = 'Valid refund amount is required.';
  if (!data.currency) errors.currency = 'Currency is required.';
  if (!data.reason) errors.reason = 'Reason for refund is required.';

  if (Object.keys(errors).length > 0) {
    return { error: 'Validation failed. Please check the fields.', errors, success: false };
  }

  try {
    const newRefundRequest = await prisma.refundRequest.create({
      data: {
        ...data,
        // Ensure numeric fields are correctly typed if schema expects Int/Float
        amount: Number(data.amount), 
      }
    });

    await createAuditLog(
      newRefundRequest.id,
      actorRole,
      actorName,
      'Refund Request Created by Agent',
      null, // No previous status for a new request
      newRefundRequest.status,
      `Initial details: ${JSON.stringify(data)}`
    );

    revalidateRelevantPaths(newRefundRequest.id);
    // Potentially revalidate the main agent dashboard list immediately
    revalidatePath('/agent'); 

    return {
      success: true,
      message: `Refund request ${newRefundRequest.ticketId || newRefundRequest.id} created successfully.`,
      refundId: newRefundRequest.id,
      errors: {}
    };
  } catch (e) {
    console.error('Create refund request error:', e);
    // Check for specific Prisma errors if needed, e.g., unique constraint violation
    return { error: 'Failed to create refund request. Please try again.', errors: {}, success: false };
  }
} 