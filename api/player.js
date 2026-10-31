const BASE = process.env.COC_API_BASE || 'https://cocproxy.royaleapi.dev/v1';

module.exports = async (req, res) => {
  const tag = '#' + String(req.query.tag || '').replace('#', '').toUpperCase();
  if (!/^#[0289PYLQGRJCUV]{4,15}$/.test(tag)) return res.status(400).json({ error: 'Invalid player tag' });
  try {
    const r = await fetch(`${BASE}/players/${encodeURIComponent(tag)}`, {
      headers: { Authorization: `Bearer ${process.env.COC_API_TOKEN}` },
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) return res.status(r.status).json({ error: data?.message || data?.reason || 'CoC API error' });
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
