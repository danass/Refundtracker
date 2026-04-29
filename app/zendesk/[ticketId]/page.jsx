import { prisma } from '@/lib/prisma.js';
import { notFound } from 'next/navigation';
import ZendeskView from './ZendeskView';

export default async function ZendeskTicketPage({ params }) {
  const { ticketId } = await params;
  const refund = await prisma.refundRequest.findFirst({
    where: { OR: [{ zendeskTicketId: ticketId }, { ticketId }] },
  });
  if (!refund) notFound();
  return <ZendeskView refund={JSON.parse(JSON.stringify(refund))} />;
}
