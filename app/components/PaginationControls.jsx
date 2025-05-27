'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from './ui/button'; // Use relative path
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10; // Or make this a prop if it needs to vary

export default function PaginationControls({ totalItems, itemsPerPage = ITEMS_PER_PAGE }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page or no items
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between mt-8 py-4 border-t border-slate-200">
      <div className="text-sm text-slate-600">
        Page <span className="font-semibold text-slate-800">{currentPage}</span> of <span className="font-semibold text-slate-800">{totalPages}</span>
        <span className="ml-2 text-slate-500">({totalItems} total requests)</span>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200"
        >
          <ChevronLeft className="h-4 w-4 mr-1.5" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
} 