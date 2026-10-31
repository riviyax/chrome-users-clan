// Vercel serverless function: GET /api/player?tag=#XXXX -> player profile
const BASE = process.env.COC_API_BASE || 'https://cocproxy.royaleapi.dev/v1';

module.exports = async (req, res) => {
  try {
    const tag = String(req.query.tag || '').replace(/^#/, '').toUpperCase();
    if (!/^[0-9A-Z]{3,15}$/.test(tag)) throw Object.assign(new Error('Invalid player tag'), { status: 400 });
    if (!process.env.COC_API_TOKEN) throw Object.assign(new Error('COC_API_TOKEN is not set'), { status: 500 });
    const r = await fetch(BASE + '/players/' + encodeURIComponent('#' + tag), { headers: { Authorization: 'Bearer ' + process.env.COC_API_TOKEN } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.message || d.reason || 'Clash of Clans API error'), { status: r.status });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json(d);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};