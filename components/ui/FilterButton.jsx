'use client';

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FilterButton({ label, options, filterKey }) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [selectedValue, setSelectedValue] = useState('');

  useEffect(() => {
    setSelectedValue(currentSearchParams.get(filterKey) || '');
  }, [currentSearchParams, filterKey]);

  const handleValueChange = (value) => {
    const params = new URLSearchParams(currentSearchParams.toString());
    if (value) {
      params.set(filterKey, value);
    } else {
      params.delete(filterKey);
    }
    params.set('page', '1'); // Reset to first page on filter change
    router.push(`?${params.toString()}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-1.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-300">
          <span>{label}</span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Add an 'All' option */} 
        <DropdownMenuRadioGroup value={selectedValue} onValueChange={handleValueChange}>
          <DropdownMenuRadioItem value="">All</DropdownMenuRadioItem> 
          {options && options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 