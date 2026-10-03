const { renderDocument } = require('../lib/public-prices.cjs');
const { enhanceHtml } = require('../lib/public-prices-ux.cjs');
const source = 'https://raw.githubusercontent.com/rodrigoppfx-code/Plantilla-de-Simulacion-Financiacion/main/config.json';
let cached, expires = 0, pending;

async function currentConfig() {
  if (cached && Date.now() < expires) return cached;
  if (!pending) pending = (async () => {
    const response = await fetch(source + '?t=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error('upstream');
    const config = await response.json();
    if (!Number.isSafeInteger(config.precio) || config.precio <= 0 || !config.tiers?.length || !Array.isArray(config.beneficios)) throw new Error('config');
    cached = config; expires = Date.now() + 15000;
    return config;
  })().finally(() => { pending = null; });
  return pending;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  if (!['GET','HEAD'].includes(req.method)) return res.status(405).end();
  try {
    const html = enhanceHtml(renderDocument(await currentConfig()));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    return res.status(200).send(req.method === 'HEAD' ? '' : html);
  } catch {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).send('<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Precios Avovite</title><p>No pudimos consultar los precios actuales. <a href="/">Reintentar</a></p></html>');
  }
};
