'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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