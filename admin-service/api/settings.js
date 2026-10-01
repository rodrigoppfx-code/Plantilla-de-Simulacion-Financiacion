const { scryptSync, timingSafeEqual } = require('node:crypto');
const attempts = new Map();
const origins = new Set(['https://rodrigoppfx-code.github.io', 'https://propuestas-avovite.vercel.app']);
const repository = 'rodrigoppfx-code/Plantilla-de-Simulacion-Financiacion';

function validateConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('config');
  const text = (v, max = 500) => { if (typeof v !== 'string' || v.length > max) throw new Error('text'); return v; };
  const num = (v, min, max, integer = false) => {
    if (!Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) throw new Error('number');
    return v;
  };
  if (!Array.isArray(input.tiers) || input.tiers.length < 1 || input.tiers.length > 20) throw new Error('tiers');
  const tiers = input.tiers.map(t => ({ nombre: text(t.nombre, 80), min: num(t.min, 1, 999, true), max: t.max == null ? null : num(t.max, t.min, 999, true), desc: num(t.desc, 0, 100), prod: num(t.prod, 0, 100) }));
  if (!Array.isArray(input.asesoras) || input.asesoras.length < 1 || input.asesoras.length > 100) throw new Error('asesoras');
  if (!Array.isArray(input.beneficios) || input.beneficios.length > 100) throw new Error('beneficios');
  const beneficios = input.beneficios.map(b => {
    if (!Array.isArray(b.v) || b.v.length !== tiers.length) throw new Error('beneficios');
    return { t: text(b.t), s: text(b.s), v: b.v.map(v => text(v)) };
  });
  const topeTotal = num(input.topeTotal, 0, 100);
  if (tiers.some(t => t.desc > topeTotal)) throw new Error('discount');
  return { empresa: text(input.empresa, 200), nit: text(input.nit, 80), precio: num(input.precio, 1, 1e12, true), maxCuotas: num(input.maxCuotas, 1, 36, true), topeTotal, nota: text(input.nota, 2000), asesoras: input.asesoras.map(v => text(v, 200)), tiers, beneficios, github: { owner: 'rodrigoppfx-code', repo: 'Plantilla-de-Simulacion-Financiacion', branch: 'main', path: 'config.json' } };
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
  const origin = req.headers.origin || 'https://rodrigoppfx-code.github.io';
  if (!origins.has(origin)) return res.status(403).json({ error: 'Origen no permitido.' });
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido.' });
  const salt = process.env.ADMIN_KEY_SALT, hash = process.env.ADMIN_KEY_HASH, token = process.env.GITHUB_TOKEN;
  if (!salt || !hash || !token) return res.status(503).json({ error: 'Servicio no disponible.' });
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || Buffer.byteLength(JSON.stringify(body)) > 100000) throw new Error();
  } catch { return res.status(400).json({ error: 'Solicitud invalida.' }); }
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.until < now) attempts.delete(key);
  const entry = attempts.get(ip) || { count: 0, until: now + 900000 };
  if (entry.count >= 10) return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
  if (typeof body.password !== 'string' || body.password.length > 200 || !timingSafeEqual(scryptSync(body.password, salt, 64), Buffer.from(hash, 'hex'))) {
    entry.count++; attempts.set(ip, entry);
    return res.status(401).json({ error: 'Clave incorrecta.' });
  }
  attempts.delete(ip);
  if (body.action === 'login') return res.status(200).json({ ok: true });
  if (body.action !== 'save') return res.status(400).json({ error: 'Accion invalida.' });
  let cfg;
  try { cfg = validateConfig(body.config); } catch { return res.status(400).json({ error: 'Revisa los precios, categorias y beneficios antes de guardar.' }); }
  const url = `https://api.github.com/repos/${repository}/contents/config.json`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  try {
    const current = await fetch(url + '?ref=main', { headers, signal: AbortSignal.timeout(15000) });
    if (!current.ok) throw new Error('read');
    const file = await current.json();
    const previous = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    if ((body.config.updatedAt || 0) !== (previous.updatedAt || 0)) return res.status(409).json({ error: 'Otra persona actualizo los datos. Recarga antes de guardar.' });
    cfg.updatedAt = Date.now();
    const saved = await fetch(url, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000), body: JSON.stringify({ message: 'Actualizar configuracion desde administrador', sha: file.sha, branch: 'main', content: Buffer.from(JSON.stringify(cfg, null, 2) + '\n').toString('base64') }) });
    if (saved.status === 409) return res.status(409).json({ error: 'Los datos cambiaron. Recarga antes de guardar.' });
    if (!saved.ok) throw new Error('save');
    return res.status(200).json({ ok: true, config: cfg });
  } catch { return res.status(502).json({ error: 'No se pudo publicar. Los cambios no se han guardado; intenta de nuevo.' }); }
}
module.exports = handler;
module.exports.validateConfig = validateConfig;
