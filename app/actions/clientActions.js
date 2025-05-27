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
function revalidateRelevantPaths(refundRequestId) {
  revalidatePath(`/refunds/${refundRequestId}`);
  revalidatePath('/'); // Overview
  revalidatePath('/client'); // Client's view of their request
}

// Client Action: Submit Information / Respond to Agent Request
export async function clientSubmitInfo(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName') || 'Client'; // Default if not passed, though it should be
  const clientProvidedInfo = formData.get('clientProvidedInfo');
  const actorRole = 'client';

  if (!clientProvidedInfo) return { error: 'Please provide the requested information.' };

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.' };
    if (refund.status !== RefundStatus.RETURNED_TO_CLIENT_FOR_INFO) {
      return { error: 'Action not allowed for current status. Agent must request info first.' };
    }

    const previousStatus = refund.status;
    // After client provides info, it goes back to agent review
    const newStatus = RefundStatus.PENDING_AGENT_REVIEW;

    // Append client info to a specific field or a general notes field if applicable
    // For now, let's assume it updates client-specific notes or appends to a general one.
    // We need a field like `clientResponseNotes` or similar in the schema or update existing general notes field.
    // Let's use `clientResponseNotes` - assuming it exists. If not, this will fail or need schema adjustment.
    // For now, we'll update `additionalClientInfo` if such a field exists, or log it to audit.
    // Let's update agentNotes for simplicity, prepending client's response.

    const updatedAgentNotes = `Client Response: ${clientProvidedInfo}\n-------------------\n${refund.agentNotes || ''}`;

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: newStatus,
        // Add a field like `additionalClientInfo` or `clientResponse` to schema for this if needed
        // For now, just log it and it could be part of general notes.
        agentNotes: updatedAgentNotes, // Or a new field like additionalClientInfo: clientProvidedInfo
      },
    });

    await createAuditLog(refundRequestId, actorRole, actorName, 'Information Submitted by Client', previousStatus, newStatus, `Client provided: ${clientProvidedInfo}`);
    revalidateRelevantPaths(refundRequestId);
    revalidatePath('/agent'); // Notify agent queue

    return { success: true, message: 'Information submitted successfully. Your request will be reviewed by an agent.' };
  } catch (e) {
    console.error('Client submit info error:', e);
    return { error: 'Failed to submit information.' };
  }
}

// Client Action: Validate/Confirm their initial refund request
export async function clientValidateRequest(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName') || 'Client';
  const actorRole = 'client';

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.' };
    if (refund.status !== RefundStatus.AWAITING_CLIENT_VALIDATION) {
      return { error: 'Action not allowed. Request may have already been validated or is not awaiting validation.' };
    }

    const previousStatus = refund.status;
    // Corrected: After client validation, immediately move to PENDING_AGENT_REVIEW
    const newStatus = RefundStatus.PENDING_AGENT_REVIEW;

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: {
        status: newStatus, 
      },
    });

    await createAuditLog(refundRequestId, actorRole, actorName, 'Refund Request Validated by Client', previousStatus, newStatus, 'Client confirmed request details. Moving to agent review.');
    revalidateRelevantPaths(refundRequestId);
    revalidatePath('/agent'); // Notify agent queue as it's now pending their review

    return { success: true, message: 'Your refund request has been validated and submitted for agent review.' };
  } catch (e) {
    console.error('Client validate request error:', e);
    return { error: 'Failed to validate your request.' };
  }
}

