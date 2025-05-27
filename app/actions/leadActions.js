'use server';

import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
// import { SUPERVISOR_APPROVAL_THRESHOLD } from '../../lib/constants.js';

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

const LEAD_REJECTION_LIMIT = 5000; // Example: Leads can reject up to $5000

// export const SUPERVISOR_APPROVAL_THRESHOLD = 1000; // Refunds over this amount go to supervisor

// Team Lead Action: Approve
export async function leadApprove(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName');
  const leadComments = formData.get('leadComments');
  const actorRole = 'team_lead';

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.' };
    if (refund.status !== RefundStatus.PENDING_LEAD_APPROVAL) {
      return { error: 'Action not allowed for current status.' };
    }

    const previousStatus = refund.status;
    let newStatus;
    let auditActionDescription = 'Lead Approved Refund';

    // Temporarily disable SUPERVISOR_APPROVAL_THRESHOLD logic
    // if (refund.amount > SUPERVISOR_APPROVAL_THRESHOLD) {
    //   newStatus = RefundStatus.PENDING_FINAL_APPROVAL;
    //   auditActionDescription = 'Lead Approved & Escalated for Final Approval (Over Threshold)';
    // } else {
    //   newStatus = RefundStatus.APPROVED_FOR_PAYMENT;
    //   auditActionDescription = 'Lead Approved for Payment (Under Supervisor Threshold)';
    // }
    newStatus = RefundStatus.APPROVED_FOR_PAYMENT; // Defaulting to this for now
    auditActionDescription = 'Lead Approved for Payment';

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: newStatus,
        leadComments: leadComments || refund.leadComments,
      },
    });

    await createAuditLog(refundRequestId, actorRole, actorName, auditActionDescription, previousStatus, newStatus, leadComments ? `Lead comments: ${leadComments}` : 'Approved');
    revalidateRelevantPaths(refundRequestId, 'team_lead');
    revalidatePath('/supervisor');

    return { success: true, message: 'Refund approved by Team Lead and sent for final approval.' };
  } catch (e) {
    console.error('Lead approve error:', e);
    return { error: 'Failed to approve refund.' };
  }
}

// Team Lead Action: Reject
export async function leadReject(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName');
  const rejectionReason = formData.get('rejectionReason');
  const actorRole = 'team_lead';

  if (!rejectionReason) return { error: 'Rejection reason is mandatory.' };

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.' };
    if (refund.status !== RefundStatus.PENDING_LEAD_APPROVAL) {
      return { error: 'Action not allowed for current status.' };
    }

    const previousStatus = refund.status;
    const newStatus = RefundStatus.REJECTED_BY_LEAD;
    const updatedLeadComments = refund.leadComments ? `${refund.leadComments}\nREJECTION REASON: ${rejectionReason}` : `REJECTION REASON: ${rejectionReason}`;

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: newStatus,
        leadComments: updatedLeadComments,
      },
    });

    await createAuditLog(refundRequestId, actorRole, actorName, 'Rejected by Team Lead', previousStatus, newStatus, `Rejection reason: ${rejectionReason}`);
    revalidateRelevantPaths(refundRequestId, 'team_lead');

    return { success: true, message: 'Refund rejected by Team Lead.' };
  } catch (e) {
    console.error('Lead reject error:', e);
    return { error: 'Failed to reject refund.' };
  }
}

// Team Lead Action: Return to Agent for Edits
export async function leadReturnToAgent(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName');
  const returnReason = formData.get('returnReason');
  const actorRole = 'team_lead';

  if (!returnReason) return { error: 'Reason for returning to agent is mandatory.' };

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.' };
    if (refund.status !== RefundStatus.PENDING_LEAD_APPROVAL) {
      return { error: 'Action not allowed for current status.' };
    }

    const previousStatus = refund.status;
    const newStatus = RefundStatus.RETURNED_TO_AGENT_FOR_EDITS;
    const updatedLeadComments = refund.leadComments ? `${refund.leadComments}\nRETURNED: ${returnReason}` : `RETURNED: ${returnReason}`;

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: newStatus,
        leadComments: updatedLeadComments,
      },
    });

    await createAuditLog(refundRequestId, actorRole, actorName, 'Returned to Agent by Team Lead', previousStatus, newStatus, `Reason: ${returnReason}`);
    revalidateRelevantPaths(refundRequestId, 'team_lead');
    revalidatePath('/agent');

    return { success: true, message: 'Refund returned to agent for edits.' };
  } catch (e) {
    console.error('Lead return to agent error:', e);
    return { error: 'Failed to return refund to agent.' };
  }
} 