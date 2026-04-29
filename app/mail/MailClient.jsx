'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, ChevronDown, Star, Archive, Trash2, MoreHorizontal, ExternalLink, Inbox, Send, FileText, Tag, ChevronRight } from 'lucide-react';

const TAG_STYLES = {
  action: { bg: 'bg-amber-100 text-amber-700', label: 'Action requise', dot: 'bg-amber-400' },
  good:   { bg: 'bg-emerald-100 text-emerald-700', label: 'Approuvé', dot: 'bg-emerald-400' },
  done:   { bg: 'bg-gray-100 text-gray-500', label: '', dot: 'bg-gray-300' },
  info:   { bg: 'bg-blue-50 text-blue-600', label: '', dot: 'bg-blue-300' },
  closed: { bg: 'bg-red-50 text-red-500', label: 'Clôturé', dot: 'bg-red-300' },
};

export default function MailClient({ emails }) {
  const [selected, setSelected] = useState(emails[0] ?? null);
  const [search, setSearch] = useState('');

  const filtered = search
    ? emails.filter(e => e.subject.toLowerCase().includes(search.toLowerCase()) || e.fromShort.toLowerCase().includes(search.toLowerCase()))
    : emails;

  const unread = emails.filter(e => !e.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: 13 }}>

      {/* Gmail-style top bar */}
      <div className="h-14 flex items-center px-4 gap-4 border-b bg-white shrink-0" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6"><path d="M6 18L18 6M6 6l12 12" stroke="none"/><path fill="#EA4335" d="M3 3h18v18H3z" opacity="0"/><path fill="#4285F4" d="M0 0h24v24H0V0z" opacity="0"/><rect x="2" y="4" width="20" height="16" rx="2" fill="white" stroke="#dadce0" strokeWidth="1.5"/><path d="M2 6l10 7 10-7" stroke="#5f6368" strokeWidth="1.5" fill="none"/></svg>
          </div>
          <span className="text-lg font-normal text-gray-600">Mail</span>
        </div>

        <div className="flex-1 max-w-2xl mx-4">
          <div className="flex items-center gap-2 bg-[#f1f3f4] rounded-2xl px-4 py-2 hover:bg-[#e8eaed] transition-colors">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher dans les e-mails"
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#4285f4] flex items-center justify-center text-white text-sm font-medium">A</div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="w-56 shrink-0 py-2 border-r overflow-y-auto" style={{ borderColor: '#e2e8f0' }}>
          <button className="mx-4 mb-4 px-4 py-3 bg-[#c2e7ff] text-[#001d35] rounded-2xl text-sm font-medium flex items-center gap-2 hover:shadow-md transition-all">
            <span className="text-base">✏️</span> Nouveau message
          </button>

          {[
            { icon: Inbox, label: 'Boîte de réception', count: unread, active: true },
            { icon: Star, label: 'Suivis', count: 0 },
            { icon: Send, label: 'Messages envoyés' },
            { icon: FileText, label: 'Brouillons', count: 2 },
            { icon: Archive, label: 'Archives' },
            { icon: Trash2, label: 'Corbeille' },
          ].map(({ icon: Icon, label, count, active }) => (
            <div key={label} className={`flex items-center gap-3 px-4 py-1.5 rounded-r-full mr-3 cursor-pointer transition-colors ${active ? 'bg-[#d3e3fd] font-semibold' : 'hover:bg-gray-100'}`}>
              <Icon className="w-4 h-4 text-gray-600 shrink-0" />
              <span className="text-sm text-gray-700 flex-1">{label}</span>
              {count > 0 && <span className="text-xs font-bold text-gray-700">{count}</span>}
            </div>
          ))}

          <div className="mt-4 px-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Libellés</p>
            {[
              { color: 'bg-amber-400', label: 'Action requise' },
              { color: 'bg-emerald-400', label: 'Remboursements' },
              { color: 'bg-blue-400', label: 'Support Clear' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2.5 px-1 py-1.5 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Email list */}
        <div className="w-80 shrink-0 border-r overflow-y-auto" style={{ borderColor: '#e2e8f0' }}>
          <div className="sticky top-0 bg-white px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: '#e2e8f0' }}>
            <input type="checkbox" className="w-3.5 h-3.5 rounded" />
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            <RefreshCw className="w-3.5 h-3.5 text-gray-400 ml-1 cursor-pointer hover:text-gray-600" />
            <span className="ml-auto text-xs text-gray-400">{filtered.length} messages</span>
          </div>

          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">Aucun email.</div>
          )}

          {filtered.map(email => {
            const ts = TAG_STYLES[email.tag] || TAG_STYLES.info;
            const isSelected = selected?.id === email.id;
            return (
              <div
                key={email.id}
                onClick={() => setSelected(email)}
                className={`flex items-start gap-3 px-3 py-3 cursor-pointer border-b transition-colors ${isSelected ? 'bg-[#d3e3fd]' : email.read ? 'hover:bg-gray-50' : 'bg-white hover:bg-gray-50'}`}
                style={{ borderColor: '#f0f0f0' }}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${email.fromColor}`}>
                  {email.fromInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`text-xs truncate flex-1 ${!email.read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                      {email.fromShort}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {email.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${!email.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{email.subject}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {ts.dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ts.dot}`} />}
                    <p className="text-[11px] text-gray-400 truncate">{email.preview}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Email view */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-gray-300">
              <div className="text-center">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Sélectionnez un email</p>
              </div>
            </div>
          ) : (
            <div className="px-8 py-6 max-w-3xl">
              {/* Email header */}
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-normal text-gray-900 flex-1 pr-4">{selected.subject}</h2>
                <div className="flex items-center gap-2 shrink-0">
                  {selected.tag === 'action' && (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Action requise</span>
                  )}
                  {selected.refundId && (
                    <Link href={`/refunds/${selected.refundId}?simulatedRole=client`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#4285f4] text-white rounded-full text-xs font-medium hover:bg-[#3367d6] transition-colors">
                      <ExternalLink className="w-3 h-3" />
                      Voir ma demande
                    </Link>
                  )}
                </div>
              </div>

              {/* Sender row */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: '#e2e8f0' }}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${selected.fromColor}`}>
                  {selected.fromInitials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{selected.fromShort}</span>
                    <span className="text-gray-400 text-xs">&lt;{selected.from.match(/<(.+)>/)?.[1] ?? selected.from}&gt;</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <span>À moi</span>
                    <span>·</span>
                    <span>{selected.date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })} à {selected.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Star className="w-4 h-4 cursor-pointer hover:text-amber-400 transition-colors" />
                  <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-gray-600 transition-colors" />
                </div>
              </div>

              {/* Body */}
              <div className="text-sm text-gray-700 whitespace-pre-line leading-6 mb-8">
                {selected.body}
              </div>

              {/* CTA if action needed */}
              {selected.tag === 'action' && selected.refundId && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm font-semibold text-amber-800 mb-1">Action requise</p>
                  <p className="text-xs text-amber-700 mb-3">Renseignez vos coordonnées bancaires pour recevoir votre remboursement.</p>
                  <Link href={`/refunds/${selected.refundId}?simulatedRole=client`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors">
                    Compléter mes informations
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Success confirmation */}
              {selected.tag === 'done' && selected.subject.includes('✓') && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-2xl mb-1">🎉</p>
                  <p className="text-sm font-semibold text-emerald-800">Virement confirmé</p>
                  <p className="text-xs text-emerald-600 mt-1">Le remboursement a bien été effectué sur votre compte.</p>
                </div>
              )}

              {/* Reply area (cosmetic) */}
              <div className="mt-6 border rounded-xl overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
                <div className="px-4 py-3 bg-[#f1f3f4] text-xs text-gray-500">
                  Répondre à {selected.fromShort}…
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
