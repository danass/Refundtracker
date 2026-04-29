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

// Updated Client Action: Validate/Confirm and optionally update details
export async function clientValidateRequest(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName') || 'Client'; // actorName might be from ClientEditDetailsFields
  const actorRole = 'client';
  const confirmValidation = formData.get('confirmValidation');

  if (!confirmValidation) {
    return { error: 'You must check the confirmation box to submit.', success: false, fieldErrors: null };
  }

  const submittedData = {
    clientFirstName: formData.get('clientFirstName'),
    clientLastName: formData.get('clientLastName'),
    clientAddress: formData.get('clientAddress'),
    iban: formData.get('iban')?.replace(/\s+/g, '').toUpperCase(),
    bic: formData.get('bic')?.replace(/\s+/g, '').toUpperCase(),
    // Email and reason are read-only on the form, not processed for update here
  };

  const fieldErrors = {};
  if (submittedData.iban && !/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(submittedData.iban)) {
    fieldErrors.iban = 'Invalid IBAN format.';
  }
  if (submittedData.bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(submittedData.bic)) {
    fieldErrors.bic = 'Invalid BIC/SWIFT format.';
  }
  // Add other field validations if necessary (e.g., for name, address format)

  if (Object.keys(fieldErrors).length > 0) {
    return { error: 'Validation failed for updated details. Please check the fields.', fieldErrors, success: false };
  }

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund not found.', success: false };

    if (refund.status !== RefundStatus.AWAITING_CLIENT_VALIDATION) {
      return { error: 'Action not allowed. Request is not awaiting validation.', success: false };
    }

    const previousStatus = refund.status;
    const dataToUpdate = {};
    const changedFieldsArray = [];
    let detailsChanged = false;

    const allowedClientUpdates = ['clientFirstName', 'clientLastName', 'clientAddress', 'iban', 'bic'];

    for (const key of allowedClientUpdates) {
      const currentVal = refund[key] === null || refund[key] === undefined ? '' : refund[key];
      const newVal = submittedData[key] === null || submittedData[key] === undefined ? '' : submittedData[key];

      if (newVal !== currentVal) {
        dataToUpdate[key] = newVal === '' ? null : newVal;
        changedFieldsArray.push(`${key} from '${currentVal || 'empty'}' to '${newVal || 'empty'}'`);
        detailsChanged = true;
      }
    }

    let auditLogDescription = 'Client confirmed request details.';
    let auditFieldChanges = 'Client confirmed request details. Moving to agent review.';

    if (detailsChanged) {
      await prisma.refundRequest.update({
        where: { id: refundRequestId },
        data: dataToUpdate,
      });
      auditLogDescription = 'Client updated details and validated request.';
      auditFieldChanges = `Details updated: ${changedFieldsArray.join('; ')}. Request validated.`;
      // Create an audit log specifically for the detail changes, status remains AWAITING_CLIENT_VALIDATION for this log entry.
      await createAuditLog(refundRequestId, actorRole, actorName, 'Client Updated Details (During Validation Step)', previousStatus, previousStatus, changedFieldsArray.join('; '));
    }

    // Now, update the status to PENDING_AGENT_REVIEW
    const newStatus = RefundStatus.PENDING_AGENT_REVIEW;
    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: { status: newStatus }, 
    });

    // Create audit log for the validation and status change
    await createAuditLog(refundRequestId, actorRole, actorName, 'Refund Request Validated by Client', previousStatus, newStatus, 
      detailsChanged ? `Validated after changes: ${changedFieldsArray.join('; ')}` : 'Client confirmed existing details.'
    );

    revalidateRelevantPaths(refundRequestId);
    revalidatePath('/agent');

    return { 
        success: true, 
        message: detailsChanged ? 'Your details have been updated and the request has been submitted for agent review.' : 'Your refund request has been validated and submitted for agent review.',
        noChanges: !detailsChanged && confirmValidation // For toast logic on page
    };

  } catch (e) {
    console.error('Client validate request error:', e);
    return { error: 'Failed to validate your request.', success: false, fieldErrors: null };
  }
}

// Client Action: Proactively provide IBAN (no status change)
export async function clientProvideIban(prevState, formData) {
  const requestId = formData.get('requestId');
  const iban = formData.get('iban')?.replace(/\s+/g, '').toUpperCase();
  const bic = formData.get('bic')?.replace(/\s+/g, '').toUpperCase() || null;
  const bankName = formData.get('bankName') || null;

  const fieldErrors = {};
  if (!iban) {
    fieldErrors.iban = 'L\'IBAN est requis.';
  } else if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(iban)) {
    fieldErrors.iban = 'Format IBAN invalide (ex: FR76 3000 …).';
  }
  if (bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) {
    fieldErrors.bic = 'Format BIC invalide (ex: BNPAFRPP).';
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { error: 'Vérifiez les champs.', fieldErrors, success: false };
  }

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: requestId } });
    if (!refund) return { error: 'Demande introuvable.', success: false };

    const newStatus = refund.status === RefundStatus.PENDING_AGENT_REVIEW
      ? RefundStatus.CLIENT_VALIDATED
      : refund.status; // for other statuses just save IBAN without changing status

    await prisma.refundRequest.update({
      where: { id: requestId },
      data: { iban, bic, bankName, status: newStatus },
    });

    await createAuditLog(
      requestId, 'client', 'Alice Wonder',
      'Coordonnées bancaires fournies par le client',
      refund.status, newStatus,
      `IBAN: ${iban}${bic ? ` · BIC: ${bic}` : ''}`,
    );

    revalidateRelevantPaths(requestId);
    revalidatePath('/agent');
    return { success: true, message: 'Coordonnées bancaires enregistrées.' };
  } catch (e) {
    console.error('clientProvideIban error:', e);
    return { error: 'Échec de l\'enregistrement. Réessayez.', success: false };
  }
}

