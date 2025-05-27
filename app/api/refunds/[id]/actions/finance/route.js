import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request, { params }) {
    const { id } = await params;
    const { action, actorRole, actorName, notes } = await request.json();

    // Basic validation
    if (actorRole !== 'finance') {
        return NextResponse.json({ error: 'Unauthorized action' }, { status: 403 });
    }

    try {
        const refundRequest = await prisma.refundRequest.findUnique({
            where: { id: id },
             include: { auditLogs: true },
        });

        if (!refundRequest) {
            return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
        }

        let newStatus = refundRequest.status;
        let actionDescription = '';

        if (refundRequest.status !== 'APPROVED_FOR_PAYMENT') {
             return NextResponse.json({ error: `Cannot perform finance actions on requests with status ${refundRequest.status}` }, { status: 400 });
        }

        switch (action) {
            case 'mark_as_paid':
                newStatus = 'PAID';
                actionDescription = `Finance marked the request as paid.`;
                break;
            case 'reject':
                newStatus = 'REJECTED';
                actionDescription = `Finance rejected the request.`;
                break;
            default:
                return NextResponse.json({ error: 'Invalid finance action' }, { status: 400 });
        }

        // Update refund request and create audit log
        const updatedRequest = await prisma.refundRequest.update({
            where: { id: id },
            data: {
                status: newStatus,
                financeNotes: notes, // Save finance notes
                auditLogs: {
                    create: {
                        actionDescription: actionDescription,
                        actorRole: actorRole,
                        actorName: actorName,
                        previousStatus: refundRequest.status,
                        newStatus: newStatus,
                        notes: notes || null,
                    },
                },
            },
            include: { auditLogs: true },
        });

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Error handling finance action:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 