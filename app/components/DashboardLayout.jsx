"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, ListChecks, BarChart3, Settings, HelpCircle, UserCheck, Users, ShieldCheck, Landmark, FileText, Briefcase,
  Activity
} from 'lucide-react';
import { Toaster } from 'sonner';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  const baseNavItems = [];
  const commonNavItems = [];

  let roleSpecificNavItems = [];
  let pageTitle = "Refund System";
  let displayRole = ""; 

  if (pathname.startsWith('/overview')) {
    pageTitle = "System Overview";
    displayRole = "Overview";
    roleSpecificNavItems = [
      { href: '/agent', icon: <UserCheck className="w-5 h-5" />, label: 'Agent Queue' },
      { href: '/lead', icon: <Users className="w-5 h-5" />, label: 'Lead Approvals' },
      { href: '/supervisor', icon: <ShieldCheck className="w-5 h-5" />, label: 'Supervisor View' },
      { href: '/finance', icon: <Landmark className="w-5 h-5" />, label: 'Finance Desk' },
      { href: '/client', icon: <FileText className="w-5 h-5" />, label: 'Client Portal (Example)' },
    ];
  } else if (pathname.startsWith('/client')) {
    pageTitle = "Client Portal";
    displayRole = "Client";
    roleSpecificNavItems = [
      { href: '/client', icon: <ListChecks className="w-5 h-5" />, label: 'My Requests' }, 
    ];
  } else if (pathname.startsWith('/agent')) {
    pageTitle = "Agent Dashboard";
    displayRole = "Agent";
    roleSpecificNavItems = [
      { href: '/agent', icon: <UserCheck className="w-5 h-5" />, label: 'Agent Queue' },
    ];
  } else if (pathname.startsWith('/lead')) {
    pageTitle = "Team Lead Dashboard";
    displayRole = "Team Lead";
    roleSpecificNavItems = [
      { href: '/lead', icon: <Users className="w-5 h-5" />, label: 'Lead Approvals' },
    ];
  } else if (pathname.startsWith('/supervisor')) {
    pageTitle = "Supervisor Dashboard";
    displayRole = "Supervisor";
    roleSpecificNavItems = [
      { href: '/supervisor', icon: <ShieldCheck className="w-5 h-5" />, label: 'Supervisor View' },
    ];
  } else if (pathname.startsWith('/finance')) {
    pageTitle = "Finance Dashboard";
    displayRole = "Finance";
    roleSpecificNavItems = [
      { href: '/finance', icon: <Landmark className="w-5 h-5" />, label: 'Finance Desk' },
    ];
  } else if (pathname.startsWith('/refunds/') && pathname !== '/refunds') {
    pageTitle = "Refund Request Details";
    displayRole = "Details";
  } else {
    pageTitle = "Refund System";
    displayRole = "System";
    roleSpecificNavItems = [];
  }

  const navItems = [...baseNavItems, ...roleSpecificNavItems, ...commonNavItems];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans" key={pathname}>
      <aside className="w-full md:w-64 bg-white p-6 shadow-lg md:shadow-none md:border-r border-slate-200 flex flex-col">
        <div className="mb-8">
          <Link href="/overview" className="flex items-center space-x-2 text-2xl font-semibold text-slate-800 hover:text-slate-900 transition-colors">
            <Activity className="w-7 h-7 text-slate-700" /> 
            <span>RefundTracker</span>
          </Link>
        </div>
        
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-800 mb-1">{pageTitle}</h1>
          {!pathname.startsWith('/overview') && displayRole && 
            <p className="text-sm text-slate-600 font-medium">Viewing as: {displayRole}</p>}
          {pathname.startsWith('/overview') && 
            <p className="text-sm text-slate-600 font-medium">Main System Overview</p>} 
        </div>
                
        <nav className="flex-grow">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = 
                (item.href === '/' && pathname === '/') || 
                (item.href === pathname) || 
                (item.href !== '/' && item.href !== '#' && pathname.startsWith(item.href) && item.href.length > 1 && pathname.split('/')[1] === item.href.split('/')[1]);
              
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 py-2 px-3 rounded-md transition-colors duration-150 text-sm font-medium ${
                      isActive
                        ? 'bg-slate-100 text-slate-900' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    {item.icon && <span className={`${isActive ? 'text-slate-700' : 'text-slate-500'} group-hover:text-slate-600`}>{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        {children}
      </main>
      <Toaster />
    </div>
  );
} 