// clientUpdateDetailsAction remains largely the same, but its usage context has changed.
// It's now primarily for DRAFT or RETURNED_TO_CLIENT_FOR_INFO statuses when details are updated standalone.
export async function clientUpdateDetailsAction(prevState, formData) {
  const refundRequestId = formData.get('refundRequestId');
  const actorName = formData.get('actorName') || 'Client'; 
  const actorRole = 'client';

  const submittedData = {
    clientFirstName: formData.get('clientFirstName'),
    clientLastName: formData.get('clientLastName'),
    clientAddress: formData.get('clientAddress'),
    iban: formData.get('iban')?.replace(/\s+/g, '').toUpperCase(), 
    bic: formData.get('bic')?.replace(/\s+/g, '').toUpperCase(),
  };

  const errors = {};
  if (submittedData.iban && !/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(submittedData.iban)) {
    errors.iban = 'Invalid IBAN format.';
  }
  if (submittedData.bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(submittedData.bic)) {
      errors.bic = 'Invalid BIC/SWIFT format.';
  }

  if (Object.keys(errors).length > 0) {
    return { error: 'Validation failed. Please check the fields.', errors, success: false };
  }

  try {
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundRequestId } });
    if (!refund) return { error: 'Refund request not found.', success: false };

    const allowedEditStatuses = [
      RefundStatus.RETURNED_TO_CLIENT_FOR_INFO,
      RefundStatus.DRAFT
      // AWAITING_CLIENT_VALIDATION is handled by clientValidateRequest now for detail + validation submission
    ];

    if (!allowedEditStatuses.includes(refund.status)) {
      // This case should ideally not be hit if UI logic is correct for AWAITING_CLIENT_VALIDATION
      return { error: 'Your request is not in a status that allows standalone detail editing via this action.', success: false };
    }

    const previousStatus = refund.status;
    const updatedFields = {};
    const changedFieldsArray = [];
    const allowedClientUpdates = ['clientFirstName', 'clientLastName', 'clientAddress', 'iban', 'bic'];

    for (const key of allowedClientUpdates) {
      const currentVal = refund[key] === null || refund[key] === undefined ? '' : refund[key];
      const newVal = submittedData[key] === null || submittedData[key] === undefined ? '' : submittedData[key];
      if (newVal !== currentVal) {
        updatedFields[key] = newVal === '' ? null : newVal;
        changedFieldsArray.push(`${key} from '${currentVal || 'empty'}' to '${newVal || 'empty'}'`);
      }
    }

    if (Object.keys(updatedFields).length === 0) {
      return { success: true, message: 'No changes were detected in the editable fields.', noChanges: true };
    }

    // For DRAFT or RETURNED_TO_CLIENT_FOR_INFO, if details are updated, status might change.
    // If RETURNED_TO_CLIENT_FOR_INFO, it goes to RETURNED_TO_AGENT_FOR_EDITS.
    // If DRAFT, it might stay DRAFT or move to AWAITING_CLIENT_VALIDATION depending on business rules (not handled here yet)
    let newStatus = refund.status;
    let auditDescription = 'Client Updated Request Details';
    let successMessage = 'Your details have been updated.';

    if (refund.status === RefundStatus.RETURNED_TO_CLIENT_FOR_INFO) {
      newStatus = RefundStatus.RETURNED_TO_AGENT_FOR_EDITS;
      updatedFields.status = newStatus;
      auditDescription = 'Client Updated Request Details (Returned to Agent)';
      successMessage = 'Your details have been updated and sent for agent review.';
    } else if (refund.status === RefundStatus.DRAFT) {
        auditDescription = 'Client Updated Draft Details';
        successMessage = 'Your draft details have been updated.';
        // Stays in DRAFT status, no change to newStatus or updatedFields.status
    }

    await prisma.refundRequest.update({
      where: { id: refundRequestId },
      data: updatedFields,
    });

    await createAuditLog(
      refundRequestId,
      actorRole,
      actorName,
      auditDescription,
      previousStatus, 
      newStatus, // This is the newStatus determined above
      changedFieldsArray.join('; ')
    );

    revalidateRelevantPaths(refundRequestId);
    if (updatedFields.status && updatedFields.status !== previousStatus) {
      revalidatePath('/agent'); 
    }
    
    return { success: true, message: successMessage, errors: {}, noChanges: false };

  } catch (e) {
    console.error('Client update details error:', e);
    return { error: 'Failed to update your details. Please try again.', success: false, errors: {} };
  }
} 