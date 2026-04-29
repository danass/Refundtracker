'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '../components/Logo';
import {
  ArrowRight, Play, Mail, MapPin, MessageSquare, Building2, ChevronRight, Check,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Top nav (identique à la home) */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b" style={{ borderColor: 'hsl(220,13%,93%)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link href="/"><Logo size={32} withWordmark /></Link>
          <nav className="hidden md:flex items-center gap-8 ml-12 text-sm text-gray-600">
            <Link href="/#fonctionnalites" className="hover:text-gray-900 transition-colors">Fonctionnalités</Link>
            <Link href="/#workflow" className="hover:text-gray-900 transition-colors">Comment ça marche</Link>
            <Link href="/#integrations" className="hover:text-gray-900 transition-colors">Intégrations</Link>
            <Link href="/contact" className="text-gray-900 font-medium">Contact</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              Se connecter
            </Link>
            <Link
              href="/presentation"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Play className="w-3 h-3 fill-white" />
              Voir la démo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero contact */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -top-20 right-0 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-40" />
        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-white/80 backdrop-blur text-xs font-semibold text-gray-600 mb-8" style={{ borderColor: 'hsl(220,13%,89%)' }}>
            <MessageSquare className="w-3 h-3 text-blue-500" />
            Réponse sous 24h ouvrées
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-[1.05] tracking-tight">
            Parlons de vos
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              remboursements.
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto leading-7">
            Démo personnalisée, intégration sur-mesure ou simple question — notre équipe vous répond.
          </p>
        </div>
      </section>

      {/* Form + cards */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Formulaire (3/5) */}
          <div className="lg:col-span-3 rounded-2xl border bg-white p-8 shadow-sm" style={{ borderColor: 'hsl(220,13%,89%)' }}>
            <ContactForm />
          </div>

          {/* Sidebar contacts (2/5) */}
          <aside className="lg:col-span-2 space-y-4">
            <ContactCard
              icon={Mail}
              title="Email direct"
              lines={['contact@reflow.app', 'support@reflow.app']}
              tone="text-blue-600 bg-blue-50"
            />
            <ContactCard
              icon={Building2}
              title="Bureau Paris"
              lines={['12 rue du Sentier', '75002 Paris, France']}
              tone="text-violet-600 bg-violet-50"
            />
            <ContactCard
              icon={MapPin}
              title="Couverture"
              lines={['SEPA — 36 pays', 'Support FR / EN']}
              tone="text-emerald-600 bg-emerald-50"
            />

            {/* CTA démo */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-100 mb-2">Pas envie d'écrire ?</p>
              <h3 className="text-lg font-bold leading-snug">Lancez la démo guidée en 3 minutes.</h3>
              <Link
                href="/presentation"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-900 text-sm font-bold hover:bg-blue-50 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Voir Reflow en action
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* FAQ rapide */}
      <section className="bg-gray-50 border-y" style={{ borderColor: 'hsl(220,13%,93%)' }}>
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Questions fréquentes</p>
            <h2 className="text-3xl font-bold text-gray-900">Avant de nous écrire…</h2>
          </div>
          <div className="space-y-3">
            <FaqItem
              q="Combien de temps pour intégrer Reflow ?"
              a="Un connecteur Zendesk natif, une clé API Stripe, et c'est en route. La plupart de nos clients sont en production en moins de 2 semaines, démo & formation incluses."
            />
            <FaqItem
              q="Mes données sont-elles hébergées en Europe ?"
              a="Oui. Tous les serveurs Reflow sont hébergés en France (Scaleway Paris) et en Allemagne (AWS Frankfurt). Aucun transfert hors UE, conformité RGPD documentée."
            />
            <FaqItem
              q="Puis-je tester sans engagement ?"
              a="Oui. Nous offrons 30 jours d'essai sur jeu de données de démonstration, sans CB requise. Vous gardez l'historique si vous activez l'abonnement."
            />
            <FaqItem
              q="Quels marchands utilisent Reflow ?"
              a="Reflow s'adresse aux marchands mid-market et au-delà, traitant plus de 200 remboursements/mois. Nos références clients sont disponibles sur demande qualifiée."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'hsl(220,13%,93%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={24} withWordmark />
            <span className="text-xs text-gray-400 ml-2">© 2026 · Tous droits réservés</span>
          </div>
          <div className="flex gap-6 text-xs text-gray-500">
            <a className="hover:text-gray-900 cursor-pointer">Confidentialité</a>
            <a className="hover:text-gray-900 cursor-pointer">Conditions</a>
            <a className="hover:text-gray-900 cursor-pointer">Sécurité</a>
            <Link href="/contact" className="hover:text-gray-900">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Form ────────────────────────────────────────────────────────────────

function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '', company: '', email: '', role: 'support', volume: '', message: '',
  });

  const handleChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <Check className="w-6 h-6 text-emerald-600" strokeWidth={3} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Message reçu, merci.</h3>
        <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto leading-6">
          Notre équipe revient vers vous sous 24h ouvrées à l'adresse <span className="font-semibold text-gray-700">{form.email || 'indiquée'}</span>.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', company: '', email: '', role: 'support', volume: '', message: '' }); }}
          className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Écrivez-nous</h2>
        <p className="mt-1 text-sm text-gray-500">Tous les champs sont requis sauf mention contraire.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nom complet">
          <input
            type="text" required value={form.name} onChange={handleChange('name')}
            placeholder="Marie Dupont"
            className="w-full h-10 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
            style={{ borderColor: 'hsl(220,13%,89%)' }}
          />
        </Field>
        <Field label="Entreprise">
          <input
            type="text" required value={form.company} onChange={handleChange('company')}
            placeholder="Acme Commerce"
            className="w-full h-10 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
            style={{ borderColor: 'hsl(220,13%,89%)' }}
          />
        </Field>
      </div>

      <Field label="Email professionnel">
        <input
          type="email" required value={form.email} onChange={handleChange('email')}
          placeholder="marie@acme.com"
          className="w-full h-10 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
          style={{ borderColor: 'hsl(220,13%,89%)' }}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Votre rôle">
          <select
            value={form.role} onChange={handleChange('role')}
            className="w-full h-10 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
            style={{ borderColor: 'hsl(220,13%,89%)' }}
          >
            <option value="support">Direction Support</option>
            <option value="finance">Direction Finance</option>
            <option value="ops">Direction Ops</option>
            <option value="cto">CTO / Tech</option>
            <option value="other">Autre</option>
          </select>
        </Field>
        <Field label="Volume de remboursements / mois" optional>
          <select
            value={form.volume} onChange={handleChange('volume')}
            className="w-full h-10 px-3 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
            style={{ borderColor: 'hsl(220,13%,89%)' }}
          >
            <option value="">Préciser…</option>
            <option value="<200">Moins de 200</option>
            <option value="200-1000">200 à 1 000</option>
            <option value="1000-5000">1 000 à 5 000</option>
            <option value=">5000">Plus de 5 000</option>
          </select>
        </Field>
      </div>

      <Field label="Votre message">
        <textarea
          required value={form.message} onChange={handleChange('message')}
          rows={5}
          placeholder="Parlez-nous de votre stack actuelle et de ce qui vous frustre dans le traitement des remboursements…"
          className="w-full px-3 py-2.5 rounded-md border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition resize-none"
          style={{ borderColor: 'hsl(220,13%,89%)' }}
        />
      </Field>

      <button
        type="submit"
        className="w-full h-11 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
      >
        Envoyer le message
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-xs text-gray-400 text-center">
        En envoyant ce formulaire, vous acceptez notre politique de confidentialité.
      </p>
    </form>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function Field({ label, optional, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-gray-400">(optionnel)</span>}
      </span>
      {children}
    </label>
  );
}

function ContactCard({ icon: Icon, title, lines, tone }) {
  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: 'hsl(220,13%,89%)' }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="mt-4 text-sm font-bold text-gray-900">{title}</h3>
      {lines.map((l, i) => (
        <p key={i} className="text-sm text-gray-500 leading-6">{l}</p>
      ))}
    </div>
  );
}

function FaqItem({ q, a }) {
  return (
    <details className="group rounded-xl border bg-white" style={{ borderColor: 'hsl(220,13%,89%)' }}>
      <summary className="cursor-pointer list-none p-5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors rounded-xl">
        <span className="text-sm font-semibold text-gray-900">{q}</span>
        <ChevronRight className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90 shrink-0" />
      </summary>
      <div className="px-5 pb-5 -mt-1 text-sm text-gray-500 leading-6">{a}</div>
    </details>
  );
}
