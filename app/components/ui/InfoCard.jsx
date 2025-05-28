'use client'; // Marking as client component as it's UI, though simple enough it might not strictly need it, good practice for UI kit.

import { Badge } from '@/components/ui/badge'; // Assuming Badge is already a client component or UI utility

export function InfoCard({ title, children, titleBadge }) {
  return (
    <div className="bg-white shadow border border-slate-200 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
        {titleBadge}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
} 