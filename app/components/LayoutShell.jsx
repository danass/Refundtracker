'use client';

import { usePathname } from 'next/navigation';
import DashboardLayout from './DashboardLayout';

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const noLayout = pathname === '/'
    || pathname === '/login'
    || pathname.startsWith('/zendesk')
    || pathname.startsWith('/demo')
    || pathname.startsWith('/shop')
    || pathname.startsWith('/presentation')
    || pathname.startsWith('/stripe')
    || pathname.startsWith('/refunds/');
  if (noLayout) return <>{children}</>;
  return <DashboardLayout>{children}</DashboardLayout>;
}
