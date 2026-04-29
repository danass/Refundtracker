import { prisma } from '@/lib/prisma.js';
import { RefundStatus } from '@prisma/client';
import PresentationFrame from './PresentationFrame';

export default async function PresentationPage({ searchParams }) {
  const sp = await searchParams;
  const stepIdx = Number(sp?.step ?? 0);

  // The live Alice refund — single source of truth for the whole presentation.
  // Excludes the historic PAID one created by /api/demo/setup.
  const liveAlice = await prisma.refundRequest.findFirst({
    where: {
      clientEmail: 'alice.wonder@example.com',
      status: { notIn: [RefundStatus.PAID] },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, ticketId: true, zendeskTicketId: true },
  });

  const ids = {
    refundId: liveAlice?.id,
    ticketId: liveAlice?.ticketId,
    zendeskId: liveAlice?.zendeskTicketId || liveAlice?.ticketId,
  };

  return <PresentationFrame ids={ids} initialStep={stepIdx} />;
}
