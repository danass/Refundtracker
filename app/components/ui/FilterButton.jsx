"use client";

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
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function FilterButton({ label, options, selectedValue, paramName }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize internal state with selectedValue from URL or default
  const [currentValue, setCurrentValue] = useState(selectedValue || '');

  // Effect to update internal state if selectedValue from URL changes (e.g., back button)
  useEffect(() => {
    setCurrentValue(selectedValue || '');
  }, [selectedValue]);

  const handleValueChange = (value) => {
    setCurrentValue(value); // Update local state for immediate UI feedback

    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(paramName, value);
    } else {
      params.delete(paramName); // Remove param if value is empty (e.g. "All" option)
    }
    params.set('page', '1'); // Reset to first page when filter changes
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-1.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-300">
          <span>{label}{currentValue ? `: ${options.find(o => o.value === currentValue)?.label || currentValue}` : ''}</span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={currentValue} onValueChange={handleValueChange}>
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