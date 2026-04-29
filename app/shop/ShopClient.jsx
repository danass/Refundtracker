'use client';

import { useState } from 'react';
import { Search, ShoppingCart, Heart, User, ChevronRight, Package, Truck, CheckCircle2, Loader2, X } from 'lucide-react';

const ORDER = {
  id: 'CMD-2026-04893',
  date: '23 mars 2026',
  status: 'Livré',
  total: 159.99,
  items: [
    {
      name: 'Casque Audio Premium ProSound X3',
      variant: 'Noir mat — Bluetooth 5.3',
      price: 159.99,
      qty: 1,
      img: '🎧',
    },
  ],
};

export default function ShopClient() {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Top promo bar */}
      <div className="bg-black text-white text-center py-2 text-xs font-medium">
        ✨ Livraison gratuite dès 50 € · Retours étendus 60 jours
      </div>

      {/* Header */}
      <header className="border-b sticky top-0 bg-white z-10" style={{ borderColor: '#e5e5e5' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-8">
          <h1 className="text-xl font-bold tracking-tight">SOUNDWAVE</h1>
          <nav className="hidden md:flex gap-6 text-sm text-gray-700">
            <span className="cursor-pointer hover:text-black">Casques</span>
            <span className="cursor-pointer hover:text-black">Enceintes</span>
            <span className="cursor-pointer hover:text-black">Accessoires</span>
            <span className="cursor-pointer hover:text-black">Promotions</span>
          </nav>
          <div className="flex items-center gap-4 ml-auto">
            <Search className="w-4 h-4 text-gray-600 cursor-pointer hover:text-black" />
            <Heart className="w-4 h-4 text-gray-600 cursor-pointer hover:text-black" />
            <ShoppingCart className="w-4 h-4 text-gray-600 cursor-pointer hover:text-black" />
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-black">
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-[11px] font-bold text-violet-700">AW</span>
              </div>
              <span className="text-xs font-medium hidden md:block">Alice</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <span className="cursor-pointer hover:text-gray-700">Mon compte</span>
          <ChevronRight className="w-3 h-3" />
          <span className="cursor-pointer hover:text-gray-700">Mes commandes</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700">{ORDER.id}</span>
        </div>

        {/* Order header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Commande {ORDER.id}</h1>
          <p className="text-sm text-gray-500 mt-1">Passée le {ORDER.date} · Livrée</p>
        </div>

        {/* Order timeline */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Step icon={CheckCircle2} label="Confirmée" done />
            <div className="flex-1 h-0.5 bg-emerald-300 mx-2" />
            <Step icon={Package} label="Préparée" done />
            <div className="flex-1 h-0.5 bg-emerald-300 mx-2" />
            <Step icon={Truck} label="Expédiée" done />
            <div className="flex-1 h-0.5 bg-emerald-300 mx-2" />
            <Step icon={CheckCircle2} label="Livrée" done active />
          </div>
        </div>

        {/* Order items */}
        <div className="border rounded-2xl p-6 mb-6" style={{ borderColor: '#e5e5e5' }}>
          {ORDER.items.map((item, i) => (
            <div key={i} className="flex items-center gap-5 py-2">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl shrink-0">
                {item.img}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{item.variant}</p>
                <p className="text-xs text-gray-400 mt-1">Quantité : {item.qty}</p>
              </div>
              <p className="text-lg font-bold text-gray-900 shrink-0">€{item.price.toFixed(2)}</p>
            </div>
          ))}
          <div className="border-t mt-4 pt-4 flex justify-between" style={{ borderColor: '#e5e5e5' }}>
            <span className="text-sm text-gray-500">Total payé</span>
            <span className="text-lg font-bold">€{ORDER.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button className="px-5 py-2.5 border-2 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" style={{ borderColor: '#e5e5e5' }}>
            Suivre le colis
          </button>
          <button className="px-5 py-2.5 border-2 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" style={{ borderColor: '#e5e5e5' }}>
            Télécharger la facture
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            Demander un remboursement
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Service client : du lundi au vendredi de 9h à 19h · Réponse sous 24h
        </p>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {!submitted ? (
              <>
                <div className="px-7 pt-6 pb-3 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Demande de remboursement</h2>
                    <p className="text-sm text-gray-500 mt-1">Commande {ORDER.id} · €{ORDER.total.toFixed(2)}</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-7 py-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Motif du remboursement</label>
                    <select className="w-full px-4 py-3 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-black focus:border-black transition-all" style={{ borderColor: '#e5e5e5' }}>
                      <option>Produit défectueux</option>
                      <option>Article non conforme à la description</option>
                      <option>Article endommagé à la réception</option>
                      <option>Article ne fonctionne pas</option>
                      <option>Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Décrivez le problème</label>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      rows={4}
                      placeholder="Précisez ce qui ne va pas avec votre commande…"
                      className="w-full px-4 py-3 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-black focus:border-black transition-all placeholder-gray-300 resize-none"
                      style={{ borderColor: '#e5e5e5' }}
                    />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 leading-5">
                    Notre équipe traitera votre demande sous 24h. Vous recevrez un email de confirmation et un lien pour transmettre vos coordonnées bancaires.
                  </div>
                </div>

                <div className="px-7 pb-6 pt-2 flex gap-3">
                  <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors" style={{ borderColor: '#e5e5e5' }}>
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!reason.trim() || submitting}
                    className="flex-1 px-4 py-3 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : 'Envoyer ma demande'}
                  </button>
                </div>
              </>
            ) : (
              <div className="px-7 py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
                <p className="text-sm text-gray-500 leading-6 mb-6">
                  Notre équipe a bien reçu votre demande. Vous recevrez un email de confirmation dans les prochaines minutes au sujet du ticket support.
                </p>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-xs text-gray-400 mb-1">Numéro de demande</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">REF-2026-{Math.floor(Math.random() * 90000 + 10000)}</p>
                </div>
                <button onClick={() => { setShowModal(false); setSubmitted(false); setReason(''); }} className="w-full px-4 py-3 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors">
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ icon: Icon, label, done, active }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
        done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
      } ${active ? 'ring-4 ring-emerald-100' : ''}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className={`text-[11px] font-medium ${done ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}
