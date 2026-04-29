'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Shuffle, Database, Trash2 } from 'lucide-react';

function Btn({ onClick, disabled, loading, icon: Icon, label, loadingLabel, danger = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors disabled:opacity-40 ${
        danger
          ? 'border-red-200 text-red-600 hover:bg-red-50'
          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? loadingLabel : label}
    </button>
  );
}

export default function DbControls() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);

  const busy = generating || seeding || resetting;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/refunds/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const { refund } = data;
      toast.success(`Demande créée — ${refund.ticketId}`, {
        description: `${refund.clientFirstName} ${refund.clientLastName} · ${refund.amount.toFixed(2)} ${refund.currency}${refund.isFlagged ? ' · signalée' : ''}`,
        action: { label: 'Voir', onClick: () => router.push(`/refunds/${refund.id}?simulatedRole=agent`) },
        duration: 6000,
      });
      router.refresh();
    } catch (err) {
      toast.error('Échec', { description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/refunds/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Base repeuplée — ${data.count} demandes créées`);
      router.refresh();
    } catch (err) {
      toast.error('Échec du seed', { description: err.message });
    } finally {
      setSeeding(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Vider toute la base de données ? Cette action est irréversible.')) return;
    setResetting(true);
    try {
      const res = await fetch('/api/refunds/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Base vidée');
      router.refresh();
    } catch (err) {
      toast.error('Échec du reset', { description: err.message });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Btn onClick={handleGenerate} disabled={busy} loading={generating} icon={Shuffle} label="Générer" loadingLabel="Génération…" />
      <Btn onClick={handleSeed} disabled={busy} loading={seeding} icon={Database} label="Repopuler la DB" loadingLabel="Peuplement…" />
      <Btn onClick={handleReset} disabled={busy} loading={resetting} icon={Trash2} label="Vider la DB" loadingLabel="Suppression…" danger />
    </div>
  );
}
