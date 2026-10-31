// Vercel serverless proxy: keeps your CoC API token off the browser and avoids CORS.
require('dotenv').config();

const TAG = encodeURIComponent(process.env.CLAN_TAG || '#2CYGVVU9Y');
const BASE = process.env.COC_API_BASE || 'https://cocproxy.royaleapi.dev/v1';


module.exports = async (req, res) => {
  const headers = { Authorization: `Bearer ${process.env.COC_API_TOKEN}` };
  const get = async (path) => {
    const r = await fetch(`${BASE}/clans/${TAG}${path}`, { headers });
    return { ok: r.ok, status: r.status, data: await r.json().catch(() => null) };
  };
  try {
    const [clan, war] = await Promise.all([get(''), get('/currentwar')]);
    if (!clan.ok) return res.status(clan.status).json({ error: clan.data?.message || clan.data?.reason || 'CoC API error' });
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
    res.status(200).json({ clan: clan.data, war: war.ok ? war.data : null, updated: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
