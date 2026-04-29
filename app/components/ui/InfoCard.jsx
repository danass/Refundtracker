'use client'; // Marking as client component as it's UI, though simple enough it might not strictly need it, good practice for UI kit.

import { Badge } from '@/components/ui/badge'; // Assuming Badge is already a client component or UI utility

export function InfoCard({ title, children, titleBadge }) {
  return (
    <div className="bg-white border rounded-lg p-5 mb-4" style={{ borderColor: 'hsl(220,13%,89%)' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        {titleBadge}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
} 