export async function clientUpdateDetailsAction(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName') || 'Client'; // Default to client if not provided
  const actorRole = 'client';

  // Fields that client can attempt to update (even if some are read-only on form, good to have server-side logic)
  const submittedData = {
    clientFirstName: formData.get('clientFirstName'),
    clientLastName: formData.get('clientLastName'),
    clientEmail: formData.get('clientEmail'), // Will be validated but not changed if original is different
    clientAddress: formData.get('clientAddress'),
    iban: formData.get('iban')?.replace(/\s+/g, '').toUpperCase(), // Normalize IBAN: remove spaces, uppercase
    bic: formData.get('bic')?.replace(/\s+/g, '').toUpperCase(),    // Normalize BIC: remove spaces, uppercase
    reason: formData.get('reason'), // Will not be changed by client if original is different
  };

  const errors = {};

  // Validate submitted email (even if form field is read-only, to ensure data integrity if action is ever called differently)
  if (submittedData.clientEmail && !/\S+@\S+\.\S+/.test(submittedData.clientEmail)) {
    errors.clientEmail = 'Invalid email format provided.';
  }

  // Basic IBAN structure validation (very simplified - real validation is complex)
  // Example: Two letters followed by up to 30 alphanumeric characters.
  if (submittedData.iban && !/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(submittedData.iban)) {
    errors.iban = 'Invalid IBAN format. It should start with 2 letters and be followed by numbers/letters.';
  }
  
  // Basic BIC/SWIFT structure validation
  if (submittedData.bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(submittedData.bic)) {
      errors.bic = 'Invalid BIC/SWIFT format.';
  }

  if (Object.keys(errors).length > 0) {
    return { error: 'Validation failed. Please check the fields.', errors, success: false, ...prevState };
  }

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund request not found.', success: false };

    const allowedEditStatuses = [
      RefundStatus.RETURNED_TO_CLIENT_FOR_INFO,
      RefundStatus.AWAITING_CLIENT_VALIDATION,
      RefundStatus.PENDING_AGENT_REVIEW,
      RefundStatus.DRAFT
    ];

    if (!allowedEditStatuses.includes(refund.status)) {
      return { error: 'Your request is not in a status that allows direct editing of these details.', success: false };
    }

    const previousStatus = refund.status;
    let newStatus = refund.status; // Initialize newStatus with current status

    const updatedFields = {};
    const changedFieldsArray = [];

    // Only allow client to update specific fields
    const allowedClientUpdates = ['clientFirstName', 'clientLastName', 'clientAddress', 'iban', 'bic'];

    for (const key of allowedClientUpdates) {
      // Ensure submittedData[key] is not just empty string if refund[key] is null/undefined
      const currentVal = refund[key] === null || refund[key] === undefined ? '' : refund[key];
      const newVal = submittedData[key] === null || submittedData[key] === undefined ? '' : submittedData[key];

      if (newVal !== currentVal) {
        updatedFields[key] = submittedData[key] === '' ? null : submittedData[key]; // Store null if emptied
        changedFieldsArray.push(`${key} from '${currentVal}' to '${newVal}'`);
      }
    }
    
    // Client cannot change their email or reason for refund through this form
    // These fields are made read-only on the form, this is a server-side enforcement too.
    if (submittedData.clientEmail && submittedData.clientEmail !== refund.clientEmail) {
        // Log or notify if an attempt to change read-only field is made, but don't update it.
        console.warn(`Attempt to change read-only field clientEmail by ${actorName} for request ${refundRequestId}.`);
    }
    if (submittedData.reason && submittedData.reason !== refund.reason) {
        console.warn(`Attempt to change read-only field reason by ${actorName} for request ${refundRequestId}.`);
    }

    if (Object.keys(updatedFields).length === 0) {
      return { success: true, message: 'No changes were detected in the editable fields.', noChanges: true };
    }

    // If there are actual field changes, the status moves to RETURNED_TO_AGENT_FOR_EDITS
    newStatus = RefundStatus.RETURNED_TO_AGENT_FOR_EDITS;
    updatedFields.status = newStatus;


    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: updatedFields,
    });

    await createAuditLog(
      refundRequestId,
      actorRole,
      actorName,
      'Client Updated Request Details (Returned to Agent)',
      previousStatus,
      newStatus, // Use the determined newStatus
      changedFieldsArray.length > 0 ? changedFieldsArray.join('; ') : 'Client updated information, awaiting agent review.'
    );

    revalidateRelevantPaths(refundRequestId);
    // Always revalidate agent path as it's now RETURNED_TO_AGENT_FOR_EDITS
    revalidatePath('/agent'); 

    return { success: true, message: 'Your details have been updated and sent for agent review.', errors: {} };

  } catch (e) {
    console.error('Client update details error:', e);
    return { error: 'Failed to update your details. Please try again.', success: false, errors: {} };
  }
} 