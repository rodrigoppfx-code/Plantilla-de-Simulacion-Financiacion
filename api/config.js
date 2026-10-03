const source = 'https://raw.githubusercontent.com/rodrigoppfx-code/Plantilla-de-Simulacion-Financiacion/main/config.json';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo no permitido.' });
  try {
    const response = await fetch(source + '?t=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error('upstream');
    const config = await response.json();
    if (!config || !Number.isSafeInteger(config.precio) || config.precio <= 0 || !Array.isArray(config.tiers) || !config.tiers.length || !Array.isArray(config.beneficios) || !Array.isArray(config.asesoras)) throw new Error('config');
    // Only valid public data is cached; errors and writes are never cached.
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    return res.status(200).json(config);
  } catch {
    return res.status(502).json({ error: 'No se pudieron consultar los precios actuales.' });
  }
};
