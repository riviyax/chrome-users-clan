// Vercel serverless function: GET /api/clan -> { clan, war, updated }
const fs = require('fs');
const path = require('path');

// Resolve the clan tag at request time: CLAN_TAG env wins, then the first config.json found.
// Add your own folder here if your static files live somewhere else.
const CONFIG_PATHS = ['../public/config.json', '../config.json', '../site/config.json', '../static/config.json', '../www/config.json'];
function clanTag() {
  if (process.env.CLAN_TAG) return process.env.CLAN_TAG;
  for (const p of CONFIG_PATHS) {
    try { return JSON.parse(fs.readFileSync(path.join(__dirname, p), 'utf8')).clanTag; } catch {}
  }
  throw Object.assign(new Error('Clan tag not found. Set CLAN_TAG in .env or put config.json next to index.html.'), { status: 500 });
}
const BASE = process.env.COC_API_BASE || 'https://cocproxy.royaleapi.dev/v1';
const enc = tag => encodeURIComponent('#' + String(tag).replace(/^#/, '').toUpperCase());

async function coc(path) {
  const r = await fetch(BASE + path, { headers: { Authorization: 'Bearer ' + process.env.COC_API_TOKEN } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.message || d.reason || 'Clash of Clans API error'), { status: r.status });
  return d;
}

module.exports = async (req, res) => {
  try {
    if (!process.env.COC_API_TOKEN) throw Object.assign(new Error('COC_API_TOKEN is not set'), { status: 500 });
    const tag = clanTag();
    const [clan, war] = await Promise.all([
      coc('/clans/' + enc(tag)),
      coc('/clans/' + enc(tag) + '/currentwar').catch(() => null) // null when the war log is private
    ]);
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
    res.status(200).json({ clan, war, updated: Date.now() });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};