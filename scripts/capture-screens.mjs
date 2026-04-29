// Capture screenshots of every key view of Reflow.
// Output: public/screencaptures/*.png
//
// Usage: node scripts/capture-screens.mjs
// Prerequisite: dev server running on http://localhost:3000

import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'screencaptures');
const BASE_URL = 'http://localhost:3000';

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 2 };

// Cookies for the various roles
const ROLE_COOKIES = {
  agent:      { id: 'agent-1', name: 'Marc Lefèvre', role: 'agent', email: 'marc.lefevre@clear.io' },
  team_lead:  { id: 'lead-1', name: 'Vanessa Durand', role: 'team_lead', email: 'vanessa.durand@clear.io' },
  supervisor: { id: 'supervisor-1', name: 'Éric Bertrand', role: 'supervisor', email: 'eric.bertrand@clear.io' },
  finance:    { id: 'finance-1', name: 'Isabelle Roux', role: 'finance', email: 'isabelle.roux@clear.io' },
  client:     { id: 'client-1', name: 'Alice Wonder', role: 'client', email: 'alice.wonder@example.com' },
};

async function setRoleCookie(page, role) {
  const user = ROLE_COOKIES[role];
  if (!user) return;
  const value = encodeURIComponent(JSON.stringify(user));
  await page.setCookie({
    name: 'demo_user',
    value,
    domain: 'localhost',
    path: '/',
  });
}

async function callApi(path, opts = {}) {
  const res = await fetch(BASE_URL + path, { method: 'POST', ...opts });
  return res.json();
}

async function getLiveAliceRefund() {
  const res = await fetch(BASE_URL + '/api/demo/advance');
  return res.json();
}

async function shoot(page, name, { fullPage = false, clip = null, hideOverlay = true } = {}) {
  if (hideOverlay) {
    // Hide any sticky toasts or overlays we can't control
    await page.evaluate(() => {
      const sel = ['[data-sonner-toaster]'];
      sel.forEach(s => document.querySelectorAll(s).forEach(el => el.style.display = 'none'));
    });
  }
  await new Promise(r => setTimeout(r, 600));
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage, clip: clip || undefined });
  console.log(`✓ ${name}.png`);
}

async function gotoAndWait(page, url, { waitFor = null } = {}) {
  await page.goto(BASE_URL + url, { waitUntil: 'networkidle0', timeout: 30000 });
  if (waitFor) {
    try { await page.waitForSelector(waitFor, { timeout: 5000 }); } catch {}
  }
  await new Promise(r => setTimeout(r, 500));
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log('▶ Préparation des données démo…');
  await callApi('/api/refunds/seed');
  await callApi('/api/demo/setup');

  let live = await getLiveAliceRefund();
  console.log('  Alice live refund:', live.ticketId, live.id);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // ── Public pages ─────────────────────────────────────────────────────
  console.log('\n▶ Pages publiques');
  await gotoAndWait(page, '/');
  await shoot(page, '01-landing');

  await gotoAndWait(page, '/shop');
  await shoot(page, '02-shop');

  // Click "Demander un remboursement" to capture the modal
  try {
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const target = btns.find(b => /Demander un remboursement/i.test(b.textContent));
      target?.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await shoot(page, '02b-shop-modal');
  } catch (e) { console.log('  (modal skip)', e.message); }

  await gotoAndWait(page, `/zendesk/${live.zendeskTicketId || live.ticketId || 'ZD-DEMO'}`);
  await shoot(page, '03-zendesk');

  // ── Login ────────────────────────────────────────────────────────────
  console.log('\n▶ Login');
  await gotoAndWait(page, '/login');
  await shoot(page, '04-login');

  // ── Agent views ──────────────────────────────────────────────────────
  console.log('\n▶ Agent');
  await setRoleCookie(page, 'agent');

  await gotoAndWait(page, '/overview');
  await shoot(page, '05-overview');

  await gotoAndWait(page, '/agent?tab=waiting');
  await shoot(page, '06-agent-waiting');

  await gotoAndWait(page, '/agent?tab=ready');
  await shoot(page, '07-agent-ready');

  if (live.id) {
    await gotoAndWait(page, `/refunds/${live.id}?simulatedRole=agent`);
    await shoot(page, '08-agent-detail');
  }

  // ── Client views ─────────────────────────────────────────────────────
  console.log('\n▶ Client');
  await setRoleCookie(page, 'client');

  await gotoAndWait(page, '/mail');
  await shoot(page, '09-client-mail');

  await gotoAndWait(page, '/client');
  await shoot(page, '10-client-list');

  if (live.id) {
    await gotoAndWait(page, `/refunds/${live.id}?simulatedRole=client`);
    await shoot(page, '11-client-detail-iban');

    // Advance to CLIENT_VALIDATED so we can capture the post-IBAN view
    await callApi('/api/demo/advance', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'CLIENT_VALIDATED' }),
    });
    await gotoAndWait(page, `/refunds/${live.id}?simulatedRole=client`);
    await shoot(page, '12-client-detail-progress');
  }

  // ── Lead, Supervisor, Finance ────────────────────────────────────────
  console.log('\n▶ Validation');
  await setRoleCookie(page, 'team_lead');
  await gotoAndWait(page, '/lead');
  await shoot(page, '13-lead');

  await setRoleCookie(page, 'supervisor');
  await gotoAndWait(page, '/supervisor');
  await shoot(page, '14-supervisor');

  await setRoleCookie(page, 'finance');
  await gotoAndWait(page, '/finance');
  await shoot(page, '15-finance');

  // Stripe view — needs an APPROVED_FOR_PAYMENT or PAYMENT_PROCESSING refund
  // Advance the live refund through the chain
  await callApi('/api/demo/advance', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'PENDING_LEAD_APPROVAL' }) });
  await callApi('/api/demo/advance', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'APPROVED_FOR_PAYMENT' }) });

  if (live.id) {
    await gotoAndWait(page, `/stripe/${live.id}`);
    await shoot(page, '16-stripe');
  }

  // ── Final paid state for client ──────────────────────────────────────
  console.log('\n▶ Paiement final');
  await callApi('/api/demo/advance', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'PAID' }) });
  await setRoleCookie(page, 'client');
  if (live.id) {
    await gotoAndWait(page, `/refunds/${live.id}?simulatedRole=client`);
    await shoot(page, '17-client-paid');
  }

  // ── Presentation overview ────────────────────────────────────────────
  console.log('\n▶ Présentation');
  await gotoAndWait(page, '/presentation');
  await shoot(page, '18-presentation');

  await browser.close();
  console.log('\n✅ Toutes les captures dans public/screencaptures/');
}

main().catch(e => {
  console.error('❌ Erreur :', e);
  process.exit(1);
});
