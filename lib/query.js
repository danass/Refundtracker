import { prisma } from './prisma.js';
import { RefundStatus } from '@prisma/client'; // Added for status checks

export async function getRefundRequestWithHistory(id) {
  if (!id) {
    return null;
  }
  try {
    const refundRequest = await prisma.refundRequest.findUnique({
      where: { id: id },
      include: {
        auditLogs: {
          orderBy: { timestamp: 'desc' }, // Corrected from createdAt to timestamp
        },
      },
      // Explicitly select internalNotes (not strictly necessary unless using select, but for clarity)
    });

    if (!refundRequest) return null;

    // Fetch additional client history
    const clientEmail = refundRequest.clientEmail;
    const paidRequests = await prisma.refundRequest.findMany({
      where: {
        clientEmail: clientEmail,
        status: RefundStatus.PAID,
      },
    });

    const totalPaidAmount = paidRequests.reduce((sum, req) => sum + req.amount, 0);
    const paidCount = paidRequests.length;

    const openStatuses = [
      RefundStatus.DRAFT,
      RefundStatus.AWAITING_CLIENT_VALIDATION,
      RefundStatus.CLIENT_VALIDATED,
      RefundStatus.PENDING_AGENT_REVIEW,
      RefundStatus.RETURNED_TO_AGENT_FOR_EDITS,
      RefundStatus.RETURNED_TO_CLIENT_FOR_INFO,
      RefundStatus.PENDING_LEAD_APPROVAL,
      RefundStatus.PENDING_FINAL_APPROVAL,
      RefundStatus.APPROVED_FOR_PAYMENT,
      RefundStatus.PAYMENT_PROCESSING,
      RefundStatus.ERROR_PROCESSING_PAYMENT
    ];

    const openRequestsCount = await prisma.refundRequest.count({
      where: {
        clientEmail: clientEmail,
        status: { in: openStatuses },
        id: { not: refundRequest.id } // Exclude the current request from its own "other open requests" count
      },
    });

    return {
      ...refundRequest,
      clientHistory: {
        paidCount,
        totalPaidAmount,
        openRequestsCount,
      },
    };

  } catch (error) {
    console.error(`Error fetching refund request ${id} with history:`, error);
    // Optionally, rethrow the error or return a specific error object
    return null; 
  }
} 