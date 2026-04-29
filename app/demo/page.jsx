import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import DemoWalkthrough from './DemoWalkthrough';

export default async function DemoPage() {
  // Pick one refund per key status for the scenarios
  const [pending, validated, leadPending, paid, flagged] = await Promise.all([
    prisma.refundRequest.findFirst({ where: { status: RefundStatus.PENDING_AGENT_REVIEW }, orderBy: { createdAt: 'desc' } }),
    prisma.refundRequest.findFirst({ where: { status: RefundStatus.CLIENT_VALIDATED }, orderBy: { createdAt: 'desc' } }),
    prisma.refundRequest.findFirst({ where: { status: RefundStatus.PENDING_LEAD_APPROVAL }, orderBy: { createdAt: 'desc' } }),
    prisma.refundRequest.findFirst({ where: { status: RefundStatus.PAID }, orderBy: { createdAt: 'desc' } }),
    prisma.refundRequest.findFirst({ where: { isFlagged: true }, orderBy: { createdAt: 'desc' } }),
  ]);

  const ids = {
    pending: pending?.id,
    pendingTicket: pending?.ticketId,
    pendingZd: pending?.zendeskTicketId || pending?.ticketId,
    validated: validated?.id,
    validatedTicket: validated?.ticketId,
    leadPending: leadPending?.id,
    leadTicket: leadPending?.ticketId,
    paid: paid?.id,
    paidTicket: paid?.ticketId,
    flagged: flagged?.id,
    flaggedTicket: flagged?.ticketId,
  };

  return <DemoWalkthrough ids={ids} />;
}
