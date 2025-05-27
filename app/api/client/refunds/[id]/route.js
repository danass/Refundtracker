import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma.js';

export async function GET(request, { params }) {
  const { id } = await params;

  console.log(`[API GET /api/client/refunds/${id}] Handler started.`);
  console.log('[API GET /api/client/refunds] Prisma object:', typeof prisma, Object.keys(prisma || {}));
  try {
    // For this simulation, we just fetch the request by ID.
    console.log(`[API GET /api/client/refunds/${id}] Attempting to fetch refundRequest with id: ${id}`);
    const refundRequest = await prisma.refundRequest.findUnique({
      where: {
        id: id,
      },
      include: {
        auditLogs: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!refundRequest) {
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    }

    return NextResponse.json(refundRequest);
  } catch (error) {
    console.error(`Error fetching client refund request ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch refund request' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  try {
    // In a real application, you would verify the client's identity and ownership
    // Also, implement validation logic here before updating

    const existingRequest = await prisma.refundRequest.findUnique({
        where: { id: id }
    });

    if (!existingRequest) {
        return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    }

    const updatedRefundRequest = await prisma.refundRequest.update({
      where: {
        id: id,
      },
      data: {
        clientFirstName: body.clientFirstName,
        clientLastName: body.clientLastName,
        clientAddress: body.clientAddress,
        iban: body.iban,
        bic: body.bic,
         // Update status to CLIENT_VALIDATED if it was AWAITING_CLIENT_VALIDATION
        ...(existingRequest.status === 'AWAITING_CLIENT_VALIDATION' && {
            status: 'CLIENT_VALIDATED'
        })
      },
    });

     // Create an audit log entry for the update
     await prisma.auditLog.create({
        data: {
            id: uuidv4(),
            refundRequestId: updatedRefundRequest.id,
            actorRole: 'client', // Assuming the client is the actor
            actorName: `${updatedRefundRequest.clientFirstName} ${updatedRefundRequest.clientLastName}`, // Use client name
            previousStatus: existingRequest.status,
            newStatus: updatedRefundRequest.status,
            actionDescription: 'Client updated personal/bank details',
            // You could add fieldChanges here by comparing existingRequest and body
            // fieldChanges: JSON.stringify({ ... }),
        }
     });

    return NextResponse.json(updatedRefundRequest);
  } catch (error) {
    console.error(`Error updating client refund request ${id}:`, error);
    return NextResponse.json({ error: 'Failed to update refund request' }, { status: 500 });
  }
} 