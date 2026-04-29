import { prisma } from '@/lib/prisma.js';
import { notFound } from 'next/navigation';
import StripeView from './StripeView';

export default async function StripeRefundPage({ params }) {
  const { refundId } = await params;
  const refund = await prisma.refundRequest.findUnique({ where: { id: refundId } });
  if (!refund) notFound();
  return <StripeView refund={JSON.parse(JSON.stringify(refund))} />;
}
