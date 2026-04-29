"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Inbox, CheckCircle, ShieldCheck, CreditCard,
  Receipt, LayoutGrid, LogOut,
} from 'lucide-react';
import Logo from './Logo';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';

function getSessionUser() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/demo_user=([^;]+)/);
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match[1])); } catch { return null; }
}

const ROLES = [
  {
    id: 'agent',
    label: 'Agent',
    description: 'Traitement des demandes',
    href: '/agent',
    icon: Inbox,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
  {
    id: 'team_lead',
    label: 'Responsable',
    description: 'Validation des dossiers',
    href: '/lead',
    icon: CheckCircle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    id: 'supervisor',
    label: 'Superviseur',
    description: 'Approbations finales',
    href: '/supervisor',
    icon: ShieldCheck,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Exécution des paiements',
    href: '/finance',
    icon: CreditCard,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    id: 'client',
    label: 'Client',
    description: 'Mes remboursements',
    href: '/client',
    icon: Receipt,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
];

const NAV_BY_ROLE = {
  agent: [
    { href: '/agent', label: 'Mes demandes à traiter' },
  ],
  team_lead: [
    { href: '/lead', label: 'À valider' },
  ],
  supervisor: [
    { href: '/supervisor', label: 'Approbations finales' },
  ],
  finance: [
    { href: '/finance', label: 'Paiements' },
  ],
  client: [
    { href: '/client', label: 'Mes remboursements' },
    { href: '/mail', label: 'Messagerie' },
  ],
};

const NAV_FOOTER = [
  { href: '/presentation', label: '▶ Mode présentation' },
];

function getRoleFromPath(pathname) {
  if (pathname.startsWith('/agent')) return 'agent';
  if (pathname.startsWith('/lead')) return 'team_lead';
  if (pathname.startsWith('/supervisor')) return 'supervisor';
  if (pathname.startsWith('/finance')) return 'finance';
  if (pathname.startsWith('/client') || pathname.startsWith('/mail')) return 'client';
  return null;
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentRoleId = getRoleFromPath(pathname);
  const currentRole = ROLES.find(r => r.id === currentRoleId) || null;
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    setSessionUser(getSessionUser());
  }, [pathname]);

  const handleLogout = () => {
    document.cookie = 'demo_user=; path=/; max-age=0';
    router.push('/login');
  };

  const navItems = currentRoleId ? NAV_BY_ROLE[currentRoleId] || [] : [];

  return (
    <div className="min-h-screen flex" style={{ background: 'hsl(220,20%,97%)' }}>
      {/* Sidebar — caché en mobile (md:flex) pour laisser la pleine largeur à la surface cliente */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-white border-r h-screen sticky top-0" style={{ borderColor: 'hsl(220,13%,89%)' }}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <Link href="/overview" className="flex items-center">
            <Logo size={24} withWordmark />
          </Link>
        </div>

        {/* Current role badge (static — role switching happens via the demo nav) */}
        <div className="px-3 py-3 border-b" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          <div className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left">
            {currentRole ? (
              <>
                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${currentRole.bg}`}>
                  <currentRole.icon className={`w-3.5 h-3.5 ${currentRole.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 leading-none mb-0.5 truncate">{currentRole.label}</p>
                  <p className="text-[11px] text-gray-400 leading-none truncate">{currentRole.description}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 leading-none mb-0.5">Vue d'ensemble</p>
                  <p className="text-[11px] text-gray-400 leading-none">Toutes les métriques</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-px overflow-y-auto">
          {navItems.length > 0 ? navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            );
          }) : (
            <Link
              href="/overview"
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                pathname === '/overview'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Vue d'ensemble
            </Link>
          )}
        </nav>

        {/* Demo link */}
        <div className="px-3 pb-1 border-t pt-2" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          {NAV_FOOTER.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User footer */}
        <div className="px-3 py-3 border-t" style={{ borderColor: 'hsl(220,13%,89%)' }}>
          {sessionUser ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-blue-600">
                  {sessionUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate leading-none mb-0.5">{sessionUser.name}</p>
                <p className="text-[10px] text-gray-400 truncate leading-none">{sessionUser.email}</p>
              </div>
              <button onClick={handleLogout} className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors" title="Déconnexion">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-gray-400">Outil interne — simulation</p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>

      <Toaster richColors closeButton position="bottom-right" />
    </div>
  );
}
