'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ dashboardPath, buttonText = 'Back' }) {
  const router = useRouter();

  const handleClick = () => {
    // Prefer router.back() for SPA-like back navigation within the app
    // or fallback to dashboardPath if a more specific return is needed.
    // window.history.back() is also an option but router.back() is usually smoother in Next.js
    router.back(); 
    // Alternatively, to always go to a specific dashboard:
    // if (dashboardPath) router.push(dashboardPath);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      {buttonText}
    </button>
  );
} 