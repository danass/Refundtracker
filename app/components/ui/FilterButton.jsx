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
import { useState } from 'react';

export default function FilterButton({ label, options, selectedValue, onValueChange }) {
  // If no selectedValue is provided, use the first option as default or an empty string
  const [currentValue, setCurrentValue] = useState(selectedValue || (options && options.length > 0 ? options[0].value : ''));

  const handleValueChange = (value) => {
    setCurrentValue(value);
    if (onValueChange) {
      onValueChange(value);
    }
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
        <DropdownMenuRadioGroup value={currentValue} onValueChange={handleValueChange}>
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