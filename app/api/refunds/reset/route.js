import { prisma } from '@/lib/prisma.js';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await prisma.auditLog.deleteMany({});
    await prisma.refundRequest.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
