'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';

const USERS = [
  { id: 'agent-1',      name: 'Marc Lefèvre',     role: 'agent',      email: 'marc.lefevre@clear.io',     password: 'agent123',      avatar: 'ML' },
  { id: 'agent-2',      name: 'Sarah Moulin',      role: 'agent',      email: 'sarah.moulin@clear.io',      password: 'agent123',      avatar: 'SM' },
  { id: 'lead-1',       name: 'Vanessa Durand',    role: 'team_lead',  email: 'vanessa.durand@clear.io',    password: 'lead123',       avatar: 'VD' },
  { id: 'supervisor-1', name: 'Éric Bertrand',     role: 'supervisor', email: 'eric.bertrand@clear.io',     password: 'supervisor123', avatar: 'EB' },
  { id: 'finance-1',    name: 'Isabelle Roux',     role: 'finance',    email: 'isabelle.roux@clear.io',     password: 'finance123',    avatar: 'IR' },
  { id: 'client-1',     name: 'Alice Wonder',      role: 'client',     email: 'alice.wonder@example.com',   password: 'client123',     avatar: 'AW' },
];

const ROLE_REDIRECTS = {
  agent:      '/agent',
  team_lead:  '/lead',
  supervisor: '/supervisor',
  finance:    '/finance',
  client:     '/client',
};

const ROLE_LABELS = {
  agent:      'Agent',
  team_lead:  'Responsable',
  supervisor: 'Superviseur',
  finance:    'Finance',
  client:     'Client',
};

const QUICK_LOGINS = [
  { label: 'Agent',        email: 'marc.lefevre@clear.io',     password: 'agent123' },
  { label: 'Responsable',  email: 'vanessa.durand@clear.io',   password: 'lead123' },
  { label: 'Superviseur',  email: 'eric.bertrand@clear.io',    password: 'supervisor123' },
  { label: 'Finance',      email: 'isabelle.roux@clear.io',    password: 'finance123' },
  { label: 'Client',       email: 'alice.wonder@example.com',  password: 'client123' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fillingFor, setFillingFor] = useState(null);

  // Listen to postMessage from the presentation sidebar to auto-fill & submit
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type !== 'reflow:quick-login') return;
      const preset = QUICK_LOGINS.find(p => p.label === e.data.label);
      if (preset) fillCredentials(preset, true);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fillCredentials = (preset, autoSubmit = false) => {
    setError('');
    setFillingFor(preset.label);
    setEmail('');
    setPassword('');

    // Animate typing email then password
    let i = 0;
    const typeEmail = setInterval(() => {
      i++;
      setEmail(preset.email.slice(0, i));
      if (i >= preset.email.length) {
        clearInterval(typeEmail);
        let j = 0;
        const typePwd = setInterval(() => {
          j++;
          setPassword(preset.password.slice(0, j));
          if (j >= preset.password.length) {
            clearInterval(typePwd);
            setFillingFor(null);
            if (autoSubmit) {
              setTimeout(() => {
                handleSubmitProgrammatic(preset.email, preset.password);
              }, 300);
            }
          }
        }, 40);
      }
    }, 22);
  };

  const handleSubmitProgrammatic = async (e, p) => {
    setError('');
    const user = USERS.find(u => u.email === e.trim() && u.password === p);
    if (!user) { setError('Identifiants incorrects.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setSuccess(true);
    document.cookie = `demo_user=${encodeURIComponent(JSON.stringify({ id: user.id, name: user.name, role: user.role, email: user.email }))}; path=/; max-age=86400`;
    await new Promise(r => setTimeout(r, 400));
    router.push(ROLE_REDIRECTS[user.role]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const user = USERS.find(u => u.email === email.trim() && u.password === password);
    if (!user) {
      setError('Identifiants incorrects.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSuccess(true);
    document.cookie = `demo_user=${encodeURIComponent(JSON.stringify({ id: user.id, name: user.name, role: user.role, email: user.email }))}; path=/; max-age=86400`;
    await new Promise(r => setTimeout(r, 500));
    router.push(ROLE_REDIRECTS[user.role]);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'hsl(220,20%,97%)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center mb-8 justify-center">
          <Logo size={36} withWordmark />
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl border shadow-sm overflow-hidden relative"
          style={{ borderColor: 'hsl(220,13%,89%)' }}
        >
          {/* Success overlay */}
          {success && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center animate-bounce">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Connexion réussie…</p>
              </div>
            </div>
          )}

          <div className="p-7 relative">
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Connexion</h1>
            <p className="text-sm text-gray-400 mb-6">Accédez à votre espace Reflow</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Adresse e-mail</label>
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="prenom.nom@clear.io"
                  required
                  className="w-full px-3 py-2.5 text-sm rounded-lg border bg-white outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{ borderColor: error ? '#fca5a5' : 'hsl(220,13%,89%)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg border bg-white outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ borderColor: error ? '#fca5a5' : 'hsl(220,13%,89%)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || success || !!fillingFor}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading || success ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {loading || success ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">Reflow · données fictives</p>
      </div>
    </div>
  );
}
